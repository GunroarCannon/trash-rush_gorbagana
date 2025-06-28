// Game Scene
class GameScene extends BaseScene {
    constructor() {
        super('GameScene');
        this.gameMusic = null;
        this.players = [];
        this.trash = null;
        this.isGameActive = false;
        this.scoreTexts = [];
        this.backgrounds = [];
        this.negativeMode = false;
        this.gameTimer = null;
        this.beginText = null;
    }
    
    init(data) {
        this.bgContainer = data.bgContainer;
    }
    
    preload() {
        // Load player character options
        const characters = ['goblin', 'pig', 'tanuki', 'cookie', 'egg', 'dwarf', 'mouse', 'cat'];
        characters.forEach(char => {
            this.load.image(char, `assets/characters/${char}.png`);
        });
        
        // Load player backgrounds
        this.load.image('character_bg', 'assets/characters/character_background.png');
        
        // Load trash types
        const trashTypes = ['golden', 'handbag', 'trashcan'];
        trashTypes.forEach(type => {
            this.load.image(`${type}_normal`, `assets/trash/${type}/normal.png`);
            this.load.image(`${type}_hit1`, `assets/trash/${type}/hit1.png`);
            this.load.image(`${type}_hit2`, `assets/trash/${type}/hit2.png`);
        });
        
        // Load sounds
        for (let i = 1; i <= 8; i++) {
            this.load.audio(`stonebang${i}`, `assets/sounds/hits/stonebang${i}.ogg`);
            this.load.audio(`metalbang${i}`, `assets/sounds/hits/metalbang${i}.ogg`);
        }
        this.load.audio('clang', 'assets/sounds/hits/clang.ogg');
        this.load.audio('critical_hit', 'assets/sounds/hits/critical_hit.ogg');
        this.load.audio('negative_sound', 'assets/sounds/negative_sound2.ogg');
        
        // Load backgrounds
        this.load.image('game_bg', 'assets/backgrounds/game_bg.png');
        this.load.image('game_bg_morning', 'assets/backgrounds/game_bg_morning.png');
        this.load.image('game_bg_night', 'assets/backgrounds/game_bg_night.png');
    }
    
    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        if (this.bgContainer) {
            this.add.existing(this.bgContainer);
            this.tweens.add({
                targets: this.bgContainer,
                alpha: 0.5,
                duration: 500,
                ease: 'Linear'
            });
        }
        
        this.playGameMusic();
        this.createBackButton();
        this.setupBackgrounds();
        this.setupPlayers();
        this.setupTrash();
        this.setupGameStartSequence();
    }
    
    setupBackgrounds() {
        // Morning background (base layer)
        this.backgrounds.push(this.add.image(0, 0, 'game_bg_morning').setOrigin(0));
        
        // Main game background (fades in)
        const mainBg = this.add.image(0, 0, 'game_bg').setOrigin(0).setAlpha(0);
        this.backgrounds.push(mainBg);
        this.tweens.add({
            targets: mainBg,
            alpha: 1,
            duration: 1000,
            ease: 'Linear'
        });
        
        // Night background (will fade in later)
        const nightBg = this.add.image(0, 0, 'game_bg_night').setOrigin(0).setAlpha(0);
        this.backgrounds.push(nightBg);
        
        // Set up the night transition timer
        this.gameTimer = this.time.delayedCall(30000, () => {
            this.tweens.add({
                targets: [this.backgrounds[0]], // Morning bg
                alpha: 10,
                duration: 60000,
                ease: 'Linear'
            });
            
            this.tweens.add({
                targets: [this.backgrounds[2]], // Night bg
                alpha: 1,
                duration: 60000,
                ease: 'Linear'
            });
        });
    }
    
    setupPlayers() {
        const characterChoices = ['goblin', 'pig', 'tanuki', 'cookie', 'egg', 'dwarf', 'mouse', 'cat'];
        const bgColors = [0x00ff00, 0xff0000, 0x0000ff, 0xffff00]; // Green, Red, Blue, Yellow
        
        // Player positions (bottom-left, top-right, top-left, bottom-right)
        const positions = [
            { x: 200, y: this.sys.game.config.height - 200 },
            { x: this.sys.game.config.width - 200, y: 200 },
            { x: 200, y: 200 },
            { x: this.sys.game.config.width - 200, y: this.sys.game.config.height - 200 }
        ];
        
        // Create 4 players (for now, player 1 is the actual player)
        for (let i = 0; i < 4; i++) {
            const charType = characterChoices[Phaser.Math.Between(0, characterChoices.length - 1)];
            const player = this.createPlayer(positions[i].x, positions[i].y, charType, bgColors[i], i);
            this.players.push(player);
            
            // Create score text
            const scoreText = this.add.text(
                i % 2 === 0 ? positions[i].x + 250 : positions[i].x - 250,
                positions[i].y,
                '0',
                { fontFamily: 'Comic', fontSize: '48px', color: '#ffffff' }
            ).setOrigin(i % 2 === 0 ? 0 : 1, 0.5).setAlpha(0);
            
            this.scoreTexts.push(scoreText);
        }
    }
    
    createPlayer(x, y, characterType, bgColor, playerIndex) {
        const isRightSide = playerIndex % 2 === 1; // Players on right side
        const isTop = playerIndex == 3 || playerIndex == 2; // Players on top
        
        // Create sprite group with background and character
        const player = new SpriteGroup(this, x, y, ['character_bg', characterType]);
        
        // Set properties based on position
        player.setDisplaySize(415, 415);
        
        // Flip players on right side (character only)
        if (isRightSide) {
            player.setLayerTexture(1, characterType);
            player._layers[1].setFlipX(true);
        }
        
        // Flip background for top players
        if (isTop) {
            player._layers[0].setFlipY(true);
        }
        
        // Color the background
        player._layers[0].setTint(bgColor);
        
        // Set up click interaction for player 1 (the actual player)
        if (playerIndex === 0) {
            player.img.setInteractive();
            player.img.on('pointerdown', () => {
                if (this.isGameActive) {
                    this.handlePlayerClick(playerIndex);
                }
            });
        }
        
        // Fade in after a delay
        this.time.delayedCall(1500 + (playerIndex * 300), () => {
            player.fadeIn(800);
            this.tweens.add({
                targets: this.scoreTexts[playerIndex],
                alpha: 1,
                duration: 800
            });
        });
        
        return player;
    }
    
    setupTrash() {
        const trashTypes = ['golden', 'handbag', 'trashcan'];
        const trashType = trashTypes[Phaser.Math.Between(0, trashTypes.length - 1)];
        
        // Create trash sprite group
        this.trash = new SpriteGroup(this, this.sys.game.config.width / 2, this.sys.game.config.height / 2, `${trashType}_normal`);
        this.trash.setDisplaySize(500, 500);
        this.trash.setAlpha(0);
        
        // Fade in after players
        this.time.delayedCall(2500, () => {
            this.trash.fadeIn(800);
        });
        
        // Set up click interaction
        this.trash.img.setInteractive();
        this.trash.img.on('pointerdown', () => {
            if (this.isGameActive) {
                this.handleTrashClick(0); // Player 0 is the actual player
            }
        });
    }
    
    setupGameStartSequence() {
        // Create "Begin" text
        this.beginText = this.add.text(
            this.sys.game.config.width / 2,
            -100,
            'BEGIN!',
            { 
                fontFamily: 'Comic', 
                fontSize: '128px', 
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 8
            }
        ).setOrigin(0.5);
        
        // Animate "Begin" text
        this.tweens.add({
            targets: this.beginText,
            y: this.sys.game.config.height / 2,
            duration: 800,
            ease: 'Bounce.easeOut',
            delay: 3500,
            onComplete: () => {
                this.tweens.add({
                    targets: this.beginText,
                    y: this.sys.game.config.height + 100,
                    duration: 600,
                    ease: 'Power2',
                    delay: 1000,
                    onComplete: () => {
                        this.beginText.destroy();
                        this.startGame();
                    }
                });
            }
        });
    }
    
    startGame() {
        this.isGameActive = true;
        
        // Set up AI players (players 1-3)
        for (let i = 1; i < 4; i++) {
            this.setupAIPlayer(i);
        }
        
        // Set up random negative mode events
        this.time.addEvent({
            delay: 10000, // Every 10 seconds
            callback: this.activateNegativeMode,
            callbackScope: this,
            loop: true
        });
    }
    
    setupAIPlayer(playerIndex) {
        // Random click interval between 0.5-2 seconds
        const clickInterval = Phaser.Math.Between(500, 2000);
        
        this.time.addEvent({
            delay: clickInterval,
            callback: () => {
                if (this.isGameActive) {
                    // 80% chance to click trash, 20% to miss
                    if (Phaser.Math.Between(1, 100) <= 80) {
                        this.handleTrashClick(playerIndex);
                    } else {
                        this.handlePlayerClick(playerIndex);
                    }
                    
                    // Schedule next click
                    this.setupAIPlayer(playerIndex);
                }
            },
            callbackScope: this,
            loop: false
        });
    }
    
    activateNegativeMode() {
        if (!this.isGameActive) return;
        
        this.negativeMode = true;
        
        // Tint background red
        this.tweens.add({
            targets: this.backgrounds[1], // Main game bg
            tint: 0xff0000,
            duration: 500,
            yoyo: true,
            repeat: 0,
            onComplete: () => {
                this.negativeMode = false;
            }
        });
        
        // Duration of negative mode (3-5 seconds)
        const duration = Phaser.Math.Between(3000, 5000);
        this.time.delayedCall(duration, () => {
            this.negativeMode = false;
        });
    }
    
    handleTrashClick(playerIndex) {
        if (this.negativeMode) {
            this.handleNegativeClick(playerIndex);
            return;
        }
        
        const player = this.players[playerIndex];
        const scoreText = this.scoreTexts[playerIndex];
        
        // Pulse animation for player
        this.tweens.add({
            targets: player._layers,
            scale: 1.1,
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });
        
        // Determine if critical hit (5% chance)
        const isCritical = Phaser.Math.Between(1, 100) <= 5;
        
        // Play sound
        if (isCritical) {
            const critSound = Phaser.Math.Between(0, 1) ? 'clang' : 'critical_hit';
            this.sound.play(critSound);
            
            // Extra effects for player 0 (the actual player)
            if (playerIndex === 0) {
                this.cameras.main.shake(200, 0.01);
            }
        } else {
            const soundType = Phaser.Math.Between(0, 1) ? 'stonebang' : 'metalbang';
            const soundNum = Phaser.Math.Between(1, 8);
            this.sound.play(`${soundType}${soundNum}`);
        }
        
        // Update score
        const points = isCritical ? 5 : 1;
        const currentScore = parseInt(scoreText.text);
        scoreText.setText(currentScore + points);
        
        // Change trash sprite (50% chance)
        if (Phaser.Math.Between(1, 100) <= 50) {
            const currentTexture = this.trash.img.texture.key;
            const baseType = currentTexture.split('_')[0];
            const newState = Phaser.Math.Between(1, 2);
            
            this.trash.setLayerTexture(0, `${baseType}_hit${newState}`);
            
            // Revert after delay
            this.time.delayedCall(300, () => {
                this.trash.setLayerTexture(0, `${baseType}_normal`);
            });
        }
    }
    
    handlePlayerClick(playerIndex) {
        if (this.negativeMode) {
            this.handleNegativeClick(playerIndex);
            return;
        }
        
        const player = this.players[playerIndex];
        
        // Pulse animation
        this.tweens.add({
            targets: player._layers,
            scale: 1.1,
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });
    }
    
    handleNegativeClick(playerIndex) {
        const player = this.players[playerIndex];
        const scoreText = this.scoreTexts[playerIndex];
        
        // Play negative sound
        this.sound.play('negative_sound');
        
        // Shake animation for player
        this.tweens.add({
            targets: player._layers,
            x: '+=10',
            y: '+=10',
            duration: 50,
            yoyo: true,
            repeat: 3,
            ease: 'Sine.easeInOut'
        });
        
        // Update score (subtract points)
        const currentScore = parseInt(scoreText.text);
        const newScore = Math.max(0, currentScore - 2); // Don't go below 0
        scoreText.setText(newScore);
        
        // Extra effects for player 0 (the actual player)
        if (playerIndex === 0) {
            this.cameras.main.shake(100, 0.005);
        }
    }
    
    playGameMusic() {
        try {
            this.gameMusic = this.sound.add('gameMusic', { loop: true, volume: 0.5 });
            this.gameMusic.play();
        } catch (e) {
            console.warn('Audio playback error:', e);
        }
    }
    
    handleBackAction() {
        if (this.gameMusic) this.gameMusic.stop();
        this.fadeToScene('MenuScene', { 
            bgContainer: this.bgContainer,
            titleMusic: null
        });
    }
}