// Base Scene with common functionality
class BaseScene extends Phaser.Scene {
    constructor(key) {
        super({ key });
        this.backKey = null;
        this.backButton = null;
    }

    createBackButton() {
        // Create a back button for mobile
        this.backButton = this.add.text(50, 50, '←', {
            fontFamily: 'Comic',
            fontSize: '48px',
            color: '#ffffff',
            backgroundColor: '#8B4513',
            padding: { x: 15, y: 5 }
        }).setInteractive();
        
        this.backButton.on('pointerdown', () => this.handleBackAction());
        
        // Set up keyboard back listeners
        this.backKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.backKey.on('down', () => this.handleBackAction());
        
        // Also listen for backspace
        this.input.keyboard.on('keydown-BACKSPACE', () => this.handleBackAction());
    }

    handleBackAction() {
        // To be overridden by child scenes
    }

    fadeToScene(sceneKey, data = {}) {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start(sceneKey, data);
        });
    }
}
