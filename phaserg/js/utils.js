

function initializeSeedrandom(seed) {
    // Check if seedrandom is available
    if (typeof Math.seedrandom !== 'function') {
        console.error('seedrandom.js not loaded - please include the library');
        return false;
    }
    
    try {
        // Try both constructor styles
        const rng = new Math.seedrandom(seed);
        return rng;
    } catch (e) {
        try {
            // Fallback to non-constructor usage
            Math.seedrandom(seed);
            return Math.random; // Return the seeded random function
        } catch (e) {
            console.error('Failed to initialize seedrandom:', e);
            return false;
        }
    }
}
/**
 * Returns a Phaser-compatible color value from color names
 * @param {string} colorName - Name of the color (e.g., "red", "blue", "gold")
 * @returns {number} Phaser color integer
 */


function getColor(colorName) {
    const colors = {
        // Primary colors (toned down)
        red: 0xE57373,      // Soft red
        blue: 0x64B5F6,     // Light blue
        yellow: 0xFFF176,   // Pale yellow
        
        // Secondary colors
        green: 0x81C784,    // Muted green
        orange: 0xFFB74D,   // Warm orange
        purple: 0xBA68C8,   // Soft purple
        
        // Special colors
        gold: 0xFFD166,     // Rich but not fluorescent
        silver: 0xC0C0C0,   // Neutral silver
        toxic: 0x76FF03,    // Slightly muted toxic green
        midnight: 0x394867, // Dark blue
        
        // Default fallback
        default: 0xFFA500   // Pleasant orange
    };

    return colors[colorName.toLowerCase()] || colors.default;
}
/**
 * Creates a configurable particle effect
 * @param {Phaser.Scene} scene - Current game scene
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {object} config - Configuration options
 * @returns {Phaser.GameObjects.Particles.ParticleEmitter}
 */
function createParticles(scene, x, y, config = {}) {
    const {
        texture = 'spark',
        color = 'orange',
        scale = { start: 0.5, end: 0 },
        speed = 100,
        lifespan = 1000,
        quantity = 10,
        blendMode = 'ADD',
        gravityY = 0,
        radial = false
    } = config;

    const particles = scene.add.particles(texture);
    const colorValue = typeof color === 'string' ? getColor(color) : color;

    return particles.createEmitter({
        x: x,
        y: y,
        scale: scale,
        speed: radial ? { min: -speed, max: speed } : speed,
        angle: radial ? { min: 0, max: 360 } : 270,
        lifespan: lifespan,
        quantity: quantity,
        blendMode: blendMode,
        gravityY: gravityY,
        tint: colorValue,
        // Advanced options with defaults:
        alpha: { start: 1, end: 0 },
        rotate: { min: 0, max: 360 },
        frequency: -1 // Single burst
    });
}

/**
 * Adds a border to an existing Phaser.Graphics shape
 * @param {Phaser.GameObjects.Graphics} graphics - Pre-configured Graphics object
 * @param {number} borderWidth - Border thickness in pixels
 * @param {number|string} borderColor - Color value or name (default: 0x000000)
 * @param {object} options - Additional settings
 * @param {number} [options.cornerRadius=0] - Rounded corners radius
 * @param {number} [options.alpha=1] - Border transparency
 * @param {boolean} [options.overwrite=true] - Clear existing drawings
 */
function addBorder(graphics, borderWidth=4, borderColor = 0x000000, options = {}) {
    const {
        cornerRadius = 0,
        alpha = 1,
        overwrite = false
    } = options;

    // Convert color name to value if needed
    const borderColorValue = typeof borderColor === 'string' ? 
        getColor(borderColor) : borderColor;

    if (overwrite) graphics.clear();

    // Get bounds of existing rectangle
    const bounds = graphics.geom?.bounds;
    if (!bounds) {
        console.warn("No rectangle drawn on graphics object!");
        return;
    }

    // Draw border
    graphics.lineStyle(borderWidth, borderColorValue, alpha);
    
    if (cornerRadius > 0) {
        // Rounded rectangle border
        graphics.strokeRoundedRect(
            bounds.x - borderWidth/2,
            bounds.y - borderWidth/2,
            bounds.width + borderWidth,
            bounds.height + borderWidth,
            cornerRadius + borderWidth/2
        );
    } else {
        // Sharp rectangle border
        graphics.strokeRect(
            bounds.x - borderWidth/2,
            bounds.y - borderWidth/2,
            bounds.width + borderWidth,
            bounds.height + borderWidth
        );
    }

    return graphics;
}
// Add glow effect
function addGlowBorder(graphics, thickness, color, blur = 10) {
    const glow = this.add.graphics();
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.fillStyle(color, 0.3);
    glow.fillRoundedRect(
        bounds.x - thickness - blur,
        bounds.y - thickness - blur,
        bounds.width + 2*(thickness + blur),
        bounds.height + 2*(thickness + blur),
        cornerRadius + thickness + blur
    );
    return glow;
}

/**
 * Adds an animated pulsating border to a Graphics object
 * @param {Phaser.Scene} scene - Current scene
 * @param {Phaser.GameObjects.Graphics} graphics - Target graphics object
 * @param {number} baseWidth - Base border width
 * @param {number|string} color - Border color
 * @param {object} options - Animation settings
 * @param {number} [options.speed=1.5] - Pulse speed (cycles per second)
 * @param {number} [options.variance=2] - Width variance from base
 * @param {number} [options.cornerRadius=0] - Rounded corners
 * @param {number} [options.alpha=1] - Border opacity
 * @returns {Phaser.Tweens.Tween} The animation tween
 */
function addAnimatedBorder(scene, graphics, baseWidth, color, options = {}) {
    const {
        speed = 1.5,
        variance = 2,
        cornerRadius = 0,
        alpha = 1
    } = options;

    const colorValue = typeof color === 'string' ? getColor(color) : color;
    let currentWidth = baseWidth;

    // Store original draw commands
    const bounds = graphics.geom?.bounds;
    if (!bounds) {
        console.warn("No shape detected on graphics object");
        return null;
    }

    return scene.tweens.add({
        targets: { width: baseWidth },
        width: baseWidth + variance,
        duration: (1000 / speed) * 0.5,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: function(tween) {
            graphics.clear();
            graphics.lineStyle(currentWidth, colorValue, alpha);
            
            if (cornerRadius > 0) {
                graphics.strokeRoundedRect(
                    bounds.x - currentWidth/2,
                    bounds.y - currentWidth/2,
                    bounds.width + currentWidth,
                    bounds.height + currentWidth,
                    cornerRadius + currentWidth/2
                );
            } else {
                graphics.strokeRect(
                    bounds.x - currentWidth/2,
                    bounds.y - currentWidth/2,
                    bounds.width + currentWidth,
                    bounds.height + currentWidth
                );
            }
            
            currentWidth = tween.getValue();
        }
    });
}

/**
 * Adds an animated border with grow-in capability
 * @param {Phaser.Scene} scene 
 * @param {Phaser.GameObjects.Graphics} graphics 
 * @param {number|string} color 
 * @param {object} options 
 * @returns {Phaser.Tweens.Tween} Animation tween
 */

function addBorderIn(scene, graphics, color, options = {}) {
    const {
        baseWidth = 4,
        pulseSpeed = 1.5,
        pulseVariance = 2,
        growDuration = 1000,
        cornerRadius = 0,
        alpha = 1,
        overwrite = true
    } = options;

    const colorValue = typeof color === 'string' ? getColor(color) : color;
    const bounds = graphics.geom?.bounds;

    if (!bounds) {
        console.warn("No shape detected for border animation");
        return null;
    }

    // Phase 1: Grow-in animation
    const growTween = scene.tweens.add({
        targets: { width: 0 },
        width: baseWidth,
        duration: growDuration,
        ease: 'Back.out',
        onUpdate: function(tween) {
            if (overwrite) graphics.clear();
            const currentWidth = tween.getValue();
            
            graphics.lineStyle(currentWidth, colorValue, alpha);
            if (cornerRadius > 0) {
                graphics.strokeRoundedRect(
                    bounds.x - currentWidth/2,
                    bounds.y - currentWidth/2,
                    bounds.width + currentWidth,
                    bounds.height + currentWidth,
                    cornerRadius + currentWidth/2
                );
            } else {
                graphics.strokeRect(
                    bounds.x - currentWidth/2,
                    bounds.y - currentWidth/2,
                    bounds.width + currentWidth,
                    bounds.height + currentWidth
                );
            }
        },
        onComplete: () => {
            // Phase 2: Continuous pulse after grow-in
            if (pulseVariance > 0) {
                scene.tweens.add({
                    targets: { width: baseWidth },
                    width: baseWidth + pulseVariance,
                    duration: (1000 / pulseSpeed) * 0.5,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    onUpdate: function(tween) {
                        if (overwrite) graphics.clear();
                        const currentWidth = tween.getValue();
                        
                        graphics.lineStyle(currentWidth, colorValue, alpha);
                        if (cornerRadius > 0) {
                            graphics.strokeRoundedRect(
                                bounds.x - currentWidth/2,
                                bounds.y - currentWidth/2,
                                bounds.width + currentWidth,
                                bounds.height + currentWidth,
                                cornerRadius + currentWidth/2
                            );
                        } else {
                            graphics.strokeRect(
                                bounds.x - currentWidth/2,
                                bounds.y - currentWidth/2,
                                bounds.width + currentWidth,
                                bounds.height + currentWidth
                            );
                        }
                    }
                });
            }
        }
    });

    return growTween;
}
/**
 * Adds an animated glowing border with grow-in effect
 * @param {Phaser.Scene} scene 
 * @param {Phaser.GameObjects.Graphics|Phaser.GameObjects.Sprite} target 
 * @param {number|string} color 
 * @param {object} options 
 * @returns {Object} { glow: Graphics, tween: Tween }
 */
 
 function addAnimatedBorderIn(scene, graphics, color, options = {}) {
    options.pulseVariance = 0
    return addBorderIn(scene, graphics, color, options);
}


function addGlowBorderIn(scene, target, color, options = {}) {
    const {
        thickness = 10,
        intensity = 0.3,
        blur = 5,
        cornerRadius = 0,
        growDuration = 800,
        pulseSpeed = 1.2,
        pulseVariance = 3
    } = options;

    const colorValue = typeof color === 'string' ? getColor(color) : color;
    const glow = scene.add.graphics();
    glow.setBlendMode(Phaser.BlendModes.ADD);

    let currentThickness = 0;
    let currentIntensity = 0;

    function updateGlow() {
        glow.clear();
        
        const bounds = target.geom?.bounds || target.getBounds();
        const effectiveThickness = currentThickness + blur;
        
        glow.fillStyle(colorValue, currentIntensity);
        
        if (cornerRadius > 0) {
            glow.fillRoundedRect(
                bounds.x - effectiveThickness,
                bounds.y - effectiveThickness,
                bounds.width + 2*effectiveThickness,
                bounds.height + 2*effectiveThickness,
                cornerRadius + effectiveThickness
            );
        } else {
            glow.fillRect(
                bounds.x - effectiveThickness,
                bounds.y - effectiveThickness,
                bounds.width + 2*effectiveThickness,
                bounds.height + 2*effectiveThickness
            );
        }
    }

    // Grow-in animation
    const growTween = scene.tweens.add({
        targets: { t: 0, i: 0 },
        t: thickness,
        i: intensity,
        duration: growDuration,
        ease: 'Cubic.out',
        onUpdate: function(tween) {
            currentThickness = tween.getValue("t");
            currentIntensity = tween.getValue("i");
            updateGlow();
        },
        onComplete: () => {
            // Continuous pulse
            if (pulseVariance > 0) {
                scene.tweens.add({
                    targets: { t: thickness },
                    t: thickness + pulseVariance,
                    duration: (1000 / pulseSpeed) * 0.5,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    onUpdate: function(tween) {
                        currentThickness = tween.getValue();
                        updateGlow();
                    }
                });
            }
        }
    });

    // Auto-update position
    scene.events.on('update', updateGlow);
    glow.setDepth(target.depth - 1);

    return { glow, tween: growTween };
}
/**
 * Returns a Phaser-compatible color value from color names
 * @param {string} colorName - Name of the color (e.g., "red", "blue", "gold")
 * @returns {number} Phaser color integer
 */
function getColor(colorName) {
    const colors = {
        // Primary colors (toned down)
        red: 0xE57373,      // Soft red
        blue: 0x64B5F6,     // Light blue
        yellow: 0xFFF176,   // Pale yellow
        
        // Secondary colors
        green: 0x81C784,    // Muted green
        orange: 0xFFB74D,   // Warm orange
        purple: 0xBA68C8,   // Soft purple
        
        // Special colors
        gold: 0xFFD166,     // Rich but not fluorescent
        silver: 0xC0C0C0,   // Neutral silver
        toxic: 0x76FF03,    // Slightly muted toxic green
        midnight: 0x394867, // Dark blue
        
        // Default fallback
        default: 0xFFA500   // Pleasant orange
    };

    return colors[colorName.toLowerCase()] || colors.default;
}/**
 * Creates a configurable particle effect (Phaser 3.60+ compatible)
 * @param {Phaser.Scene} scene - Current game scene
 * @param {number} x - X position 
 * @param {number} y - Y position
 * @param {object} config - Configuration options
 * @returns {Phaser.GameObjects.Particles.ParticleEmitter}
 */
function createParticles(scene, x, y, config = {}) {
    const {
        texture = 'spark',
        color = 'orange',
        scale = { start: 0.5, end: 0 },
        speed = 100,
        lifespan = 1000,
        quantity = 10,
        blendMode = 'ADD',
        gravityY = 0,
        radial = false,
        alpha = { start: 1, end: 0 },
        rotate = { min: 0, max: 360 },
        frequency = -1
    } = config;

    const colorValue = typeof color === 'string' ? getColor(color) : color;

    // New Phaser 3.60+ particle creation syntax
    const emitter = scene.add.particles(x, y, texture, {
        speed: radial ? { min: -speed, max: speed } : speed,
        angle: radial ? { min: 0, max: 360 } : 270,
        scale: scale,
        lifespan: lifespan,
        quantity: quantity,
        blendMode: blendMode,
        gravityY: gravityY,
        tint: colorValue,
        alpha: alpha,
        rotate: rotate,
        frequency: frequency,
        emitZone: frequency === -1 ? null : undefined // Handle single burst
    });

    // For single burst effects
    if (frequency === -1) {
        emitter.explode(quantity, x, y);
    }

    return emitter;
}

/**
 * Adds a border to an existing Phaser.Graphics shape
 * @param {Phaser.GameObjects.Graphics} graphics - Pre-configured Graphics object
 * @param {number} borderWidth - Border thickness in pixels
 * @param {number|string} borderColor - Color value or name (default: 0x000000)
 * @param {object} options - Additional settings
 * @param {number} [options.cornerRadius=0] - Rounded corners radius
 * @param {number} [options.alpha=1] - Border transparency
 * @param {boolean} [options.overwrite=true] - Clear existing drawings
 */
function addBorder(graphics, borderWidth, borderColor = 0x000000, options = {}) {
    const {
        cornerRadius = 0,
        alpha = 1,
        overwrite = true
    } = options;

    // Convert color name to value if needed
    const borderColorValue = typeof borderColor === 'string' ? 
        getColor(borderColor) : borderColor;

    if (overwrite) graphics.clear();

    // Get bounds of existing rectangle
    const bounds = graphics.geom?.bounds;
    if (!bounds) {
        console.warn("No rectangle drawn on graphics object!");
        return;
    }

    // Draw border
    graphics.lineStyle(borderWidth, borderColorValue, alpha);
    
    if (cornerRadius > 0) {
        // Rounded rectangle border
        graphics.strokeRoundedRect(
            bounds.x - borderWidth/2,
            bounds.y - borderWidth/2,
            bounds.width + borderWidth,
            bounds.height + borderWidth,
            cornerRadius + borderWidth/2
        );
    } else {
        // Sharp rectangle border
        graphics.strokeRect(
            bounds.x - borderWidth/2,
            bounds.y - borderWidth/2,
            bounds.width + borderWidth,
            bounds.height + borderWidth
        );
    }

    return graphics;
}
// Add glow effect
function addGlowBorder(graphics, thickness, color, blur = 10) {
    const glow = this.add.graphics();
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.fillStyle(color, 0.3);
    glow.fillRoundedRect(
        bounds.x - thickness - blur,
        bounds.y - thickness - blur,
        bounds.width + 2*(thickness + blur),
        bounds.height + 2*(thickness + blur),
        cornerRadius + thickness + blur
    );
    return glow;
}

/**
 * Adds an animated pulsating border to a Graphics object
 * @param {Phaser.Scene} scene - Current scene
 * @param {Phaser.GameObjects.Graphics} graphics - Target graphics object
 * @param {number} baseWidth - Base border width
 * @param {number|string} color - Border color
 * @param {object} options - Animation settings
 * @param {number} [options.speed=1.5] - Pulse speed (cycles per second)
 * @param {number} [options.variance=2] - Width variance from base
 * @param {number} [options.cornerRadius=0] - Rounded corners
 * @param {number} [options.alpha=1] - Border opacity
 * @returns {Phaser.Tweens.Tween} The animation tween
 */
function addAnimatedBorder(scene, graphics, baseWidth, color, options = {}) {
    const {
        speed = 1.5,
        variance = 2,
        cornerRadius = 0,
        alpha = 1
    } = options;

    const colorValue = typeof color === 'string' ? getColor(color) : color;
    let currentWidth = baseWidth;

    // Store original draw commands
    const bounds = graphics.geom?.bounds;
    if (!bounds) {
        console.warn("No shape detected on graphics object");
        return null;
    }

    return scene.tweens.add({
        targets: { width: baseWidth },
        width: baseWidth + variance,
        duration: (1000 / speed) * 0.5,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: function(tween) {
            graphics.clear();
            graphics.lineStyle(currentWidth, colorValue, alpha);
            
            if (cornerRadius > 0) {
                graphics.strokeRoundedRect(
                    bounds.x - currentWidth/2,
                    bounds.y - currentWidth/2,
                    bounds.width + currentWidth,
                    bounds.height + currentWidth,
                    cornerRadius + currentWidth/2
                );
            } else {
                graphics.strokeRect(
                    bounds.x - currentWidth/2,
                    bounds.y - currentWidth/2,
                    bounds.width + currentWidth,
                    bounds.height + currentWidth
                );
            }
            
            currentWidth = tween.getValue();
        }
    });
}

/**
 * Adds an animated border with grow-in capability
 * @param {Phaser.Scene} scene 
 * @param {Phaser.GameObjects.Graphics} graphics 
 * @param {number|string} color 
 * @param {object} options 
 * @returns {Phaser.Tweens.Tween} Animation tween
 */

function addBorderIn(scene, graphics, color, options = {}) {
    const {
        baseWidth = 4,
        pulseSpeed = 1.5,
        pulseVariance = 2,
        growDuration = 1000,
        cornerRadius = 0,
        alpha = 1,
        overwrite = true
    } = options;

    const colorValue = typeof color === 'string' ? getColor(color) : color;
    const bounds = graphics.geom?.bounds;

    if (!bounds) {
        console.warn("No shape detected for border animation");
        return null;
    }

    // Phase 1: Grow-in animation
    const growTween = scene.tweens.add({
        targets: { width: 0 },
        width: baseWidth,
        duration: growDuration,
        ease: 'Back.out',
        onUpdate: function(tween) {
            if (overwrite) graphics.clear();
            const currentWidth = tween.getValue();
            
            graphics.lineStyle(currentWidth, colorValue, alpha);
            if (cornerRadius > 0) {
                graphics.strokeRoundedRect(
                    bounds.x - currentWidth/2,
                    bounds.y - currentWidth/2,
                    bounds.width + currentWidth,
                    bounds.height + currentWidth,
                    cornerRadius + currentWidth/2
                );
            } else {
                graphics.strokeRect(
                    bounds.x - currentWidth/2,
                    bounds.y - currentWidth/2,
                    bounds.width + currentWidth,
                    bounds.height + currentWidth
                );
            }
        },
        onComplete: () => {
            // Phase 2: Continuous pulse after grow-in
            if (pulseVariance > 0) {
                scene.tweens.add({
                    targets: { width: baseWidth },
                    width: baseWidth + pulseVariance,
                    duration: (1000 / pulseSpeed) * 0.5,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    onUpdate: function(tween) {
                        if (overwrite) graphics.clear();
                        const currentWidth = tween.getValue();
                        
                        graphics.lineStyle(currentWidth, colorValue, alpha);
                        if (cornerRadius > 0) {
                            graphics.strokeRoundedRect(
                                bounds.x - currentWidth/2,
                                bounds.y - currentWidth/2,
                                bounds.width + currentWidth,
                                bounds.height + currentWidth,
                                cornerRadius + currentWidth/2
                            );
                        } else {
                            graphics.strokeRect(
                                bounds.x - currentWidth/2,
                                bounds.y - currentWidth/2,
                                bounds.width + currentWidth,
                                bounds.height + currentWidth
                            );
                        }
                    }
                });
            }
        }
    });

    return growTween;
}
/**
 * Adds an animated glowing border with grow-in effect
 * @param {Phaser.Scene} scene 
 * @param {Phaser.GameObjects.Graphics|Phaser.GameObjects.Sprite} target 
 * @param {number|string} color 
 * @param {object} options 
 * @returns {Object} { glow: Graphics, tween: Tween }
 */
 
 function addAnimatedBorderIn(scene, graphics, color, options = {}) {
    options.pulseVariance = 0
    return addBorderIn(scene, graphics, color, options);
}


function addGlowBorderIn(scene, target, color, options = {}) {
    const {
        thickness = 10,
        intensity = 0.3,
        blur = 5,
        cornerRadius = 0,
        growDuration = 800,
        pulseSpeed = 1.2,
        pulseVariance = 3
    } = options;

    const colorValue = typeof color === 'string' ? getColor(color) : color;
    const glow = scene.add.graphics();
    glow.setBlendMode(Phaser.BlendModes.ADD);

    let currentThickness = 0;
    let currentIntensity = 0;

    function updateGlow() {
        glow.clear();
        
        const bounds = target.geom?.bounds || target.getBounds();
        const effectiveThickness = currentThickness + blur;
        
        glow.fillStyle(colorValue, currentIntensity);
        
        if (cornerRadius > 0) {
            glow.fillRoundedRect(
                bounds.x - effectiveThickness,
                bounds.y - effectiveThickness,
                bounds.width + 2*effectiveThickness,
                bounds.height + 2*effectiveThickness,
                cornerRadius + effectiveThickness
            );
        } else {
            glow.fillRect(
                bounds.x - effectiveThickness,
                bounds.y - effectiveThickness,
                bounds.width + 2*effectiveThickness,
                bounds.height + 2*effectiveThickness
            );
        }
    }

    // Grow-in animation
    const growTween = scene.tweens.add({
        targets: { t: 0, i: 0 },
        t: thickness,
        i: intensity,
        duration: growDuration,
        ease: 'Cubic.out',
        onUpdate: function(tween) {
            currentThickness = tween.getValue("t");
            currentIntensity = tween.getValue("i");
            updateGlow();
        },
        onComplete: () => {
            // Continuous pulse
            if (pulseVariance > 0) {
                scene.tweens.add({
                    targets: { t: thickness },
                    t: thickness + pulseVariance,
                    duration: (1000 / pulseSpeed) * 0.5,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut',
                    onUpdate: function(tween) {
                        currentThickness = tween.getValue();
                        updateGlow();
                    }
                });
            }
        }
    });

    // Auto-update position
    scene.events.on('update', updateGlow);
    glow.setDepth(target.depth - 1);

    return { glow, tween: growTween };
}
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  
function eliminateFromList(list, seed) {
    if (!Array.isArray(list) || list.length === 0) {
        throw new Error('Input must be a non-empty array');
    }

    // Create seeded RNG
    const rng = new Math.seedrandom(seed);
    const randomIndex = Math.floor(rng() * list.length);
    
    return list.splice(randomIndex, 1)[0];
}

  
  
  function seededShuffle(array, seed) {
      let rng = initializeSeedrandom(seed);
      let m = array.length, t, i;
  
      while (m) {
          i = Math.floor(rng() * m--);
          t = array[m];
          array[m] = array[i];
          array[i] = t;
      }
  
      return array;
  }
