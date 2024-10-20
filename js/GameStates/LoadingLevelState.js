import { BaseState } from './BaseState.js';
import * as FadeEffect from '../Effects/FadeEffect.js';
import { ShowGoalState } from './ShowGoalState.js';

const FADE_OUT_TIME = 2;

export class LoadingLevelState extends BaseState {
    async enter() {
        const scene = this.game.getScene();
        scene.hideSceneEffect.dispose();

        const hud = this.game.getHud();
        hud.setLoadingTextVisible(true);

        // init battle area
        const battleArea = this.game.getBattleArea();
        await battleArea.initPhysics();
        await battleArea.spawnEntities();

        const checkIsReadyInt = setInterval(() => {
            const isReady = battleArea.isReady();
            if (isReady) {
                clearInterval(checkIsReadyInt);

                hud.blackScreen.isVisible = false;
                hud.setLoadingTextVisible(false);

                FadeEffect.fadeSceneOut(scene, FADE_OUT_TIME, () => {
                    this.game.changeState(new ShowGoalState(this.game));
                });
            }
        }, 100);
    }
}
