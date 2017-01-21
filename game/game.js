/**
 * Game main file
 */

// Debug configuration
var debug = {
    enable: true,
    contexts: {
        'rune': true,
        'spell': true,
        'life': true
    }
};

// Configurable variable
var config = {
  'wrongSpellLifeCost': 5
};

// Init all game global vars
var game;
var waves = {
    'aggresiveWavesLeftPlayer': undefined,
    'defensiveWavesLeftPlayer': undefined,
    'aggresiveWavesRightPlayer': undefined,
    'defensiveWavesRightPlayer': undefined
};
var players = {
    'player1': { 'name': 'player1', 'pad': undefined, 'defenseSpell': [], 'attackSpell': [], life: 50, 'enemyName': 'player2' },
    'player2': { 'name': 'player2', 'pad': undefined, 'defenseSpell': [], 'attackSpell': [], life: 50, 'enemyName': 'player1' }
};
var player1Hitbox;
var player2Hitbox;
var wavemehamehaLeftPlayer;
var wavemehamehaRightPlayer;

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

        // Load attack and defense lines assets
        game.load.image('attackLine', 'assets/images/attackLine.png');
        game.load.image('defenseLine', 'assets/images/defenseLine.png');

    }

    /**
     * Create basic game
     */
    function create() {

        // Start game physics mode
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // Init waves groups properties
        for(var k in waves) {
            waves[k] =  game.add.group();
            waves[k].enableBody = true;
            waves[k].physicsBodyType = Phaser.Physics.ARCADE;
        }

        // Players hitbox init
        // TODO

        // Waveméhaméha init !
        wavemehamehaLeftPlayer = game.add.tileSprite(0, heightPercent(60), widthPercent(50), 170, 'wavemehamehaBeamLeftPlayer');
        wavemehamehaRightPlayer = game.add.tileSprite(widthPercent(50), heightPercent(60), widthPercent(50), 170, 'wavemehamehaBeamRightPlayer');

        // Attack & Defense lines between players init
        attackLineLeftPlayer = game.add.tileSprite(0, heightPercent(15), widthPercent(50), 20, 'attackLine');
        defenseLineLeftPlayer = game.add.tileSprite(0, heightPercent(35), widthPercent(50), 100, 'defenseLine');
        attackLineRightPlayer = game.add.tileSprite(widthPercent(50), heightPercent(35), widthPercent(50), 20, 'attackLine');
        defenseLineRightPlayer = game.add.tileSprite(widthPercent(50), heightPercent(15), widthPercent(50), 100, 'defenseLine');
        defenseLineLeftPlayer.tileScale.y = 0.5;
        defenseLineRightPlayer.tileScale.y = 0.5;
        defenseLineLeftPlayer.tileScale.x = 0.2;
        defenseLineRightPlayer.tileScale.x = 0.2;

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
        spellType = (spellType == 'attack') ? 'attackSpell' : 'defenseSpell';

        // Log cast spell
        console.gameLog(pad.name + ' cast spell: ' + players[pad.name][spellType].join('-'), 'spell');

        // Verify if runes mactch a real spell
        var matchRealSpell = false;
        if(matchRealSpell) {
            // TODO: Make the spell alive !
        }
        else {
            downgradePlayerLife(pad.name, config.wrongSpellLifeCost);
        }

        // Consume the runes of the spell
        players[pad.name][spellType] = [];
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
        }
        // Resume the game
        else {
            $('#pause_screen').fadeOut(function(){
                game.paused = false;
            });
        }
    }

    /**
     * Handle sticks usage for players
     * @param pad
     * @param value
     */
    function onAxisCallback(pad, value) {
        // TODO
        //console.log(this.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X)); return;
    }

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
     * Launch win screen
     */
    function launchWinScreen () {

        // TODO
        //ball.body.velocity.setTo(0, 0);
        //introText.text = 'Game Over!';
        //introText.visible = true;

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

    /**
     * Get % of height of the game size
     * @param percent
     */
    function heightPercent(percent) {
        return $('#game').height() * percent / 100;
    }

    /**
     * Get % of width of the game size
     * @param percent
     */
    function widthPercent(percent) {
        return $('#game').width() * percent / 100;
    }

});})(jQuery);

/**
 * Util function to capitalize first letter in a string
 * @returns {string}
 */
String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

/**
 * Game log function which only log if debug is enable and if context is enable
 * @param data data to log
 * @param context context of the data
 */
console.gameLog = function(data, context) {
    if(debug.enable == true && typeof debug.contexts[context] != 'undefined' && debug.contexts[context] == true) {
        console.log(data);
    }
};