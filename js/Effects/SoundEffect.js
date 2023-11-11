const DELTA_TIME = 50;  // ms

export class SoundEffect {

    sound = null;
    time = 0;

    cur_volume = undefined;
    change_int = undefined;
    
    constructor(name, url, scene, opt) {
        this.sound = new BABYLON.Sound(name, url, scene, null, opt);
        this.sound.setVolume(0);
    }
    play(time, start_volume, end_volume) {
        // time in ms
        if (this.cur_volume === undefined) {
            this.cur_volume = start_volume;
            this.sound.setVolume(start_volume);
            this.sound.play();
        } else {
            clearInterval(this.change_int);
        }
        let delta_volume = end_volume - this.cur_volume;
        let volume_speed = delta_volume / DELTA_TIME;
        this.change_int = setInterval( () => {
            this.cur_volume += volume_speed;
            this.sound.setVolume(this.cur_volume);

            if (this.cur_volume >= end_volume) {
                clearInterval(this.change_int);

                this.change_int = undefined;
                this.cur_volume = undefined;
            }
        }, DELTA_TIME);
    }
    stop(time, start_volume, end_volume) {
        // time in ms
        if (this.cur_volume === undefined) {
            this.cur_volume = start_volume;
            this.sound.setVolume(start_volume);
        } else {
            clearInterval(this.change_int);
        }
        let delta_volume = end_volume - this.cur_volume;
        let volume_speed = delta_volume / DELTA_TIME;
        this.change_int = setInterval( () => {
            this.cur_volume += volume_speed;
            this.sound.setVolume(this.cur_volume);

            if (this.cur_volume <= end_volume) {
                clearInterval(this.change_int);

                this.sound.stop();

                this.change_int = undefined;
                this.cur_volume = undefined;
            }
        }, DELTA_TIME);
    }
    dispose() {
        if (this.sound) {
            this.sound.dispose();
        }
    }
}