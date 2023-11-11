import * as FadeEffect from '../Effects/FadeEffect.js';

// controls the player's ship
export class PlayerShipController {

    game  = null;
    scene = null;

    battle_area = null;
    player_ship = null;
    
    keyboard_manager = null;
    pointer_observer = null;

    is_warp_effect = false;

    constructor(game, keyboard_manager) {
        this.game  = game;
        this.scene = game.getScene();

        this.battle_area = game.getBattleArea();
        this.player_ship = this.battle_area.getPlayerShip();
        
        this.keyboard_manager = keyboard_manager;
        this.pointer_observer = this.scene.onPointerObservable.add(this.onPointerHandler.bind(this));
    }

    update(dt) {
        // control player ship
        const player_ship = this.player_ship;
        if (player_ship) {
            if (!player_ship.isDestroyed()) {
                const is_shift_pressed = this.keyboard_manager.isShiftPressed();

                if (this.keyboard_manager.isKeyPressed('KeyW')) {
                    player_ship.moveForward(dt, is_shift_pressed);
                }
                else if (this.keyboard_manager.isKeyPressed('KeyS')) {
                    player_ship.moveBackward(dt, is_shift_pressed);
                }
                else {
                    player_ship.moveInertial(dt);
                }
                if (this.keyboard_manager.isKeyPressed('KeyA')) {
                    player_ship.moveSide(true, dt);
                }
                else if (this.keyboard_manager.isKeyPressed('KeyD')) {
                    player_ship.moveSide(false, dt);
                }
                if (this.keyboard_manager.isKeyPressed('KeyQ')) {
                    player_ship.roll(true, dt);
                }
                else if (this.keyboard_manager.isKeyPressed('KeyE')) {
                    player_ship.roll(false, dt);
                }
            }
            player_ship.update(dt);

            if (!this.is_warp_effect) {
                let ship_pos = player_ship.getPosition();
                if (this.battle_area.isMaxRadiusExit(ship_pos)) {
                    this.keyboard_manager.setInputAllowed(false);
                    this.startWarpEffect();
                }
            }
        }

        // tests
        if (this.keyboard_manager.isKeyPressed('KeyL')) {
            this.battle_area.createTestLootBox();
        }
        if (this.keyboard_manager.isKeyPressed('KeyM')) {
            this.player_ship.addMissile(10);
        }
    }

    onPointerHandler(e) {
        const MOUSE_LEFT_BUTTON = 0;
        const MOUSE_RIGHT_BUTTON= 2;

        if (e.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            if (e.event.button === MOUSE_LEFT_BUTTON) {
                if (e.pickInfo.hit && this.player_ship && !this.player_ship.isDestroyed()) {
                    this.player_ship.firePlasmaShot(e);
                }
                if (this.game.isStatePlay() && !this.scene.getEngine().isPointerLock) {
                    this.scene.getEngine().enterPointerlock();
                }
            }
            if (e.event.button === MOUSE_RIGHT_BUTTON) {
                if (e.pickInfo.hit && this.player_ship && !this.player_ship.isDestroyed()) {
                    this.player_ship.fireMissile(e);
                }
            }
        }
    }

    startWarpEffect() {
        this.is_warp_effect = true;

        const black_and_white_effect = new BABYLON.BlackAndWhitePostProcess("bandw", 1.0, this.scene.activeCamera);

        const player_ship = this.player_ship;
        const mesh = player_ship.getMesh();
        const body = player_ship.getBody();

        body.disablePreStep = false;    // this allows to set position and orientation of ship directly

        const FADE_IN_TIME = 2;
        player_ship.setNoiseMaterial();

        FadeEffect.fadeSceneIn(this.scene, FADE_IN_TIME, () => {
            const dist_from_center = 1.2;
            this.battle_area.warpShipToRadius(mesh, dist_from_center);

            FadeEffect.fadeSceneOut(this.scene, FADE_IN_TIME, async () => {
                this.keyboard_manager.setInputAllowed(true);
                this.is_warp_effect = false;
                player_ship.resetNoiseMaterial();

                body.disablePreStep = true;

                black_and_white_effect.dispose();
            });
        });
    }

    clear() {
        this.scene.onPointerObservable.remove(this.pointer_observer);
    }
}