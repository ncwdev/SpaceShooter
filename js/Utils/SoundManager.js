import { SoundEffect } from '../Effects/SoundEffect.js';

// const volumeSlider = document.getElementById('VolumeSlider');
// const initialVolume = volumeSlider.value / 100.0;
// BABYLON.Engine.audioEngine.setGlobalVolume(initialVolume);
// console.log(`Initial volume set to ${initialVolume}`);

BABYLON.Engine.audioEngine.useCustomUnlockedButton = true;

class SoundManagerSingleton {
    static instance = null;

    scene = null;

    menuMusic = null;
    gameMusic = null;

    sounds = {};

    SND_WELCOME = 'welcome';
    SND_CLICK = 'click.ogg';
    SND_PLASMA = 'plasma.ogg';
    SND_PLASMA_ENEMY = 'plasmaEnemy.ogg';
    SND_EXPLOSION = 'explosion.wav';
    SND_LOOTBOX = 'collectLoot.ogg';
    SND_MISSILE = 'missile.ogg';

    constructor(scene) {
        if (SoundManagerSingleton.instance) {
            return SoundManagerSingleton.instance;
        }
        SoundManagerSingleton.instance = this;

        this.scene = scene;
    }

    getSound(soundId) {
        let sound = this.sounds[soundId];
        if (!sound) {
            sound = new BABYLON.Sound(soundId, `./assets/sounds/${soundId}`, this.scene, () => console.log(`${soundId} loaded`), {
                loop: false,
                autoplay: true,
                volume: 0.25,
            });
            this.sounds[soundId] = sound;
        }
        return sound;
    }

    playSound(soundId, mesh = null) {
        const sound = this.getSound(soundId);
        if (sound) {
            if (mesh) {
                sound.attachToMesh(mesh);
            }
            sound.play();
        } else {
            console.error(`SoundManager.playSound(${soundId}): sound not found`);
        }
        return sound;
    }

    attachSound(soundId, mesh) {
        const sound = this.getSound(soundId);
        if (sound) {
            sound.attachToMesh(mesh);
            sound.autoplay = false;
        }
        return sound;
    }

    cloneSound(soundId) {
        const sound = this.getSound(soundId);
        if (sound) {
            const clone = sound.clone();
            return clone;
        }
        return null;
    }

    deleteSound(soundId) {
        const sound = this.sounds[soundId];
        if (sound) {
            sound.dispose();
            delete this.sounds[soundId];
        }
    }

    playExplosionSound(pos) {
        const originalSound = this.getSound(this.SND_EXPLOSION);
        originalSound.spatialSound = true;
        originalSound.maxDistance = 1000;

        const clone = originalSound.clone();
        clone.setPosition(pos);
        clone.play();
    }

    playMenuMusic() {
        if (!this.menuMusic) {
            this.menuMusic = new SoundEffect('menuMusic', './assets/sounds/menuMusic.mp3', this.scene, {
                loop: true,
                autoplay: false,
                // preload: 'true',
            });
        }
        const START_VOLUME = 0;
        const END_VOLUME = 0.25;
        const START_TIME = 1500;
        this.menuMusic.play(START_VOLUME, END_VOLUME, START_TIME);
    }

    stopMenuMusic() {
        const START_VOLUME = 0.25;
        const END_VOLUME = 0;
        const STOP_TIME = 1000;
        this.menuMusic?.stop(START_VOLUME, END_VOLUME, STOP_TIME);
    }

    playGameMusic() {
        if (!this.gameMusic) {
            this.gameMusic = new SoundEffect('gameMusic', './assets/sounds/gameMusic.ogg', this.scene, {
                loop: true,
                autoplay: false,
                // preload: 'true',
            });
        }
        const START_VOLUME = 0;
        const END_VOLUME = 0.25;
        const START_TIME = 3000;
        this.gameMusic.play(START_VOLUME, END_VOLUME, START_TIME);
    }

    stopGameMusic() {
        const START_VOLUME = 0.25;
        const END_VOLUME = 0;
        const STOP_TIME = 1500;
        this.gameMusic.stop(START_VOLUME, END_VOLUME, STOP_TIME);
    }

    clear() {
        this.menuMusic.dispose();
        this.menuMusic = null;

        this.gameMusic.dispose();
        this.gameMusic = null;

        for (const soundId in this.sounds) {
            const sound = this.sounds[soundId];
            if (sound) {
                sound.dispose();
            }
        }
        this.sounds= null;
        this.scene = null;
    }
}
export const SoundManager = new SoundManagerSingleton(scene);
