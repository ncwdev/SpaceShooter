import * as FadeEffect from '../Effects/FadeEffect.js';

// transition effect from menu to game level
export class BattleLoader {
    game = null;
    scene= null;

    constructor(game) {
        this.game = game;
        this.scene= game.getScene();
    }

    start() {
        const FADE_IN_TIME = 1;
        FadeEffect.fadeSceneIn(this.scene, FADE_IN_TIME, () => {
            this.game.getHud().loading_txt.isVisible = true;

            this.startAfterFadeInPhase();
        });
    }

    async startAfterFadeInPhase() {
        // battle area is created every time when player presses Play button
        const battle_area = this.game.getBattleArea();
        await battle_area.initPhysics();
        await battle_area.spawnEntities();

        const check_is_ready = setInterval( () => {
            const is_ready = battle_area.isReady();
            if (is_ready) {
                clearInterval(check_is_ready);

                const hud = this.game.getHud();
                hud.black_screen.isVisible= false;
                hud.loading_txt.isVisible = false;
                hud.info_panel.isVisible  = true;
        
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