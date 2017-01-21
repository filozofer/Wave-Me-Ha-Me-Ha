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
        defenseLineLeftPlayer = game.add.tileSprite(0, heightPercent(35), widthPercent(50), 20, 'defenseLine');
        attackLineRightPlayer = game.add.tileSprite(widthPercent(50), heightPercent(35), widthPercent(50), 20, 'attackLine');
        defenseLineRightPlayer = game.add.tileSprite(widthPercent(50), heightPercent(15), widthPercent(50), 20, 'defenseLine');


        // Declare inputs listener
        // TODO
        //game.input.onDown.add(releaseBall, this);

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