
// Background Scene
class BackgroundScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BackgroundScene', active: true });
    }

    preload() {
        this.load.image('main_bg', 'main_bg.png');
    }

    create() {
        this.bgContainer = this.add.container(0, 0);
        this.bg1 = this.add.image(0, 0, 'main_bg').setOrigin(0, 0);
        this.bgContainer.add([this.bg1]);
        this.children.each((child) => { child.alpha = 0.7; });
        this.setVisible(false);
    }

    setVisible(isVisible) {
        this.children.each((child) => child.setVisible(isVisible));
    }

    showBackground() {
        this.setVisible(true);
        this.scene.moveAbove(null);
    }

    hideBackground() {
        this.setVisible(false);
    }
}

// Boot Scene
class BootScene extends BaseScene {
    constructor() {
        console.log("created Boot");
        super('BootScene');
    }

    preload() {
        this.load.font('comic', 'comic.ttf');
        this.load.audio('titleMusic', 'song1.mp3');
        this.load.audio('gameMusic', 'song2.mp3');
    }

    create() {
        console.log("hmmmm????");
        if (window.walletManager && window.walletManager.connected) {
            console.log('Wallet connected:', window.walletManager.publicKey.toString());
            // You can now use walletManager in your game scenes
        }
        this.initAudio();
        this.scene.start('TitleScene');
    }

    initAudio() {
        try {
            if (this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }
        } catch (e) {
            console.warn('Audio initialization error:', e);
        }
    }
}

// Title Scene
class TitleScene extends BaseScene {
    constructor() {
        super('TitleScene');
        this.backgrounds = [];
        this.startText = null;
        this.allAnimationsComplete = false;
        this.titleMusic = null;
    }

    preload() {
        this.load.image('bg1', 'bg1.png');
        this.load.image('bg2', 'assets/bg2.png');
        this.load.image('bg3', './bg3.png');
    }

    create() {
        this.playTitleMusic();
        this.createBackgrounds();
        this.setupEventListeners();
    }

    playTitleMusic() {
        try {
            if (!this.titleMusic) {
                this.titleMusic = this.sound.add('titleMusic', { loop: true, volume: 0.5 });
                this.titleMusic.play();
            }
        } catch (e) {
            console.warn('Audio playback error:', e);
        }
    }

    createBackgrounds() {
        this.bgContainer = this.add.container(0, 0);
        this.bgContainer.setSize(this.sys.game.config.width, this.sys.game.config.height);
        
        const bg1 = this.add.image(0, 0, 'bg1').setOrigin(0, 0);
        const bg2 = this.add.image(0, this.sys.game.config.height, 'bg3').setOrigin(0, 0);
        const bg3 = this.add.image(0, 0, 'bg2').setOrigin(0, 0);
        
        bg1.alpha = 0;
        bg3.alpha = 0;
        
        this.backgrounds = [bg1, bg2, bg3];
        this.bgContainer.add(this.backgrounds);
        
        const mask = new Phaser.Display.Masks.GeometryMask(
            this, 
            this.add.graphics()
                .fillRect(0, 0, this.sys.game.config.width, this.sys.game.config.height)
        );
        this.bgContainer.setMask(mask);
        
        this.playBackgroundAnimations();
    }

    playBackgroundAnimations() {
        this.tweens.add({
            targets: this.backgrounds[0],
            alpha: 1,
            duration: 1000,
            ease: 'Linear',
            onComplete: () => {
                this.time.delayedCall(500, () => {
                    this.tweens.add({
                        targets: this.backgrounds[2],
                        alpha: 1,
                        duration: 1000,
                        ease: 'Linear'
                    });
                });
                
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: this.backgrounds[1],
                        y: 0,
                        duration: 1000,
                        ease: 'Linear',
                        onComplete: () => {
                            this.allAnimationsComplete = true;
                            this.showStartText();
                        }
                    });
                });
            }
        });
    }

    showStartText() {
        if (!this.allAnimationsComplete) return;
        
        this.startText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height - 100,
            'Click anywhere to begin!',
            {
                fontFamily: 'Comic',
                fontSize: '36px',
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        this.tweens.add({
            targets: this.startText,
            y: this.startText.y - 20,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        this.startText.alpha = 0;
        this.tweens.add({
            targets: this.startText,
            alpha: 1,
            duration: 800,
            ease: 'Linear'
        });
    }

    setupEventListeners() {
        this.input.on('pointerdown', () => {
            if (this.allAnimationsComplete) {
                this.fadeToScene('MenuScene', { 
                    bgContainer: this.bgContainer,
                    titleMusic: this.titleMusic 
                });
            }
        });
    }
}

// Menu Scene
class MenuScene extends BaseScene {
    constructor() {
        super('MenuScene');
        this.titleMusic = null;
    }
    
    init(data) {
        this.bgContainer = data.bgContainer;
        this.titleMusic = data.titleMusic;
    }
    
    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.scene.get("BackgroundScene").showBackground();
        this.createMenuButtons();
        this.createBackButton();
    }
    
    handleBackAction() {
        if (confirm('Do you want to exit the game?')) {
            if (this.titleMusic) this.titleMusic.stop();
            window.close();
        }
    }
    
    createMenuButtons() {
        const centerX = this.sys.game.config.width / 2;
        const buttonStyle = {
            fontFamily: 'Comic',
            fontSize: '62px',
            color: '#ffffff',
            backgroundColor: '#8B4513',
            padding: { x: 20, y: 10 },
            fixedWidth: 500,
            align: 'center'
        };
        
        if (window.walletManager && !window.walletManager.connected) {
            const connectBtn = this.add.text(100, 100, 'Connect Wallet', { 
                fontFamily: 'Comic', 
                fontSize: '24px', 
                color: '#ffffff',
                backgroundColor: '#8B4513',
                padding: { x: 10, y: 5 }
            })
            .setInteractive()
            .on('pointerdown', () => {
                window.walletManager.connect();
            });
        }
        
        const buttons = [
            { text: 'Play Game', y: 300, action: () => this.startGame() },
            { text: 'Options', y: 400, action: () => console.log('Options clicked') },
            { text: 'Credits', y: 500, action: () => console.log('Credits clicked') }
        ];
        
        buttons.forEach(btn => {
            const button = this.add.text(
                centerX,
                btn.y,
                btn.text,
                buttonStyle
            ).setOrigin(0.5).setInteractive();
            
            button.on('pointerover', () => {
                button.setStyle({ fill: '#ffff00' });
                button.setScale(1.05);
            });
            
            button.on('pointerout', () => {
                button.setStyle({ fill: '#ffffff' });
                button.setScale(1);
            });
            
            button.on('pointerdown', () => {
                this.tweens.add({
                    targets: button,
                    angle: Phaser.Math.Between(-5, 5),
                    duration: 100,
                    yoyo: true,
                    repeat: 3,
                    delay: Phaser.Math.Between(0, 1000),
                    ease: 'Sine.easeInOut'
                });
                this.time.delayedCall(120, btn.action);
            });
        });
    }
    
    startGame() {
        if (this.titleMusic && this.titleMusic.isPlaying) {
            this.titleMusic.stop();
        }
        this.fadeToScene('GameScene', { bgContainer: this.bgContainer });
    }
}


// Game Configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1920,
    height: 1080,
    scene: [BootScene, BackgroundScene, TitleScene, MenuScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#000000',
    audio: {
        disableWebAudio: false,
        noAudio: false
    }
};

// Initialize the game
new Phaser.Game(config);