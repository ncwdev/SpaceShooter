import * as FadeEffect from '../Effects/FadeEffect.js';

// transition effect from menu to game level
export class BattleLoader {
    game = null;
    scene = null;

    constructor(game) {
        this.game = game;
        this.scene = game.getScene();
    }

    start() {
        const FADE_IN_TIME = 1;
        FadeEffect.fadeSceneIn(this.scene, FADE_IN_TIME, () => {
            this.game.getHud().loadingText.isVisible = true;

            this.startAfterFadeInPhase();
        });
    }

    async startAfterFadeInPhase() {
        // battle area is created every time when player presses Play button
        const battle_area = this.game.getBattleArea();
        await battle_area.initPhysics();
        await battle_area.spawnEntities();

        const checkIsReadyInt = setInterval(() => {
            const isReady = battle_area.isReady();
            if (isReady) {
                clearInterval(checkIsReadyInt);

                const hud = this.game.getHud();
                hud.blackScreen.isVisible = false;
                hud.loadingText.isVisible = false;
                hud.infoPanel.isVisible = true;

                const FADE_OUT_TIME = 2;
                FadeEffect.fadeSceneOut(this.scene, FADE_OUT_TIME, async () => {
                    this.startAfterFadeOutPhase();
                });
            }
        }, 100);
    }

    startAfterFadeOutPhase() {
        this.game.onStartBattle();
    }
}
