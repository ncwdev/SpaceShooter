const DELTA_TIME = 50; // ms

export class SoundEffect {
    sound = null;
    time = 0;

    curVolume = undefined;
    changeInt = undefined;

    constructor(name, url, scene, opt) {
        this.sound = new BABYLON.Sound(name, url, scene, null, opt);
        this.sound.setVolume(0);
    }

    play(time, start_volume, end_volume) {
        // time in ms
        if (this.curVolume === undefined) {
            this.curVolume = start_volume;
            this.sound.setVolume(start_volume);
            this.sound.play();
        } else {
            clearInterval(this.changeInt);
        }
        const deltaVolume = end_volume - this.curVolume;
        const volumeSpeed = deltaVolume / DELTA_TIME;
        this.changeInt = setInterval( () => {
            this.curVolume += volumeSpeed;
            this.sound.setVolume(this.curVolume);

            if (this.curVolume >= end_volume) {
                clearInterval(this.changeInt);

                this.changeInt = undefined;
                this.curVolume = undefined;
            }
        }, DELTA_TIME);
    }

    stop(time, start_volume, end_volume) {
        // time in ms
        if (this.curVolume === undefined) {
            this.curVolume = start_volume;
            this.sound.setVolume(start_volume);
        } else {
            clearInterval(this.changeInt);
        }
        const deltaVolume = end_volume - this.curVolume;
        const volumeSpeed = deltaVolume / DELTA_TIME;
        this.changeInt = setInterval( () => {
            this.curVolume += volumeSpeed;
            this.sound.setVolume(this.curVolume);

            if (this.curVolume <= end_volume) {
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
        }
    }
}
