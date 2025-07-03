const GOR_MIN = 2;

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
    }// In your GameScene.js or networking module
async  wakeRenderServer() {
    try {
        const wakeResponse = await fetch('https://trash-rush-server.onrender.com/wake', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-wake-up': 'true' // Custom header to identify wake calls
            },
            body: JSON.stringify({
                source: 'client',
                timestamp: Date.now()
            })
        });

        if (!wakeResponse.ok) {
            throw new Error(`Server responded with ${wakeResponse.status}`);
        }

        const data = await wakeResponse.json();
        console.log('Server wake successful:', data);
        return { success: true, ping: data.ping };
    } catch (error) {
        console.error('Wake attempt failed:', error.message);
        return { success: false, error: error.message };
    }
}


    preload() {
        this.wakeRenderServer();
        this.game.soundManager = new SoundManager(this);
        
        
        this.load.image('spark', 'assets/spark.png'); // For networked player effects
        
        
    
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
        this.game.soundManager.create();
        this.initAudio();
        this.scene.start(!'GameScene' ||  'TitleScene');
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
                //this.titleMusic = this.sound.add('titleMusic', { loop: true, volume: 0.5 });
                //this.titleMusic.play();
                this.game.soundManager.playMainMusic();

            }
        } catch (e) {
            console.warn('Audio playback error:', e.message);
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
        this.connectButton = null;
        this.playButton = null;
        this.disconnectButton = null;
        this.menuButtons = [];
        this.isTweening = false;
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
        this.updateWalletButton();
        
        document.addEventListener('walletConnected', () => this.onWalletConnected());
        document.addEventListener('walletDisconnected', () => this.updateWalletButton());
    }
    
    createMenuButtons() {
        const centerX = this.sys.game.config.width / 2;
       
    const buttonStyle = {
        fontFamily: 'Comic',
        fontSize: '48px',
        color: '#FFD700', // Gold text
        stroke: '#8B4513', // Brown border
        strokeThickness: 8,
        shadow: {
            offsetX: 4,
            offsetY: 4,
            color: '#000000',
            blur: 0,
            stroke: true,
            fill: true
        },
        backgroundColor: '#5D2906', // Darker brown
        padding: { x: 30, y: 15 },
        fixedWidth: 450,
        align: 'center'
    };
        
        const walletConnected = window.walletManager?.connected;
        
        let nn = 70;
        this.playButton = this.add.text(
            centerX,
            300+nn, //walletConnected ? 300 : 400,
            'Play Game',
            buttonStyle
        ).setOrigin(0.5).setInteractive();
        
        this.connectButton = this.add.text(
            centerX,
            400+nn, //walletConnected ? 400 : 300,
            'Connect Wallet',
            buttonStyle
        ).setOrigin(0.5).setInteractive();
        
        const buttons = [
            //{ text: 'Options', y: walletConnected ? 500 : 500, action: () => console.log('Options clicked') },
            { text: 'How to Play', y: walletConnected ? 500+nn : 500+nn, action: () => this.showHowToPlay() }
        ];
        
        buttons.forEach(btn => {
            const button = this.add.text(
                centerX,
                btn.y,
                btn.text,
                buttonStyle
            ).setOrigin(0.5).setInteractive();
            
            this.setupButtonInteractions(button, btn.action);
            this.menuButtons.push(button);
        });
        
        if (walletConnected) {
            //this.createDisconnectButton();
        }
        
        this.setupButtonInteractions(this.playButton, () => this.showStakeConfirmation());
        this.setupButtonInteractions(this.connectButton, () => 
            {
                //this.showWalletSelector();
                this.handleWalletConnect("backpack");
            });
    }
    
    createDisconnectButton() {
        /*const centerX = this.sys.game.config.width / 2;
        this.disconnectButton = this.add.text(
            centerX,
            700,
            'Disconnect Wallet',
            {
                fontFamily: 'Comic',
                fontSize: '36px',
                color: '#ffffff',
                backgroundColor: '#ff0000',
                padding: { x: 20, y: 10 },
                fixedWidth: 400,
                align: 'center'
            }
        ).setOrigin(0.5).setInteractive();
        
        this.setupButtonInteractions(this.disconnectButton, () => this.handleWalletDisconnect());
        this.menuButtons.push(this.disconnectButton);*/
    }
    
    setupButtonInteractions(button, action, ignoreTweening) {
        button.on('pointerover', () => {
            if (!this.isTweening||ignoreTweening) {
                button.setStyle({ fill: '#ffff00' });
                button.setScale(1.05);
            }
        });
        
        button.on('pointerout', () => {
            if (!this.isTweening||ignoreTweening) {
            button.setStyle({ fill: '#ffffff' });
            button.setScale(1);
            this.game.soundManager.playMenuSound();
            }
        });
        
        button.on('pointerdown', () => {
            if (this.isTweening&&!ignoreTweening) return;
            
            this.game.soundManager.playScoreSound();
            this.tweens.add({
                targets: button,
                angle: Phaser.Math.Between(-5, 5),
                duration: 100,
                yoyo: true,
                repeat: 3,
                ease: 'Sine.easeInOut'
            });
            this.time.delayedCall(120, action);
        });
    }
    
    
async showWalletSelector() {
    if (this.isTweening) return;
    
    // Create modal elements
    const modalBg = this.add.graphics()
        .fillStyle(0x000000, 0.7)
        .fillRect(0, 0, this.sys.game.config.width, this.sys.game.config.height)
        .setInteractive();
    
    const panel = this.add.graphics()
        .fillStyle(0x8B4513, 0.9)
        .fillRoundedRect(
            this.sys.game.config.width / 2 - 300,
            this.sys.game.config.height / 2 - 200,
            600, 400, 20
        );
    
    // Title
    const titleText = this.add.text(
        this.sys.game.config.width / 2,
        this.sys.game.config.height / 2 - 150,
        'Select Wallet',
        {
            fontFamily: 'Comic',
            fontSize: '48px',
            color: '#ffffff',
            align: 'center'
        }
    ).setOrigin(0.5);
    
    // Get available wallets
    const availableWallets = window.walletManager?.detectedWallets || [];
    const buttonStyle = {
        fontFamily: 'Comic',
        fontSize: '36px',
        color: '#ffffff',
        backgroundColor: '#8B4513',
        padding: { x: 20, y: 10 },
        fixedWidth: 400,
        align: 'center'
    };
    
    // Store all created elements for cleanup
    const modalElements = [modalBg, panel, titleText];
    
    // Create wallet buttons with icons
    availableWallets.forEach((wallet, index) => {
        // Create button container
        const buttonContainer = this.add.container(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 50 + (index * 100)
        );
        
        // Create button background
        const buttonBg = this.add.graphics()
            .fillStyle(0x8B4513, 1)
            .fillRoundedRect(-200, -30, 400, 60, 15);
        
        // Create button text
        const buttonText = this.add.text(
            0,
            0,
            wallet.name.charAt(0).toUpperCase() + wallet.name.slice(1),
            {
                fontFamily: 'Comic',
                fontSize: '36px',
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Try to load wallet icon
        try {
            const icon = this.add.image(-150, 0, `${wallet.name}_icon`)
                .setDisplaySize(40, 40)
                .setOrigin(0.5);
            buttonContainer.add(icon);
        } catch (e) {
            console.warn(`Couldn't load icon for ${wallet.name}:`, e);
        }
        
        buttonContainer.add([buttonBg, buttonText]);
        buttonContainer.setInteractive(
            new Phaser.Geom.Rectangle(-200, -30, 400, 60),
            Phaser.Geom.Rectangle.Contains
        );
        
        buttonContainer.on('pointerdown', async () => {
            // Clean up all modal elements
            modalElements.forEach(element => element.destroy());
            buttonContainer.destroy();
            
            // Handle wallet connection
            await this.handleWalletConnect(wallet.name);
        });
        
        modalElements.push(buttonContainer);
    });
    
    // Close button
    const closeButton = this.add.text(
        this.sys.game.config.width / 2,
        this.sys.game.config.height / 2 + 150,
        'Close',
        buttonStyle
    ).setOrigin(0.5).setInteractive();
    
    modalElements.push(closeButton);
    
    closeButton.on('pointerdown', () => {
        // Clean up all modal elements
        modalElements.forEach(element => element.destroy());
    });
}

    async handleWalletConnect(walletName = null) {
        try {
            //this.isTweening = true;
            this.connectButton.setText('Connecting...');
            this.connectButton.setStyle({ backgroundColor: '#FFA500' });
            this.connectButton.setInteractive(false);
            this.playButton.setInteractive(false);
            
            await window.walletManager.connect(walletName);
            
            const wallet = window.walletManager;
            this.connectButton.setText(wallet.getShortAddress());
            this.connectButton.setStyle({ backgroundColor: '#4CAF50' });
            this.showNotification('CONNECTED!',0x00FF00);
        } catch (error) {
            this.connectButton.setText('Connect Wallet');
            this.connectButton.setStyle({ backgroundColor: '#8B4513' });
            
            this.showNotification(`${error.message}\nCheck internet connection or backpack extension.`,0xFF0000);
        } finally {
            this.connectButton.setInteractive(true);
            this.playButton.setInteractive(true);
            this.isTweening = false;
        }
    }
    
    async handleWalletDisconnect() {
        try {
            this.isTweening = true;
            this.connectButton.setInteractive(false);
            this.playButton.setInteractive(false);
            this.disconnectButton?.setInteractive(false);
            
            await window.walletManager.disconnect();
            
            if (this.disconnectButton) {
                this.disconnectButton.destroy();
                this.disconnectButton = null;
            }
            
            this.updateWalletButton();
            
            if (false) {
            this.tweens.add({
                targets: this.playButton,
                y: 400,
                duration: 300,
                ease: 'Power2'
            });
            
            this.tweens.add({
                targets: this.connectButton,
                y: 300,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    this.connectButton.setInteractive(true);
                    this.playButton.setInteractive(true);
                    this.isTweening = false;
                }
            });
        }
            
        } catch (error) {
            console.error('Disconnect failed:', error);
            this.showNotification(`Disconnect failed: ${error.message}`, '#ff0000');
            this.connectButton.setInteractive(true);
            this.playButton.setInteractive(true);
            this.disconnectButton?.setInteractive(true);
            this.isTweening = false;
        }
    }
    
    nadda () {}

    updateWalletButton() {
        if (!this.connectButton || this.isTweening) return;
        
        const wallet = window.walletManager;
        if (!wallet) {
            this.connectButton.setText('Install Wallet');
            this.connectButton.setStyle({ backgroundColor: '#ff0000' });
            this.connectButton.on('pointerdown', () => window.open('https://phantom.app/', '_blank'));
            return;
        }


        
        if (wallet.connected) {
            this.connectButton.setText(wallet.getShortAddress());
            this.connectButton.setStyle({ backgroundColor: '#4CAF50' });
            this.connectButton.on('pointerdown', this.nadda);
            
            if (false && this.playButton.y > this.connectButton.y) {
                this.isTweening = true;
                this.connectButton.setInteractive(false);
                this.playButton.setInteractive(false);
                
                /*this.tweens.add({
                    targets: this.playButton,
                    y: this.connectButton.y,
                    duration: 300,
                    ease: 'Power2'
                });
                
                this.tweens.add({
                    targets: this.connectButton,
                    y: this.playButton.y,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                        this.connectButton.setInteractive(true);
                        this.playButton.setInteractive(true);
                        this.isTweening = false;
                        
                        if (!this.disconnectButton) {
                            this.createDisconnectButton();
                        }
                    }
                });*/
            }
        } else {
            this.connectButton.setText('Connect Wallet');
            this.connectButton.setStyle({ backgroundColor: '#8B4513' });
            this.connectButton.on('pointerdown', () => {
                //this.showWalletSelector()
                this.handleWalletConnect("backpack");
        });
            
            if (this.disconnectButton) {
                this.disconnectButton.destroy();
                this.disconnectButton = null;
                this.menuButtons = this.menuButtons.filter(btn => btn !== this.disconnectButton);
            }
            
            if (false && this.playButton.y < this.connectButton.y) {
                this.isTweening = true;
                this.connectButton.setInteractive(false);
                this.playButton.setInteractive(false);
                
                this.tweens.add({
                    targets: this.playButton,
                    y: 400,
                    duration: 300,
                    ease: 'Power2'
                });
                
                this.tweens.add({
                    targets: this.connectButton,
                    y: 300,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                        this.connectButton.setInteractive(true);
                        this.playButton.setInteractive(true);
                        this.isTweening = false;
                    }
                });
            }
        }
    }
    
    onWalletConnected() {
        this.updateWalletButton();
        //this.connectButton.setText('Connected!');
        
        if (false && this.playButton && this.playButton.y < this.connectButton.y) {
            this.tweens.add({
                targets: this.playButton,
                y: this.connectButton.y,
                duration: 500,
                ease: 'Power2'
            });
            
            this.tweens.add({
                targets: this.connectButton,
                y: this.playButton.y,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    this.tweens.add({
                        targets: this.playButton,
                        angle: { from: -10, to: 10 },
                        duration: 100,
                        yoyo: true,
                        repeat: 5,
                        ease: 'Sine.easeInOut'
                    });
                }
            });
        }
    }
    
    showHowToPlay() {
        this.isTweening = true;
        const modalBg = this.add.graphics()
            .fillStyle(0x000000, 0.7)
            .fillRect(0, 0, this.sys.game.config.width, this.sys.game.config.height)
            .setInteractive();
        
        const infoText = `
1. Connect your BACKPACK wallet
2. Stake ${GOR_MIN} GOR tokens to enter the game
3. Compete against other players in a fast-paced TRASH tapping game
4. DON'T TAP WHEN THE TRASH MONSTER ARRIVES  OR ELSE!!
5. Your staked tokens go into the prize pool
6. The player who taps the most wins after 3 rounds the pool!`;
        
        const textBox = this.add.graphics()
            .fillStyle(0x8B4513, 0.9)
            .fillRoundedRect(
                this.sys.game.config.width / 2 - 350,
                this.sys.game.config.height / 2 - 250,
                700, 500, 20
            );
        
        const howToText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 50,
            infoText,
            {
                fontFamily: 'Comic',
                fontSize: '28px',
                color: '#ffffff',
                align: 'center',
                lineSpacing: 10,
                wordWrap: { width: 650 }
            }
        ).setOrigin(0.5);
        
        const closeButton = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 + 200,
            'Close',
            {
                fontFamily: 'Comic',
                fontSize: '36px',
                color: '#ffffff',
                backgroundColor: '#8B4513',
                padding: { x: 20, y: 10 },
                fixedWidth: 200,
                align: 'center'
            }
        ).setOrigin(0.5).setInteractive();
        
        this.setupButtonInteractions(closeButton, () => {
            modalBg.destroy();
            textBox.destroy();
            howToText.destroy();
            closeButton.destroy();
            this.isTweening = false;
        },true);
    }
    
    async showStakeConfirmation() {
        if (!window.walletManager?.connected) {
            this.showNotification('Please connect your wallet first');
            return;
        }
        
        try {
            const balance = await window.walletManager.getBalance();
            if (balance.gor < GOR_MIN) {
                this.showNotification(`Insufficient balance! You need at least ${GOR_MIN} GOR`, '#ff0000');
                return;
            }
        } catch (error) {
            this.showNotification(`Error checking balance: ${error.message}\nPlease check metwrk connection.`, '#ff0000');
            return;
        }
        
        const modalBg = this.add.graphics()
            .fillStyle(0x000000, 0.7)
            .fillRect(0, 0, this.sys.game.config.width, this.sys.game.config.height)
            .setInteractive();
        
        const bgPanel = this.add.graphics()
            .fillStyle(0x8B4513, 1.0)
            .fillRoundedRect(
                this.sys.game.config.width / 2 - 300,
                this.sys.game.config.height / 2 - 150,
                600, 300, 20
            );
        
        const confirmText = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height / 2 - 80,
            `To play, you need to stake ${GOR_MIN} GOR tokens\n\nThis goes into the prize pool\nWinner takes all!`,
            {
                fontFamily: 'Comic',
                fontSize: '28px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: 550 }
            }
        ).setOrigin(0.5);
        
        const buttonStyle = {
            fontFamily: 'Comic',
            fontSize: '36px',
            color: '#ffffff',
            backgroundColor: '#8B4513',
            padding: { x: 20, y: 10 },
            fixedWidth: 250,
            align: 'center'
        };
        
        const confirmButton = this.add.text(
            this.sys.game.config.width / 2 - 160,
            this.sys.game.config.height / 2 + 80,
            'Confirm',
            buttonStyle
        ).setOrigin(0.5).setInteractive();
        
        const cancelButton = this.add.text(
            this.sys.game.config.width / 2 + 160,
            this.sys.game.config.height / 2 + 80,
            'Cancel',
            buttonStyle
        ).setOrigin(0.5).setInteractive();
        
        this.setupButtonInteractions(confirmButton, async () => {
            modalBg.destroy();
            bgPanel.destroy();
            confirmText.destroy();
            confirmButton.destroy();
            cancelButton.destroy();
            
            await this.stakeTokens();
        });
        
        this.setupButtonInteractions(cancelButton, () => {
            modalBg.destroy();
            bgPanel.destroy();
            confirmText.destroy();
            confirmButton.destroy();
            cancelButton.destroy();
        });
    }
    
    async stakeTokens() {
        try {
            const processingBg = this.add.graphics()
                .fillStyle(0x8B4513, 0.9)
                .fillRoundedRect(
                    this.sys.game.config.width / 2 - 300,
                    this.sys.game.config.height / 2 - 100,
                    600, 200, 20
                );
            
            const loadingText = this.add.text(
                this.sys.game.config.width / 2,
                this.sys.game.config.height / 2 - 30,
                'Processing transaction...\nPlease approve in your wallet',
                {
                    fontFamily: 'Comic',
                    fontSize: '28px',
                    color: '#ffffff',
                    align: 'center',
                    wordWrap: { width: 550 }
                }
            ).setOrigin(0.5);
            
            const statusText = this.add.text(
                this.sys.game.config.width / 2,
                this.sys.game.config.height / 2 + 40,
                'Fetching transaction info...',
                {
                    fontFamily: 'Comic',
                    fontSize: '20px',
                    color: '#ffffff',
                    align: 'center'
                }
            ).setOrigin(0.5);
            
            this.time.delayedCall(1000, () => {
                statusText.setText('Checking wallet balance...');
            });
            
            this.time.delayedCall(2000, () => {
                statusText.setText('Creating transaction...');
            });
            
            const result = await window.walletManager.stakeTokens(GOR_MIN);
            
            if (result.success) {
                statusText.setText('Transaction confirmed! Starting game...');
                
                this.time.delayedCall(2000, () => {
                    processingBg.destroy();
                    loadingText.destroy();
                    statusText.destroy();
                    this.startGame();
                });
            } else {
                processingBg.destroy();
                loadingText.destroy();
                statusText.destroy();
                throw new Error(result.error && result.error.message || 'Transaction failed');
            }
        } catch (error) {
            const errorText = this.add.text(
                this.sys.game.config.width / 2,
                this.sys.game.config.height / 2,
                error.message,
                {
                    fontFamily: 'Comic',
                    fontSize: '28px',
                    color: '#ff0000',
                    align: 'center',
                    wordWrap: { width: 550 }
                }
            ).setOrigin(0.5);
            
            this.time.delayedCall(3000, () => errorText.destroy());
        }
    }
    
    startGame() {
        if (this.titleMusic) this.titleMusic.stop();
        this.fadeToScene('GameScene', { bgContainer: this.bgContainer });
    }
    
    createBackButton() {
        this.backButton = this.add.text(50, 50, '←', {
            fontFamily: 'Comic',
            fontSize: '48px',
            color: '#ffffff',
            backgroundColor: '#8B4513',
            padding: { x: 15, y: 5 }
        }).setInteractive();
        
        this.setupButtonInteractions(this.backButton, () => this.handleBackAction());
        
        this.backKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.backKey.on('down', () => this.handleBackAction());
        
        this.input.keyboard.on('keydown-BACKSPACE', () => this.handleBackAction());
    }

    handleBackAction() {
        if (confirm('Do you want to exit the game?')) {
            if (this.titleMusic) this.titleMusic.stop();
            window.close();
        }
    }

    showNotification(message, color = '#000000', duration = 2000) {
        const bg = this.add.graphics()
            .fillStyle(0xFFB380,.9)//Phaser.Display.Color.RGBToString(255,179, 128), 0.9)
            .fillRoundedRect(
                this.sys.game.config.width / 2 - 225,
                this.sys.game.config.height - 220,
                450, 200, 10
            );
        
        const notification = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height - 110,
            message,
            {
                fontFamily: 'Comic',
                fontSize: '30px',
                color: color,
                align: 'center',
                wordWrap: { width: 430 }
            }
        ).setOrigin(0.5);
        
        this.time.delayedCall(duration, () => {
            this.tweens.add({
                targets: [notification, bg],
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    notification.destroy();
                    bg.destroy();
                }
            });
        });
    }

    resizeUI() {
        const centerX = this.sys.game.config.width / 2;
        
        if (this.connectButton) {
            this.connectButton.setPosition(centerX, this.connectButton.y);
        }
        
        this.menuButtons.forEach((button, index) => {
            button.setPosition(centerX, button.y);
        });
        
        if (this.backButton) {
            this.backButton.setPosition(50, 50);
        }
    }
}
/*
// Game Configuration
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1920,
    height: 1080,
    scene: [BootScene,GameScene,GameOverScene] ?? [BootScene, BackgroundScene, TitleScene, MenuScene, GameScene, GameOverScene],
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
new Phaser.Game(config);*/