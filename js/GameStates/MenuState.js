import { BaseState } from './BaseState.js';
import { MainMenu } from '../Gui/MainMenu.js';

const FADE_IN_TIME = 1;

export class MenuState extends BaseState {
    hideMenuTime = FADE_IN_TIME;

    enter() {
        MainMenu.setMaxEnemiesNumber(this.game.config.max_enemies_num);
        MainMenu.enablePlayButton();
    }

    update(dt) {
        // dt in seconds
        const hud = this.game.getHud();
        if (hud) {
            hud.blackScreen.isVisible = true;

            // hide main menu
            if (this.hideMenuTime >= 0 && this.hideMenuTime <= FADE_IN_TIME) {
                const opacity = this.hideMenuTime / FADE_IN_TIME;
                MainMenu.setOpacity(opacity);
                this.hideMenuTime -= dt;

                if (this.hideMenuTime < 0) {
                    MainMenu.setVisible(false);

                    this.game.loadLevel();
                }
            }
        }
    }

    exit() {
        this.game.getBattleArea().enemiesNumber = MainMenu.getEnemiesNumber();
    }
}
