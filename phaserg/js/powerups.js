class PowerupManager {
    constructor(scene) {
        this.scene = scene;
        this.availablePowerups = {
            "Cup of Coffee": {
                description: "Max stamina +50% (Caffeine boost!)",
                icon: "coffee_cup",
                apply: (player) => {
                    player.maxStamina = (player.maxStamina || 100) * 1.5;
                    if (player.staminaBar) {
                        player.staminaBar.maxWidth = (player.staminaBar.maxWidth || 200) * 1.5;
                    }
                }
            },
            "Lucky Clover": {
                description: "Every 3rd click gives 3× points",
                icon: "lucky_clover",
                apply: (player) => {
                    player.luckyInterval = 3;
                    player.clickCount = 0;
                }
            },
            "Sharp Pickaxe": {
                description: "+50% points but stamina drains 2× faster",
                icon: "sharp_pick",
                apply: (player) => {
                    player.pointsMultiplier = (player.pointsMultiplier || 1) * 1.5;
                    player.staminaDrainRate = (player.staminaDrainRate || 1) * 2;
                }
            },
            "Efficient Clicker": {
                description: "Clicks use 60% less stamina",
                icon: "click_glove",
                apply: (player) => {
                    player.staminaCost = (player.staminaCost || 5) * 0.4;
                }
            },
            "Toxic Hand": {
                description: "Deal poison damage over time",
                icon: "toxic_hand",
                apply: (player) => {
                    player.onHit = (target) => {
                        if (target.addPoison) target.addPoison(3);
                    };
                }
            },
            "Monster Repellant": {
                description: "Immune to negative mode effects",
                icon: "monster_spray",
                apply: (player) => {
                    player.negativeModeImmune = true;
                }
            },
            "Forbidden Technique": {
                description: "3× damage but lose 1 HP per click",
                icon: "forbidden_scroll",
                apply: (player) => {
                    player.damageMultiplier = (player.damageMultiplier || 1) * 3;
                    player.onClick = () => {
                        player.hp = (player.hp || 100) - 1;
                    };
                }
            },
            "Final Countdown": {
                description: "Last 5 seconds: 2× points!",
                icon: "stopwatch",
                apply: (player) => {
                    player.endgameMultiplier = 2;
                }
            },
            "Trash Gambler": {
                description: "50% chance: 4× or 0 points",
                icon: "dice",
                apply: (player) => {
                    player.calculatePoints = (base) => Math.random() < 0.5 ? base * 4 : 0;
                }
            },
            "Berserk Tapper": {
                description: "Lower stamina = more damage (1-4×)",
                icon: "berserker_finger",
                apply: (player) => {
                    player.getDamageMultiplier = () => 1 + (3 * (1 - (player.stamina || 100) / 100));
                }
            },
            "Hit or Miss": {
                description: "Crits: 3× | Normal: 0.7×",
                icon: "hit_or_miss",
                apply: (player) => {
                    player.critMultiplier = 3;
                    player.normalMultiplier = 0.7;
                }
            },
            "Trash King": {
                description: "Earn 1% of score every 3s",
                icon: "trash_crown",
                apply: (player) => {
                    player.passiveIncome = player.scene.time.addEvent({
                        delay: 3000,
                        callback: () => {
                            const currentScore = parseInt(player.scoreText?.text || "0");
                            player.scoreText?.setText(currentScore + Math.floor(currentScore * 0.01));
                        },
                        loop: true
                    });
                }
            },
            "Sugar Cubes": {
                description: "Stamina >80%: 1.8× speed",
                icon: "sugar",
                apply: (player) => {
                    player.speedBoostThreshold = 80;
                    player.speedMultiplier = 1.8;
                }
            },
            "Golden Touch": {
                description: "Golden trash gives 3× points",
                icon: "golden_hand",
                apply: (player) => {
                    player.goldenMultiplier = 3;
                }
            }
        };
        
        this.usedPowerups = [];
        this.powerupKeys = Object.keys(this.availablePowerups);
        this.generatePredeterminedOrder();
    }
    
    generatePredeterminedOrder() {
        // Create a shuffled copy of all powerups
        this.predeterminedOrder = Phaser.Utils.Array.Shuffle([...this.powerupKeys]);
    }
    
    getRandomPowerups(count) {
        // Get the next 'count' powerups from predetermined order
        const selected = this.predeterminedOrder.slice(0, count);
        
        // Remove them from the queue so they won't be selected again
        this.predeterminedOrder = this.predeterminedOrder.slice(count);
        
        // If we run out, regenerate the order
        if (this.predeterminedOrder.length === 0) {
            this.generatePredeterminedOrder();
        }
        
        return selected;
    }
    
    preloadPowerupIcons() {
        for (const powerupName in this.availablePowerups) {
            const iconName = this.availablePowerups[powerupName].icon;
            try {
                this.scene.load.image(
                    `${iconName}`,
                    `assets/powerups/${iconName}.png`
                );
            } catch (e) {
                console.error(`Failed to load ${iconName}:`, e);
            }
        }
    }
    
    getPowerup(key) {
        return this.availablePowerups[key] || {
            name: key,
            description: "Unknown powerup",
            icon: "unknown",
            apply: () => {}
        };
    }
    
    reset() {
        this.usedPowerups = [];
    }
}
