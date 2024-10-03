import { BaseState } from './BaseState.js';

export class PlayState extends BaseState {
    isPlayState = true;

    enter() {
        this.game.getBattleArea().startBattle();
    }

    update(dt) {
        this.game.controller.update(dt);
        this.game.getBattleArea().update(dt);
    }
}
