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
        'life': true,
        'speed': true
    }
};

// Configurable variable
var config = {
    'initGameSpeed'              : 1,
    'wrongSpellLifeCost'         : 5,
    'wrongCounterSpellLifeCost'  : 10,
    'hitByOtherPlayerLifeCost'   : 30,
    'waveSpeed'                  : 100,
    'wavemehamehaSpeed'          : 200,
    'secondsBetweenEachSpeedUp'  : 20,
    'secondsBeforeSpeedUpAfterWarning' : 2,
    'gameSpeedMultiplicator'     : 1.2
};

// Spell Combos !
var spells = {
    'easy'   : { 'water': 'L'    , 'grass': 'D'    , 'fire': 'R' },
    'medium' : { 'water': 'L-U'  , 'grass': 'D-L'  , 'fire': 'R-D' },
    'hard'   : { 'water': 'L-R-U', 'grass': 'D-L-U', 'fire': 'R-U-D' },
    'crazy'  : { 'water': 'L-R-U-R', 'grass': 'D-L-U-U', 'fire': 'R-U-D-R' }
};

// Init all game global vars
var wavesInitState = {
    'attackWavesPlayer1'  : null,
    'defenseWavesPlayer1' : null,
    'attackWavesPlayer2'  : null,
    'defenseWavesPlayer2':  null
};
var playersInitState = {
    'player1': { 'name': 'player1', 'difficulty': 'easy', 'pad': undefined, 'defenseSpell': [], 'attackSpell': [], life: 50, 'enemyName': 'player2' },
    'player2': { 'name': 'player2', 'difficulty': 'easy', 'pad': undefined, 'defenseSpell': [], 'attackSpell': [], life: 50, 'enemyName': 'player1' }
};
var linesInitState = {
    'attackPlayer1'   : null,
    'defensePlayer1'  : null,
    'attackPlayer2'  : null,
    'defensePlayer2' : null
};
var game;
var waves;
var lines;
var players;
var playersHitbox;
var wavemehamehaLeftPlayer;
var wavemehamehaRightPlayer;
var wavemehamehaImpact;
var upLineImpact;
var downLineImpact;
var warningSpeedUp;
var warningTween;
var moveWavemehamehaImpact;
var gameSpeed;
var difficultyMode = 'easy';

(function($) {$(document).ready(function() {

    // Init Phaser game
    game = new Phaser.Game($('#game').width(), $('#game').height(), Phaser.AUTO, 'game', null, true);
    game.state.add('loading', { init: initLoading, closeLoading: closeLoading });
    game.state.add('startscreen', { create: createStartScreen });
    game.state.add('pregame', { create: createPreGame });
    game.state.add('game', { preload: preload, create: create, update: update });
    game.state.add('winscreen', { create: createWinScreen });

    /**
     * Start game on loading screen waiting for game to be load
     */
    // Show loading screen
    game.state.states['loading'].init();
    game.state.start('startscreen');

    /**
     * Init Loading by showing loading screen if not visible yet
     */
    function initLoading(endLoadingCheck, nextState) {

        // Hide other fullscreen window
        $('.fullscreen').hide(0);

        // Show loading screen
        if(!$('#loading_screen').is(':visible')) {
            $('#loading_screen').show(0);
        }
    }

    /**
     * Loading handler state
     */
    function closeLoading() {

        // Set default degree value (0)
        $('#loader').attr('deg', ($('#loader').attr('deg') != undefined) ? parseInt( $('#loader').attr('deg')) : 0);

        // Get actual degree
        var actualDeg = parseInt($('#loader').attr('deg'));

        // Fast speed rotation for loader
        $('#loader').css('transform', 'rotate(' + (actualDeg + 1440) + 'deg)');
        $('#loader').attr('deg', actualDeg + 1440);

        // Close the loading screen
        setTimeout(function(){
            $('#loading_screen').fadeOut();
        }, 1000);

    }

    /**
     * Start Screen
     */
    function createStartScreen() {

        // Display start screen
        $('#start_screen').show(0);

        // Close loading
        game.state.states['loading'].closeLoading();

        // Init players
        players = jQuery.extend({}, playersInitState);

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
                    case Phaser.Gamepad.XBOX360_START:
                        game.state.start('pregame');
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
     * Handle inputs on pregame screen
     */
    function createPreGame() {

        // Reset pregrame screen
        $('.press_a_container .press_a').removeClass('ready');

        // Display pregame
        $('#pregame_screen').fadeIn();

        // Close loading
        game.state.states['loading'].closeLoading();

        // Init players
        players = jQuery.extend({}, playersInitState);

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
        $('.difficulty_mode').css({'visibility': 'visible'}).find('.slick-slide').animate({width: "toggle"}, 2000);
        $('.difficulty_mode .difficulty.slick-slide').css('line-height', $('.difficulty_mode').height() + 'px');

        // Default difficulty mode
        difficultyMode = 'easy';

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
                        difficultyMode = $('.difficulty_mode .slick-current').attr('difficulty');
                        break;
                    case Phaser.Gamepad.XBOX360_DPAD_LEFT:
                        $('.difficulty_mode').slick('slickPrev');
                        difficultyMode = $('.difficulty_mode .slick-current').attr('difficulty');
                        break;

                    // Validate player is ready
                    case Phaser.Gamepad.XBOX360_A:

                        // Set player in ready state
                        $('.press_a_container .press_a.' + this.name).toggleClass('ready');

                        // If both player ready start the game !
                        if($('.press_a_container .press_a.ready').length === 2) {
                            setTimeout(function(){
                                game.state.states['loading'].init();
                                $('#pregame_screen').hide(0);
                                game.state.start('game');
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

        // Show loading screen
        game.state.states['loading'].init();

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

        // Load warning image
        game.load.image('warning', 'assets/images/warning.png');

        // Call loading screen
        game.load.onLoadComplete.add(function(){
            // Fake loading time // TODO: Remove this ?
            setTimeout(function(){
                game.state.states['loading'].closeLoading();
            }, 1000);
        }, this);

    }

    /**
     * Init game
     */
    function create() {

        // Reset game variables for new game
        this.stopUpdate = false;
        gameSpeed = config.initGameSpeed;
        players = jQuery.extend(true, {}, playersInitState);
        waves = jQuery.extend(true, {}, wavesInitState);
        lines = jQuery.extend(true, {}, linesInitState);
        $('#character_1').attr('style', '');
        $('#character_2').attr('style', '');

        // Start game physics mode
        game.physics.startSystem(Phaser.Physics.ARCADE);

        // Waveméhaméha init !
        wavemehamehaLeftPlayer = game.add.tileSprite(0, heightPercent(60), game.world.centerX, 150, 'wavemehamehaBeamLeftPlayer');
        wavemehamehaRightPlayer = game.add.tileSprite(game.world.centerX, heightPercent(60), game.world.centerX, 150, 'wavemehamehaBeamRightPlayer');
        wavemehamehaLeftPlayer.scale.setTo(1, 1);
        wavemehamehaRightPlayer.scale.setTo(1, 1);
        wavemehamehaImpact = game.add.sprite(widthPercent(51.2), heightPercent(72), 'wavemehamehaBeamImpact');
        wavemehamehaImpact.anchor.setTo(0.5, 0.5);
        wavemehamehaImpact.scale.setTo(1, 0.9);
        wavemehamehaLeftPlayer.alpha = 0;
        wavemehamehaRightPlayer.alpha = 0;
        wavemehamehaImpact.alpha = 0;

        // Attack & Defense lines between players init
        lines['attackPlayer1'] = game.add.tileSprite(0, heightPercent(5), game.world.centerX, 120, 'attackLine');
        lines['defensePlayer1'] = game.add.tileSprite(0, heightPercent(25), game.world.centerX, 120, 'defenseLine');
        lines['attackPlayer2'] = game.add.tileSprite(game.world.centerX, heightPercent(25), game.world.centerX, 120, 'attackLine');
        lines['defensePlayer2'] = game.add.tileSprite(game.world.centerX, heightPercent(5), game.world.centerX, 120, 'defenseLine');
        lines['attackPlayer1'].direction = 1;
        lines['defensePlayer1'].direction = 1;
        lines['attackPlayer2'].direction = -1;
        lines['defensePlayer2'].direction = -1;
        for(var k in lines) {
            lines[k].tileScale.y = 0.6;
            lines[k].tileScale.x = 0.3;
            lines[k].alpha = 0;
            lines[k].beginOfLine = function() {
                var x = (this.direction == 1) ? this.x : this.x + this.width;
                return { x: x, y: this.y + this.height / 2 }
            };
        }
        upLineImpact = game.add.sprite(widthPercent(50) + 25, heightPercent(5)+ 5, 'lineImpact');
        upLineImpact.scale.setTo(0.6,0.6);
        upLineImpact.scale.x *= -1;
        upLineImpact.alpha = 0;
        downLineImpact = game.add.sprite(widthPercent(50) - 35, heightPercent(25) + 5, 'lineImpact');
        downLineImpact.scale.setTo(0.6,0.6);
        downLineImpact.alpha = 0;

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
            waves[k] = game.add.group();
            waves[k].enableBody = true;
            waves[k].physicsBodyType = Phaser.Physics.ARCADE;
            waves[k].name = k;
        }

        // Warning icon when speed up game
        warningSpeedUp = game.add.image(game.world.centerX , heightPercent(49), 'warning');
        warningSpeedUp.anchor.setTo(0.5);
        warningSpeedUp.scale.setTo(0.4, 0.4);
        warningSpeedUp.alpha = 0;

        // Declare pads inputs listener
        game.input.gamepad.start();
        var playerId = 1;
        for(var k in players) {
            players[k].pad = game.input.gamepad['pad' + playerId];
            players[k].pad.name = k;
            mapInputsToPlayersAfterXSeconds(players[k], Phaser.Timer.SECOND * 4)
            players[k].difficulty = difficultyMode;
            playerId +=1 ;
        }

        // Get UI position
        var posCharacter1 = parseInt($('#character_1').css('left'));
        $('#character_1').css('left', posCharacter1 - $('#character_1').width());
        $('#character_2').css('right', posCharacter1 - $('#character_2').width());
        $('#commands').css('bottom', -$('#commands').height());

        // Animate UI
        game.time.events.add(Phaser.Timer.SECOND * 2, function(){
            $('#character_1').animate({'left': posCharacter1}, Phaser.Timer.SECOND * 2, function(){
                // Basic animations because we have not time for that !
                game.add.tween(wavemehamehaLeftPlayer).to({alpha: 1}, Phaser.Timer.SECOND, null, true);
                game.add.tween(wavemehamehaRightPlayer).to({alpha: 1}, Phaser.Timer.SECOND, null, true);
                game.add.tween(wavemehamehaImpact).to({alpha: 1}, Phaser.Timer.SECOND, null, true);
                for(var k in lines) {
                    game.add.tween(lines[k]).to({alpha: 0.7}, Phaser.Timer.SECOND, null, true);
                }
                game.add.tween(upLineImpact).to({alpha: 1}, Phaser.Timer.SECOND, null, true);
                game.add.tween(downLineImpact).to({alpha: 1}, Phaser.Timer.SECOND, null, true);
            });
            $('#character_2').animate({'right': posCharacter1}, Phaser.Timer.SECOND * 2);
            $('#commands').animate({'bottom': 0}, Phaser.Timer.SECOND * 2);
        }, this);

        // Print spell book in UI
        printSpellBookUI(spells[players['player1'].difficulty]);

        // Print spell book in console
        console.gameLog(JSON.stringify(spells[players['player1'].difficulty]), 'spellBook');

        // Increase game speed
        game.time.events.loop(Phaser.Timer.SECOND * config.secondsBetweenEachSpeedUp, increaseGameSpeed, this);

    }

    /**
     * Map input to player (allow to call this function after game is ready and not before
     * @param player
     */
    function mapInputsToPlayersAfterXSeconds(player, seconds) {
        game.time.events.add(seconds, function() {
            player.pad.onDownCallback = onDownCallback;
            player.pad.onAxisCallback = onAxisCallback;
        });
    }

    /**
     * Print spell book UI
     */
    function printSpellBookUI(book) {

        // Print each spell in UI
        for(var spell in book) {
            $('.commands_board .' + spell + '_spell .runes_list').html(book[spell].split('-').map(function(rune){
                $rune = $('<img>').addClass('command_icon').attr('src', 'assets/images/command_' + rune + '.png');
                return $('<div>').append($rune).html();
            }).join(''));
        }

    }

    /**
     * Handle buttons usage for players
     * @param buttonCode
     * @param value
     */
    function onDownCallback(buttonCode, value) {

        // Prevent user to continue to cast when game is over
        if(game.state.states['game'].stopUpdate) {
            return;
        }

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
     * Increase game speed
     */
    function increaseGameSpeed(){

        // Warning !
        console.gameLog('Warning: game speed up in ' + config.secondsBeforeSpeedUpAfterWarning + ' seconds !' , 'speed');
         warningTween = game.add.tween(warningSpeedUp);
         warningTween.to({ alpha: 1 }, 100, 'Linear', true, 0, -1, true);

        // Increase speed after warning time
        game.time.events.add(Phaser.Timer.SECOND * config.secondsBeforeSpeedUpAfterWarning, function(){

            // Change gameSpeed for next waves
            gameSpeed *= config.gameSpeedMultiplicator;

            // Change actual waves speed (velocity)
            for(var k in waves) {
                waves[k].forEachExists(function(wave){
                    wave.body.velocity.x *= config.gameSpeedMultiplicator;
                }, this);
            }

            // Log the speed up
            console.gameLog('Game speed up ! Actual speed: x' + gameSpeed, 'speed');

            // Stop warning tween and hide warning icon
            warningTween.stop();
            warningSpeedUp.alpha = 0;

        }, this);

    }

    /**
     * Add rune in one of the player spell (defense or attack)
     * @param pad SinglePad
     * @param spellType string attack|defense
     * @param inputCode integer Phaser.Gamepad.BUTTON_MAPPING
     */
    function addRuneInSpell(pad, spellType, rune) {
        spellTypeSimple = spellType;
        spellType = (spellType == 'attack') ? 'attackSpell' : 'defenseSpell';
        if(players[pad.name][spellType].length < 4) {

            // Put rune in spell bar
            players[pad.name][spellType].push(rune);
            console.gameLog(pad.name + ' cast rune for his ' + spellType + ' : ' + rune, 'rune');

            // Display rune in UI
            $rune = $('<img>').addClass('command_icon').attr('src', 'assets/images/command_' + rune + '.png');
            $('#character_' + pad.name.slice(6) + '_runes_bar_' + spellTypeSimple).append($rune)

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
        var spellTypeBar = (spellType == 'attack') ? 'attackSpell' : 'defenseSpell';
        players[pad.name][spellTypeBar] = [];
        $('#character_' + pad.name.slice(6) + '_runes_bar_' + spellType).html('');
        console.gameLog(pad.name + ' remove all runes for his ' + spellTypeBar, 'rune');
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
            wave.body.velocity.setTo(parseInt(line.direction * (config.waveSpeed * gameSpeed)), 0);

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
        $('#character_' + pad.name.slice(6) + '_runes_bar_' + spellType).html('');
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
        wavemehamehaImpact.targetX = wavemehamehaLeftPlayer.targetWidth;

        // Handle win/lose case !
        if(player.life <= 0) {

            // Tell to win screen which has win
            $('#win_screen').removeClass(player.name).addClass(enemy.name + 'Win')
                .attr('winner', enemy.name)
                .attr('loser', player.name);

            // Stop update
            game.state.states['game'].stopUpdate = true;

            // Call end of game animation
            endOfBattleAnimation();

        }

    }

    /**
     * End of battle animation
     */
    function endOfBattleAnimation() {

        // Winner & loser name
        var winner = $('#win_screen').attr('winner');
        var loser = $('#win_screen').attr('loser');

        // Kill beam & waves
        for(var k in lines) {
            killWithOpacity(lines[k], Phaser.Timer.SECOND);
        }
        killWithOpacity(downLineImpact, Phaser.Timer.SECOND);
        killWithOpacity(upLineImpact, Phaser.Timer.SECOND);
        for(var k in waves) {
            waves[k].forEachExists(function(wave){
                killWithOpacity(wave, Phaser.Timer.SECOND);
            }, this);
        }
        if(warningTween) { warningTween.stop() }
        warningSpeedUp.alpha = 0;

        // Kill the player
        $({brightness: 1}).animate({brightness: 0}, {
            duration: Phaser.Timer.SECOND * 3,
            easing: 'swing', // or "linear"
            step: function() {
                $('#character_' + loser.slice(6)).css({
                    '-webkit-filter': 'brightness('+this.brightness+')',
                    'filter': 'brightness('+this.brightness+')'
                });
            },
            complete: function(){
                wavemehamehaLeftPlayer.kill();
                wavemehamehaRightPlayer.kill();
                wavemehamehaImpact.kill();
                $('#character_' + loser.slice(6)).animate({'opacity': 0}, 500);
            }
        });

        // Beam animation
        moveWavemehamehaImpact = game.add.tween(wavemehamehaImpact);
        moveWavemehamehaImpact.to({x: wavemehamehaImpact.x - 100}, 500, null, false, 0, -1, true);
        moveWavemehamehaImpact = game.add.tween(wavemehamehaImpact);
        var moveWavemehamehaImpactNext = game.add.tween(wavemehamehaImpact);
        moveWavemehamehaImpactNext.to({x: wavemehamehaImpact.x + 100}, 500, null, false, 0, -1, true);
        moveWavemehamehaImpact.chain(moveWavemehamehaImpactNext);
        moveWavemehamehaImpact.start();

        // Display win screen after animation
        game.time.events.add(Phaser.Timer.SECOND * 4, function(){
            game.state.start('winscreen');
        }, this);

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
    function update() {

        // Allow to stop update on win for example
        if(this.stopUpdate) {
            return;
        }

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
            moveWavemehamehaImpact = game.add.tween(wavemehamehaImpact);
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
     * Show win screen and handle inputs
     */
    function createWinScreen(){

        // Close loading
        game.state.states['loading'].closeLoading();

        // Display win screen
        $('#win_screen').fadeIn();

        // If one of the players play start, the game start again !
        for(var k in players) {
            players[k].pad.onDownCallback = function(buttonCode, value){
                switch (buttonCode) {

                    // Start the game again
                    case Phaser.Gamepad.XBOX360_START:
                        $('#win_screen').fadeOut();
                        game.state.start('pregame');
                        break;

                    // Do nothing for other key
                    default: break;
                }
            };
        }

    }

    /**
     * Kill asset by reducing his opacity first, then kill it !
     * @param element
     */
    function killWithOpacity(target, duration) {
        var duration = (!duration) ? 500 : 1000;
        var tween = game.add.tween(target).to({alpha: 0}, duration);
        tween.onComplete.add(function (el) { el.kill(); }, this);
        tween.start();
    }

});})(jQuery);

