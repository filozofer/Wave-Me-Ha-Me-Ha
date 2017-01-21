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
    'wrongSpellLifeCost': 5,
    'waveSpeed' : 100
};

// Spell Combos !
var spells = {
    'easy'   : { 'water': 'L'    , 'grass': 'D'    , 'fire': 'R' },
    'medium' : { 'water': 'L-U'  , 'grass': 'D-L'  , 'fire': 'R-D' },
    'hard'   : { 'water': 'L-R-U', 'grass': 'D-L-U', 'fire': 'R-U-D' }
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
    'player1': { 'name': 'player1', 'difficulty': 'medium', 'pad': undefined, 'defenseSpell': [], 'attackSpell': [], life: 50, 'enemyName': 'player2' },
    'player2': { 'name': 'player2', 'difficulty': 'medium', 'pad': undefined, 'defenseSpell': [], 'attackSpell': [], life: 50, 'enemyName': 'player1' }
};
var player1Hitbox;
var player2Hitbox;
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

    // Init Phaser game
    game = new Phaser.Game($('#game').width(), $('#game').height(), Phaser.AUTO, 'game', {
        preload: preload,
        create: create,
        update: update
    }, true);

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

    }

    /**
     * Create basic game
     */
    function create() {

        // Start game physics mode
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // Players hitbox init
        // TODO

        // Waveméhaméha init !
        wavemehamehaLeftPlayer = game.add.tileSprite(0, heightPercent(60), widthPercent(50), 170, 'wavemehamehaBeamLeftPlayer');
        wavemehamehaRightPlayer = game.add.tileSprite(widthPercent(50), heightPercent(60), widthPercent(50), 170, 'wavemehamehaBeamRightPlayer');
        wavemehamehaImpact = game.add.sprite(widthPercent(50) - 105, heightPercent(60) - 80, 'wavemehamehaBeamImpact');
        wavemehamehaImpact.scale.setTo(0.6, 1.2);

        // Attack & Defense lines between players init
        lines['attackPlayer1'] = game.add.tileSprite(0, heightPercent(15), widthPercent(50), 50, 'attackLine');
        lines['defensePlayer1'] = game.add.tileSprite(0, heightPercent(35), widthPercent(50), 50, 'defenseLine');
        lines['attackPlayer2'] = game.add.tileSprite(widthPercent(50), heightPercent(35), widthPercent(50), 50, 'attackLine');
        lines['defensePlayer2'] = game.add.tileSprite(widthPercent(50), heightPercent(15), widthPercent(50), 50, 'defenseLine');
        lines['attackPlayer1'].direction = 1;
        lines['defensePlayer1'].direction = 1;
        lines['attackPlayer2'].direction = -1;
        lines['defensePlayer2'].direction = -1;
        for(var k in lines) {
            lines[k].tileScale.y = 0.3;
            lines[k].tileScale.x = 0.2;
            lines[k].beginOfLine = function() {
                var x = (this.direction == 1) ? this.x : this.x + this.width;
                return { x: x, y: this.y + this.height / 2 }
            };
        }
        upLineImpact = game.add.sprite(widthPercent(50) + 25, heightPercent(15) - 5, 'lineImpact');
        upLineImpact.scale.setTo(0.5,0.4);
        upLineImpact.scale.x *= -1;
        downLineImpact = game.add.sprite(widthPercent(50) - 35, heightPercent(35) - 5, 'lineImpact');
        downLineImpact.scale.setTo(0.5,0.4);

        // Init waves groups properties
        for(var k in waves) {
            waves[k] =  game.add.group();
            waves[k].enableBody = true;
            waves[k].physicsBodyType = Phaser.Physics.ARCADE;
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

        // Verify if gamepad are connected until they are !
        setInterval(function(){ verifyIfGamepadAreConnected(); }, 200);

        // Print spell book in console (thanx me for that !)
        console.gameLog(JSON.stringify(spells.medium), 'spellBook');

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
            var heightOfWave = 50; // TODO Dynamic ?
            var wave = waves[waveName].create(line.beginOfLine().x, line.beginOfLine().y - (heightOfWave/2), spell + 'Wave');
            wave.name = 'wave-' + spellType + '-' + pad.name + '-' + waves[waveName].length;;
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

        // Log life score update
        console.gameLog('Players life updated:', 'life');
        console.gameLog(Array(parseInt(players['player1'].life / 5) + 1).join('=') + '> | <' + Array(parseInt(players['player2'].life / 5) + 1).join('='), 'life');
        console.gameLog('Player 1 : ' + players['player1'].life + ' | Player 2 : ' + players['player2'].life, 'life');

        // Change beam display
        // TODO

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

        // Verify colission between waves
        // TODO
        //game.physics.arcade.collide(ball, paddle, ballHitPaddle, null, this);
        //game.physics.arcade.collide(ball, bricks, ballHitBrick, null, this);

        // Verify colission between waves and players hitbox

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

