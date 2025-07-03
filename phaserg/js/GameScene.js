// Game Scene
class GameScene extends BaseScene {
    constructor() {
        super('GameScene');
        this.gameMusic = null;
        this.players = [];
        this.trash = null;this.playerStaminaBars = [];
        this.isGameActive = false;
        this.scoreTexts = [];
        this.backgrounds = [];
        this.negativeMode = false;
        this.gameTimer = null;
        this.beginText = null;
        this.clouds = [];
        this.stamina = 100;
        this.staminaBar = null;  // Add to GameScene class
        this.playerCombos = [0,0,0,0];
        this.comboTimers = [null,null,null,null];

        this.monster = null;
        this.monsterText = null;// Add to constructor:
        this.multiplayer = null;
        this.isMultiplayer = true;
        this.remotePlayers = {};
        this.localPlayerId = null;
        this.gameId = null;
        this.waitingText = null;
        this.lobbyContainer = null;
        this.waitingContainer = null;
        this.selectedCharacter = 'goblin'; // Default
        
    }
    
    init(data) {
        this.bgContainer = data.bgContainer;
        this.isMultiplayer = true;//data.isMultiplayer || false;
        this.selectedCharacter = data.character || 'goblin';
    }
    
    preload() {
        this.powerupManager = new PowerupManager(this);
        
        this.powerupManager.preloadPowerupIcons();
        
        // Load player character options
        const characters = ['goblin', 'pig', 'tanuki', 'cookie', 'egg', 'dwarf', 'mouse', 'cat'];
        characters.forEach(char => {
          this.load.image(char, `assets/characters/${char}.png`);
        });
      
        // Load clouds
        for (let i = 1; i <= 4; i++) {
          this.load.image(`cloud${i}`, `assets/backgrounds/cloud${i}.png`);
        }
      
        // Load UI/background elements
        this.load.image('character_bg', 'assets/characters/character_background.png');
        this.load.image('character_bg_top', 'assets/characters/character_background_top.png');
        this.load.image('trash_monster', 'assets/monster.png');
        this.load.image('opacity_bg', 'assets/backgrounds/opacity_20.png');
        
        // Load backgrounds
        this.load.image('game_bg', 'assets/backgrounds/game_bg.png');
        this.load.image('game_bg_morning', 'assets/backgrounds/game_bg_morning.png');
        this.load.image('game_bg_night', 'assets/backgrounds/game_bg_night.png');
      
        // Load trash types (all variants)
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
        this.load.audio('score', 'assets/sounds/score.wav');
      
      }
    
    create() {
        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        if (this.bgContainer) {
            this.tweens.add({
                targets: this.bgContainer,
                alpha: 0.0,
                duration: 500,
                ease: 'Linear'
            });
        }
        
        this.playGameMusic();
        this.createBackButton();
        this.setupBackgrounds();
        this.setupCloudSystem();
        
        this.createCharacterSelection();
        /*
        if (this.isMultiplayer) {
            this.initializeMultiplayer();
            //this.showLobbyMenu();
        } else {
            this.startOfflineGame();
        }*/
    }
    
    initializeMultiplayer() {
        this.multiplayer = new MultiplayerManager(this);
        this.multiplayer.connect();
        
        this.setupMultiplayerListeners();
        this.showLobbyMenu();
        
    }
    showWaitingForPlayers(gameId) {
        // Clear previous UI if exists
        if (this.waitingContainer) this.waitingContainer.destroy();
    
        this.waitingContainer = this.add.container(0, 0);
        
        // Background
        const bg = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            600, 400, 0x8B4513, 0.9
        ).setStrokeStyle(2, 0x000000);
        
        // Game ID Text
        const gameIdText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 150,
            `Game ID: ${gameId}`,
            { fontFamily: 'Comic', fontSize: '32px', color: '#FFFF00' }
        ).setOrigin(0.5);
        
        // Connected Players Title
        const playersTitle = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            'Players:',
            { fontFamily: 'Comic', fontSize: '24px', color: '#FFFFFF' }
        ).setOrigin(0.5);
        
        
    this.waitingPlayersText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY - 70,
        'Players: 1/4',
        { fontFamily: 'Comic', fontSize: '24px', color: '#FFFFFF' }
    ).setOrigin(0.5).setDepth(10);
    
    this.waitingContainer.add(this.waitingPlayersText);

        // Player List Container
        const playersContainer = this.add.container(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 30
        );
        
        // Ready Button
        this.readyButton = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 120,
            'Ready',
            { 
                fontFamily: 'Comic', 
                fontSize: '28px', 
                color: '#FFFFFF',
                backgroundColor: '#4CAF50',
                padding: { x: 30, y: 10 }
            }
        ).setOrigin(0.5).setInteractive();
        
        // Cancel Button
        const cancelBtn = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 170,
            'Cancel',
            { 
                fontFamily: 'Comic', 
                fontSize: '24px', 
                color: '#FFFFFF',
                backgroundColor: '#FF0000',
                padding: { x: 20, y: 5 }
            }
        ).setOrigin(0.5).setInteractive();
        
        this.waitingContainer.add([bg, gameIdText, playersTitle, playersContainer, this.readyButton, cancelBtn]);
        
        // Store references for updates
        this.waitingUI = {
            playersContainer,
            playerTexts: [],
            readyStates: {}
        };
        
        // Button handlers
        this.readyButton.on('pointerdown', () => {
            const isReady = !this.waitingUI.readyStates[this.multiplayer.playerId];
            this.multiplayer.setReadyStatus(isReady);
        });
        
        cancelBtn.on('pointerdown', () => {
            this.multiplayer.cancelMatchmaking();
            this.showLobbyMenu();
        });
        
        // Initial state
        this.updateReadyButton(false);
    }
    
    updatePlayerList(players) {
        if (!this.waitingUI) return;
        
        // Clear previous player texts
        this.waitingUI.playersContainer.removeAll(true);
        this.waitingUI.playerTexts = [];
        
        // Add each player
        players.forEach((player, index) => {
            const isReady = this.waitingUI.readyStates[player.id] || false;
            const playerText = this.add.text(
                -150,
                index * 40,
                `${player.character} (${player.id === this.multiplayer.playerId ? 'You' : 'Player'})`,
                { fontFamily: 'Comic', fontSize: '20px', color: '#FFFFFF' }
            );
            
            const readyStatus = this.add.text(
                150,
                index * 40,
                isReady ? '✅ Ready' : '❌ Not Ready',
                { fontFamily: 'Comic', fontSize: '20px', color: isReady ? '#00FF00' : '#FF0000' }
            );
            
            this.waitingUI.playersContainer.add([playerText, readyStatus]);
            this.waitingUI.playerTexts.push(playerText, readyStatus);
        });
    }
    
    updateReadyButton(isReady) {
        if (!this.readyButton) return;
        
        this.readyButton.setStyle({
            backgroundColor: isReady ? '#FFA500' : '#4CAF50'
        });
        this.readyButton.setText(isReady ? 'Cancel Ready' : 'Ready');
    }
    
    updateReadyStates(readyStates) {
        if (!this.waitingUI) return;
        
        this.waitingUI.readyStates = readyStates;
        this.updateReadyButton(readyStates[this.multiplayer.playerId] || false);
    }

    setupMultiplayerListeners() {
        // Initialization
        this.events.on('multiplayerInit', (data) => {
            this.localPlayerId = data.playerId;
        });

        // Game created
        this.events.on('gameCreated', (data) => {
            this.gameId = data.gameId;
            this.localPlayerId = 0;//data.playerId;
            this.isHost = data.isHost;
            this.lobbyContainer.destroy();
            this.showWaitingForPlayers(data.gameId);
        });
        this.events.on('playersUpdated', (players) => {
            console.log('Players updated:', players); // Debug log
            if (this.waitingUI) {
                this.updatePlayerList(players);
            }
        });
    
    this.events.on('readyStatesUpdated', (readyStates) => {
        this.updateReadyStates(readyStates);
    });
    
    
        // Game joined
        this.events.on('gameJoined', (data) => {
            this.gameId = data.gameId;
            this.localPlayerId = data.playerId;
            this.isHost = data.isHost;
            this.lobbyContainer.destroy();
            data.players.forEach((p)=> {
                this.addRemotePlayer(p.id, p.position, p.character);
            });
            this.localPlayer = this.remotePlayers[this.localPlayerId].player;
            this.showWaitingForPlayers(data.gameId);
        });

        // Player joined
        this.events.on('playerJoined', (data) => {
            this.addRemotePlayer(data.playerId, data.position);
            this.updateWaitingText();
        });

        // Player ready
        this.events.on('playerReady', (data) => {
            if (this.remotePlayers[data.playerId]) {
                this.remotePlayers[data.playerId].character = data.character;
                this.updatePlayerCharacter(data.playerId, data.character);
            }
            this.updateWaitingText();
        });

        // Player disconnected
        this.events.on('playerDisconnected', (data) => {
            this.removeRemotePlayer(data.playerId);
            this.updateWaitingText();
        });

        this.events.on('startGameCountDown', (data) => {
            console.log('startingcountdown');
            this.startGameCountDown();
        })

        this.events.on('cancelGameCountDown', (data) => {
            this.cancelGameCountDown();
        })


        // Game start
        this.events.on('gameStart', (data) => {
            this.startMultiplayerGame(data.trashType);
        });

        // Player action
        this.events.on('playerAction', (data) => {
            if (data.action === 'tapTrash') {
                this.handleRemotePlayerTap(data.playerId, data.points);
            }
            else if (data.action === 'selectPowerup') {
                this.selectPowerup(getRemotePlayer(data.playerId), this.powerupManager.getPowerup(data.powerup)
                )
            }
        });

        // Next round
        this.events.on('startNextRound', (data) => {
            //this.startNextRound(data.trashType);
        });

        // Game over
        this.events.on('gameOver', (data) => {
            this.showMultiplayerGameOver(data);
        });

        // Promoted to host
        this.events.on('promotedToHost', () => {
            this.isHost = true;
            this.showNotification('You are now the host!', '#FFFF00');
        });

        // Game error
        this.events.on('gameError', (data) => {
            this.showNotification(data.message, '#FF0000');
        });
        
    }

// Update the updatePlayerList method:
updatePlayerList(players) {
    if (!this.waitingUI || !this.waitingUI.playersContainer) return;
    
    // Clear previous player texts
    this.waitingUI.playersContainer.removeAll(true);
    this.waitingUI.playerTexts = [];

    players.forEach((player, index) => {
        const isReady = this.waitingUI.readyStates[player.id] || false;
        const playerText = this.add.text(
            -150,
            index * 40,
            `${player.character} (${player.id === this.multiplayer.playerId ? 'You' : 'Player'})`,
            { fontFamily: 'Comic', fontSize: '20px', color: '#FFFFFF' }
        );
        
        const readyStatus = this.add.text(
            150,
            index * 40,
            isReady ? '✅ Ready' : '❌ Not Ready',
            { fontFamily: 'Comic', fontSize: '20px', color: isReady ? '#00FF00' : '#FF0000' }
        );
        
        this.waitingUI.playersContainer.add([playerText, readyStatus]);
        this.waitingUI.playerTexts.push({text: playerText, status: readyStatus});
    });
}
    // In GameScene.js - modify showLobbyMenu()
    showLobbyMenu() {
    // Clear previous container if exists
    if (this.lobbyContainer) this.lobbyContainer.destroy();
    
    // Create new UI
    this.lobbyContainer = this.add.container(0, 0);
    
    // Background
    const bg = this.add.rectangle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        600, 400, 0x8B4513, 0.9
    ).setStrokeStyle(5, 0x000000);
    
    // Title
    const title = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY - 150,
        'Game Mode Selection',
        { fontFamily: 'Comic', fontSize: '48px', color: '#FFFFFF' }
    ).setOrigin(0.5);
    
    // Online Quick Play Button
    const quickPlayBtn = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY - 50,
        'Online Quick Play',
        { 
            fontFamily: 'Comic', 
            fontSize: '36px', 
            color: '#FFFFFF',
            backgroundColor: '#4CAF50',
            padding: { x: 20, y: 10 }
        }
    ).setOrigin(0.5).setInteractive();
    
    // Private Game Button
    const privateGameBtn = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY + 50,
        'Create Private Game',
        { 
            fontFamily: 'Comic', 
            fontSize: '36px', 
            color: '#FFFFFF',
            backgroundColor: '#8B4513',
            padding: { x: 20, y: 10 }
        }
    ).setOrigin(0.5).setInteractive();
    
    // Offline Play Button
    const offlineBtn = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY + 150,
        'Play Offline',
        { 
            fontFamily: 'Comic', 
            fontSize: '36px', 
            color: '#FFFFFF',
            backgroundColor: '#FFA500',
            padding: { x: 20, y: 10 }
        }
    ).setOrigin(0.5).setInteractive();
    
    // Add elements
    this.lobbyContainer.add([bg, title, quickPlayBtn, privateGameBtn, offlineBtn]);
    
    // Button handlers
    quickPlayBtn.on('pointerdown', () => {
        this.multiplayer.findRandomGame();
        this.showWaitingMessage("Finding available game...");
    });
    
    privateGameBtn.on('pointerdown', () => {
        this.multiplayer.createPrivateGame();
        this.showWaitingMessage("Creating private game...");
    });
    
    offlineBtn.on('pointerdown', () => {
        this.startOfflineGame();
    });
   }// In GameScene.js
    startOfflineGame() {
    // Clean up multiplayer if active
    if (this.multiplayer) {
        this.multiplayer.disconnect();
        this.multiplayer = null;
    }
    
    // Hide lobby UI
    if (this.lobbyContainer) {
        this.lobbyContainer.destroy();
    }
    
    // Initialize as offline game
    this.isMultiplayer = false;
    this.game.seed = Date.now().toString(); // Local seed
    
    // Setup single player game
    this.setupPlayers();
    this.setupTrash();
    this.setupGameStartSequence();
    
    // Show notification
    this.showNotification('Starting offline game', '#00FF00', 1500);
}
cancelGameCountDown() {
    if (this.countdownTimer) {
        this.countdownTimer.remove(false);
        this.countdownTimer = null;
    }

    if (this.countdownText) {
        this.countdownText.destroy();
        this.countdownText = null;
    }

    // Optional: Add notification
    //this.showNotification('Countdown cancelled', '#FF0000', 2000);
}
startGameCountDown() {
    if (this.countdownText) this.countdownText.destroy();
    
    let count = 5; // Start from 5 seconds
    this.countdownText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY + 250,
        !this.isHost && 'Starting game soon...' || `Starting in ${count}...`,
        {
            fontFamily: 'Comic',
            fontSize: '32px',
            color: '#000000',
            backgroundColor: '#FFB74D',
            padding: { x: 20, y: 10 }
        }
    ).setOrigin(0.5);

    this.countdownTimer = this.time.addEvent({
        delay: 1000,
        repeat: count - 1,
        callback: () => {
            count--;
            if (this.countdownText) {
            this.countdownText.setText(!this.isHost && 'Starting game soon...' || `Starting in ${count}...`);
            
            if (count <= 0) {
                this.multiplayer.startGameForReal();
                this.countdownText.destroy();
                this.countdownText = null;
                this.countdownTimer = null;
            }
        }
        }
    });
}

    showWaitingMessage(message) {
        this.lobbyContainer.destroy();
        
        this.waitingContainer = this.add.container(0, 0);
        
        const bg = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            600, 200, 0x8B4513, 0.9
        );
        
        const text = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            message,
            { fontFamily: 'Comic', fontSize: '32px', color: '#FFFFFF' }
        ).setOrigin(0.5);
        
        const cancelBtn = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 80,
            'Cancel',
            { 
                fontFamily: 'Comic', 
                fontSize: '24px', 
                color: '#FFFFFF',
                backgroundColor: '#FF0000',
                padding: { x: 10, y: 5 }
            }
        ).setOrigin(0.5).setInteractive();
        
        this.waitingContainer.add([bg, text, cancelBtn]);
        
        cancelBtn.on('pointerdown', () => {
            this.multiplayer.socket.emit('cancelMatchmaking');
            this.showLobbyMenu();
        });
    }
    updateWaitingText() {
        if (this.waitingPlayersText) {
            const playerCount = this.multiplayer.getPlayerCount();
            this.waitingPlayersText.setText(`Players: ${playerCount}/4`).setDepth(200);
        }
    }
    
    getRemotePlayer(playerId) {
        return this.players[this.remotePlayers[playerId]?.position]
    }
    
    addRemotePlayer(playerId, position, char='goblin') {
        const bgColors = [
            0xD61A40, // #FFD61A40 (alpha removed)
            0x5FAAD7, // #FF5FAAD7
            0x5FD789, // #FF5FD789
            0xF1DF0F  // #FFF1DF0F
        ]
        const color = bgColors[position - 1];
        
        const player = this.createPlayer(
            this.getPositionForPlayer(position).x,
            this.getPositionForPlayer(position).y,
            char,//'goblin', // Default character, will be updated when ready
            color,
            position - 1
        );
        
        this.remotePlayers[playerId] = {
            player,
            position,
            score: 0,
            character: null
        };
        
        // Create score text for remote player
        const pos = this.getPositionForPlayer(position);
        const scoreText = this.add.text(
            pos.x + (position % 2 === 0 ? 250 : -250),
            pos.y,
            '0',
            { fontFamily: 'Comic', fontSize: '48px', color: '#ffffff' }
        ).setOrigin(position % 2 === 0 ? 0 : 1, 0.5);
        
        this.remotePlayers[playerId].scoreText = scoreText;
    }
    
    getPositionForPlayer(position) {
        let nn = 30;
        const positions = [
            { x: 250, y: this.sys.game.config.height - 250 +nn},
            { x: this.sys.game.config.width - 250, y: 200 +nn},
            { x: 250, y: 200+nn },
            { x: this.sys.game.config.width - 250, y: this.sys.game.config.height - 250+nn }
        ];
        return positions[position - 1];
    }
    
    updatePlayerCharacter(playerId, character) {
        if (this.remotePlayers[playerId]) {
            this.remotePlayers[playerId].player.setLayerTexture(1, character);
        }
    }
    
    removeRemotePlayer(playerId) {
        if (false && this.remotePlayers[playerId]) {
            this.remotePlayers[playerId].player.destroy();
            this.remotePlayers[playerId].scoreText.destroy();
            delete this.remotePlayers[playerId];
        }
    }
    
    startMultiplayerGame(trashType) {
        this.cancelGameCountDown();
        
        // Create local player (always position 1)
        const bgColors = [
            0xD61A40, // #FFD61A40 (alpha removed)
            0x5FAAD7, // #FF5FAAD7
            0x5FD789, // #FF5FD789
            0xF1DF0F  // #FFF1DF0F
        ]
        // addre
        const localPlayer = this.localPlayer || this.createPlayer(
            this.getPositionForPlayer(1).x,
            this.getPositionForPlayer(1).y,
            this.selectedCharacter,
            bgColors[0],
            0
        );
        
        console.log('localplayer added at', this.localPlayerId);
        this.players[this.localPlayerId||0] = localPlayer;
        
        // Create score text for local player
        const scoreText = this.add.text(
            this.getPositionForPlayer(1).x + 250,
            this.getPositionForPlayer(1).y,
            '0',
            { fontFamily: 'Comic', fontSize: '48px', color: '#ffffff' }
        ).setOrigin(0, 0.5);
        
        this.scoreTexts[0] = scoreText;
        
        // Create stamina bar for local player
        const staminaBar = this.add.graphics();
        this.playerStaminaBars[0] = staminaBar;
        this.playerStaminaValues = [100];
        this.updateStaminaBar(0);
        
        // Hide waiting UI
        if (this.waitingContainer) {
            this.waitingContainer.destroy();
        }

        
        for (let i = 0; i < 4; i++) {

            const charType = characterChoices[Phaser.Math.Between(0, characterChoices.length - 1)];
            const pos = this.getPositionForPlayer(i+1);
            const player = this.remotePlayers[i]?.player;//createPlayer(pos.x, pos.y, charType, bgColors[i], i);
            if (player && player!=this.localPlayer) {
                this.players.push(player);
            
            const scoreText = this.add.text(
                i % 2 === 0 ? positions[i].x + 250 : positions[i].x - 250,
                positions[i].y + ((i===1||i===2) ? 60:0),
                '0',
                { fontFamily: 'Comic', fontSize: '48px', color: '#ffffff' }
            ).setOrigin(i % 2 === 0 ? 0 : 1, 0.5).setAlpha(0);
            
            this.scoreTexts.push(scoreText);
    
            // Create stamina bar for each player
            const staminaBar = this.add.graphics();
            this.playerStaminaBars.push(staminaBar);
            this.playerStaminaValues.push(100);
            this.updateStaminaBar(i);
            }
        }
        
        // Setup trash with the type from server
        this.setupTrash();
        
        // Start game
        this.isGameActive = true;
        this.currentRound = 1;
        this.startRound();
    }
    
    handleRemotePlayerTap(playerId, points) {
        if (!this.remotePlayers[playerId]) return;
        
        // Update score
        this.remotePlayers[playerId].score += points;
        this.remotePlayers[playerId].scoreText.setText(this.remotePlayers[playerId].score);
        
        // Visual feedback
        const player = this.remotePlayers[playerId].player;
        this.tweens.add({
            targets: player._layers,
            scale: 1.1,
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });
        
        // Show points text
        const pointsText = this.add.text(
            player.x,
            player.y - 100,
            `+${points}`,
            { fontFamily: 'Comic', fontSize: '32px', color: '#FFFFFF' }
        ).setOrigin(0.5);
        
        this.tweens.add({
            targets: pointsText,
            y: player.y - 200,
            alpha: 0,
            duration: 1000,
            onComplete: () => pointsText.destroy()
        });
        
        // Play sound
        const soundType = Phaser.Math.Between(0, 1) ? 'stonebang' : 'metalbang';
        this.sound.play(`${soundType}${Phaser.Math.Between(1, 8)}`);
    }
    
    showMultiplayerGameOver(data) {
        // Convert player IDs to positions for display
        const playerScores = [];
        
        // Add local player score (always position 1)
        playerScores.push({
            position: 1,
            score: parseInt(this.scoreTexts[0].text)
        });
        
        // Add remote player scores
        Object.keys(this.remotePlayers).forEach(playerId => {
            playerScores.push({
                position: this.remotePlayers[playerId].position,
                score: this.remotePlayers[playerId].score
            });
        });
        
        // Sort by position (1-4)
        playerScores.sort((a, b) => a.position - b.position);
        
        // Show game over scene with these scores
        this.scene.start('GameOverScene', { 
            scores: playerScores.map(p => p.score),
            isMultiplayer: true
        });
    }
    
    setupBackgrounds() {
        // Morning background (base layer)
        this.backgrounds.push(this.add.image(0, 0, 'game_bg_morning').setOrigin(0).setDepth(-0.3));
        //this.add.image(0, 0, 'game_bg_night').setOrigin(0)
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
        const nightBg = this.add.image(0, 0, 'game_bg_night').setOrigin(0).setAlpha(0).setDepth(-0.2);
        this.backgrounds.push(nightBg);
        
        this.backgrounds.push(this.add.image(0,0, 'opacity_bg').setOrigin(0).setAlpha(.2));
        // Set up the night transition timer
        this.gameTimer = this.time.delayedCall(30000, () => {
            this.tweens.add({
                targets: [this.backgrounds[0]], // Morning bg
                alpha: 0,
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
        const bgColors = [
            0xD61A40, // #FFD61A40 (alpha removed)
            0x5FAAD7, // #FF5FAAD7
            0x5FD789, // #FF5FD789
            0xF1DF0F  // #FFF1DF0F
        ]
        
    // Initialize arrays first!
    this.players = [];
    this.scoreTexts = [];
    this.playerStaminaBars = [];  // <-- Add this
    this.playerStaminaValues = []; // <-- Add this
    this.playerPowerups = [];      // <-- Add this for powerup icons
 
        const positions = [
            { x: 250, y: this.sys.game.config.height - 250 },
            { x: this.sys.game.config.width - 250, y: 200 },
            { x: 250, y: 200 },
            { x: this.sys.game.config.width - 250, y: this.sys.game.config.height - 250 }
        ];
        
        for (let i = 0; i < 4; i++) {
            const charType = characterChoices[Phaser.Math.Between(0, characterChoices.length - 1)];
            const pos = this.getPositionForPlayer(i+1);
            const player = this.createPlayer(pos.x, pos.y, charType, bgColors[i], i);
            this.players.push(player);
            
            const scoreText = this.add.text(
                i % 2 === 0 ? positions[i].x + 250 : positions[i].x - 250,
                positions[i].y + ((i===1||i===2) ? 60:0),
                '0',
                { fontFamily: 'Comic', fontSize: '48px', color: '#ffffff' }
            ).setOrigin(i % 2 === 0 ? 0 : 1, 0.5).setAlpha(0);
            
            this.scoreTexts.push(scoreText);
    
            // Create stamina bar for each player
            const staminaBar = this.add.graphics();
            this.playerStaminaBars.push(staminaBar);
            this.playerStaminaValues.push(100);
            this.updateStaminaBar(i);
        }
    }
    
    updateStaminaBar(playerIndex) {
        const player = this.players[playerIndex];
        const stamina = this.playerStaminaValues[playerIndex];
        const barWidth = 200;
        const barHeight = 40;
        const x = player.x + (playerIndex % 2 === 0 ? 250 : -250 - barWidth);
        const y = player.y + (!(playerIndex === 2 || playerIndex === 1) ? 60 : -60);
        
        const staminaBar = this.playerStaminaBars[playerIndex];
        staminaBar.clear();
        
        staminaBar.fillStyle(0x000000, 0.5);
        staminaBar.fillRect(x, y, barWidth, barHeight);
        
        staminaBar.fillStyle(0x00ff00, 1);
        staminaBar.fillRect(x, y, barWidth * (stamina/100), barHeight);
        
        staminaBar.lineStyle(7, 0x000000, 1);
        staminaBar.strokeRect(x, y, barWidth, barHeight);

       // addBorder(staminaBar);
    }

    setupCloudSystem() {
        // Cloud spawn timer
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnCloud,
            callbackScope: this,
            loop: true
        });
    }

    spawnCloud() {
        const cloudTypes = ['cloud1', 'cloud2', 'cloud3', 'cloud4'];
        const cloudType = cloudTypes[Phaser.Math.Between(0, 3)];
        
        // Random scale between 0.7 and 1.3
        const scale = Phaser.Math.FloatBetween(0.4, 1.1);
        
        // Random starting position (off-screen)
        let x, y;
        const side = Phaser.Math.Between(0, 3);
        const buffer = 100;
        
        switch(side) {
            case 0: // top
                x = Phaser.Math.Between(-buffer, this.sys.game.config.width + buffer);
                y = -buffer;
                break;
            case 1: // right
                x = this.sys.game.config.width + buffer;
                y = Phaser.Math.Between(-buffer, this.sys.game.config.height + buffer);
                break;
            case 2: // bottom
                x = Phaser.Math.Between(-buffer, this.sys.game.config.width + buffer);
                y = this.sys.game.config.height + buffer;
                break;
            case 3: // left
                x = -buffer;
                y = Phaser.Math.Between(-buffer, this.sys.game.config.height + buffer);
                break;
        }

        
        x = -buffer;
        y = Phaser.Math.Between(-buffer, this.sys.game.config.height + buffer);
        
        y = y - 200;

        const cloud = this.add.image(x, y, cloudType)
            .setScale(scale)
            .setDepth(-0.1); // Between morning/night and main bg
        
        // Calculate target position (opposite side)
        const targetX = this.sys.game.config.width * 2;
        const targetY = y;
        
        // Random speed (duration)
        const duration = Phaser.Math.Between(15000, 30000);
        
        this.tweens.add({
            targets: cloud,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                cloud.destroy();
                this.clouds = this.clouds.filter(c => c !== cloud);
            }
        });
        
        this.clouds.push(cloud);
    }
    createPlayer(x, y, characterType, bgColor, playerIndex) {
        const isRightSide = playerIndex % 2 === 1;
        const isTop = playerIndex === 2 || playerIndex === 1;
    
        const player = new SpriteGroup(this, x, y, ['character_bg', characterType, 'character_bg_top']);
        player.setDisplaySize(415, 415);
    
        if (isRightSide) {
            player._layers[1].setFlipX(true);
            if (playerIndex === 3) {
                player._layers[0].setFlipX(true);
            }
            else if (playerIndex === 1) {
                player._layers[0].setFlipX(true).setFlipY(true);
            }
        }
    
        if (playerIndex === 2) {
            player._layers[0].setFlipY(true);
        }
    
        // Apply offset for top players
        if (isTop) {
            player._layers[1].offsetY = -50;
        }

        player.setDepth(15);
    
        player._layers[0].setTint(bgColor);
        player._layers[1].offsetX = 200;
    
        if (playerIndex === 0) {
            player.img.setInteractive();
            player.img.on('pointerdown', () => {
                if (this.isGameActive && this.stamina >= 5) {
                    this.handlePlayerClick(playerIndex);
                }
            });
        }
    
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
        const trashType = this.currentRound===3 ? "golden" : eliminateFromList(trashTypes, this.game.seed);
        
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
                this.cameras.main.shake(100, 0.005); // Added screen shake on trash tap
                this.handleTrashClick(0); // Player 0 is the actual player
                
                // Reduce stamina and update bar
                this.stamina = Math.max(0, this.stamina - 5);
                this.updateStaminaBar(0);
                
                // Stamina regeneration
                if (this.staminaRegenTimer) {
                    this.staminaRegenTimer.remove();
                }
                this.staminaRegenTimer = this.time.delayedCall(2000, () => {
                    this.startStaminaRegen();
                });
            }
        });
    }
    
    startStaminaRegen() {
        if (this.stamina >= 100) return;
        
        this.stamina = Math.min(100, this.stamina + 1);
        this.updateStaminaBar(0);
        
        this.staminaRegenTimer = this.time.delayedCall(100, () => {
            this.startStaminaRegen();
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
        this.currentRound = 1;
        this.maxRounds = 2||3;
        
        for (let i = 1; i < 4; i++) {
            this.setupAIPlayer(i);
        }
    
        this.startRound();
    }
    
    startRound() { //=2) ?
        this.roundTime = 25;
        this.roundTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.roundTime--;
                if (this.roundTime <= 0) {
                    console.log('ending round');
                    this.roundTimer.remove();
                    this.endRound();
                }
            },
            callbackScope: this,
            loop: true
        });
    
        // Set up negative mode events
        this.negativeEvent = this.time.addEvent({
            delay: 10000,
            callback: this.activateNegativeMode,
            callbackScope: this,
            loop: true
        });
    }
    
    endRoundold() {
        this.isGameActive = false;
        this.roundTimer.remove();
        this.negativeEvent.remove();
    
        // Tween out current trash
        this.tweens.add({
            targets: this.trash,
            y: this.sys.game.config.height + 500,
            duration: 1000,
            onComplete: () => {
                this.trash.destroy();
                this.showPowerupSelection();
            }
        });
    }
    
    
    setupButtonInteractions(button, action, ignoreTweening) {
        button.on('pointerover', () => {
            if (!this.isTweening||ignoreTweening) {
                if (button.setStyle) { button.setStyle({ fill: '#ffff00' });
            }// else {button.setScale(1.05); }
            }
        });
        
        button.on('pointerout', () => {
            if (!this.isTweening||ignoreTweening) {
                if (button.setStyle)  button.setStyle({ fill: '#ffffff' });
          //  button.setScale(1);
            this.game.soundManager.playMenuSound();
            }
        });
        
        button.on('pointerdown', (p) => {
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
            this.time.delayedCall(120, () =>action(p));
        });
    }
    
    
    showPowerupSelection() {
        const powerups = this.powerupManager.getRandomPowerups(3);
        
        // Create semi-transparent overlay
        const overlay = this.add.rectangle(0, 0, this.sys.game.config.width, this.sys.game.config.height, 0x000000, 0.7)
            .setOrigin(0)
            .setInteractive();
        
        // Add title
        const textv = this.add.text(this.sys.game.config.width/2, 100, 'END OF ROUND\nPICK A PERK', {
            fontFamily: 'Comic',
            fontSize: '64px',
            color: '#FFD700',
            align: 'center'
        }).setOrigin(0.5);
    
        // Display powerups
        const powerupSprites = [];
        const powerupTexts = [];
        const powerupDescTexts = [];
        
        let d = 20;
        let count = -1;
        

        powerups.forEach((i) => {
            const powerup = this.powerupManager.getPowerup(i);
            count ++;
            const x = this.sys.game.config.width/2 + (count - 1) * 500;
            const y = this.sys.game.config.height/2;
            
            const sprite = this.add.image(x, y - 100, powerup.icon)
                .setDisplaySize(450, 450)
                .setInteractive().setDepth(d);
            
            const text = this.add.text(x, y + 250, powerup.name, {
                fontFamily: 'Comic',
                fontSize: '36px',
                color: '#FFFFFF'
            }).setOrigin(0.5).setDepth(d);
            
            const desc = this.add.text(x, y + 300, powerup.description, {
                fontFamily: 'Comic',
                fontSize: '30px',
                color: '#AAAAAA',
                wordWrap: { width: 370 }
            }).setOrigin(0.5).setDepth(d);
            
            powerupSprites.push(sprite);
            powerupTexts.push(text);
            powerupDescTexts.push(desc);
            this.selectedPowerup = false;
            // Player selection
            //if (i === 0) {
                this.setupButtonInteractions(sprite, (p)=> {
                    if (this.selectedPowerup) {return}; 
                    if (this.isMultiplayer && playerIndex === 0) {
                        this.multiplayer.sendAction('selectPowerup', null,i);
                    }
                    powerupSprites.forEach((sp) => {
                        if (sp!=sprite) {
                            sp.setAlpha(0.41);
                        }
                        sp.removeInteractive();
                    });
                    
                    createParticles(this, p.x, p.y);
                    this.selectedPowerup = true;
                    console.log('hmmmm');
                    this.selectPowerup(0, i);
                }
                );
                //sprite.on('pointerdown', () => this.selectPowerup(0, powerups[i]));
            //}
        });

        // Countdown
        let countdown = 6;
        const countdownText = this.add.text(this.sys.game.config.width/2, this.sys.game.config.height - 100, 
            `Selecting in ${countdown}...`, {
                fontFamily: 'Comic',
                fontSize: '48px',
                color: '#FFFFFF'
            }).setOrigin(0.5);
        
        const ev = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (countdown > 0) {
                    countdown--;
                    countdownText.setText(`Selecting in ${countdown}...`);
                }

                if (countdown <= 0) {
                    // AI random selection
                    for (let i = 1; i < 4; i++) {
                        if (!this.isMultiplayer){
                            const randomPowerup = Phaser.Utils.Array.GetRandom(powerups);
                            this.applyPowerup(i, randomPowerup);
                        }
                    }
                    
                    // Start next round
                    this.startNextRound();
                    
                    ev.remove();
                    
                    
                    // Clean up
                    overlay.destroy();
                    textv.destroy();
                    countdownText.destroy();
                    powerupSprites.forEach(s => s.destroy());
                    powerupTexts.forEach(t => t.destroy());
                    powerupDescTexts.forEach(d => d.destroy());
                }
            },
            callbackScope: this,
            loop: true
        });
    }
    
    selectPowerup(playerIndex, powerup) {
        this.applyPowerup(playerIndex, powerup);
        // Visual feedback could be added here
    }
    
    applyPowerup(playerIndex, powerup) {
        powerup = this.powerupManager.getPowerup(powerup);
        const player = this.players[playerIndex];
        player.powerupCount = player.powerupCount ?? 0;
        powerup.apply(this.players[playerIndex]);
        // Add small powerup icon below stamina bar
        const powerupIcon = this.add.image(
            this.players[playerIndex].x + ((playerIndex === 0||playerIndex===2) ? 250 : -250-50)+(60*(player.powerupCount)*((playerIndex===1||playerIndex===3) ? -1: 1)),
            this.players[playerIndex].y + ((playerIndex === 0||playerIndex===3) ? 110 : -130),
            powerup.icon
        ).setDisplaySize(50, 50).setOrigin(0);
        player.powerupCount ++;
        // In applyPowerup()
const powerupGlow = this.add.graphics();
powerupGlow.fillStyle(0xFFFF00, 0.5);
powerupGlow.fillRect(player.x, player.y, 300);
this.tweens.add({
    targets: powerupGlow,
    alpha: 0,
    duration: 1000,
    onComplete: () => powerupGlow.destroy()
});

        this.playerPowerups[playerIndex] = powerupIcon;
    }
    
    
    
    endGame() {
        // Handle game end logic
        this.scene.start('GameOverScene', { bgContainer:this.bgContainer,playerData:this.players,isMultiplayer:this.isMultiplayer,scores: this.scoreTexts.map(t => parseInt(t.text)) });
    }

    // Add to GameScene
saveHighscore() {
    const scores = this.scoreTexts.map(t => parseInt(t.text));
    const maxScore = Math.max(...scores);
    
    try {
        localStorage.setItem('trashGameHighscore', 
            Math.max(maxScore, localStorage.getItem('trashGameHighscore') || 0)
        );
    } catch (e) {
        console.warn('LocalStorage unavailable');
    }
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
        
        this.game.soundManager.playDeepGrowl();
        this.negativeMode = true;
    
        // Create monster (starts below screen)
        this.monster = this.add.image(
            0,
            this.cameras.main.height + 50,
            'trash_monster'
        )
        .setOrigin(0) // Anchor at bottom center
        .setDepth(10); // Above everything
    
        // Create monster text
        this.monsterText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 200,
            'THE TRASH MONSTER!',
            {
                fontFamily: 'Comic',
                fontSize: '72px',
                color: '#FF0000',
                stroke: '#000000',
                strokeThickness: 8,
                shadow: { blur: 10, stroke: true, fill: true }
            }
        )
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(11);
    
        // Screen shake
        this.cameras.main.shake(500, 0.02);
    
        // Monster entrance tween
        this.tweens.add({
            targets: this.monster,
            y:100, // Slightly overlaps bottom
            duration: 800+200,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Text appear after monster
                this.tweens.add({
                    targets: this.monsterText,
                    alpha: 1,
                    duration: 300,
                    yoyo: true,
                    repeat: 1
                });
            }
        });
    
        // Tint background red
        this.tweens.add({
            targets: this.backgrounds[1],
            tint: 0xff0000,
            duration: 500,
            yoyo: true,
            repeat: 0
        });
    
        // Duration of negative mode (3-5 seconds)
        const duration = Phaser.Math.Between(3000, 5000);
        this.time.delayedCall(duration, () => {
            this.endNegativeMode();
        });
    }
    
    endNegativeMode() {
        this.negativeMode = false;
        
        // Monster exit tween
        this.tweens.add({
            targets: [this.monster, this.monsterText],
            y: this.cameras.main.height + 1000,
            alpha: 0,
            duration: 800,
            ease: 'Power1.easeIn',
            onComplete: () => {
                this.monster.destroy();
                this.monsterText.destroy();
            }
        });
    
        // Reset background tint
        this.tweens.add({
            targets: this.backgrounds[1],
            tint: 0xffffff,
            duration: 500
        });
    }

    handleTrashClick(playerIndex) {
        if (this.negativeMode) {
            this.handleNegativeClick(playerIndex);
            return;
        }
        
        if (this.playerStaminaValues[playerIndex] < 5) return;
        
        // Deduct stamina
        this.playerStaminaValues[playerIndex] -= this.players[playerIndex].staminaCost||5;
        this.updateStaminaBar(playerIndex);
        
        // Add growth effect
        this.tweens.add({
            targets: this.trash._layers,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });
        
        const player = this.players[playerIndex];
        const scoreText = this.scoreTexts[playerIndex];
        
        /* Particles
        const particles = this.add.particles('spark');
        particles.createEmitter({
            x: player.x,
            y: player.y,
            speed: { min: -100, max: 100 },
            scale: { start: 0.3, end: 0 },
            blendMode: 'ADD',
            lifespan: 500
        });
        */
        // Pulse animation
        this.tweens.add({
            targets: player._layers,
            scale: 1.1,
            duration: 100,
            yoyo: true,
            ease: 'Power1'
        });
        
        // Determine points
        const pointOptions = [1,1,1,1,1,1,1,2,2,2,2,3,3];
        const points = Phaser.Utils.Array.GetRandom(pointOptions)*(player.pointsMultiplier||1);
        const isCritical = Phaser.Math.Between(1, 100) <= (player.critChance||5);
        
        // Reset combo if too much time passed
        if (this.comboTimers[playerIndex]) {
            this.time.removeEvent(this.comboTimers[playerIndex]);
        }
        
        this.playerCombos[playerIndex]++;
        this.comboTimers[playerIndex] = this.time.delayedCall(2000, () => {
            this.playerCombos[playerIndex] = 0;
        });
        
        // Apply combo bonus
        const comboBonus = Math.min(5, Math.floor(this.playerCombos[playerIndex]/3));
        const totalPoints = points + comboBonus;
        
        // In multiplayer, send action to server
        if (this.isMultiplayer && playerIndex === 0) {
            this.multiplayer.sendAction('tapTrash', totalPoints);
        }
        
        // Show floating text
        const pointDisplay = this.add.text(
            player.x,
            player.y - 100,
            `+${totalPoints}`,
            { fontFamily: 'Comic', fontSize: '32px', color: isCritical ? '#FFD700' : '#FFFFFF' }
        ).setOrigin(0.5);
        
        this.tweens.add({
            targets: pointDisplay,
            y: player.y - 200,
            alpha: 0,
            duration: 1000,
            onComplete: () => pointDisplay.destroy()
        });
        
        // Play sound
        if (isCritical) {
            this.sound.play(Phaser.Math.Between(0, 1) ? 'clang' : 'critical_hit');
            this.cameras.main.shake(200, 0.01);
        } else {
            this.game.soundManager.playScoreSound();
            //const soundType = Phaser.Math.Between(0, 1) ? 'stonebang' : 'metalbang';
            //this.sound.play(`${soundType}${Phaser.Math.Between(1, 8)}`);
        }
        
        // Update score (only for local player in multiplayer)
        if (!this.isMultiplayer || playerIndex === 0) {
            const currentScore = parseInt(scoreText.text);
            scoreText.setText(currentScore + totalPoints);
        }
        
        // Change trash sprite
        if (Phaser.Math.Between(1, 100) <= 50) {
            const currentTexture = this.trash.img.texture.key;
            const baseType = currentTexture.split('_')[0];
            this.trash.setLayerTexture(0, `${baseType}_hit${Phaser.Math.Between(1, 2)}`);
            
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
            this.game.soundManager.playRoundMusic();
        } catch (e) {
            console.warn('Audio playback error:', e);
        }
    }
    
    endRound() {
        this.isGameActive = false;
        if (this.roundTimer) this.roundTimer.remove();
        if (this.negativeEvent) this.negativeEvent.remove();
        
        // In multiplayer, only host handles round progression
        if (this.isMultiplayer) {
            if (this.isHost) {
                //this.multiplayer.sendRoundComplete();
            }
            //return;
        }
        
        if (this.currentRound >= this.maxRounds){
            this.endGame();
            return;
        }
        // Single player round handling (original code)
        this.tweens.add({
            targets: this.trash,
            y: this.sys.game.config.height + 500,
            duration: 1000,
            onComplete: () => {
                this.trash.destroy();
                this.showPowerupSelection();
            }
        });
    }
    
    startNextRound(trashType) {
        this.currentRound++; if (this.currentRound>4)er();
        console.log('round++',this.currentRound);
        if (this.currentRound > this.maxRounds) {
            console.log('ending game');
            this.endGame();
            return;
        }
    
        this.setupTrash(trashType);
        this.isGameActive = true;
        this.startRound();
    }
    
    handleBackAction() {
        if (this.gameMusic) this.gameMusic.stop();
        if (this.multiplayer) {
            this.multiplayer.disconnect();
        }
        this.fadeToScene('MenuScene', { 
            bgContainer: this.bgContainer,
            titleMusic: null
        });
    }
    
    proceedToGameSetup() {
        if (this.isMultiplayer) {
            this.initializeMultiplayer();
            //this.showLobbyMenu();
        } else {
            this.startOfflineGame();
        }
    }
    createCharacterSelection() {
        // Clear previous UI if exists
        if (this.selectionContainer) this.selectionContainer.destroy();
        
        // Create container for the selection screen
        this.selectionContainer = this.add.container(0, 0);
        
        // Add fancy brown background with border using Graphics
        const bg = this.add.graphics();
        const bgWidth = 800;
        const bgHeight = 600;
        const bgX = this.cameras.main.centerX - bgWidth/2;
        const bgY = this.cameras.main.centerY - bgHeight/2;
        
        // Draw background (brown with 70% opacity)
        bg.fillStyle(0x5D2906, 0.7); // Rich brown color
        bg.fillRoundedRect(bgX, bgY, bgWidth, bgHeight, 20);
        
        // Add border using your addBorder function
        /*addBorder(bg, 6, 0x8B4513, { 
            cornerRadius: 20,
            alpha: 1
        });*/
        
        bg.setInteractive(
            new Phaser.Geom.Rectangle(bgX, bgY, bgWidth, bgHeight),
            Phaser.Geom.Rectangle.Contains
        );
        this.selectionContainer.add(bg);
        
        // Add title with improved styling
        const title = this.add.text(
            this.cameras.main.centerX,
            120, // Moved slightly higher
            'CHOOSE YOUR CHARACTER',
            { 
                fontFamily: 'Comic', 
                fontSize: '64px', 
                color: '#FFD700',
                stroke: '#5D2906', // Dark brown stroke
                strokeThickness: 8,
                shadow: { 
                    offsetX: 4, 
                    offsetY: 4, 
                    color: '#000', 
                    blur: 2, // Slightly softer shadow
                    stroke: true,
                    fill: true
                }
            }
        ).setOrigin(0.5);
        this.selectionContainer.add(title);
        
        // Available character options
        const characters = [
            { name: 'Goblin', key: 'goblin' },
            { name: 'Pig', key: 'pig' },
            { name: 'Tanuki', key: 'tanuki' },
            { name: 'Cookie', key: 'cookie' },
            { name: 'Egg', key: 'egg' },
            { name: 'Dwarf', key: 'dwarf' },
            { name: 'Mouse', key: 'mouse' },
            { name: 'Cat', key: 'cat' }
        ];
        
        // Create a grid of characters with better positioning
        const gridOptions = {
            startX: this.cameras.main.centerX - 350,
            startY: bgY+20, // Adjusted y-position
            cellWidth: 175, // 700/4 = 175
            cellHeight: 180,
            padding: 20
        };
        
        characters.forEach((char, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            
            // Calculate centered position within each grid cell
            const x = gridOptions.startX + (gridOptions.cellWidth * col) + (gridOptions.cellWidth/2);
            const y = gridOptions.startY + (gridOptions.cellHeight * row) + (gridOptions.cellHeight/2);
            const w = 150;
            const h = w;
            
            // Create character container
            const charContainer = this.add.container(x, y);
            
            // Add character sprite (centered in container)
            const sprite1 = this.add.image(0, -20, 'character_bg')
                .setDisplaySize(w, h)
                //.setInteractive();
            const sprite2 = this.add.image(0, -20, 'character_bg_top')
                .setDisplaySize(w, h)
              //  .setInteractive();
            const spritek = this.add.image(0, -20, char.key)
            .setDisplaySize(w, h)
            .setInteractive();
            const sprite = this.add.image(0, -20, char.key)
                .setDisplaySize(w. h)
                .setInteractive();
            
            const border = this.add.image(0, -20, 'character_bg')
                .setDisplaySize(w, h).setTint(0xFFB74D).setVisible(false);
              //  .setInteractive();
            // Add character name
            const nameText = this.add.text(0, 70, char.name, {
                fontFamily: 'Comic',
                fontSize: '24px',
                color: '#FFFFFF',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(0.5);
            
            // Add selection border (hidden by default)
            const spritesel = this.add.graphics()
                .lineStyle(4, 0xFFFF00, 1)
                .strokeRoundedRect(-70, -70, 140, 160, 10)
                .setVisible(false);
            
            charContainer.add([sprite1, border, sprite, spritek, sprite2, nameText]); // Border first so it's behind
            this.selectionContainer.add(charContainer);
            
            // Add interactivity
            spritek.on('pointerover', () => {
                border.setVisible(true);
               // sprite.setScale(1.1);
            });
            
            spritek.on('pointerout', () => {
                border.setVisible(false);
                //sprite.setScale(1);
            });
            
            spritek.on('pointerdown', (p) => {
                this.selectedCharacter = char.key;
                this.showNotification(`Selected ${char.name}!`, '#00FF00');
                this.selectionContainer.destroy();
                this.proceedToGameSetup();
                createParticles(this, p.x, p.y);
            });
        });
        
        // Improved back button
        const backButton = this.add.text(
            this.cameras.main.centerX,
            700,
            'Back',
            { 
                fontFamily: 'Comic', 
                fontSize: '36px', 
                color: '#FFFFFF',
                backgroundColor: '#8B4513',
                padding: { x: 30, y: 15 },
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setInteractive();
        
        this.setupButtonInteractions(backButton, () => {
            this.selectionContainer.destroy();
            this.scene.star("MenuScene");
        });
        
        this.selectionContainer.add(backButton);
    }
    
    showNotification(message, color = '#ffffff', duration = 2000) {
        const bg = this.add.graphics()
            .fillStyle(0x8B4513, 0.9)
            .fillRoundedRect(
                this.sys.game.config.width / 2 - 200,
                this.sys.game.config.height - 150,
                400, 80, 10
            );
        
        const notification = this.add.text(
            this.sys.game.config.width / 2,
            this.sys.game.config.height - 110,
            message,
            {
                fontFamily: 'Comic',
                fontSize: '24px',
                color: color,
                align: 'center',
                wordWrap: { width: 380 }
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
}
