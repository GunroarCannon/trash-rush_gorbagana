class GameObject {
    constructor(scene, x, y, texture, frame) {
        this.scene = scene;
        this.sprite = scene.add.image(x, y, texture);
        this.setInteractive();
    }

    setPosition(x, y) {
        this.sprite.setPosition(x, y);
        return this;
    }

    setScale(scale) {
        this.sprite.setScale(scale);
        return this;
    }

    setAlpha(alpha) {
        this.sprite.setAlpha(alpha);
        return this;
    }

    setInteractive() {
        this.sprite.setInteractive();
        return this;
    }

    setOrigin(x, y) {
        this.sprite.setOrigin(x, y);
        return this;
    }

    destroy() {
        this.sprite.destroy();
    }

    // Add more common methods as needed
}