class WalletManager {
    constructor() {
        this.wallet = null;
        this.publicKey = null;
        this.connected = false;
        this.initWallet();
    }

    initWallet() {
        // Check if wallet adapters are loaded
        if (!window.solanaWallets || !window.solanaWallets.BackpackWalletAdapter) {
            console.error('Wallet adapters not loaded properly');
            return;
        }

        // Initialize Backpack wallet
        this.wallet = new window.solanaWallets.BackpackWalletAdapter();
        
        // Set up event listeners
        this.wallet.on('connect', (publicKey) => {
            console.log('Connected to wallet:', publicKey.toString());
            this.publicKey = publicKey;
            this.connected = true;
            this.updateUI();
        });

        this.wallet.on('disconnect', () => {
            console.log('Disconnected from wallet');
            this.publicKey = null;
            this.connected = false;
            this.updateUI();
        });

        // Set up connect button
        document.getElementById('connectWallet').addEventListener('click', async () => {
            if (!this.connected) {
                await this.connect();
            } else {
                await this.disconnect();
            }
        });

        this.updateUI();
    }

    async connect() {
        try {
            await this.wallet.connect();
        } catch (error) {
            console.error('Connection error:', error);
            alert('Failed to connect wallet: ' + error.message);
        }
    }

    async disconnect() {
        try {
            await this.wallet.disconnect();
        } catch (error) {
            console.error('Disconnection error:', error);
        }
    }

    updateUI() {
        const btn = document.getElementById('connectWallet');
        if (this.connected && this.publicKey) {
            const fullKey = this.publicKey.toString();
            const shortKey = `${fullKey.substring(0, 4)}...${fullKey.substring(fullKey.length - 4)}`;
            btn.textContent = shortKey;
            btn.style.backgroundColor = '#4CAF50';
        } else {
            btn.textContent = 'Connect Backpack';
            btn.style.backgroundColor = '#8B4513';
        }
    }

    async signTransaction(transaction) {
        if (!this.connected) {
            throw new Error('Wallet not connected');
        }
        return await this.wallet.signTransaction(transaction);
    }

    async signMessage(message) {
        if (!this.connected) {
            throw new Error('Wallet not connected');
        }
        return await this.wallet.signMessage(new TextEncoder().encode(message));
    }
}

// Wait for all scripts to load
window.addEventListener('load', () => {
    window.walletManager = new WalletManager();
});