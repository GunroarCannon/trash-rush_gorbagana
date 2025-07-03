// wallet.js


const ONLY_BACKPACK = true; // Global flag to force Backpack-only mode

class WalletManager {
    constructor(network = "mainnet-beta") {
        console.log("[Wallet] Initializing WalletManager...");
        this.wallet = null;
        this.publicKey = null;
        this.connected = false;
        this.providerName = null;
        this.network = network;
        this.TREASURY_WALLET = "DhFNkXSZq8DPTk43YTaVm6FtvwFSysWK9MSWemRQFtuj";
        this.GOL_TOKEN_MINT = "DhFNkXSZq8DPTk43YTaVm6FtvwFSysWK9MSWemRQFtuj";
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        this.balanceCache = null;
        this.lastBalanceUpdate = 0;
        this.availableWallets = [];
        this.detectedWallets = [];
        this.initWallet();
    }
   
    async initWallet() {
        console.log(`[Wallet] Initializing for ${this.network} network`);
        
        // Wallet detection logic with global flag
        this.detectedWallets = ONLY_BACKPACK 
            ? [{
                name: "backpack",
                obj: window.backpack,
                isAvailable: !!window.backpack
              }]
            : [
                { name: "backpack", obj: window.backpack, isAvailable: !!window.backpack },
                { name: "phantom", obj: window.phantom?.solana, isAvailable: !!window.phantom?.solana },
                { name: "glow", obj: window.glow?.solana, isAvailable: !!window.glow?.solana },
                { name: "solflare", obj: window.solflare, isAvailable: !!window.solflare }
              ].filter(w => w.isAvailable);

        // Rest of the logic remains the same
        if (this.detectedWallets.length > 0) {
            await this.selectWallet("backpack");
        } else {
            throw new Error(ONLY_BACKPACK 
                ? "Backpack wallet not detected" 
                : "No wallet providers detected");
        }
    }
    async selectWallet(walletName) {
        const selected = this.detectedWallets.find(
            (w) => w.name === walletName,
        );
        if (!selected) {
            throw new Error(`Wallet ${walletName} not available`);
        }

        console.log(`[Wallet] Selected ${walletName} wallet`);
        this.wallet = selected.obj;
        this.providerName = selected.name;
        this.setupWalletEvents();

        try {
            const isConnected = await this.checkConnection();
            if (isConnected) {
                console.log("[Wallet] Already connected");
                return true;
            }
            return false;
        } catch (error) {
            console.error("[Wallet] Connection check error:", error);
            throw error;
        }
    }

    showWalletSelection() {
        // Dispatch event that UI can listen to show wallet selector
        document.dispatchEvent(
            new CustomEvent("showWalletSelector", {
                detail: {
                    wallets: this.detectedWallets.map((w) => w.name),
                },
            }),
        );
    }

    async connect(walletName = null) {
        if (walletName) {
            await this.selectWallet(walletName);
        }

        if (!this.wallet) {
            throw new Error("No wallet provider selected");
        }

        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            throw new Error("Connection failed after multiple attempts");
        }

        this.connectionAttempts++;
        console.log(
            `[Wallet] Connection attempt ${this.connectionAttempts} with ${this.providerName}`,
        );

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

    async checkConnection() {
        if (!this.wallet) return false;

        try {
            if (typeof this.wallet.isConnected === "boolean") {
                if (this.wallet.isConnected && this.wallet.publicKey) {
                    this.handleConnected(this.wallet.publicKey);
                    return true;
                }
            } else if (typeof this.wallet.isConnected === "function") {
                const connected = await this.wallet.isConnected();
                if (connected && this.wallet.publicKey) {
                    this.handleConnected(this.wallet.publicKey);
                    return true;
                }
            } else if (this.wallet.request) {
                const { connected } = await this.wallet.request({
                    method: "isConnected",
                });
                if (connected && this.wallet.publicKey) {
                    this.handleConnected(this.wallet.publicKey);
                    return true;
                }
            }
        } catch (error) {
            console.error("[Wallet] Connection check failed:", error);
        }
        return false;
    }

    setupWalletEvents() {
        if (!this.wallet) return;

        this.wallet.on("connect", (publicKey) => {
            console.log("[Wallet] Connected:", publicKey.toString());
            this.handleConnected(publicKey);
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

    handleConnectedold(publicKey) {
        this.publicKey = publicKey;
        this.connected = true;
        this.connectionAttempts = 0;
        this.balanceCache = null;
        document.dispatchEvent(
            new CustomEvent("walletConnected", {
                detail: {
                    publicKey: publicKey.toString(),
                    network: this.network,
                },
            }),
        );
    }

    handleDisconnected() {
        this.publicKey = null;
        this.connected = false;
        this.balanceCache = null;
        document.dispatchEvent(new CustomEvent("walletDisconnected"));
    }

    async disconnect() {
        if (!this.wallet || !this.connected) return;

        try {
            if (this.wallet.disconnect) {
                await this.wallet.disconnect();
            } else if (this.wallet.request) {
                await this.wallet.request({ method: "disconnect" });
            } else {
                this.handleDisconnected();
                return;
            }
        } catch (error) {
            console.error("[Wallet] Disconnection failed:", error);
            throw error;
        }
    }

        async getBalance(forceRefresh = false) {
            if (!this.connected || !this.publicKey) {
                throw new Error('Wallet not connected');
            }
    
            // Ensure publicKey is a PublicKey object
            let publicKey;
            try {
                publicKey = new window.solanaWeb3.PublicKey(this.publicKey);
            } catch (error) {
                throw new Error('Invalid public key');
            }
    
            if (!forceRefresh && this.balanceCache && Date.now() - this.lastBalanceUpdate < 15000) {
                return this.balanceCache;
            }
    
            try {
                const connection = new window.solanaWeb3.Connection(
                    window.solanaWeb3.clusterApiUrl(this.network),
                    'confirmed'
                );
    
                // Get SOL balance
                const solBalance = await connection.getBalance(publicKey);
                const solAmount = solBalance / window.solanaWeb3.LAMPORTS_PER_SOL;
    
                // Get GOL token balance
                let golBalance = 0;
                const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                    publicKey,
                    { mint: new window.solanaWeb3.PublicKey(this.GOL_TOKEN_MINT) }
                );
    
                if (tokenAccounts.value.length > 0) {
                    golBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
                }
    
                this.balanceCache = {
                    sol: solAmount,
                    gol: golBalance,
                    lastUpdated: Date.now(),
                    network: this.network
                };
                this.lastBalanceUpdate = Date.now();
    
                return this.balanceCache;
            } catch (error) {
                console.error('[Wallet] Balance check failed:', error);
                throw new Error(`Failed to get balance: ${error.message}`);
            }
        }
    
        // Update handleConnected to ensure proper publicKey handling
        handleConnected(publicKey) {
            try {
                // Convert to PublicKey object if it isn't already
                this.publicKey = publicKey instanceof window.solanaWeb3.PublicKey 
                    ? publicKey 
                    : new window.solanaWeb3.PublicKey(publicKey);
                    
                this.connected = true;
                this.connectionAttempts = 0;
                this.balanceCache = null;
                
                document.dispatchEvent(new CustomEvent('walletConnected', { 
                    detail: { 
                        publicKey: this.publicKey.toString(),
                        network: this.network 
                    } 
                }));
            } catch (error) {
                console.error('[Wallet] Error handling connection:', error);
                this.handleDisconnected();
                throw new Error('Invalid public key received');
            }
        }
    
        // Update getShortAddress to handle publicKey safely
        getShortAddress(length = 4) {
            if (!this.publicKey) return 'Not Connected';
            
            try {
                const pubKey = this.publicKey instanceof window.solanaWeb3.PublicKey
                    ? this.publicKey
                    : new window.solanaWeb3.PublicKey(this.publicKey);
                    
                const addr = pubKey.toString();
                return `${addr.substring(0, length)}...${addr.substring(addr.length - length)}`;
            } catch (error) {
                console.error('[Wallet] Error getting short address:', error);
                return 'Invalid Address';
            }
        }

    async stakeTokens(amount) {
        if (!this.connected || !this.publicKey) {
            throw new Error("Wallet not connected");
        }

        try {
            const balance = await this.getBalance(true);
            if (balance.gol < amount) {
                throw new Error(
                    `Insufficient GOL balance. Need ${amount}, have ${balance.gol}`,
                );
            }

            const connection = new window.solanaWeb3.Connection(
                window.solanaWeb3.clusterApiUrl(this.network),
                "confirmed",
            );

            const transaction = new window.solanaWeb3.Transaction();
            const treasuryPublicKey = new window.solanaWeb3.PublicKey(
                this.TREASURY_WALLET,
            );
            const golMintPublicKey = new window.solanaWeb3.PublicKey(
                this.GOL_TOKEN_MINT,
            );

            // Get token accounts
            const fromTokenAccount = await this.getTokenAccount(
                connection,
                this.publicKey,
                golMintPublicKey,
            );
            const toTokenAccount = await this.getTokenAccount(
                connection,
                treasuryPublicKey,
                golMintPublicKey,
                true,
            );

            // Add transfer instruction
            transaction.add(
                window.solanaWeb3.Token.createTransferInstruction(
                    window.solanaWeb3.TOKEN_PROGRAM_ID,
                    fromTokenAccount,
                    toTokenAccount,
                    this.publicKey,
                    [],
                    amount * Math.pow(10, 9), // Assuming 9 decimals
                ),
            );

            // Sign and send
            const { blockhash } = await connection.getRecentBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = this.publicKey;

            const signed = await this.wallet.signTransaction(transaction);
            const signature = await connection.sendRawTransaction(
                signed.serialize(),
            );
            const confirmation = await connection.confirmTransaction(
                signature,
                "confirmed",
            );

            if (confirmation.value.err) {
                throw new Error("Transaction failed");
            }

            return {
                success: true,
                signature: signature,
                explorerUrl: this.getExplorerUrl(signature),
            };
        } catch (error) {
            console.error("[Wallet] Stake failed:", error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    async getTokenAccount(connection, owner, mint, mustExist = false) {
        const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
            mint,
        });

        if (accounts.value.length > 0) {
            return accounts.value[0].pubkey;
        }

        if (mustExist) {
            throw new Error("Recipient token account not found");
        }

        // Create token account if doesn't exist
        const newAccount = window.solanaWeb3.Keypair.generate();
        const transaction = new window.solanaWeb3.Transaction();

        transaction.add(
            window.solanaWeb3.SystemProgram.createAccount({
                fromPubkey: owner,
                newAccountPubkey: newAccount.publicKey,
                lamports: await connection.getMinimumBalanceForRentExemption(
                    window.solanaWeb3.AccountLayout.span,
                ),
                space: window.solanaWeb3.AccountLayout.span,
                programId: window.solanaWeb3.TOKEN_PROGRAM_ID,
            }),
        );

        transaction.add(
            window.solanaWeb3.Token.createInitAccountInstruction(
                window.solanaWeb3.TOKEN_PROGRAM_ID,
                mint,
                newAccount.publicKey,
                owner,
            ),
        );

        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = owner;
        transaction.sign(newAccount);

        const signed = await this.wallet.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(
            signed.serialize(),
        );
        await connection.confirmTransaction(signature, "confirmed");

        return newAccount.publicKey;
    }

    getExplorerUrl(signature) {
        const cluster =
            this.network === "mainnet-beta" ? "" : `?cluster=${this.network}`;
        return `https://explorer.solana.com/tx/${signature}${cluster}`;
    }// First, let's update the wallet selector in MenuScene
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

    // ... existing code ...
    
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
            const isConnected = await this.checkConnection();
            if (isConnected) {
                console.log('[Wallet] Already connected');
                return true;
            }
            return false;
        } catch (error) {
            console.error('[Wallet] Connection check error:', error);
            throw error;
        }
    }
    
    showWalletSelection() {
        // Cleaner event dispatch
        document.dispatchEvent(new CustomEvent('showWalletSelector', {
            detail: {
                wallets: this.detectedWallets.map(w => ({
                    name: w.name,
                    icon: `${w.name}_icon`
                }))
            }
        }));
    }
    
    async getTransactionInfo(signature) {
        try {
            const connection = new window.solanaWeb3.Connection(
                window.solanaWeb3.clusterApiUrl(this.network),
                "confirmed",
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

// UI Integration Example:
document.addEventListener("showWalletSelector-nah", (e) => {
    const wallets = e.detail.wallets;
    const selector = document.createElement("div");
    selector.className = "wallet-selector";
    selector.innerHTML = `
        <div class="wallet-selector-content">
            <h3>Select Wallet</h3>
            ${wallets
                .map(
                    (wallet) => `
                <button class="wallet-btn ${wallet}-btn" onclick="window.walletManager.connect('${wallet}')">
                    <img src="icons/${wallet}.png" alt="${wallet}">
                    ${wallet.charAt(0).toUpperCase() + wallet.slice(1)}
                </button>
            `,
                )
                .join("")}
        </div>
    `;
    document.body.appendChild(selector);
});

// Initialize wallet
function initializeWallet(network = "mainnet-beta") {
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

// Example usage:
initializeWallet("testnet"); // or 'testnet' or 'mainnet-beta'
// initializeWallet(); // defaults to mainnet-beta
