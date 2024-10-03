import * as FadeEffect from '../Effects/FadeEffect.js';

const MOUSE_LEFT_BUTTON = 0;
const MOUSE_RIGHT_BUTTON = 2;

// controls the player's ship
export class PlayerShipController {
    game = null;
    scene = null;

    battleArea = null;
    playerShip = null;

    keyboardManager = null;
    pointerObserver = null;

    isWarpEffect = false;

    constructor(game, keyboardManager) {
        this.game = game;
        this.scene = game.getScene();

        this.battleArea = game.getBattleArea();
        this.playerShip = this.battleArea.getPlayerShip();

        this.keyboardManager = keyboardManager;
        this.pointerObserver = this.scene.onPointerObservable.add(this.onPointerHandler.bind(this));
    }

    update(dt) {
        // control player ship
        const playerShip = this.playerShip;
        if (playerShip) {
            if (!playerShip.isDestroyed()) {
                const isShiftPressed = this.keyboardManager.isShiftPressed();

                if (this.keyboardManager.isKeyPressed('KeyW')) {
                    playerShip.moveForward(dt, isShiftPressed);
                }
                else if (this.keyboardManager.isKeyPressed('KeyS')) {
                    playerShip.moveBackward(dt, isShiftPressed);
                }
                else {
                    playerShip.moveInertial(dt);
                }
                if (this.keyboardManager.isKeyPressed('KeyA')) {
                    playerShip.moveSide(true, dt);
                }
                else if (this.keyboardManager.isKeyPressed('KeyD')) {
                    playerShip.moveSide(false, dt);
                }
                if (this.keyboardManager.isKeyPressed('KeyQ')) {
                    playerShip.roll(true, dt);
                }
                else if (this.keyboardManager.isKeyPressed('KeyE')) {
                    playerShip.roll(false, dt);
                }
            }
            playerShip.update(dt);

            if (!this.isWarpEffect) {
                const shipPos = playerShip.getPosition();
                if (this.battleArea.isMaxRadiusExit(shipPos)) {
                    this.keyboardManager.setInputAllowed(false);
                    this.startWarpEffect();
                }
            }
        }

        // tests
        if (this.keyboardManager.isKeyPressed('KeyL')) {
            this.battleArea.createTestLootBox();
        }
        if (this.keyboardManager.isKeyPressed('KeyM')) {
            this.playerShip.addMissile(10);
        }
    }

    onPointerHandler(e) {
        if (e.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            if (e.event.button === MOUSE_LEFT_BUTTON) {
                if (e.pickInfo.hit && this.playerShip && !this.playerShip.isDestroyed()) {
                    this.playerShip.firePlasmaShot(e);
                }
                if (this.game.isPlayState() && !this.scene.getEngine().isPointerLock) {
                    this.scene.getEngine().enterPointerlock();
                }
            }
            if (e.event.button === MOUSE_RIGHT_BUTTON) {
                if (e.pickInfo.hit && this.playerShip && !this.playerShip.isDestroyed()) {
                    this.playerShip.fireMissile(e);
                }
            }
        }
    }

    startWarpEffect() {
        this.isWarpEffect = true;

        const blackAndWhiteEffect = new BABYLON.BlackAndWhitePostProcess('bandw', 1.0, this.scene.activeCamera);

        const playerShip = this.playerShip;
        const mesh = playerShip.getMesh();
        const body = playerShip.getBody();

        body.disablePreStep = false; // this allows to set position and orientation of ship directly

        const FADE_IN_TIME = 2;
        playerShip.setNoiseMaterial();

        FadeEffect.fadeSceneIn(this.scene, FADE_IN_TIME, () => {
            const distFromCenter = 1.2;
            this.battleArea.warpShipToRadius(mesh, distFromCenter);

            FadeEffect.fadeSceneOut(this.scene, FADE_IN_TIME, async () => {
                this.keyboardManager.setInputAllowed(true);
                this.isWarpEffect = false;
                playerShip.resetNoiseMaterial();

                body.disablePreStep = true;

                blackAndWhiteEffect.dispose();
            });
        });
    }

    clear() {
        this.scene.onPointerObservable.remove(this.pointerObserver);
    }
}
