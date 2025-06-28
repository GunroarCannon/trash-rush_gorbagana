/* USE:
// Single image
const player = new SpriteGroup(this, 100, 100, "player");
player.setScale(0.5).fadeIn();

// Multi-layer object
const enemy = new SpriteGroup(this, 200, 200, ["enemy_shadow", "enemy_body", "enemy_armor"]);
enemy.setMainLayer(1)  // Make body the main reference
     .setWidth(80)     // Scale all layers proportionally
     .tweenTo(300, 400);

// Dynamic layer management
enemy.addLayer("enemy_weapon", 10, true)  // Add new top layer
     .setLayerTexture(0, "enemy_shadow_dark");  // Modify shadow only
*/

class SpriteGroup {
    constructor(scene, x = 0, y = 0, texture) {
        this.scene = scene;
        this._layers = [];
        this._mainIndex = 0; // Tracks which layer is considered "main"
        
        // Handle both array and single texture input
        const textures = Array.isArray(texture) ? texture : [texture];
        
        // Create initial layers
        textures.forEach(tex => {
            if (tex) this.addLayer(tex);
        });
        
        // Set initial position
        this.setPosition(x, y);
    }
    
    // ======================
    // Core Layer Management
    // ======================
    addLayer(texture, depth = this._layers.length, isMain = false) {
        const img = this.scene.add.image(0, 0, texture);
        img.setDepth(depth);
        this._layers.push(img);
        
        if (isMain || this._layers.length === 1) {
            this._mainIndex = this._layers.length - 1;
        }
        
        this._updatePosition();
        return this;
    }
    
    removeLayer(index) {
        if (index >= 0 && index < this._layers.length) {
            this._layers[index].destroy();
            this._layers.splice(index, 1);
            if (this._mainIndex >= index && this._mainIndex > 0) {
                this._mainIndex--;
            }
        }
        return this;
    }
    
    setMainLayer(index) {
        if (index >= 0 && index < this._layers.length) {
            this._mainIndex = index;
        }
        return this;
    }
    
    // ======================
    // Aliases and References
    // ======================
    get img() { return this._layers[this._mainIndex]; }
    get source() { return this.img; }
    get sprite() { return this.img; }
    get top() { return this._layers[this._layers.length - 1]; }
    get first() { return this._layers[0]; }
    
    // ======================
    // Position and Size
    // ======================
    get x() { return this._layers[0]?.x || 0; }
    get y() { return this._layers[0]?.y || 0; }
    
    set x(value) { this.setX(value); }
    set y(value) { this.setY(value); }
    
    get width() { return this.img.displayWidth; }
    get height() { return this.img.displayHeight; }
    
    setWidth(width) {
        const scale = width / this.img.width;
        this.setScale(scale);
        return this;
    }
    
    setHeight(height) {
        const scale = height / this.img.height;
        this.setScale(undefined, scale);
        return this;
    }
    
    setDisplaySize(width, height) {
        this._layers.forEach(layer => layer.setDisplaySize(width, height));
        return this;
    }
    
    // ======================
    // Transformations (affect all layers)
    // ======================
    setPosition(x, y) {
        this._targetX = x;
        this._targetY = y;
        this._updatePosition();
        return this;
    }
    
    setX(x) {
        this._targetX = x;
        this._updatePosition();
        return this;
    }
    
    setY(y) {
        this._targetY = y;
        this._updatePosition();
        return this;
    }
    
    setScale(x, y = x) {
        this._layers.forEach(layer => {
            const newX = x !== undefined ? x : layer.scaleX;
            const newY = y !== undefined ? y : layer.scaleY;
            layer.setScale(newX, newY);
        });
        return this;
    }
    
    // ======================
    // Visual Properties
    // ======================
    setTexture(texture, frame) {
        this.img.setTexture(texture, frame);
        return this;
    }
    
    setLayerTexture(index, texture, frame) {
        if (this._layers[index]) {
            this._layers[index].setTexture(texture, frame);
        }
        return this;
    }
    
    setAlpha(alpha) {
        this._layers.forEach(layer => layer.setAlpha(alpha));
        return this;
    }
    
    setVisible(visible) {
        this._layers.forEach(layer => layer.setVisible(visible));
        return this;
    }
    
    // ======================
    // Animation and Effects
    // ======================
    tweenTo(x, y, duration = 1000, ease = 'Linear', onComplete) {
        this.scene.tweens.add({
            targets: this._layers,
            x,
            y,
            duration,
            ease,
            onComplete
        });
        return this;
    }
    
    fadeIn(duration = 1000) {
        this.setAlpha(0);
        this.scene.tweens.add({
            targets: this._layers,
            alpha: 1,
            duration
        });
        return this;
    }
    
    // ======================
    // Timing and Utilities
    // ======================
    after(time, callback) {
        this.scene.time.delayedCall(time, callback, [], this);
        return this;
    }
    
    every(time, callback, repeat = -1) {
        const event = this.scene.time.addEvent({
            delay: time,
            callback,
            callbackScope: this,
            loop: true,
            repeat
        });
        return () => event.destroy();
    }
    
    destroy() {
        this._layers.forEach(layer => layer.destroy());
        this._layers = [];
    }
    
    // ======================
    // Internal Helpers
    // ======================
    _updatePosition() {
        this._layers.forEach(layer => {
            layer.x = this._targetX || layer.x;
            layer.y = this._targetY || layer.y;
        });
    }
}