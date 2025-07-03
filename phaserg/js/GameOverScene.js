class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.scores = data.scores || [0, 0, 0, 0];
        this.playerData = data.playerData || Array(4).fill({ character: 'goblin' });
        this.bgContainer = data.bgContainer;
        this.isMultiplayer = data.isMultiplayer || false;
        this.winnerIndex = data.winnerIndex || this.scores.indexOf(Math.max(...this.scores));
    }

    create() {
        // Color palette with golden theme and color theory friendly colors
        this.colors = {
            background: [0x1A120B, 0x3C2A21, 0xD5CEA3, 0xE5E5CB],
            gold: [0xFFD700, 0xD4AF37, 0x996515, 0xF0E68C],
            accents: [0x5E3023, 0x895737, 0xB88B4A, 0xDDCA7D],
            text: 0xE5E5CB,
            playerColors: [0x4E9F3D, 0xD80032, 0x1E56A0, 0xFFC300]
        };

        // Background setup
        this.setupBackground();
        
        // Create visual elements with better spacing
        this.createWinnerDisplay();
        this.createScoreboard();
        this.createActionButtons();
        
        // Add celebratory effects
        this.addCelebrationEffects();
        
        // Add input controls
        this.setupInputControls();
    }

    setupBackground() {
        // Golden gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(
            this.colors.background[0], this.colors.background[1], 
            this.colors.background[2], this.colors.background[3],
            1, 1, 0, 1
        );
        bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        // Add subtle golden pattern
        const pattern = this.make.graphics();
        pattern.fillStyle(this.colors.gold[3], 0.05);
        for (let i = 0; i < 20; i++) {
            pattern.fillCircle(
                Phaser.Math.Between(0, this.cameras.main.width),
                Phaser.Math.Between(0, this.cameras.main.height),
                Phaser.Math.Between(5, 20)
            );
        }
        const texture = pattern.generateTexture();
       // this.add.image(0, 0, texture).setOrigin(0).setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    }

    createWinnerDisplay() {
        // Title with golden text and animation
        const title = this.add.text(this.cameras.main.centerX, 80, 'GAME OVER', {
            fontFamily: '"Luckiest Guy", "Comic Sans MS", cursive',
            fontSize: '96px',
            color: '#E5E5CB',
            stroke: this.colors.accents[0],
            strokeThickness: 12,
            shadow: { 
                offsetX: 4,
                offsetY: 4,
                color: '#000000',
                blur: 8,
                stroke: true
            }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: title,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Winner announcement with golden accent
        const winnerText = this.add.text(
            this.cameras.main.centerX,
            180,
            this.winnerIndex === 0 ? 'VICTORY!' : `PLAYER ${this.winnerIndex + 1} WINS!`,
            {
                fontFamily: '"Luckiest Guy", "Comic Sans MS", cursive',
                fontSize: '72px',
                color: this.colors.playerColors[this.winnerIndex],
                stroke: '#000000',
                strokeThickness: 8,
                shadow: { 
                    offsetX: 3,
                    offsetY: 3,
                    color: '#000000',
                    blur: 6,
                    stroke: true 
                }
            }
        ).setOrigin(0.5);

        // Add golden particles around the winner text
        if (this.textures.exists('spark')) {
            const particles = this.add.particles('spark',
                this.cameras.main.centerX,180,{
                speed: { min: 20, max: 100 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.3, end: 0 },
                blendMode: 'ADD',
                lifespan: 2000,
                frequency: 30,
                tint: [this.colors.gold[0], this.colors.gold[1]]
            });
        }
    }

    createScoreboard() {
        // Position scoreboard lower on screen
        const scoreboardY = this.cameras.main.centerY + 100;
        const scoreboard = this.add.container(this.cameras.main.centerX, scoreboardY);
        
        // Larger scoreboard background with golden border
        const bg = this.add.graphics()
            .fillStyle(this.colors.background[1], 0.8)
            .fillRoundedRect(-400, -200, 800, 400, 25)
            .lineStyle(6, this.colors.gold[1], 1)
            .strokeRoundedRect(-400, -200, 800, 400, 25);
        
        // Golden header
        const header = this.add.graphics()
            .fillStyle(this.colors.gold[1], 0.7)
            .fillRoundedRect(-400, -200, 800, 50, { tl: 25, tr: 25, bl: 0, br: 0 });
        
        const title = this.add.text(0, -185, 'FINAL SCORES', {
            fontFamily: '"Luckiest Guy", "Comic Sans MS", cursive',
            fontSize: '36px',
            color: this.colors.background[0],
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        scoreboard.add([bg, header, title]);

        // Create animated winner character on the scoreboard
        this.createWinnerCharacterAnimation(scoreboard);
        
        // Score entries with more space
        this.scores.forEach((score, i) => {
            const yPos = -120 + (i * 80);
            const isWinner = i === this.winnerIndex;
            
            // Player label with more space
            const playerLabel = this.isMultiplayer ? 
                (i === 0 ? 'YOU' : `PLAYER ${i+1}`) : 
                `PLAYER ${i+1}`;
                
            const playerText = this.add.text(-300, yPos, playerLabel, {
                fontFamily: '"Luckiest Guy", "Comic Sans MS", cursive',
                fontSize: '36px',
                color: this.colors.playerColors[i],
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0, 0.5);
            scoreboard.add(playerText);

            // Score value with golden color for winner
            const scoreText = this.add.text(300, yPos, score.toString(), {
                fontFamily: '"Arial Black", sans-serif',
                fontSize: '48px',
                color: isWinner ? this.colors.gold[0] : this.colors.text,
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(1, 0.5);
            scoreboard.add(scoreText);
        });
    }

    createWinnerCharacterAnimation(scoreboard) {
        const winnerChar = this.playerData[this.winnerIndex]?.character || 'goblin';
        const winnerSprite = this.add.sprite(0, -50, winnerChar)
            .setScale(0.5)
            .setDepth(10);
        scoreboard.add(winnerSprite);

        // Animation sequence
        this.tweens.add({
            targets: winnerSprite,
            scale: 0.6,
            y: -70,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Rotation effect
        this.tweens.add({
            targets: winnerSprite,
            angle: 5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Golden glow effect
        const glow = this.add.graphics()
            .fillStyle(this.colors.gold[0], 0.3)
            .fillCircle(0, -50, 100)
            .setBlendMode('ADD');
        scoreboard.add(glow);

        this.tweens.add({
            targets: glow,
            scaleX: 1.2,
            scaleY: 1.2,
            alpha: 0.5,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createActionButtons() {
        // Golden-themed buttons
        const menuBtn = this.add.text(
            this.cameras.main.centerX - 180,
            this.cameras.main.height - 100,
            'MAIN MENU',
            {
                fontFamily: '"Luckiest Guy", "Comic Sans MS", cursive',
                fontSize: '36px',
                color: this.colors.text,
                backgroundColor: this.colors.accents[0],
                padding: { x: 30, y: 15 },
                shadow: { 
                    offsetX: 3, 
                    offsetY: 3, 
                    color: '#000', 
                    blur: 0, 
                    stroke: true 
                }
            }
        )
        .setOrigin(0.5)
        .setInteractive()
        .setDepth(20);

        // Golden play again button
        const playBtn = this.add.text(
            this.cameras.main.centerX + 180,
            this.cameras.main.height - 100,
            'PLAY AGAIN',
            {
                fontFamily: '"Luckiest Guy", "Comic Sans MS", cursive',
                fontSize: '36px',
                color: this.colors.background[0],
                backgroundColor: this.colors.gold[0],
                padding: { x: 30, y: 15 },
                shadow: { 
                    offsetX: 3, 
                    offsetY: 3, 
                    color: '#000', 
                    blur: 0, 
                    stroke: true 
                }
            }
        )
        .setOrigin(0.5)
        .setInteractive()
        .setDepth(20);

        // Enhanced button hover effects
        [menuBtn, playBtn].forEach(btn => {
            btn.on('pointerover', () => {
                this.tweens.add({
                    targets: btn,
                    scale: 1.1,
                    backgroundColor: this.colors.gold[2],
                    duration: 150,
                    ease: 'Power2'
                });
                this.sound.play('hover_sound');
            });

            btn.on('pointerout', () => {
                this.tweens.add({
                    targets: btn,
                    scale: 1,
                    backgroundColor: btn === playBtn ? this.colors.gold[0] : this.colors.accents[0],
                    duration: 150,
                    ease: 'Power2'
                });
            });

            btn.on('pointerdown', () => {
                this.sound.play('click_sound');
                this.tweens.add({
                    targets: btn,
                    scale: 0.95,
                    duration: 50,
                    yoyo: true,
                    ease: 'Power1'
                });
            });
        });

        // Button actions
        menuBtn.on('pointerup', () => {
            this.scene.start('MenuScene', { bgContainer: this.bgContainer });
        });

        playBtn.on('pointerup', () => {
            this.scene.start('GameScene', { 
                bgContainer: this.bgContainer,
                character: this.playerData[0]?.character || 'goblin'
            });
        });
    }

    addCelebrationEffects() {
        // Golden confetti particles
        if (this.textures.exists('spark')) {
            const emitter = this.add.particles('spark',{ min: 100, max: this.cameras.main.width - 100 },
             0, {
                speed: { min: 100, max: 300 },
                angle: { min: 240, max: 300 },
                scale: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                lifespan: 3000,
                frequency: 50,
                gravityY: 300,
                tint: [this.colors.gold[0], this.colors.gold[1], this.colors.gold[3]]
            });
            
            // Stop emitter after initial burst
            this.time.delayedCall(2000, () => {
                emitter.stop();
            });
        }

        // Golden flash effect
        const flash = this.add.rectangle(
            0, 0, 
            this.cameras.main.width * 2, 
            this.cameras.main.height * 2, 
            this.colors.gold[0], 0.8
        )
        .setOrigin(0.5)
        .setDepth(9);
        
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            ease: 'Power1'
        });
    }

    setupInputControls() {
        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.start('GameScene', { 
                bgContainer: this.bgContainer,
                character: this.playerData[0]?.character || 'goblin'
            });
        });
        
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene', { bgContainer: this.bgContainer });
        });
    }
}