    // Add debounce to ready state changes
    let readyDebounce = null;


class MultiplayerManager {
    constructor(scene) {
      this.scene = scene;
      this.socket = null;
      this.playerId = null;
      this.gameId = null;
      this.isHost = false;
      this.connectedPlayers = {};
      this.gameState = {
        currentRound: 1,
        maxRounds: 3
      };
    }
    
  findRandomGame() {
      this.socket.emit('quickPlay', { 
          character: this.scene.selectedCharacter 
      });
  }
    createPrivateGame() {
        this.socket.emit('createPrivateGame');
    }

    
  
    connect() {
      if (this.socket && this.socket.connected) {
          console.warn('Already connected!');
          return;
      }
      // Replace with your Render server URL
      const serverUrl = 'https://trash-rush-server.onrender.com';
      console.log(`Connecting to server: ${serverUrl}`);
      
      this.socket = io(serverUrl, {
        transports: ['websocket'], // Force WebSocket
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        //upgrade: false,
        secure: true,
        rejectUnauthorized: false // Only for development/testing
        
      });
      this.socket.on('connect', () => {
          console.log('Socket connected, ID:', this.socket.id);
          this.playerId = this.socket.id;
          this.scene.showNotification("Connected to server", "#00FF00", 2000);
        
      });
      this.socket.onAny((event, ...args) => {
        console.log('📡 Incoming event:', event, args);
      });
      this.socket.on('connect_error', (err) => {
        console.error('❌ Connection failed:', err.message);
        this.scene.showNotification(`Connection failed: ${err.message}`, "#FF0000");
      });
    
      this.socket.on('disconnect', (reason) => {
        console.log('⚠ Disconnected:', reason);
      });
      
      this.socket.on('disconnect', () => {
          console.log('Socket disconnected');
      });
      
      this.socket.on('playersUpdated', (data) => {
        this.scene.events.emit('playersUpdated', data.players);
    });
    
    this.socket.on('readyStatesUpdated', (readyStates) => {
        this.scene.events.emit('readyStatesUpdated', readyStates);
    });
    
      this.socket.on('gameOver', (data) => {
        // data contains:
        // - scores: {playerId: score}
        // - winnerId
        // - players: array with character/position info
        
        this.scene.start('GameOverScene', {
          scores: data.players.map(p => p.score),
          winnerIndex: data.players.findIndex(p => p.id === data.winnerId),
          playerData: data.players // Pass full player data
        });
      });

      this.socket.on('gameCreated', (data) => {
        this.gameId = data.gameId;
        this.isHost = data.isHost;
        this.scene.isHost = data.isHost;
        this.scene.game.seedd = data.seed;
        this.scene.events.emit('gameCreated', data);
      });
  
      this.socket.on('gameJoined', (data) => {
        this.gameId = data.gameId;
        this.isHost = data.isHost;
        this.scene.events.emit('gameJoined', data);
      });
  
      this.socket.on('playerJoined', (data) => {
        this.connectedPlayers[data.playerId] = {
          position: data.position,
          ready: false
        };
        this.scene.events.emit('playerJoined', data);
      });
  
      this.socket.on('playerReady', (data) => {
        if (this.connectedPlayers[data.playerId]) {
          this.connectedPlayers[data.playerId].ready = true;
          this.connectedPlayers[data.playerId].character = data.character;
        }
        this.scene.events.emit('playerReady', data);
      });
  
      this.socket.on('playerDisconnected', (data) => {
        delete this.connectedPlayers[data.playerId];
        this.scene.events.emit('playerDisconnected', data);
      });
  
      this.socket.on('gameStart', (data) => {
        this.scene.events.emit('gameStart', data);
      });

      this.socket.on('startGameCountDown', (data) => {
        this.scene.events.emit('startGameCountDown', data);
      });
  
      this.socket.on('cancelGameCountDown', (data) => {
        this.scene.events.emit('cancelGameCountDown', data);
      });

      this.socket.on('playerAction', (data) => {
        this.scene.events.emit('playerAction', data);
      });
  
      this.socket.on('startNextRound', (data) => {
        this.gameState.currentRound = data.round;
        //this.scene.events.emit('startNextRound', data);
      });
  
      this.socket.on('gameOver', (data) => {
        this.scene.events.emit('gameOver', data);
      });
  
      this.socket.on('promoteToHost', () => {
        this.isHost = true;
        this.scene.events.emit('promotedToHost');
      });
      this.socket.io.on('reconnect_attempt', () => {
        console.log('🔄 Trying to reconnect...');
      });
      this.socket.io.on('reconnect_failed', () => {
        console.log('❌ Reconnection failed');
      });
      
  
      this.socket.on('gameError', (data) => {
        this.scene.events.emit('gameError', data);
      });
    }

setReadyStatus(isReady) {
    if (readyDebounce) clearTimeout(readyDebounce);
    
    readyDebounce = setTimeout(() => {
        this.socket.emit('playerReady', {
            gameId: this.gameId,
            character: this.scene.selectedCharacter,
            ready: isReady
        });
    }, 100); // 100ms debounce
}
    
    cancelMatchmaking() {
      this.socket.emit('cancelMatchmaking');
    }
    
    createGame() {
      this.socket.emit('createGame');
    }
  
    joinGame(gameId) {
      this.socket.emit('joinGame', gameId);
    }
  
    sendReady(character) {
      this.socket.emit('playerReady', { 
        gameId: this.gameId, 
        character 
      });
    }

    startGameForReal() {
      this.socket.emit('startGameForReal', {
        gameId: this.gameId
      })
    }
  
    sendAction(action, points = 1, powerup = "") {
      this.socket.emit('playerAction', { 
        gameId: this.gameId,
        action: action, 
        points: points,
        powerup: powerup
      });
    }
  
    sendRoundComplete() {
      if (this.isHost) {
        console.log('roundcomplete being sent');
        this.socket.emit('roundComplete', { 
          gameId: this.gameId 
        });
      }
    }
  
    disconnect() {
      if (this.socket) {
        this.socket.disconnect();
      }
    }
  
    getPlayerCount() {
      return Object.keys(this.connectedPlayers).length + 1; // +1 for local player
    }
  }