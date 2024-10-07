import * as dbg from './Utils/DebugPanel.js';

import { Scene } from './Scene.js';
import { GameGui } from './Gui/GameGui.js';

import { KeyboardManager } from './Utils/KeyboardManager.js';
import { PlayerShipController } from './Utils/PlayerShipController.js';

import { BattleArea } from './Entities/BattleArea.js';

import { MenuState } from './GameStates/MenuState.js';
import { LoadingLevelState } from './GameStates/LoadingLevelState.js';
import { PlayState } from './GameStates/PlayState.js';
import { ShowResultState } from './GameStates/ShowResultState.js';
import { ShowMenuState } from './GameStates/ShowMenuState.js';

// manages transition from menu to game and back
export class MyGame {
    engine = null;
    config = null;
    scene = null;

    prerenderObserver = null;
    keyboardManager = null;
    controller = null;

    gameState = null;

    enemiesNumber = 0;

    battleArea = null;
    hud = null;

    // TODO: add sounds manager
    music = null;

    constructor(engine, config) {
        this.engine = engine;
        this.config = config;

        this.scene = new Scene(engine);
        this.scene.createSkyBox(config);
        this.scene.applyOptimizations();

        this.changeState(new MenuState(this));

        // this.music = new BABYLON.Sound('music', './assets/sounds/back.wav', this.scene, null, {
        //     loop: true,
        //     autoplay: true,
        // });
        // this.music.setVolume(0.01);

        dbg.setVisible(false);
    }

    getScene() {
        return this.scene;
    }

    getHud() {
        return this.hud;
    }

    getBattleArea() {
        return this.battleArea;
    }

    changeState(state) {
        if (this.gameState?.exit) {
            this.gameState.exit();
        }
        this.gameState = state;

        if (this.gameState?.enter) {
            this.gameState.enter();
        }
    }

    isPlayState() {
        return this.gameState.isPlayState;
    }

    hideMenu() {
        // MenuState is watching for this.hud to be not null in order to hide menu
        this.hud = new GameGui(this);
        this.prerenderObserver = this.scene.onBeforeRenderObservable.add(this.onPrerenderHandler.bind(this));
    }

    loadLevel() {
        this.battleArea = new BattleArea(this, this.config);

        this.changeState(new LoadingLevelState(this));

        // let music = new BABYLON.Sound('Music', './assets/sounds/saintro.mp3', this.scene, null, {
        //     loop: true,
        //     autoplay: true
        // });

        //dbg.createAxises(10, 10, 10);
        dbg.setVisible(true);
    }

    setPlayState() {
        // when game level is completely loaded we attach keyboard and mouse
        this.keyboardManager = new KeyboardManager(this.scene);
        this.controller = new PlayerShipController(this, this.keyboardManager);

        this.changeState(new PlayState(this));
    }

    onPrerenderHandler() {
        // calc interval in seconds between frames
        const dt = this.engine.getDeltaTime() / 1000;
        if (dt > 1) {
            // skip too long delta after game pause
            return;
        }
        dbg.updateFps();
        this.hud?.update(dt);

        if (this.gameState.update) {
            this.gameState.update(dt);
        }
    }

    onPlayerWin() {
        this.hud.gameOverText.setText(getLocText('TXT_WIN'));
        this.hud.gameOverText.setBackColor(this.config.game_win_backcolor);
        this.hud.gameOverText.show(...this.config.game_over_text_times);
        this.hud.infoPanel.isVisible = false;

        this.returnToMenu();
    }

    onPlayerLost() {
        this.hud.gameOverText.setText(getLocText('TXT_LOST'));
        this.hud.gameOverText.setBackColor(this.config.game_lost_backcolor);
        this.hud.gameOverText.show(...this.config.game_over_text_times);
        this.hud.infoPanel.isVisible = false;

        this.returnToMenu();
    }

    returnToMenu() {
        this.changeState(new ShowResultState(this));
    }

    onMenuShown() {
        this.scene.onBeforeRenderObservable.remove(this.prerenderObserver);

        this.engine.exitPointerlock();
        this.changeState(new MenuState(this));
    }

    clear() {
        this.controller.clear();
        this.controller = null;

        this.keyboardManager.clear();
        this.keyboardManager = null;

        this.battleArea.clear();

        this.hud.clear();
        this.hud = null;

        // TODO:
        // if (this.music) {
        //     this.music.dispose();
        // }

        dbg.setVisible(false);

        this.changeState(new ShowMenuState(this));
    }
}
