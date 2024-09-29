import * as FadeEffect from '../Effects/FadeEffect.js';

import { MainMenu } from '../Gui/MainMenu.js';

// transition effect from game level to menu
export class BattleCleaner {
    game = null;
    scene = null;

    constructor(game) {
        this.game = game;
        this.scene = game.getScene();
    }

    start() {
        const FADE_IN_TIME = 2;
        FadeEffect.fadeSceneIn(this.scene, FADE_IN_TIME, () => {
            this.quitAfterFadeInPhase();
        });
    }

    quitAfterFadeInPhase() {
        // destroy battle area
        this.game.clear();

        const FADE_OUT_TIME = 2;
        FadeEffect.fadeSceneOut(this.scene, FADE_OUT_TIME, () => {
            MainMenu.setVisible(true);

            this.scene.getEngine().exitPointerlock();
        });
    }
}
