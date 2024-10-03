import { BaseState } from './BaseState.js';
import { MainMenu } from '../Gui/MainMenu.js';

const FADE_OUT_TIME = 1;

export class ShowMenuState extends BaseState {
    showMenuTime = 0;

    enter() {
        MainMenu.setOpacity(0);
        MainMenu.setVisible(true);
    }

    update(dt) {
        // dt in seconds
        if (this.showMenuTime >= 0 && this.showMenuTime <= FADE_OUT_TIME) {
            const opacity = this.showMenuTime / FADE_OUT_TIME;
            MainMenu.setOpacity(opacity);
            this.showMenuTime += dt;

            if (this.showMenuTime > FADE_OUT_TIME) {
                MainMenu.setOpacity(1.0);
                this.game.onMenuShown();
            }
        }
    }
}
