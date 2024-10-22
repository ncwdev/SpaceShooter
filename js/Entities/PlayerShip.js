import * as utils from '../Utils/utils.js';

// import { SoundEffect } from './Effects/SoundEffect.js';

import { Ship } from './Ship.js';
import { PlayerShipGui } from '../Gui/PlayerShipGui.js';
import { WhiteNoiseEffect } from '../Effects/WhiteNoiseEffect.js';
import { IdleMoveEffect } from '../Effects/IdleMoveEffect.js';

const EFM_MIN = 0;
const EFM_AVG = 1;
const EFM_MAX = 2;
const EFM_SIZES = [ [0.1, 0.2], [0.3, 0.4], [0.5, 0.6] ];

const ENERGY_GREEN   = 1;
const ENERGY_RED_DEC = 2; // consumption in red zone
const ENERGY_RED_INC = 3; // restoring in red zone

import player_config from '../Config/PlayerShipCfg.js';

import CONST from '../const.js';

export class PlayerShip extends Ship {
    camera = null;
    cam_offset = null;
    cam_effect = null;

    hud = null;

    energy_value = 0;
    energy_state = 0;

    // camera rotation
    cam_roll_mult = 0.25;
    camera_yaw_mult = 0.60;
    camera_pitch_mult = 0.10;

    white_noise_effect = null;

    setNoiseMaterial() {
        this.white_noise_effect.start();
    }

    resetNoiseMaterial() {
        this.white_noise_effect.stop();
    }

    constructor(game, mesh) {
        super(game, mesh, player_config);

        this.setArmor (this.config.armor);
        this.setHealth(this.config.health);

        this.energy_value = this.config.energy.volume;
        this.energy_state = ENERGY_GREEN;

        this.cam_offset = this.config.cam_offset.clone();

        // Create a shape and the associated body. Size will be determined automatically.
        const body = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, this.scene);
        body.setMassProperties({
            mass: player_config.mass, // 100
            inertia: new BABYLON.Vector3(10, 10, 10),
            centerOfMass: new BABYLON.Vector3(0, 0, 0),
        });
        body.setLinearDamping(player_config.linear_damping);    // 0.59
        body.setAngularDamping(player_config.angular_damping);  // 0.59
        body.setCollisionCallbackEnabled(true);

        body.mfg = { name: 'PlayerShip', entity_class: CONST.ENTITY_CLASS_MY_SHIP };

        const shape = new BABYLON.PhysicsShapeCapsule(
            new BABYLON.Vector3(0.5, 0, 0), // starting point of the cylinder segment
            new BABYLON.Vector3(-0.5,0, 0), // ending point of the cylinder segment
            4.0,                            // radius of the cylinder
            this.scene,
        );
        const material = { friction: 0.5, restitution: 0.9 };
        shape.material = material;
        body.shape = shape;
        this.aggregate = { body: body, shape: shape };

        // this.sounds.engine_idle = new SoundEffect("engine_idle", "./assets/sounds/engine_idle.ogg", this.scene, {
        //     loop: true,
        //     autoplay: false,
        // });
        // this.sounds.engine_main = new SoundEffect("engine_main", "./assets/sounds/engine_main.ogg", this.scene, {
        //     loop: true,
        //     autoplay: false,
        // });

        // engine flares
        this.left_flare_particles = this.createEngineFlares(mesh, player_config.left_flare_pos);
        this.right_flare_particles= this.createEngineFlares(mesh, player_config.right_flare_pos);

        this.white_noise_effect = new WhiteNoiseEffect(this.scene, mesh, './assets/models/MyShip/skull_texture.jpg');

        this.cam_effect = new IdleMoveEffect(player_config.idle_move_radius, player_config.idle_move_speed); // 0.12, 0.05
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

        this.hud.setMisselesCount(this.missiles_num);
    }

    attachCamera() {
        const camera = this.scene.activeCamera;
        camera.rotationQuaternion = BABYLON.Quaternion.Identity();

        this.camera = camera;

        this.mesh.computeWorldMatrix();

        const offset = this.cam_offset.clone();
        offset.x -= this.config.camera_to_ship_initial_dist;
        const global_cam_pos = BABYLON.Vector3.TransformCoordinates(offset, this.mesh.getWorldMatrix());
        camera.position = global_cam_pos;

        this.updateCamera(0);

        return camera;
    }

    updateCamera(dt) {
        // softly rotate camera with full control of forward and up vectors
        const targetDist = this.config.cam_target_dist; // distance to target in front of ship

        const offset = this.cam_effect.update(dt);
        this.cam_offset.z = this.config.cam_offset.z + offset.x;
        this.cam_offset.y = this.config.cam_offset.y + offset.y;

        this.mesh.computeWorldMatrix();
        const globalCameraPos = BABYLON.Vector3.TransformCoordinates(this.cam_offset, this.mesh.getWorldMatrix());

        const intFactor = 1 - Math.pow(2, -dt * this.config.cam_lerp_factor);
        this.camera.position.x += (globalCameraPos.x - this.camera.position.x) * intFactor;
        this.camera.position.y += (globalCameraPos.y - this.camera.position.y) * intFactor;
        this.camera.position.z += (globalCameraPos.z - this.camera.position.z) * intFactor;

        // change target dist based on ship's pitch
        const dx = this.pitch_speed * this.camera_pitch_mult;
        const targetPos = new BABYLON.Vector3(targetDist + dx, 0, 0); // in ship's local coordinates

        const cameraRollAngle = this.yaw_speed * this.camera_yaw_mult - this.roll_speed * this.cam_roll_mult;
        const z = Math.sin(cameraRollAngle);

        const globalTargetPos = BABYLON.Vector3.TransformCoordinates(targetPos, this.mesh.getWorldMatrix());
        const forward = globalTargetPos.subtract(globalCameraPos);
        const right = BABYLON.Vector3.Zero();
        let up = BABYLON.Vector3.Zero();

        const localForward = { x: targetPos.x - this.cam_offset.x, y: targetPos.y - this.cam_offset.y };
        const localUp  = utils.rotateVector2d(localForward, -Math.PI / 2);
        const localUp3d = new BABYLON.Vector3(localUp.x, localUp.y, 0).normalize();
        localUp3d.z = z;

        const upPos = this.cam_offset.add(localUp3d);
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

    firePlasmaShot(pointerInfo) {
        // if (!this.hud.isCursorInTargetField()) {
        //     return;
        // }
        const fwd = {x: 1, y: 0, z: 0};

        this.mesh.computeWorldMatrix();
        const matrix = this.mesh.getWorldMatrix();
        const leftPos = BABYLON.Vector3.TransformCoordinates(this.config.plasma_shot_left_pos, matrix);
        const rightPos = BABYLON.Vector3.TransformCoordinates(this.config.plasma_shot_right_pos, matrix);

        const target = this.hud.getTargetObj();

        const engine = this.scene.getEngine();
        const screenWidth = engine.getRenderWidth();
        const screenHeight = engine.getRenderHeight();

        const targetPos = this.hud.target_pos;
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
        dstPos = dstPos.add(down.scale(7.5));

        const leftDir = dstPos.subtract(leftPos);
        const q1 = utils.quaternionShortestArc(fwd, leftDir);
        this.createPlasmaShot(leftPos, q1, CONST.ENTITY_CLASS_MY_SHOT, target);

        const rightDir = dstPos.subtract(rightPos);
        const q2 = utils.quaternionShortestArc(fwd, rightDir);
        this.createPlasmaShot(rightPos , q2, CONST.ENTITY_CLASS_MY_SHOT, target);
    }

    fireMissile(pointerInfo) {
        if (this.missiles_num <= 0) {
            // TODO: play sound and show warning message
            return;
        }
        this.addMissile(-1);

        const fwd = {x: 0, y: 1, z: 0};

        this.mesh.computeWorldMatrix();
        const matrix = this.mesh.getWorldMatrix();

        const pos = BABYLON.Vector3.TransformCoordinates(this.config.missile_pos, matrix);
        const dir = this.mesh.getDirection(BABYLON.Axis.X).clone();
        const q = utils.quaternionShortestArc(fwd, dir);
        const target = this.hud.getTargetObj();

        this.createMissile(pos, q, CONST.ENTITY_CLASS_MISSILE, target);
    }

    moveForward(dt, isShiftPressed) {
        const accel = this.config.accel_fwd;
        this.accelerate(accel, dt, isShiftPressed);

        const sizes = EFM_SIZES[isShiftPressed ? EFM_MAX : EFM_AVG];
        this.setEngineFlaresMode(sizes);
    }

    moveBackward(dt, isShiftPressed) {
        const accel = this.config.accel_back;
        this.accelerate(accel, dt, isShiftPressed);
    }

    accelerate(accel, dt, isShiftPressed) {
        if (this.energy_value <= 0 || this.energy_state === ENERGY_RED_INC) {
            this.moveInertial(dt);
            return;
        }
        let energy_consumption = this.config.energy.accel_consump;
        if (isShiftPressed) {
            accel *= this.config.turbo_k;
            energy_consumption = this.config.energy.turbo_consump;
        }
        let v = this.vel_fwd + accel * dt;
        v = Math.min(v, this.config.vel_fwd_turbo);
        v = Math.max(v, this.config.vel_fwd_min);
        this.vel_fwd = v;

        this.energy_value = this.energy_value - energy_consumption * dt;
        if (this.energy_value <= this.config.energy.red_zone_value) {
            this.energy_state = ENERGY_RED_DEC;
        }
    }

    moveInertial(dt) {
        const sizes = EFM_SIZES[EFM_MIN];
        this.setEngineFlaresMode(sizes);

        this.energy_value = this.energy_value + this.config.energy.restore_speed * dt;
        if (this.energy_value > this.config.energy.volume) {
            this.energy_value = this.config.energy.volume;
        }
        if (this.energy_value >= this.config.energy.red_zone_value) {
            this.energy_state = ENERGY_GREEN;
        } else {
            this.energy_state = ENERGY_RED_INC;
        }
    }

    restoreArmor(dt) {
        // armor could be restored only if it > 0
        let armor = this.getArmor();
        if (armor > 0) {
            armor += this.config.armor_restore * dt;
            this.setArmor(armor);
        }
    }

    getPlasmaShotDamage() {
        return this.config.plasma_shot_damage;
    }

    init() {
        this.createHud();
        this.addMissile(this.config.missiles_num);
    }

    createHud() {
        this.hud = new PlayerShipGui(this.game, this);
        this.armor_bar = this.hud.getArmorBar();
        this.health_bar= this.hud.getHealthBar();
        this.hud.setInfoPanelVisible(true);
    }

    hideHud() {
        this.hud.hide();
    }

    getEnergyRedZone() {
        return this.config.energy.red_zone_value / this.config.energy.volume;
    }

    getCurEnergy() {
        return this.energy_value;
    }

    getMaxEnergy() {
        return this.config.energy.volume;
    }

    isEnergyInRedZone() {
        return this.energy_state != ENERGY_GREEN;
    }

    update(dt) {
        super.update(dt);

        if (this.isDestroyed()) {
            return;
        }
        /*
        // TODO: restore engine sounds
        if (this.keys_map['KeyW'] || this.keys_map['KeyS']) {
            let engine_main = this.sounds.engine_main;
            if (engine_main && !engine_main.is_playing) {
                engine_main.play(2000, 0, 0.3);
                engine_main.is_playing = true;
            }
        } else {
            let engine_main = this.sounds.engine_main;
            if (engine_main && engine_main.is_playing) {
                engine_main.stop(1000, 0.3, 0);
                engine_main.is_playing = false;
            }
        }
        */

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

        // if (this.sounds.engine_idle && !this.sounds.engine_idle.is_playing) {
        //     this.sounds.engine_idle.play(2000, 0, 0.2);
        //     this.sounds.engine_idle.is_playing = true;
        // }
        this.restoreArmor(dt);
        this.decreaseVelocities(dt);
    }

    clear() {
        this.camera.parent = null;

        this.white_noise_effect.stop();
        this.white_noise_effect.clear();
        this.white_noise_effect = null;

        this.hud.clear();

        super.clear();
    }
}
