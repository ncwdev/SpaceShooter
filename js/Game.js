import * as dbg from './Utils/DebugPanel.js';

import {Scene} from "./Scene.js";
import {GameGui} from './Gui/GameGui.js';

import {BattleLoader} from "./Utils/BattleLoader.js";
import {BattleCleaner} from "./Utils/BattleCleaner.js";

import {KeyboardManager} from "./Utils/KeyboardManager.js";
import {PlayerShipController} from "./Utils/PlayerShipController.js";

import {BattleArea}  from "./Entities/BattleArea.js";

const GS_MENU = 1;
const GS_PLAY = 2;

// manages transition from menu to game and back
export class MyGame {

    engine = null;
    config = null;

    scene  = null;
    getScene() {
        return this.scene;
    }

    battle_loader = null;
    battle_cleaner= null;

    battle_area = null;
    getBattleArea() {
        return this.battle_area;
    }

    keyboard_manager = null;
    controller = null;

    game_state = GS_MENU;
    setStateInMenu() {
        this.game_state = GS_MENU;
    }
    setStatePlay() {
        this.game_state = GS_PLAY;
    }
    isStateInMenu() {
        return this.game_state === GS_MENU;
    }
    isStatePlay() {
        return this.game_state === GS_PLAY;
    }

    prerender_observer = null;

    hud = null;
    getHud() {
        return this.hud;
    }

    // TODO: add sounds manager
    music = null;

    constructor(engine, config) {
        this.engine = engine;
        this.config = config;

        this.scene = new Scene(engine);
        this.scene.createSkyBox(config.radius_max);
        this.scene.applyOptimizations();

        this.battle_loader = new BattleLoader(this);
        this.battle_cleaner= new BattleCleaner(this);

        // this.music = new BABYLON.Sound("music", "./assets/sounds/back.wav", this.scene, null, {
        //     loop: true,
        //     autoplay: true,
        // });
        // this.music.setVolume(0.01);

        dbg.setVisible(false);
    }

    start(enemies_num) {
        this.battle_area = new BattleArea(this, this.config, enemies_num);

        this.hud = new GameGui(this);
        this.hud.black_screen.isVisible = true;

        this.battle_loader.start();

        // let music = new BABYLON.Sound("Music", "./assets/sounds/saintro.mp3", this.scene, null, {
        //     loop: true,
        //     autoplay: true
        // });
    
        //dbg.createAxises(10, 10, 10);
        dbg.setVisible(true);
    }

    onStartBattle() {
        // when game level is completely loaded we attach keyboard, mouse and prerender handlers
        this.hud.showGoal();
        
        this.prerender_observer = this.scene.onBeforeRenderObservable.add(this.onPrerenderHandler.bind(this));

        setTimeout( () => {    
            this.keyboard_manager = new KeyboardManager(this.scene);
            this.controller = new PlayerShipController(this, this.keyboard_manager);
        
            this.battle_area.startBattle();
            this.setStatePlay();
        }, this.config.show_goal_time);
    }

    returnToMenu() {
        this.setStateInMenu();

        this.battle_cleaner.start();
    }

    onPrerenderHandler() {
        // calc interval in seconds between frames
        const dt = this.engine.getDeltaTime() / 1000;
        if (dt > 1) {
            // skip too long delta after game pause
            return;
        }
        dbg.updateFps();
        this.hud.update(dt);

        if (this.isStatePlay()) {
            this.controller.update(dt);
            this.battle_area.update(dt);
        }
    }

    onPlayerWin() {
        this.hud.game_over_txt.setText(getLocText("TXT_WIN"));
        this.hud.game_over_txt.setBackColor(this.config.game_win_backcolor);
        this.hud.game_over_txt.show(...this.config.game_over_text_times);
        this.hud.info_panel.isVisible = false;

        this.returnToMenu();
    }

    onPlayerLost() {
        this.hud.game_over_txt.setText(getLocText("TXT_LOST"));
        this.hud.game_over_txt.setBackColor(this.config.game_lost_backcolor);
        this.hud.game_over_txt.show(...this.config.game_over_text_times);
        this.hud.info_panel.isVisible = false;

        this.returnToMenu();
    }

    clear() {
        this.controller.clear();
        this.controller = null;

        this.keyboard_manager.clear();
        this.keyboard_manager = null;

        this.scene.onBeforeRenderObservable.remove(this.prerender_observer);

        this.battle_area.clear();

        this.hud.clear();
        this.hud = null;

        // TODO:
        // if (this.music) {
        //     this.music.dispose();
        // }

        dbg.setVisible(false);
    }
}