const ONLY_BACKPACK = true; // Global flag to force Backpack-only mode

// 1. Create a custom connection class that blocks all WebSocket attempts
class HttpOnlyConnection extends window.solanaWeb3.Connection {
    constructor(endpoint, commitment = 'confirmed') {
      // Force HTTP only
      super(endpoint, {
        wsEndpoint: null,
        commitment,
        disableRetryOnRateLimit: true,
        httpHeaders: { 'Content-Type': 'application/json' }
      });
      
      // Nuclear option - override all WebSocket functionality
      this._rpcWebSocket = {
        connect: () => console.warn('WebSocket connections disabled'),
        disconnect: () => {},
        on: () => {},
        off: () => {},
        removeAllListeners: () => {},
        _connected: false
      };
    }
    
    // Override any method that might try to use WebSockets
    onSignature(signature, callback, commitment) {
      throw new Error('WebSocket subscriptions disabled - use polling instead');
    }
    
    confirmTransaction(signature, commitment) {
      return this._confirmTransactionHttp(signature, commitment);
    }
    
    async _confirmTransactionHttp(signature, commitment) {
      // Implement HTTP-only confirmation
      for (let i = 0; i < 30; i++) { // 30 attempts
        const status = await this.getSignatureStatus(signature);
        if (status?.value?.confirmationStatus === commitment) {
          return { value: status.value };
        }
        await new Promise(r => setTimeout(r, 1000)); // 1 second intervals
      }
      throw new Error('Confirmation timeout');
    }
  }
  
  

class WalletManager {
    constructor(network = "gorbagana") {
        console.log("[Wallet] Initializing WalletManager for Gorbagana...");
        this.wallet = null;
        this.publicKey = null;
        this.connected = false;
        this.providerName = null;
        this.network = network;
        this.TREASURY_WALLET = '4G3JSxJAmcYGeytV5ad9a5agnJDacBHK2YX1DoJguD6Z';//"DhFNkXSZq8DPTk43YTaVm6FtvwFSysWK9MSWemRQFtuj";
        this.GOR_TOKEN_MINT = null;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        this.balanceCache = null;
        this.lastBalanceUpdate = 0;
        this.availableWallets = [];
        this.detectedWallets = [];
        this.rpcEndpoints = [
            {
                http: 'https://rpc.gorbagana.wtf',
                ws: 'wss://rpc.gorbagana.wtf'
            },
            {
                http: 'https://gorbagana.rpcpool.com',
                ws: 'wss://gorbagana.rpcpool.com'
            },
            {
                http: 'https://api.gorbagana.wtf',
                ws: 'wss://api.gorbagana.wtf'
            }
        ];
        this.currentEndpointIndex = 0;

        if (!window.solanaWeb3) {
            this.injectSolanaWeb3();
        } else {
            this.initWallet();
        }
    }
    
  getConnection() {
    return new HttpOnlyConnection(
      'https://rpc.gorbagana.wtf', // Your HTTP endpoint
      'confirmed'
    );
  }

  async sendTransaction(connection, transaction) {
    try {
      // Prepare transaction
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.publicKey;

      // Sign and send
      const signed = await this.wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(
        signed.serialize(),
        { skipPreflight: true }
      );

      return { success: true, signature };
    } catch (error) {
        console.log(error.message);
      return { success: false, error: error.message };
    }
  }

  async checkTransactionStatus(signature) {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return {
        confirmed: status?.value?.confirmationStatus === 'confirmed',
        status
      };
    } catch (error) {
      return { error: error.message };
    }
  }
     getConnectinon() {
        const endpoint = this.rpcEndpoints[this.currentEndpointIndex];
        try {
            const connection = new window.solanaWeb3.Connection(
                endpoint.http,
                {
                    wsEndpoint: null,//endpoint.ws,
                    commitment: 'confirmed',
                    disableRetryOnRateLimit: false
                }
            );
            
            // Verify the connection works
           // await connection.getVersion();
            return connection;
        } catch (error) {
            console.warn(`Failed to connect to ${endpoint.http}, trying fallback`);
            // Rotate to next endpoint
            this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.rpcEndpoints.length;
            throw error;
        }
    }
    injectSolanaWeb3() {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js';
        script.onload = () => {
            console.log('Solana web3.js loaded successfully');
            this.initWallet();
        };
        script.onerror = () => {
            console.error('Failed to load Solana web3.js');
        };
        document.head.appendChild(script);
    }

    async initWallet() {
        console.log(`[Wallet] Initializing for ${this.network} network`);
        
        this.detectedWallets = ONLY_BACKPACK 
            ? [{
                name: "backpack",
                obj: window.backpack,
                isAvailable: !!window.backpack
              }]
            : [];
        
        if (this.detectedWallets.length === 0) {
            const errorMsg = ONLY_BACKPACK 
                ? "Backpack wallet not detected" 
                : "No wallet providers detected";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const backpackWallet = this.detectedWallets.find(w => w.name === "backpack");
        if (backpackWallet) {
            await this.selectWallet("backpack");
        }
    }
    setupWalletEvents() {
        if (!this.wallet) return;
    
        // Clear previous listeners
        this.wallet.off('connect');
        this.wallet.off('disconnect');
        this.wallet.off('accountChanged');
    
        let connectionInProgress = false;
    
        this.wallet.on("connect", async (publicKey) => {
            if (connectionInProgress) return;
            connectionInProgress = true;
            
            try {
                console.debug('[Wallet] Connect event received:', publicKey);
                await this.handleConnected(publicKey);
            } catch (error) {
                console.error('[Wallet] Connect handler error:', error);
            } finally {
                connectionInProgress = false;
            }
        });
    
        
        this.wallet.on("disconnect", () => {
            console.log("[Wallet] Disconnected");
            this.handleDisconnected();
        });

        this.wallet.on("accountChanged", (publicKey) => {
            if (publicKey) {
                console.log("[Wallet] Account changed:", publicKey.toString());
                this.handleConnected(publicKey);
            } else {
                this.handleDisconnected();
            }
        });
    }

    async selectWallet(walletName) {
        const selected = this.detectedWallets.find(w => w.name === walletName);
        if (!selected) {
            throw new Error(`Wallet ${walletName} not available`);
        }

        console.log(`[Wallet] Selected ${walletName} wallet`);
        this.wallet = selected.obj;
        this.providerName = selected.name;
        this.setupWalletEvents();

        try {
            return await this.checkConnection();
        } catch (error) {
            console.error("[Wallet] Connection check error:", error);
            throw error;
        }
    }

    /* Sets up WebSocket error handling and reconnection logic
    * @param {Connection} connection - The Solana connection object
    */
   setupConnectionEvents(connection) {
       // Remove previous error handler if it exists
       if (this._wsErrorHandler) {
           connection._rpcWebSocket?.off('error', this._wsErrorHandler);
       }

       // Define the error handler
       this._wsErrorHandler = (error) => {
           // Filter out common non-critical errors
           if (!error?.message?.match(/ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i)) {
               console.warn('[WebSocket] Error:', error.message);
           }
           
           // Schedule reconnection if still connected
           if (this.connected) {
               const reconnectDelay = 5000; // 5 seconds
               console.log(`[WebSocket] Attempting reconnection in ${reconnectDelay/1000} seconds...`);
               
               setTimeout(() => {
                   if (this.connected && connection._rpcWebSocket) {
                       try {
                           connection._rpcWebSocket.connect();
                       } catch (reconnectError) {
                           console.warn('[WebSocket] Reconnection failed:', reconnectError.message);
                       }
                   }
               }, reconnectDelay);
           }
       };

       // Attach the handler
       if (connection._rpcWebSocket) {
           connection._rpcWebSocket.on('error', this._wsErrorHandler);
       } else {
           console.warn('[WebSocket] No WebSocket instance found on connection');
       }
   }

    setupConnectionEvents(connection) {
        // Clear previous listeners
        if (this._wsErrorHandler) {
            connection._rpcWebSocket.off('error', this._wsErrorHandler);
        }
    
        this._wsErrorHandler = (error) => {
            console.warn('WebSocket error:', error);
            // Don't spam the console for common errors
            if (!error?.message?.includes('ECONNREFUSED')) {
                console.debug('Full WebSocket error:', {
                    message: error.message,
                    stack: error.stack
                });
            }
            
            // Automatically try to reconnect
            setTimeout(() => {
                if (this.connected) {
                    console.log('Attempting WebSocket reconnection...');
                    connection._rpcWebSocket.connect();
                }
            }, 5000);
        };
    
        connection._rpcWebSocket.on('error', this._wsErrorHandler);
    }
    handleConnectend(publicKey) {
        try {
            console.debug('[Wallet] Raw connection data:', publicKey);
    
            // 1. Extract public key from different wallet formats
            let extractedKey;
            
            // Case 1: Backpack's nested structure
            if (publicKey?.publicKey?.toBase58) {
                extractedKey = publicKey.publicKey;
            } 
            // Case 2: Standard Solana public key object
            else if (publicKey?.toBase58) {
                extractedKey = publicKey;
            }
            // Case 3: String representation
            else if (typeof publicKey === 'string') {
                extractedKey = new window.solanaWeb3.PublicKey(publicKey);
            }
            // Case 4: Phantom-style object
            else if (publicKey?.publicKey) {
                extractedKey = publicKey.publicKey;
            }
            else {
                throw new Error(`Unsupported public key format: ${JSON.stringify(publicKey)}`);
            }
    
            // 2. Convert to PublicKey object
            const keyString = extractedKey.toBase58();
            this.publicKey = new window.solanaWeb3.PublicKey(keyString);
    
            // 3. Validate the key
            if (!window.solanaWeb3.PublicKey.isOnCurve(this.publicKey)) {
                throw new Error('Public key failed on-curve validation');
            }
    
            // 4. Update connection state
            this.connected = true;
            this.connectionAttempts = 0;
            this.balanceCache = null;
            
            console.log('[Wallet] Successfully connected with:', keyString);
            
            document.dispatchEvent(new CustomEvent('walletConnected', {
                detail: {
                    publicKey: keyString,
                    network: this.network
                }
            }));
    
        } catch (error) {
            console.error('[Wallet] Connection failed - Full debug:', {
                error: error.message,
                rawInput: publicKey,
                inputType: typeof publicKey,
                constructorName: publicKey?.constructor?.name,
                stack: error.stack
            });
            
            this.handleDisconnected();
            throw new Error(`Wallet connection failed: ${this.simplifyError(error.message)}`);
        }
    }

    
    // Helper method to simplify error messages
    simplifyError(message) {
        if (message.includes('Invalid public key input')) {
            return 'Invalid wallet connection format';
        }
        if (message.includes('on-curve validation')) {
            return 'Security validation failed - please reconnect';
        }
        return message;
    }
    handleDisconnected() {
        this.publicKey = null;
        this.connected = false;
        this.balanceCache = null;
        document.dispatchEvent(new CustomEvent('walletDisconnected'));
    }
    handleConnected(connectionData) {
        try {
            console.debug('[Wallet] Full connection data:', JSON.parse(JSON.stringify(connectionData)));
    
            // 1. Extract public key from different wallet formats
            let extractedKey;
            
            // Case 1: Backpack's latest format (nested object)
            if (connectionData?.publicKey?.toBase58) {
                extractedKey = connectionData.publicKey;
            }
            // Case 2: Direct PublicKey object
            else if (connectionData?.toBase58) {
                extractedKey = connectionData;
            }
            // Case 3: String representation
            else if (typeof connectionData === 'string') {
                extractedKey = new window.solanaWeb3.PublicKey(connectionData);
            }
            // Case 4: Phantom-style connection
            else if (connectionData?.publicKey) {
                if (typeof connectionData.publicKey === 'string') {
                    extractedKey = new window.solanaWeb3.PublicKey(connectionData.publicKey);
                } else {
                    extractedKey = connectionData.publicKey;
                }
            }
            else {
                throw new Error(`Unsupported connection format: ${JSON.stringify(connectionData)}`);
            }
    
            // 2. Convert to PublicKey object with proper validation
            let keyString;
            if (typeof extractedKey === 'string') {
                keyString = extractedKey;
            } else if (extractedKey.toBase58) {
                keyString = extractedKey.toBase58();
            } else {
                throw new Error('Could not extract public key string');
            }
    
            this.publicKey = new window.solanaWeb3.PublicKey(keyString);
    
            // 3. Validate the key
            if (!window.solanaWeb3.PublicKey.isOnCurve(this.publicKey)) {
                throw new Error('Public key failed cryptographic validation');
            }
    
            // 4. Update connection state
            this.connected = true;
            this.connectionAttempts = 0;
            this.balanceCache = null;
            
            console.log('[Wallet] Successfully connected with:', keyString);
            
            document.dispatchEvent(new CustomEvent('walletConnected', {
                detail: {
                    publicKey: keyString,
                    network: this.network
                }
            }));
    
        } catch (error) {
            console.error('[Wallet] Connection failed:', {
                error: error.message,
                rawInput: connectionData,
                stack: error.stack
            });
            
            this.handleDisconnected();
            throw new Error(`Connection failed: ${error.message}`);
        }
    }

    handleConnected2(publicKey) {
        try {
            // 1. Handle different wallet response formats
            let keyString;
            if (typeof publicKey === 'string') {
                keyString = publicKey;
            } else if (publicKey?.publicKey) { // Backpack sometimes nests the key
                keyString = publicKey.publicKey.toString();
            } else if (publicKey?.toString) {
                keyString = publicKey.toString();
            } else {
                throw new Error('Invalid public key format');
            }
    
            // 2. Clean and validate
            keyString = keyString.trim();
            if (keyString === '[object Object]') {
                throw new Error('Received object instead of public key');
            }
    
            // 3. Rest of your validation logic...
            this.publicKey = new window.solanaWeb3.PublicKey(keyString);
            this.connected = true;
            
            console.log('Successfully connected with public key:', keyString);
        } catch (error) {
            console.error('Connection error details:', {
                rawInput: publicKey,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async checkConnection() {
        if (!this.wallet) return false;

        try {
            let isConnected = false;
            
            if (typeof this.wallet.isConnected === "boolean") {
                isConnected = this.wallet.isConnected;
            } else if (typeof this.wallet.isConnected === "function") {
                isConnected = await this.wallet.isConnected();
            } else if (this.wallet.request) {
                const response = await this.wallet.request({ method: "isConnected" });
                isConnected = response.connected;
            }

            if (isConnected && this.wallet.publicKey) {
                this.handleConnected(this.wallet.publicKey);
                return true;
            }
            return false;
        } catch (error) {
            console.error("[Wallet] Connection check failed:", error);
            return false;
        }
    }

    async connect(walletName = null) {
        if (walletName) {
            await this.selectWallet(walletName);
        }

        if (!this.wallet) {
            this.initWallet();
            if (!this.wallet) {
                throw new Error("No wallet provider selected");
            }
        }

        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            throw new Error("Connection failed after multiple attempts");
        }

        this.connectionAttempts++;
        console.log(`[Wallet] Connection attempt ${this.connectionAttempts} with ${this.providerName}`);

        try {
            if (this.wallet.connect) {
                await this.wallet.connect();
            } else if (this.wallet.request) {
                await this.wallet.request({ method: "connect" });
            } else {
                throw new Error("No supported connection method");
            }
            return true;
        } catch (error) {
            console.error("[Wallet] Connection failed:", error);
            throw new Error(`Connection failed: ${error.message}`);
        }
    }

    async disconnect() {
        if (!this.wallet || !this.connected) return;

        try {
            if (this.wallet.disconnect) {
                await this.wallet.disconnect();
            } else if (this.wallet.request) {
                await this.wallet.request({ method: "disconnect" });
            }
            this.handleDisconnected();
        } catch (error) {
            console.error("[Wallet] Disconnection failed:", error);
            throw error;
        }
    }

    getShortAddress(length = 4) {
        if (!this.publicKey) return 'Not Connected';
        try {
            const addr = this.publicKey.toString();
            return `${addr.substring(0, length)}...${addr.substring(addr.length - length)}`;
        } catch (error) {
            console.error('[Wallet] Error getting short address:', error);
            return 'Invalid Address';
        }
    }

    async getBalance(forceRefresh = false) {
        if (!this.connected || !this.publicKey) {
            throw new Error('Please connect your wallet first');
        }

        if (!forceRefresh && this.balanceCache && Date.now() - this.lastBalanceUpdate < 15000) {
            return this.balanceCache;
        }

        try {
            const connection = new window.solanaWeb3.Connection(
                'https://rpc.gorbagana.wtf',
                'confirmed'
            );
            console.log('getting balalnce...')

            const gorBalance = await connection.getBalance(this.publicKey);
            console.log('getting222222222222 balalnce...')
            const gorAmount = gorBalance / window.solanaWeb3.LAMPORTS_PER_SOL;

            const result = {
                gor: gorAmount,
                gol: 0,
                hasTokenAccount: false,
                lastUpdated: Date.now(),
                network: this.network
            };

            console.log('balance:', gorAmount);

            this.balanceCache = result;
            this.lastBalanceUpdate = Date.now();

            return result;
        } catch (error) {
            console.error('[Wallet] Balance check failed:', error.message);
            throw new Error('Failed to get balance');
        }
    }
    async stakeTokens(amount) {
        try {
            // 1. Verify connection
            if (!this.connected || !this.publicKey) {
                throw new Error('Wallet not properly connected');
            }
    
            // 2. Setup connection with WebSocket fallback
            const connection = this.createRobustConnection();
    
            // 3. Balance check
            const balance = await this.getBalance();
            const requiredLamports = Math.floor(amount * window.solanaWeb3.LAMPORTS_PER_SOL);
            const feeBuffer = 10000; // Additional buffer for fees
            
            if (balance < requiredLamports + feeBuffer) {
                throw new Error(`Insufficient balance. Need ${
                    (requiredLamports + feeBuffer)/window.solanaWeb3.LAMPORTS_PER_SOL
                } GOR (including fees)`);
            }
    
            // 4. Create transaction
            const transaction = this.buildTransaction(connection, requiredLamports);
    
            // 5. Sign and send
            const { signature, confirmation } = await this.sendTransaction(connection, transaction);
            
            return {
                success: true,
                signature,
                explorerUrl: this.getExplorerUrl(signature)
            };
    
        } catch (error) {
            console.error('[Stake] Transaction failed:', {
                error: error.message,
                stack: error.stack,
                amount,
                balance: this.balanceCache
            });
            
            return {
                success: false,
                error: this.simplifyStakeError(error.message),
                details: 'Please check your balance and try again'
            };
        }
    }
    
     createRobustConnection() {
        // Try primary RPC first
        try {
            return  this.getConnection()/*new window.solanaWeb3.Connection(
                'https://rpc.gorbagana.wtf',
                {
                    wsEndpoint: 'wss://rpc.gorbagana.wtf',
                    commitment: 'confirmed',
                    disableRetryOnRateLimit: false
                }
            )*/;
        } catch (e) {
            console.warn('Primary RPC failed, falling back to alternative');
            return new window.solanaWeb3.Connection(
                'https://gorbagana.rpcpool.com',
                { commitment: 'confirmed' }
            );
        }
    }
    
    buildTransaction(connection, lamports) {
        const treasuryPubkey = new window.solanaWeb3.PublicKey(this.TREASURY_WALLET);
        const transaction = new window.solanaWeb3.Transaction().add(
            window.solanaWeb3.SystemProgram.transfer({
                fromPubkey: this.publicKey,
                toPubkey: treasuryPubkey,
                lamports
            })
        );
    
        // Add priority fee
        transaction.add(
            window.solanaWeb3.ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 1000 // Small priority fee
            })
        );
    
        return transaction;
    }
    
    async sendTralnsaction(connection, transaction) {
        // 1. Get blockhash using version-appropriate method
        let blockhashInfo;
        try {
            if (typeof connection.getLatestBlockhash === 'function') {
                blockhashInfo = await connection.getLatestBlockhash();
            } else {
                blockhashInfo = {
                    blockhash: await connection.getRecentBlockhash(),
                    lastValidBlockHeight: undefined
                };
            }
        } catch (error) {
            throw new Error(`Failed to get blockhash: ${error.message}`);
        }
    
        // 2. Prepare transaction
        transaction.recentBlockhash = blockhashInfo.blockhash;
        if (blockhashInfo.lastValidBlockHeight) {
            transaction.lastValidBlockHeight = blockhashInfo.lastValidBlockHeight;
        }
        transaction.feePayer = this.publicKey;
    
        // 3. Sign and send
        try {
            const signed = await this.wallet.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(signed.serialize());
            
            // 4. Confirm with version-appropriate method
            let confirmation;
            if (typeof connection.confirmTransaction === 'function') {
                confirmation = await connection.confirmTransaction(
                    signature,
                    'confirmed'
                );
            } else {
                // Old confirmation style
                confirmation = await connection.waitForConfirmTransaction(
                    signature
                );
            }
    
            return {
                signature,
                confirmation
            };
        } catch (error) {
            console.error('[Transaction] Failed:', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    
    async verifyTransaction(connection, signature, blockhash) {
        // Strategy 1: Wait for confirmation
        try {
            const confirmation = await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight: undefined
            }, 'confirmed');
            
            if (confirmation.value.err) {
                return { success: false, error: 'Transaction failed on-chain' };
            }
            return { success: true, confirmation };
        } catch (error) {
            console.warn('Confirmation strategy 1 failed:', error);
        }
    
        // Strategy 2: Poll for transaction
        try {
            const startTime = Date.now();
            while (Date.now() - startTime < 30000) { // 30 second timeout
                const tx = await connection.getTransaction(signature, {
                    commitment: 'confirmed'
                });
                
                if (tx) {
                    return { 
                        success: !tx.meta?.err,
                        confirmation: { value: { err: tx.meta?.err } },
                        error: tx.meta?.err ? 'Transaction failed' : undefined
                    };
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            return { success: false, error: 'Transaction not found within timeout' };
        } catch (error) {
            console.warn('Confirmation strategy 2 failed:', error);
        }
    
        // Strategy 3: Check signature status directly
        try {
            const status = await connection.getSignatureStatus(signature);
            if (status?.value?.confirmationStatus === 'confirmed') {
                return { 
                    success: !status.value.err,
                    error: status.value.err ? 'Transaction failed' : undefined
                };
            }
        } catch (error) {
            console.warn('Confirmation strategy 3 failed:', error);
        }
    
        return { 
            success: false, 
            error: 'All verification methods failed (but transaction may have succeeded)' 
        };
    }
    getExplorerUrl(signature) {
        return `https://explorer.gorbagana.com/tx/${signature}`;
    }

    async getTransactionInfo(signature) {
        try {
            const connection = new window.solanaWeb3.Connection(
                'https://rpc.gorbagana.wtf',
                "confirmed"
            );

            const tx = await connection.getConfirmedTransaction(signature);
            if (!tx) {
                throw new Error("Transaction not found");
            }

            return {
                success: true,
                slot: tx.slot,
                blockTime: tx.blockTime,
                fee: tx.meta?.fee / window.solanaWeb3.LAMPORTS_PER_SOL,
                status: tx.meta?.err ? "failed" : "success",
                explorerUrl: this.getExplorerUrl(signature),
            };
        } catch (error) {
            console.error("[Wallet] Transaction info failed:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

function initializeWallet(network = "gorbagana") {
    try {
        if (!window.solanaWeb3) {
            throw new Error("Solana web3.js not loaded");
        }

        window.walletManager = new WalletManager(network);
        console.log(`[Wallet] Initialized for ${network} network`);
        return window.walletManager;
    } catch (error) {
        console.error("[Wallet] Initialization failed:", error);
        throw error;
    }
}

if (document.readyState === "complete") {
    initializeWallet();
} else {
    document.addEventListener("DOMContentLoaded", () => initializeWallet());
}