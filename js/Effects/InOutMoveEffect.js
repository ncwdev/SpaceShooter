import { EasingFunctions } from '../Utils/EasingFunctions.js';

const STATE_MOVE_IN = 1;
const STATE_WAIT = 2;
const STATE_MOVE_OUT = 3;
const STATE_FINISHED = 4;

export class InOutMoveEffect {
    startPos = 0;
    endPos = 0;

    inTime = 0;
    waitTime = 0;
    outTime = 0;

    curTime = 0;

    state = STATE_MOVE_IN;

    constructor(startPos, endPos, inTime, waitTime, outTime) {
        this.startPos = startPos;
        this.endPos = endPos;

        this.inTime = inTime;
        this.waitTime = waitTime;
        this.outTime = outTime;
    }

    isFinished() {
        return this.state === STATE_FINISHED;
    }

    update(dt) {
        let curPos = 0;
        this.curTime += dt;

        if (this.state === STATE_MOVE_IN) {
            let t = this.curTime / this.inTime;
            if (t >= 1) {
                this.curTime = 0;
                this.state = STATE_WAIT;

                curPos = this.endPos;
            } else {
                t = EasingFunctions.easeInOutQuad(t);
                curPos = this.startPos + (this.endPos - this.startPos) * t;
            }
        } else if (this.state === STATE_WAIT) {
            const t = this.curTime / this.waitTime;
            if (t >= 1) {
                this.curTime = 0;
                this.state = STATE_MOVE_OUT;
            }
            curPos = this.endPos;
        } else if (this.state === STATE_MOVE_OUT) {
            let t = this.curTime / this.outTime;
            if (t >= 1) {
                this.curTime = 0;
                this.state = STATE_FINISHED;

                curPos = this.startPos;
            } else {
                t = EasingFunctions.easeInOutQuad(t);
                curPos = this.endPos + (this.startPos - this.endPos) * t;
            }
        }

        return curPos;
    }
}
