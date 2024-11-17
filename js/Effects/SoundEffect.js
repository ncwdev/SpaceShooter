const DELTA_TIME = 10; // ms

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class SoundEffect {
    name = '';
    sound = null;
    isLoaded = false;

    curVolume = undefined;
    changeInt = undefined;

    constructor(name, url, scene, opt) {
        this.name = name;

        this.sound = new BABYLON.Sound(name, url, scene, () => {
            this.sound.setVolume(0);
            this.isLoaded = true;
        }, opt);
    }

    async waitSound() {
        for (let i = 0; i < 20; ++i) {
            if (this.isLoaded) {
                return;
            } else {
                await wait(50);
            }
        }
    }

    async play(startVolume, endVolume, time) {
        // time in ms
        await this.waitSound();
        if (!this.isLoaded) {
            console.error(`SoundEffect.play: sound ${this.name} not loaded - skip`);
            return;
        }
        if (this.curVolume === undefined) {
            this.curVolume = startVolume;
            this.sound.setVolume(startVolume);
            this.sound.play();
        } else {
            clearInterval(this.changeInt);
        }
        const deltaVolume = endVolume - this.curVolume;
        const volumeSpeed = deltaVolume / (time / DELTA_TIME);
        this.changeInt = setInterval(() => {
            this.curVolume += volumeSpeed;
            this.sound.setVolume(this.curVolume);

            if (this.curVolume >= endVolume) {
                clearInterval(this.changeInt);

                this.changeInt = undefined;
                this.curVolume = undefined;
            }
        }, DELTA_TIME);
    }

    stop(startVolume, endVolume, time) {
        // time in ms
        if (this.curVolume === undefined) {
            this.curVolume = startVolume;
            this.sound.setVolume(startVolume);
        } else {
            clearInterval(this.changeInt);
        }
        const deltaVolume = endVolume - this.curVolume;
        const volumeSpeed = deltaVolume / (time / DELTA_TIME);
        this.changeInt = setInterval(() => {
            this.curVolume += volumeSpeed;
            this.sound.setVolume(this.curVolume);

            if (this.curVolume <= endVolume) {
                clearInterval(this.changeInt);

                this.sound.stop();

                this.changeInt = undefined;
                this.curVolume = undefined;
            }
        }, DELTA_TIME);
    }

    dispose() {
        if (this.sound) {
            this.sound.dispose();
            this.sound = null;
        }
    }
}
