import { BaseState } from './BaseState.js';

export class ShowGoalState extends BaseState {
    hud = null;

    enter() {
        this.hud = this.game.getHud();
        this.hud.showGoal();
    }

    update() {
        if (this.hud.isGoalEffectFinished()) {
            this.game.setPlayState();
        }
    }
}
