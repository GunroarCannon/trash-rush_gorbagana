// SoundManager.js
class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.currentMusic = null;
        this.currentRoundMusic = null;
        this.musicVolume = 0.5;
        this.soundVolume = 1.0;
        this.roundMusicTracks = [
            'lofihiphop',
            'dirty_',
            'jazzy_battle_theme'
        ];
        
        // Convert background colors to Phaser hex format
        this.backgroundColors = [
            0xD61A40, // #FFD61A40 (alpha removed)
            0x5FAAD7, // #FF5FAAD7
            0x5FD789, // #FF5FD789
            0xF1DF0F  // #FFF1DF0F
        ];
        this.menuClickSounds = []; // Will store our click sounds
        
        this.preload();
       
    }

    preload() {
        // Load click sounds separately// Sound effects
this.scene.load.audio('menuClick1', 'assets/sounds/click_1.ogg');
this.scene.load.audio('menuClick2', 'assets/sounds/click_2.ogg');
this.scene.load.audio('scoreSound', 'assets/sounds/score.wav');
this.scene.load.audio('loseSound', 'assets/sounds/sad_trombone_2.mp3');
this.scene.load.audio('deepGrowl', 'assets/sounds/deep_growl.mp3');
this.scene.load.audio('score', 'assets/sounds/score.wav');

// Music tracks
this.scene.load.audio('mainMusic', 'assets/sounds/ode_to_godzila.mp3');
this.scene.load.audio('lastRoundMusic', 'assets/sounds/ente_evil_0.ogg');
this.scene.load.audio('lofihiphop', 'assets/sounds/lofihiphop.ogg');
this.scene.load.audio('dirty_', 'assets/sounds/dirty_.mp3');
this.scene.load.audio('jazzy_battle_theme', 'assets/sounds/jazzy_battle_theme.ogg');
    }
    create() {
        // After loading, store references to the click sounds
        this.menuClickSounds = [
            this.scene.sound.add('menuClick1'),
            this.scene.sound.add('menuClick2')
        ];
    }

    playMenuClick() {
        // Randomly select one of the click sounds
        const clickSound = Phaser.Utils.Array.GetRandom(this.menuClickSounds);
        clickSound.play({
            volume: this.soundVolume * 0.8,
            rate: Phaser.Math.FloatBetween(0.95, 1.05)
        });
    }

    playMenuSound() {
        return this.playMenuClick();
    }

    playScoreSound() {
        this.scene.sound.play('score', {
            volume: this.soundVolume,
            rate: Phaser.Math.FloatBetween(0.98, 1.02)
        });
    }

    playLoseSound() {
        this.scene.sound.play('loseSound', {
            volume: this.soundVolume * 0.7
        });
    }

    playDeepGrowl() {
        this.scene.sound.play('deepGrowl', {
            volume: this.soundVolume * 0.6,
            rate: 0.9
        });
    }

    playMainMusic() {
        this.fadeBetweenMusic('mainMusic', 1000, false);
    }

    playLastRoundMusic() {
        this.fadeBetweenMusic('lastRoundMusic', 800);
    }

    playRoundMusic() {
        const track = Phaser.Utils.Array.GetRandom(this.roundMusicTracks);
        this.fadeBetweenMusic(track, 1500);
    }

    fadeBetweenMusic(newTrackKey, fadeDuration = 1000, doLoop=true) {
        // If same music is already playing, do nothing
        if (this.currentMusic && this.currentMusic.key === newTrackKey) {
            return;
        }

        // Fade out current music if it exists
        if (this.currentMusic) {
            this.scene.tweens.add({
                targets: this.currentMusic,
                volume: 0,
                duration: fadeDuration * 0.8,
                onComplete: () => {
                    this.currentMusic.stop();
                }
            });
            this.currentMusicc.stop();
        }

        console.log('new song',newTrackKey);
        // Fade in new music
        this.currentMusic = this.scene.sound.add(newTrackKey, {
            loop: doLoop,
            volume: 1
        });
        this.currentMusic.play();

        this.scene.tweens.add({
            targets: this.currentMusic,
            volume: this.musicVolume,
            duration: fadeDuration
        });
    }

    stopMusic(fadeDuration = 1000) {
        if (this.currentMusic) {
            this.scene.tweens.add({
                targets: this.currentMusic,
                volume: 0,
                duration: fadeDuration,
                onComplete: () => {
                    this.currentMusic.stop();
                    this.currentMusic = null;
                }
            });
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = volume;
        if (this.currentMusic) {
            this.currentMusic.setVolume(volume);
        }
    }

    setSoundVolume(volume) {
        this.soundVolume = volume;
    }

    getBackgroundColor(index) {
        return this.backgroundColors[index % this.backgroundColors.length];
    }
}