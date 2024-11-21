import * as utils from '../Utils/utils.js';

import { SoundEffect } from '../Effects/SoundEffect.js';
import { SoundManager } from '../Utils/SoundManager.js';

import { Ship } from './Ship.js';
import { PlayerShipGui } from '../Gui/PlayerShipGui.js';
import { WhiteNoiseEffect } from '../Effects/WhiteNoiseEffect.js';
import { IdleMoveEffect } from '../Effects/IdleMoveEffect.js';

const EFM_MIN = 0;
const EFM_AVG = 1;
const EFM_MAX = 2;
const EFM_SIZES = [ [0.1, 0.2], [0.3, 0.4], [0.5, 0.6] ];

const ENERGY_GREEN = 1;
const ENERGY_RED_DEC = 2; // consumption in red zone
const ENERGY_RED_INC = 3; // restoring in red zone

import playerConfig from '../Config/PlayerShipCfg.js';

import CONST from '../const.js';

export class PlayerShip extends Ship {
    camera = null;
    camOffset = null;
    camEffect = null;

    hud = null;

    energyValue = 0;
    energyState = 0;

    // camera rotation
    camRollMult = 0.25;
    cameraYawMult = 0.60;
    cameraPitchMult = 0.10;

    whiteNoiseEffect = null;

    setNoiseMaterial() {
        this.whiteNoiseEffect.start();
    }

    resetNoiseMaterial() {
        this.whiteNoiseEffect.stop();
    }

    constructor(game, mesh) {
        super(game, mesh, playerConfig);

        this.setArmor(this.config.armor);
        this.setHealth(this.config.health);

        this.energyValue = this.config.energy.volume;
        this.energyState = ENERGY_GREEN;

        this.camOffset = this.config.camOffset.clone();

        // Create a shape and the associated body. Size will be determined automatically.
        const body = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, this.scene);
        body.setMassProperties({
            mass: playerConfig.mass,
            inertia: new BABYLON.Vector3(10, 10, 10),
            centerOfMass: new BABYLON.Vector3(0, 0, 0),
        });
        body.setLinearDamping(playerConfig.linear_damping);
        body.setAngularDamping(playerConfig.angular_damping);
        body.setCollisionCallbackEnabled(true);

        body.mfg = { name: 'PlayerShip', entityClass: CONST.ENTITY_CLASS_MY_SHIP };

        const shape = new BABYLON.PhysicsShapeCapsule(
            new BABYLON.Vector3(0.5, 0, 0), // starting point of the cylinder segment
            new BABYLON.Vector3(-0.5,0, 0), // ending point of the cylinder segment
            4.0, // radius of the cylinder
            this.scene,
        );
        const material = { friction: 0.5, restitution: 0.9 };
        shape.material = material;
        body.shape = shape;
        this.aggregate = { body: body, shape: shape };

        this.sounds.engineIdle = new SoundEffect('engineIdle', './assets/sounds/engineIdle.ogg', this.scene, {
            loop: true,
            autoplay: false,
        });
        this.sounds.engineIdle.sound.attachToMesh(mesh);

        this.sounds.engineMain = new SoundEffect('engineMain', './assets/sounds/engineMain.ogg', this.scene, {
            loop: true,
            autoplay: false,
        });
        this.sounds.engineMain.sound.attachToMesh(mesh);

        // engine flares
        this.leftFlareParticles = this.createEngineFlares(mesh, playerConfig.leftFlarePos);
        this.rightFlareParticles = this.createEngineFlares(mesh, playerConfig.rightFlarePos);

        this.whiteNoiseEffect = new WhiteNoiseEffect(this.scene, mesh, './assets/models/MyShip/skull_texture.jpg');

        this.camEffect = new IdleMoveEffect(playerConfig.idleMoveRadius, playerConfig.idleMoveSpeed);
        this.attachCamera();

        // debug
        // const length_of_axes = 12;
        // const axes = new BABYLON.AxesViewer(this.scene, length_of_axes);
        // axes.xAxis.parent = mesh;
        // axes.yAxis.parent = mesh;
        // axes.zAxis.parent = mesh;
    }

    isEnemy() {
        return false;
    }

    addMissile(num) {
        super.addMissile(num);

        this.hud.setMisselesCount(this.missilesNum);
    }

    attachCamera() {
        const camera = this.scene.activeCamera;
        camera.rotationQuaternion = BABYLON.Quaternion.Identity();

        this.camera = camera;

        this.mesh.computeWorldMatrix();

        const offset = this.camOffset.clone();
        offset.x -= this.config.cameraToShipInitialDist;
        const globalCamPos = BABYLON.Vector3.TransformCoordinates(offset, this.mesh.getWorldMatrix());
        camera.position = globalCamPos;

        this.updateCamera(0);

        return camera;
    }

    updateCamera(dt) {
        // softly rotate camera with full control of forward and up vectors
        const targetDist = this.config.camTargetDist; // distance to target in front of ship

        const offset = this.camEffect.update(dt);
        this.camOffset.z = this.config.camOffset.z + offset.x;
        this.camOffset.y = this.config.camOffset.y + offset.y;

        this.mesh.computeWorldMatrix();
        const globalCameraPos = BABYLON.Vector3.TransformCoordinates(this.camOffset, this.mesh.getWorldMatrix());

        const intFactor = 1 - Math.pow(2, -dt * this.config.camLerpFactor);
        this.camera.position.x += (globalCameraPos.x - this.camera.position.x) * intFactor;
        this.camera.position.y += (globalCameraPos.y - this.camera.position.y) * intFactor;
        this.camera.position.z += (globalCameraPos.z - this.camera.position.z) * intFactor;

        // change target dist based on ship's pitch
        const dx = this.pitchSpeed * this.cameraPitchMult;
        const targetPos = new BABYLON.Vector3(targetDist + dx, 0, 0); // in ship's local coordinates

        const cameraRollAngle = this.yawSpeed * this.cameraYawMult - this.rollSpeed * this.camRollMult;
        const z = Math.sin(cameraRollAngle);

        const globalTargetPos = BABYLON.Vector3.TransformCoordinates(targetPos, this.mesh.getWorldMatrix());
        const forward = globalTargetPos.subtract(globalCameraPos);
        const right = BABYLON.Vector3.Zero();
        let up = BABYLON.Vector3.Zero();

        const localForward = { x: targetPos.x - this.camOffset.x, y: targetPos.y - this.camOffset.y };
        const localUp = utils.rotateVector2d(localForward, -Math.PI / 2);
        const localUp3d = new BABYLON.Vector3(localUp.x, localUp.y, 0).normalize();
        localUp3d.z = z;

        const upPos = this.camOffset.add(localUp3d);
        const globalUpPos = BABYLON.Vector3.TransformCoordinates(upPos, this.mesh.getWorldMatrix());

        up = globalUpPos.subtract(globalCameraPos);
        BABYLON.Vector3.CrossToRef(up, forward, right);

        // Create the new world-space rotation matrix from the computed forward, right, and up vectors.
        const matrix = new BABYLON.Matrix.Identity();
        matrix.setRowFromFloats(0, right.x, right.y, right.z, 0);
        matrix.setRowFromFloats(1, up.x, up.y, up.z, 0);
        matrix.setRowFromFloats(2, forward.x, forward.y, forward.z, 0);

        BABYLON.Quaternion.FromRotationMatrixToRef(matrix.getRotationMatrix(), this.camera.rotationQuaternion);
    }

    firePlasmaShot() {
        // if (!this.hud.isCursorInTargetField()) {
        //     return;
        // }
        const fwd = {x: 1, y: 0, z: 0};

        this.mesh.computeWorldMatrix();
        const matrix = this.mesh.getWorldMatrix();
        const leftPos = BABYLON.Vector3.TransformCoordinates(this.config.plasmaShotLeftPos, matrix);
        const rightPos = BABYLON.Vector3.TransformCoordinates(this.config.plasmaShotRightPos, matrix);

        const target = this.hud.getTargetObj();

        const engine = this.scene.getEngine();
        const screenWidth = engine.getRenderWidth();
        const screenHeight = engine.getRenderHeight();

        const targetPos = this.hud.targetPos;
        const screenPosition = new BABYLON.Vector3(targetPos.x + screenWidth * 0.5, targetPos.y + screenHeight * 0.5, 0.99);
        const dstPosUnprojected = BABYLON.Vector3.Unproject(
            screenPosition,
            screenWidth,
            screenHeight,
            BABYLON.Matrix.Identity(),
            this.scene.getViewMatrix(),
            this.scene.getProjectionMatrix()
        );
        const dir = dstPosUnprojected.subtract(this.mesh.position).normalize();
        let dstPos = this.mesh.position.add(dir.scale(200));

        const down = this.mesh.up.clone().negate();
        dstPos = dstPos.add(down.scale(7.5)); // TODO: remove magic number

        const leftDir = dstPos.subtract(leftPos);
        const q1 = utils.quaternionShortestArc(fwd, leftDir);
        this.createPlasmaShot(leftPos, q1, CONST.ENTITY_CLASS_MY_SHOT, target);

        const rightDir = dstPos.subtract(rightPos);
        const q2 = utils.quaternionShortestArc(fwd, rightDir);
        this.createPlasmaShot(rightPos , q2, CONST.ENTITY_CLASS_MY_SHOT, target);

        SoundManager.playSound(SoundManager.SND_PLASMA, this.mesh);
    }

    fireMissile() {
        if (this.missilesNum <= 0) {
            return;
        }
        this.addMissile(-1);

        const fwd = {x: 0, y: 1, z: 0};

        this.mesh.computeWorldMatrix();
        const matrix = this.mesh.getWorldMatrix();

        const pos = BABYLON.Vector3.TransformCoordinates(this.config.missilePos, matrix);
        const dir = this.mesh.getDirection(BABYLON.Axis.X).clone();
        const q = utils.quaternionShortestArc(fwd, dir);
        const target = this.hud.getTargetObj();

        const missile = this.createMissile(pos, q, CONST.ENTITY_CLASS_MISSILE, target);
        const sound = SoundManager.playSound(SoundManager.SND_MISSILE, missile.mesh);
        sound.setVolume(1.0);
    }

    moveForward(dt, isShiftPressed) {
        const accel = this.config.accelFwd;
        this.accelerate(accel, dt, isShiftPressed);

        const sizes = EFM_SIZES[isShiftPressed ? EFM_MAX : EFM_AVG];
        this.setEngineFlaresMode(sizes);
    }

    moveBackward(dt, isShiftPressed) {
        const accel = this.config.accelBack;
        this.accelerate(accel, dt, isShiftPressed);
    }

    accelerate(accel, dt, isShiftPressed) {
        if (this.energyValue <= 0 || this.energyState === ENERGY_RED_INC) {
            this.moveInertial(dt);
            return;
        }
        let energyConsumption = this.config.energy.accelConsump;
        if (isShiftPressed) {
            accel *= this.config.turboK;
            energyConsumption = this.config.energy.turboConsump;
        }
        let v = this.velFwd + accel * dt;
        v = Math.min(v, this.config.velFwdTurbo);
        v = Math.max(v, this.config.velFwdMin);
        this.velFwd = v;

        this.energyValue = this.energyValue - energyConsumption * dt;
        if (this.energyValue <= this.config.energy.redZoneValue) {
            this.energyState = ENERGY_RED_DEC;
        }
        this.playMainEngineSound();
    }

    moveInertial(dt) {
        const sizes = EFM_SIZES[EFM_MIN];
        this.setEngineFlaresMode(sizes);

        this.energyValue = this.energyValue + this.config.energy.restoreSpeed * dt;
        if (this.energyValue > this.config.energy.volume) {
            this.energyValue = this.config.energy.volume;
        }
        if (this.energyValue >= this.config.energy.redZoneValue) {
            this.energyState = ENERGY_GREEN;
        } else {
            this.energyState = ENERGY_RED_INC;
        }
        this.playIdleEngineSound();
    }

    restoreArmor(dt) {
        // armor could be restored only if it > 0
        let armor = this.getArmor();
        if (armor > 0) {
            armor += this.config.armorRestore * dt;
            this.setArmor(armor);
        }
    }

    getPlasmaShotDamage() {
        return this.config.plasmaShotDamage;
    }

    init() {
        this.createHud();
        this.addMissile(this.config.missilesNum);
    }

    createHud() {
        this.hud = new PlayerShipGui(this.game, this);
        this.armorBar = this.hud.getArmorBar();
        this.healthBar = this.hud.getHealthBar();
        this.hud.setInfoPanelVisible(true);
    }

    hideHud() {
        this.hud.hide();
    }

    getEnergyRedZone() {
        return this.config.energy.redZoneValue / this.config.energy.volume;
    }

    getCurEnergy() {
        return this.energyValue;
    }

    getMaxEnergy() {
        return this.config.energy.volume;
    }

    isEnergyInRedZone() {
        return this.energyState != ENERGY_GREEN;
    }

    update(dt) {
        super.update(dt);

        if (this.isDestroyed()) {
            return;
        }
        if (this.hud) {
            if (this.hud.isCursorInBufferZone()) {
                this.stopYawAndPitch(dt);
            } else {
                // change direction of ship when cursor leaves the buffer zone
                const [dx, dy] = this.hud.getCursorCenterDeflection();
                this.yawPitch(-dx, dy, dt);
            }
            this.hud.update(dt);
        }
        this.updateCamera(dt);

        this.restoreArmor(dt);
        this.decreaseVelocities(dt);
    }

    playIdleEngineSound() {
        const engineIdle = this.sounds.engineIdle;
        if (engineIdle && !engineIdle.isPlaying) {
            engineIdle.play(0, 0.25, 2000);
            engineIdle.isPlaying = true;
        }
        const engineMain = this.sounds.engineMain;
        if (engineMain && engineMain.isPlaying) {
            engineMain.stop(0.1, 0, 1000);
            engineMain.isPlaying = false;
        }
    }

    playMainEngineSound() {
        const engineIdle = this.sounds.engineIdle;
        if (engineIdle && engineIdle.isPlaying) {
            engineIdle.stop(0, 0.25, 1000);
            engineIdle.isPlaying = false;
        }
        const engineMain = this.sounds.engineMain;
        if (engineMain && !engineMain.isPlaying) {
            engineMain.play(0.1, 0, 2000);
            engineMain.isPlaying = true;
        }
    }

    clear() {
        this.camera.parent = null;

        this.whiteNoiseEffect.stop();
        this.whiteNoiseEffect.clear();
        this.whiteNoiseEffect = null;

        this.hud.clear();

        super.clear();
    }
}
