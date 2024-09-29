import { EasingFunctions } from '../Utils/EasingFunctions.js';

const STATE_MOVE_IN = 1;
const STATE_WAIT = 2;
const STATE_MOVE_OUT = 3;
const STATE_FINISHED = 4;

export class InOutMoveEffect {
    start_pos = 0;
    end_pos = 0;

    in_time  = 0;
    wait_time= 0;
    out_time = 0;

    cur_time = 0;

    state = STATE_MOVE_IN;

    constructor(start_pos, end_pos, in_time, wait_time, out_time) {
        this.start_pos = start_pos;
        this.end_pos = end_pos;

        this.in_time  = in_time;
        this.wait_time= wait_time;
        this.out_time = out_time;
    }

    isFinished() {
        return this.state === STATE_FINISHED;
    }

    update(dt) {
        let cur_pos = 0;
        this.cur_time += dt;

        if (this.state === STATE_MOVE_IN) {
            let t = this.cur_time / this.in_time;
            if (t >= 1) {
                this.cur_time = 0;
                this.state = STATE_WAIT;

                cur_pos = this.end_pos;
            } else {
                t = EasingFunctions.easeInOutQuad(t);
                cur_pos = this.start_pos + (this.end_pos - this.start_pos) * t;
            }
        } else if (this.state === STATE_WAIT) {
            const t = this.cur_time / this.wait_time;
            if (t >= 1) {
                this.cur_time = 0;
                this.state = STATE_MOVE_OUT;
            }
            cur_pos = this.end_pos;
        } else if (this.state === STATE_MOVE_OUT) {
            let t = this.cur_time / this.out_time;
            if (t >= 1) {
                this.cur_time = 0;
                this.state = STATE_FINISHED;

                cur_pos = this.start_pos;
            } else {
                t = EasingFunctions.easeInOutQuad(t);
                cur_pos = this.end_pos - (this.end_pos - this.start_pos) * t;
            }
        }
        return cur_pos;
    }
}
