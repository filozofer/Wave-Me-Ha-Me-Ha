/**
 * Game main file
 */

// Debug configuration
var debug = {
    enable: true,
    contexts: {
        'rune': true,
        'spell': true,
        'spellBook': true,
        'life': true
    }
};

// Configurable variable
var config = {
    'wrongSpellLifeCost'         : 5,
    'wrongCounterSpellLifeCost'  : 10,
    'hitByOtherPlayerLifeCost'   : 30,
    'waveSpeed'                  : 100,
    'wavemehamehaSpeed'          : 200
};

// Spell Combos !
var spells = {
    'easy'   : { 'water': 'L'    , 'grass': 'D'    , 'fire': 'R' },
    'medium' : { 'water': 'L-U'  , 'grass': 'D-L'  , 'fire': 'R-D' },
    'hard'   : { 'water': 'L-R-U', 'grass': 'D-L-U', 'fire': 'R-U-D' },
    'crazy'  : { 'water': 'L-R-U-R', 'grass': 'D-L-U-U', 'fire': 'R-U-D-R' }
};

// Init all game global vars
var game;
var waves = {
    'attackWavesPlayer1'  : undefined,
    'defenseWavesPlayer1' : undefined,
    'attackWavesPlayer2'  : undefined,
    'defenseWavesPlayer2':  undefined
};
var players = {
    'player1': { 'name': 'player1', 'difficulty': 'easy', 'pad': undefined, 'defenseSpell': [], 'attackSpell': [], life: 50, 'enemyName': 'player2' },
    'player2': { 'name': 'player2', 'difficulty': 'easy', 'pad': undefined, 'defenseSpell': [], 'attackSpell': [], life: 50, 'enemyName': 'player1' }
};
var playersHitbox;
var wavemehamehaLeftPlayer;
var wavemehamehaRightPlayer;
var wavemehamehaImpact;
var gameSpeed = 1;
var lines = {
    'attackPlayer1'   : [],
    'defensePlayer1'  : [],
    'attackPlayer2'  : [],
    'defensePlayer2' : []
};
var upLineImpact;
var downLineImpact;

(function($) {$(document).ready(function() {

    // Prepare select difficulty component
    $('.difficulty_mode').slick({
        centerMode: true,
        centerPadding: '60px',
        slidesToShow: 3,
        arrows: false,
        draggable: false,
        swipe: false,
        touchMove: false
    });
    $('.difficulty_mode').css({'visibility': 'visible'}).find('.slick-slide').show(2000);

    // Init Phaser game
    game = new Phaser.Game($('#game').width(), $('#game').height(), Phaser.AUTO, 'game', null, true);
    game.state.add('pregame', { create: createPreGame });
    game.state.add('game', { preload: preload, create: create, update: update });
    game.state.start('pregame');

    /**
     * Handle inputs on pregame screen
     */
    function createPreGame() {

        // Declare pads inputs listener
        game.input.gamepad.start();
        var playerId = 1;
        for(var k in players) {
            players[k].pad = game.input.gamepad['pad' + playerId];
            players[k].pad.name = k;
            // Declare pads inputs listener
            players[k].pad.onDownCallback = function(buttonCode, value){
                switch (buttonCode) {

                    // Change difficulty for both players
                    case Phaser.Gamepad.XBOX360_DPAD_RIGHT:
                        $('.difficulty_mode').slick('slickNext');
                        for(var k in players) {
                            players[k].difficulty = $('.difficulty_mode .slick-current').attr('difficulty');
                        }
                        break;
                    case Phaser.Gamepad.XBOX360_DPAD_LEFT:
                        $('.difficulty_mode').slick('slickPrev');
                        for(var k in players) {
                            players[k].difficulty = $('.difficulty_mode .slick-current').attr('difficulty');
                        }
                        break;

                    // Validate player is ready
                    case Phaser.Gamepad.XBOX360_A:

                        // Set player in ready state
                        $('.press_a_container .press_a.' + this.name).toggleClass('ready');

                        // If both player ready start the game !
                        if($('.press_a_container .press_a.ready').length === 2) {
                            setTimeout(function(){
                                $('#pregame_screen').fadeOut(1000, function(){
                                    game.state.start('game');
                                });
                            }, 500);
                        }
                        break;

                    // Do nothing for other key
                    default: break;
                }
            };
            playerId +=1 ;
        }

        // Verify if gamepad are connected until they are !
        setInterval(function(){ verifyIfGamepadAreConnected(); }, 200);

    }

    /**
     * Preload all assets
     */
    function preload() {

        // Load waveméhaméha assets
        game.load.image('wavemehamehaBeamLeftPlayer', 'assets/images/wavemehamehaBeamLeftPlayer.png');
        game.load.image('wavemehamehaBeamRightPlayer', 'assets/images/wavemehamehaBeamRightPlayer.png');
        game.load.image('wavemehamehaBeamImpact', 'assets/images/wavemehamehaBeamImpact.png');

        // Load attack and defense lines assets
        game.load.image('attackLine', 'assets/images/attackLine.png');
        game.load.image('defenseLine', 'assets/images/defenseLine.png');
        game.load.image('lineImpact', 'assets/images/lineImpact.png');

        // Load waves
        game.load.image('waterWave', 'assets/images/waterWave.png');
        game.load.image('fireWave', 'assets/images/fireWave.png');
        game.load.image('grassWave', 'assets/images/grassWave.png');

        // Load player hitbox
        game.load.image('player1Hitbox', 'assets/images/player1Hitbox.png');
        game.load.image('player2Hitbox', 'assets/images/player2Hitbox.png');

    }

    /**
     * Init game
     */
    function create() {

        // Start game physics mode
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // Waveméhaméha init !
        wavemehamehaLeftPlayer = game.add.tileSprite(0, heightPercent(60), widthPercent(50), 120, 'wavemehamehaBeamLeftPlayer');
        wavemehamehaRightPlayer = game.add.tileSprite(widthPercent(50), heightPercent(60), widthPercent(50), 120, 'wavemehamehaBeamRightPlayer');
        wavemehamehaLeftPlayer.scale.setTo(1, 0.8);
        wavemehamehaRightPlayer.scale.setTo(1, 0.8);
        wavemehamehaImpact = game.add.sprite(widthPercent(50) - 140, heightPercent(60) - 60, 'wavemehamehaBeamImpact');
        wavemehamehaImpact.scale.setTo(0.8, 0.8);

        // Attack & Defense lines between players init
        lines['attackPlayer1'] = game.add.tileSprite(0, heightPercent(15), widthPercent(50), 80, 'attackLine');
        lines['defensePlayer1'] = game.add.tileSprite(0, heightPercent(35), widthPercent(50), 80, 'defenseLine');
        lines['attackPlayer2'] = game.add.tileSprite(widthPercent(50), heightPercent(35), widthPercent(50), 80, 'attackLine');
        lines['defensePlayer2'] = game.add.tileSprite(widthPercent(50), heightPercent(15), widthPercent(50), 80, 'defenseLine');
        lines['attackPlayer1'].direction = 1;
        lines['defensePlayer1'].direction = 1;
        lines['attackPlayer2'].direction = -1;
        lines['defensePlayer2'].direction = -1;
        for(var k in lines) {
            lines[k].tileScale.y = 0.4;
            lines[k].tileScale.x = 0.3;
            lines[k].beginOfLine = function() {
                var x = (this.direction == 1) ? this.x : this.x + this.width;
                return { x: x, y: this.y + this.height / 2 }
            };
        }
        upLineImpact = game.add.sprite(widthPercent(50) + 25, heightPercent(15)+ 5, 'lineImpact');
        upLineImpact.scale.setTo(0.5,0.4);
        upLineImpact.scale.x *= -1;
        downLineImpact = game.add.sprite(widthPercent(50) - 35, heightPercent(35) + 5, 'lineImpact');
        downLineImpact.scale.setTo(0.5,0.4);

        // Players hitbox init
        playersHitbox = game.add.group();
        playersHitbox.enableBody = true;
        playersHitbox.physicsBodyType = Phaser.Physics.ARCADE;
        var player1HitBox = playersHitbox.create(0, 0, 'player1Hitbox');
        player1HitBox.body.setSize(10, heightPercent(100), 0, 0);
        player1HitBox.body.immovable = true;
        player1HitBox.visible = false;
        player1HitBox.name = 'player1';
        var player2HitBox = playersHitbox.create(0, 0, 'player2Hitbox');
        player2HitBox.body.setSize(10, heightPercent(100), widthPercent(100) - 10, 0);
        player2HitBox.body.immovable = true;
        player2HitBox.visible = false;
        player2HitBox.name = 'player2';

        // Init waves groups properties
        for(var k in waves) {
            waves[k] =  game.add.group();
            waves[k].enableBody = true;
            waves[k].physicsBodyType = Phaser.Physics.ARCADE;
            waves[k].name = k;
        }

        // Declare pads inputs listener
        game.input.gamepad.start();
        var playerId = 1;
        for(var k in players) {
            players[k].pad = game.input.gamepad['pad' + playerId];
            players[k].pad.name = k;
            players[k].pad.onDownCallback = onDownCallback;
            players[k].pad.onAxisCallback = onAxisCallback;
            playerId +=1 ;
        }

        // Print spell book in console (thanx me for that !)
        console.gameLog(JSON.stringify(spells[players['player1'].difficulty]), 'spellBook');

    }

    /**
     * Handle buttons usage for players
     * @param buttonCode
     * @param value
     */
    function onDownCallback(buttonCode, value) {
        switch (buttonCode) {

            // Add rune in players spell (defense & attack)
            case Phaser.Gamepad.XBOX360_DPAD_UP: addRuneInSpell(this, 'defense', 'U'); break;
            case Phaser.Gamepad.XBOX360_DPAD_RIGHT: addRuneInSpell(this, 'defense', 'R'); break;
            case Phaser.Gamepad.XBOX360_DPAD_DOWN: addRuneInSpell(this, 'defense', 'D'); break;
            case Phaser.Gamepad.XBOX360_DPAD_LEFT: addRuneInSpell(this, 'defense', 'L'); break;
            case Phaser.Gamepad.XBOX360_Y: addRuneInSpell(this, 'attack', 'U'); break;
            case Phaser.Gamepad.XBOX360_B: addRuneInSpell(this, 'attack', 'R'); break;
            case Phaser.Gamepad.XBOX360_A: addRuneInSpell(this, 'attack', 'D'); break;
            case Phaser.Gamepad.XBOX360_X: addRuneInSpell(this, 'attack', 'L'); break;

            // Remove rune in players spell (defense & attack)
            case Phaser.Gamepad.XBOX360_LEFT_BUMPER: removeRuneInSpell(this, 'defense'); break;
            case Phaser.Gamepad.XBOX360_RIGHT_BUMPER: removeRuneInSpell(this, 'attack'); break;

            // Cast spell (defense & attack)
            case Phaser.Gamepad.XBOX360_LEFT_TRIGGER: castSpell(this, 'defense'); break;
            case Phaser.Gamepad.XBOX360_RIGHT_TRIGGER: castSpell(this, 'attack'); break;

            // Pause the game
            case Phaser.Gamepad.XBOX360_START: changePauseGameState(); break;

            // Do nothing for other key
            default: break;
        }
    }

    /**
     * Handle sticks usage for players
     * @param pad
     * @param value
     */
    function onAxisCallback(pad, value) {

        // Verify if left stick is triggering a rune
        if(canUseAxisLeft && pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) <= -0.8 && pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) >= -1) {
            addRuneInSpell(pad, 'defense', 'L');
            canUseAxisLeft = false;
        }
        else if(canUseAxisLeft && pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) >= 0.8 && pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) <= 1) {
            addRuneInSpell(pad, 'defense', 'R');
            canUseAxisLeft = false;
        }
        if(canUseAxisLeft && pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) <= -0.8 && pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) >= -1) {
            addRuneInSpell(pad, 'defense', 'U');
            canUseAxisLeft = false;
        }
        else if(canUseAxisLeft && pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) >= 0.8 && pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) <= 1) {
            addRuneInSpell(pad, 'defense', 'D');
            canUseAxisLeft = false;
        }

        // Return on center before accepting another direction
        if(pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) === false && pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) === false) {
            canUseAxisLeft = true;
        }

        // Verify if right stick is triggering a rune
        if(canUseAxisRight && pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) <= -0.8 && pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) >= -1) {
            addRuneInSpell(pad, 'attack', 'L');
            canUseAxisRight = false;
        }
        else if(canUseAxisRight && pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) >= 0.8 && pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) <= 1) {
            addRuneInSpell(pad, 'attack', 'R');
            canUseAxisRight = false;
        }
        if(canUseAxisRight && pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) <= -0.8 && pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) >= -1) {
            addRuneInSpell(pad, 'attack', 'U');
            canUseAxisRight = false;
        }
        else if(canUseAxisRight && pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) >= 0.8 && pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) <= 1) {
            addRuneInSpell(pad, 'attack', 'D');
            canUseAxisRight = false;
        }

        // Return on center before accepting another direction
        if(pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X) === false && pad.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y) === false) {
            canUseAxisRight = true;
        }

    }
    var canUseAxisLeft = true;
    var canUseAxisRight = true;

    /**
     * Add rune in one of the player spell (defense or attack)
     * @param pad SinglePad
     * @param spellType string attack|defense
     * @param inputCode integer Phaser.Gamepad.BUTTON_MAPPING
     */
    function addRuneInSpell(pad, spellType, rune) {
        spellType = (spellType == 'attack') ? 'attackSpell' : 'defenseSpell';
        if(players[pad.name][spellType].length < 5) {
            players[pad.name][spellType].push(rune);
            console.gameLog(pad.name + ' cast rune for his ' + spellType + ' : ' + rune, 'rune');
        }
        else {
            console.gameLog(pad.name + ' try to cast rune but his ' + spellType + ' is full.', 'rune');
        }
    }

    /**
     * Remove rune in one of the player spell (defense or attack)
     * @param pad SinglePad
     * @param spellType string attack|defense
     */
    function removeRuneInSpell(pad, spellType) {
        spellType = (spellType == 'attack') ? 'attackSpell' : 'defenseSpell';
        players[pad.name][spellType] = [];
        console.gameLog(pad.name + ' remove all runes for his ' + spellType, 'rune');
    }

    /**
     * Cast player spell !
     */
    function castSpell(pad, spellType) {
        spellTypeVar = (spellType == 'attack') ? 'attackSpell' : 'defenseSpell';

        // Only cast if there is at least one rune
        if(players[pad.name][spellTypeVar].length == 0) {
            return;
        }

        // Log cast spell
        console.gameLog(pad.name + ' try to cast spell: ' + players[pad.name][spellTypeVar].join('-'), 'spell');

        var spell = callBookSpell(players[pad.name][spellTypeVar], players[pad.name].difficulty);

        // Verify if runes match a real spell
        if(spell !== null) {

            // Log
            console.gameLog(pad.name + ' succeed to cast spell: ' + spell, 'spell', 'spell');

            // Build name of the waves group
            var waveName = spellType + 'Waves' + pad.name.capitalizeFirstLetter();

            // Create the new wave
            var line = lines[spellType + pad.name.capitalizeFirstLetter()];
            var heightOfWave = 50;
            var wave = waves[waveName].create(line.beginOfLine().x, line.beginOfLine().y - (heightOfWave/2), spell + 'Wave');
            wave.name = 'wave-' + spellType + '-' + pad.name + '-' + waves[waveName].length;
            wave.spell = spell;
            wave.shooter = pad.name;
            wave.spellType = spellType;
            wave.scale.setTo(0.25 * line.direction, 0.25);
            wave.body.velocity.setTo(line.direction * (config.waveSpeed * gameSpeed), 0);

        }
        // If runes doas not match a spell, player must to be punish !
        else {

            // Log
            console.gameLog(pad.name + ' failed to cast spell. Punish him !: ', 'spell');

            // Punish player !
            downgradePlayerLife(pad.name, config.wrongSpellLifeCost);
        }

        // Consume the runes of the spell
        players[pad.name][spellTypeVar] = [];
    }


    /**
     * Allow to retrieve the spell name corresponding to a list of runes
     * @param runes
     * @return string|null The name of the spell or null if there is no corresponding spell
     */
    function callBookSpell(runes, difficulty) {

        // Transform the runes into a real formula !
        var playerFormula = runes.join('-');

        // Try to find a corresponding spell into our spell book
        for(var spellName in spells[difficulty]) {
            var spellFormula = spells[difficulty][spellName];
            if(playerFormula === spellFormula) {
                return spellName;
            }
        }

        // No formula found into our book !
        return null;
    }

    /**
     * Downgrade a player life from a number of point (Player life start to 50 & go to 0 (lose) to 100 (win))
     * @param playerName string
     * @param lifeToLose integer
     */
    function downgradePlayerLife(playerName, lifeToLose) {

        // Update life score of player
        var player = players[playerName];
        var enemy = players[player.enemyName];
        player.life -= lifeToLose;
        enemy.life += lifeToLose;

        // Max bound for life
        player.life = (player.life < 0) ? 0 : player.life;
        player.life = (player.life > 100) ? 100 : player.life;
        enemy.life = (enemy.life < 0) ? 0 : enemy.life;
        enemy.life = (enemy.life > 100) ? 100 : enemy.life;

        // Log life score update
        console.gameLog('Players life updated:', 'life');
        console.gameLog(Array(parseInt(players['player1'].life / 5) + 1).join('=') + '> | <' + Array(parseInt(players['player2'].life / 5) + 1).join('='), 'life');
        console.gameLog('Player 1 : ' + players['player1'].life + ' | Player 2 : ' + players['player2'].life, 'life');

        // Change beam display
        var leftPlayerLife = (player.name == 'player1') ? player.life : enemy.life;
        var rightPlayerLife = (player.name == 'player2') ? player.life : enemy.life;
        wavemehamehaLeftPlayer.targetWidth = widthPercent(leftPlayerLife);
        wavemehamehaRightPlayer.targetWidth = widthPercent(rightPlayerLife);
        wavemehamehaRightPlayer.targetX = wavemehamehaLeftPlayer.targetWidth;
        wavemehamehaImpact.targetX = wavemehamehaLeftPlayer.targetWidth - 140;

        // Handle win/lose case !
        if(player.life <= 0) {

            // Display the win screen
            $('#win_screen').addClass(enemy.name + 'Win').fadeIn();

        }

    }

    /**
     * Allow to pause the game or to resume it
     */
    function changePauseGameState() {
        // Pause the game !
        if(!game.paused) {
            game.paused = true;
            $('#pause_screen').fadeIn();

            // Start to listen for unpause using browser api (not phaser) because the game is paused
            // and do not catch for keydown anymore
            setTimeout(function(){
                stopPauseScreen = setInterval(function(){
                    for(var i = 0; i <= 1; i++) {
                        // If one of the gamepad press start we unpaused the game
                        if(navigator.getGamepads()[i].buttons[9].pressed) {
                            clearInterval(stopPauseScreen);
                            changePauseGameState();
                        }
                    }
                }, 10);
            }, 1000);

        }
        // Resume the game
        else {
            $('#pause_screen').fadeOut(function(){
                game.paused = false;
            });
        }
    }
    var stopPauseScreen = undefined;

    /**
     * Update loop to handle movements & collisions
     */
    function update () {

        // Verify colission between waves and player hitbox
        for(var k in waves) {
            game.physics.arcade.overlap(waves[k], playersHitbox, waveHitPlayer, null, this);
        }

        // Verify colission between waves and waves !
        for(var k in waves) {
            for(var j in waves) {
                if(waves[k].name !== waves[j].name) {
                    game.physics.arcade.overlap(waves[k], waves[j], waveHitAnotherWave, null, this);
                }
            }
        }

        // Update beam position if needed
        if(wavemehamehaImpact.targetX != wavemehamehaImpact.x) {
            var moveWavemehamehaLeft = game.add.tween(wavemehamehaLeftPlayer);
            moveWavemehamehaLeft.to({ width: wavemehamehaLeftPlayer.targetWidth }, config.wavemehamehaSpeed, null, true);
            var moveWavemehamehaRight = game.add.tween(wavemehamehaRightPlayer);
            moveWavemehamehaRight.to({ width: wavemehamehaRightPlayer.targetWidth, x: wavemehamehaRightPlayer.targetX }, config.wavemehamehaSpeed, null, true);
            var moveWavemehamehaImpact = game.add.tween(wavemehamehaImpact);
            moveWavemehamehaImpact.to({ x: wavemehamehaImpact.targetX }, config.wavemehamehaSpeed, null, true);
        }
    }

    /**
     * What we do when a wave hit an another wave
     * @param waveA
     * @param waveB
     */
    function waveHitAnotherWave(waveA, waveB) {

        // No friendly fire ! Return now if detect friendly fire
        var shooterAName = waveA.shooter;
        var shooterBName = waveB.shooter;
        if(shooterAName === shooterBName) {
            return;
        }

        // Define who is the attack wave & who is the defense wave
        var shooterAType = waveA.spellType;
        var attackWave = (shooterAType == 'attack') ? waveA : waveB;
        var defenseWave = (shooterAType == 'defense') ? waveA : waveB;

        // Get attack and defense element

        // Attack beat defense ?
        if(attackWaveWin(attackWave.spell, defenseWave.spell)) {

            // Kill defense wave
            defenseWave.kill();

            // Punish defense player
            downgradePlayerLife(defenseWave.shooter, config.wrongCounterSpellLifeCost);

        }
        // Attack is beat by defense !
        else {

            // Kill both of the waves
            attackWave.kill();
            defenseWave.kill();

        }

    }

    /**
     * Define if the attack spell win on the defenseSpell
     * @param attackSpell
     * @param defenseSpell
     */
    function attackWaveWin(attackSpell, defenseSpell) {
        if(attackSpell === 'fire' && defenseSpell === 'water') {
            return false;
        }
        else if(attackSpell === 'water' && defenseSpell === 'grass') {
            return false;
        }
        else if(attackSpell === 'grass' && defenseSpell === 'fire') {
            return false;
        }
        return true;
    }

    /**
     * What we do when a wave hit a player hit box
     * @param wave
     * @param playerHitBox
     */
    function waveHitPlayer(wave, playerHitBox) {

        // No friendly fire ! Return now if detect friendly fire
        var shooterName = wave.name.split('-')[2];
        if(shooterName === playerHitBox.name) {
            return;
        }

        // Kill wave
        wave.kill();

        // Damage the player which has been hit !
        downgradePlayerLife(playerHitBox.name, config.hitByOtherPlayerLifeCost)

    }

    /**
     * Verify if gamepad are connected until they are !
     */
    function verifyIfGamepadAreConnected() {
        var errorsInputs = 0;

        // Gamepad is supported ?
        if(!game.input.gamepad.supported || !game.input.gamepad.active) {
            $('#pregame_screen').addClass('notSupportedGamePad');
            errorsInputs += 1;
        }

        // Players gamepads are connected ?
        for(var playerName in players) {
            if(!players[playerName].pad.connected) {
                $('#pregame_screen').addClass('missingPad' + playerName.capitalizeFirstLetter());
                errorsInputs += 1;
            }
            else {
                $('#pregame_screen').removeClass('missingPad' + playerName.capitalizeFirstLetter());
            }
        }

        // Display pregame screen with some class to tweak what is display if there is at least an error
        if(errorsInputs > 0 && !$('#pregame_screen').is(':visible')) {
            $('#pregame_screen').fadeIn();
        }
    }

    /**
     * Handle collission between waves and waves
     * @param _wave1
     * @param _wave2
     */
    function wavesCollision(_wave1, _wave2) {

        // TODO
        /*
         _brick.kill();

         score += 10;

         scoreText.text = 'score: ' + score;

         //  Are they any bricks left?
         if (bricks.countLiving() == 0)
         {
         //  New level starts
         score += 1000;
         scoreText.text = 'score: ' + score;
         introText.text = '- Next Level -';

         //  Let's move the ball back to the paddle
         ballOnPaddle = true;
         ball.body.velocity.set(0);
         ball.x = paddle.x + 16;
         ball.y = paddle.y - 16;
         ball.animations.stop();

         //  And bring the bricks back from the dead :)
         bricks.callAll('revive');
         }
         */

    }

});})(jQuery);

