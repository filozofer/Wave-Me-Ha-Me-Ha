/**
 * Game main file
 */

(function($) {$(document).ready(function() {

    // Init Phaser game
    var game = new Phaser.Game($('#game').width(), $('#game').height(), Phaser.AUTO, 'game', {
        preload: preload,
        create: create,
        update: update
    }, true);

    // Init game vars
    var waves = {
        'aggresiveWavesLeftPlayer': undefined,
        'defensiveWavesLeftPlayer': undefined,
        'aggresiveWavesRightPlayer': undefined,
        'defensiveWavesRightPlayer': undefined
    };
    var player1Hitbox;
    var player2Hitbox;
    var wavemehamehaLeftPlayer;
    var wavemehamehaRightPlayer;
    var padPlayer1;
    var padPlayer2;

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

        // Declare inputs listener
        game.input.gamepad.start();
        padPlayer1 = game.input.gamepad.pad1;
        padPlayer2 = game.input.gamepad.pad2;
        //game.input.onDown.add(releaseBall, this);

        if(!game.input.gamepad.supported || !game.input.gamepad.active || !padPlayer1.connected) {
            console.log('Merci de brancher une première manette !');
        }
        if(!game.input.gamepad.supported || !game.input.gamepad.active || !padPlayer2.connected) {
            console.log('Merci de brancher une seconde manette !');
        }

    }

    /**
     * Update loop to handle movements & collisions
     */
    function update () {



        /*

        // Handle players inputs
        // Pad "connected or not" indicator
        if (game.input.gamepad.supported && game.input.gamepad.active && padPlayer1.connected)
        {
            indicator.animations.frame = 0;
        }
        else
        {
            indicator.animations.frame = 1;
        }

        // Controls
        if (pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_LEFT) || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) < -0.1)
        {
            sprite.x--;
        }
        else if (pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_RIGHT) || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) > 0.1)
        {
            sprite.x++;
        }

        if (pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_UP) || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) < -0.1)
        {
            sprite.y--;
        }
        else if (pad1.isDown(Phaser.Gamepad.XBOX360_DPAD_DOWN) || pad1.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) > 0.1)
        {
            sprite.y++;
        }

        if (pad1.justPressed(Phaser.Gamepad.XBOX360_A))
        {
            sprite.angle += 5;
        }

        if (pad1.justReleased(Phaser.Gamepad.XBOX360_B))
        {
            sprite.scale.x += 0.01;
            sprite.scale.y = sprite.scale.x;
        }

        if (pad1.connected)
        {
            var rightStickX = pad1.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_X);
            var rightStickY = pad1.axis(Phaser.Gamepad.XBOX360_STICK_RIGHT_Y);

            if (rightStickX)
            {
                sprite.x += rightStickX * 10;
            }

            if (rightStickY)
            {
                sprite.y += rightStickY * 10;
            }
        }
        */

        // Verify colission between waves
        // TODO
        //game.physics.arcade.collide(ball, paddle, ballHitPaddle, null, this);
        //game.physics.arcade.collide(ball, bricks, ballHitBrick, null, this);

        // Verify colission between waves and players hitbox

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