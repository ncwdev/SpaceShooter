import * as utils from '../Utils/utils.js';

// import { SoundEffect } from './Effects/SoundEffect.js';
import { PlasmaShot }  from './PlasmaShot.js';

import * as DamageEffect from '../Effects/DamageEffect.js';
import * as EngineFlaresEffect from '../Effects/EngineFlaresEffect.js';
import { Missile } from './Missile.js';

export class Ship {
    game = null;
    scene = null;
    battleArea = null;

    mesh = null;
    aggregate = null;

    config = null;

    vel_fwd = 0;        // velocity along the main axis, keys W and S
    vel_side = 0;       // velocity perpendicular to the main axis, keys A and D
    roll_speed = 0;     // keys Q and E
    yaw_speed = 0;      // yaw and pitch changes with mouse
    pitch_speed = 0;

    sounds = {};
    sounds_volume = 0.2;

    left_flare_particles = null;
    right_flare_particles= null;

    plasma_shots = {};
    plasma_shots_count = 0;

    health = 0;
    health_bar = null;

    armor = null;
    armor_bar = null;

    missiles_num = 0;

    addMissile(num) {
        this.missiles_num += num;
    }

    is_destroyed = false;

    setDesroyed(flag) {
        this.is_destroyed = flag;
    }

    isDestroyed() {
        return this.is_destroyed;
    }

    constructor(game, mesh, config) {
        this.game  = game;
        this.scene = game.getScene();
        this.battleArea = game.getBattleArea();
        this.mesh  = mesh;
        this.config= config;

        mesh.receiveShadows = true;
        mesh.checkCollisions= true;
        mesh.setEnabled(true);
    }

    getMesh() {
        return this.mesh;
    }

    getBody() {
        return this.aggregate.body;
    }

    getConfig() {
        return this.config;
    }

    setPosition(pos) {
        this.mesh.position = pos;
    }

    getPosition() {
        return this.mesh.position;
    }

    setQuaternion(q) {
        this.mesh.rotationQuaternion = q;
    }

    getBoundingRadius() {
        const info = this.mesh.getBoundingInfo();
        return info.boundingSphere.radius;
    }

    setHealth(value) {
        if (isNaN(value) || value < 0) {
            value = 0;
        }
        if (value > this.config.health) {
            value = this.config.health;
        }
        this.health = value;

        if (this.health_bar) {
            this.updateHealthBar();
        }
    }

    getHealth() {
        return this.health;
    }

    updateHealthBar() {
        const progress = this.health / this.config.health;
        this.health_bar.setProgress(progress);
    }

    setArmor(value) {
        if (isNaN(value) || value < 0) {
            value = 0;
        }
        if (value > this.config.armor) {
            value = this.config.armor;
        }
        this.armor = value;

        if (this.armor_bar) {
            this.updateArmorBar();
        }
    }

    getArmor() {
        return this.armor;
    }

    updateArmorBar() {
        const progress = this.armor / this.config.armor;
        this.armor_bar.setProgress(progress);
    }

    getFwdVelocity() {
        return this.vel_fwd;
    }

    getMaxVelocity() {
        return this.config.vel_fwd_turbo;
    }

    getMinVelocity() {
        return this.config.vel_fwd_min;
    }

    createEngineFlares(mesh, position) {
        return EngineFlaresEffect.create(this.scene, mesh, position);
    }

    setEngineFlaresMode(sizes) {
        this.left_flare_particles.minSize = sizes[0];
        this.left_flare_particles.maxSize = sizes[1];

        this.right_flare_particles.minSize = sizes[0];
        this.right_flare_particles.maxSize = sizes[1];
    }

    createPlasmaShot(pos, quaternion, entity_class, target) {
        const shot = new PlasmaShot(this.game, this.plasma_shots_count, this, target);
        shot.init(pos, quaternion, entity_class);

        const id = shot.getId();
        this.plasma_shots[id] = shot;
        this.plasma_shots_count++;
        return shot;
    }

    deletePlasmaShot(id) {
        const shot = this.plasma_shots[id];
        delete this.plasma_shots[id];
        shot.clear();
    }

    takeDamage(damage) {
        const effect = DamageEffect.create(this.scene, this.mesh);
        setTimeout(() => {
            effect.dispose();
        }, 500);

        let armor = this.getArmor();
        if (armor > 0) {
            armor -= damage;
            if (armor < 0) {
                armor = 0;
            }
            this.setArmor(armor);
            return;
        }
        this.setHealth(this.getHealth() - damage);
    }

    createMissile(pos, quaternion, entity_class, target) {
        const shot = new Missile(this.game, this.plasma_shots_count, this, target);
        shot.init(pos, quaternion, entity_class);
        const id = shot.getId();

        this.plasma_shots[id] = shot;
        this.plasma_shots_count++;
        return shot;
    }

    roll(is_left, dt) {
        const side = is_left ? 1 : -1;

        let v = this.roll_speed + side * this.config.roll_accel * dt;
        v = utils.clamp(v, this.config.roll_speed_min, this.config.roll_speed_max);
        this.roll_speed = v;
    }

    yawPitch(yaw, pitch, dt) {
        // linear dependency
        let yaw2 = yaw * this.config.yaw_mult;
        yaw2 = Math.min(yaw2, this.config.yaw_speed_max);
        yaw2 = Math.max(yaw2,-this.config.yaw_speed_max);

        const TINY = 0.01;
        const delta_yaw = yaw2 - this.yaw_speed;
        if (Math.abs(delta_yaw) > TINY) {
            if (delta_yaw > 0) {
                this.yaw_speed += this.config.yaw_accel * dt;
            } else {
                this.yaw_speed -= this.config.yaw_accel * dt;
            }
        } else {
            this.yaw_speed = yaw2;
        }
        let pitch2 = pitch * this.config.pitch_mult;
        pitch2 = Math.min(pitch2, this.config.pitch_speed_max);
        pitch2 = Math.max(pitch2,-this.config.pitch_speed_max);

        const delta_pitch = pitch2 - this.pitch_speed;
        if (Math.abs(delta_pitch) > TINY) {
            if (delta_pitch > 0) {
                this.pitch_speed += this.config.pitch_accel * dt;
            } else {
                this.pitch_speed -= this.config.pitch_accel * dt;
            }
        } else {
            this.pitch_speed = pitch2;
        }
    }

    stopYawAndPitch(dt) {
        const TINY = 0.001;
        const rot_decreasing = this.config.rot_decreasing;
        const change_speed = rot_decreasing * dt;

        this.yaw_speed  = utils.decreaseValueToZero(this.yaw_speed,  TINY, change_speed);
        this.pitch_speed= utils.decreaseValueToZero(this.pitch_speed,TINY, change_speed);
    }

    moveSide(is_left, dt) {
        const side = is_left ? 1 : -1;

        let v = this.vel_side + side * this.config.accel_side * dt;
        v = Math.min(v, this.config.vel_side_max);
        v = Math.max(v, this.config.vel_side_min);
        this.vel_side = v;
    }

    update(dt) {
        for (const id in this.plasma_shots) {
            const shot = this.plasma_shots[id];
            const isAlive = shot.update(dt);
            if (!isAlive) {
                delete this.plasma_shots[id];
                shot.clear();
            }
        }
        if (this.isDestroyed()) {
            return;
        }
        // moving
        let impulse_dir = BABYLON.Vector3.Zero();

        const dir = this.mesh.getDirection(BABYLON.Axis.X).clone();
        impulse_dir = impulse_dir.add(dir.scale(this.vel_fwd));

        // get ship's right vector and multiply by side velocity
        const side_dir = this.mesh.getDirection(BABYLON.Axis.Z).clone();
        impulse_dir = impulse_dir.add(side_dir.scale(this.vel_side));

        this.aggregate.body.setLinearVelocity(impulse_dir);

        // rotations
        let rot_vel = this.mesh.getDirection(BABYLON.Axis.X).clone();
        rot_vel = rot_vel.scale(this.roll_speed);

        let yaw_vel = this.mesh.getDirection(BABYLON.Axis.Y).clone();
        yaw_vel = yaw_vel.scale(this.yaw_speed);
        rot_vel = rot_vel.add(yaw_vel);

        let pitch_vel = this.mesh.getDirection(BABYLON.Axis.Z).clone();
        pitch_vel = pitch_vel.scale(this.pitch_speed);
        rot_vel = rot_vel.add(pitch_vel);

        this.aggregate.body.setAngularVelocity(rot_vel);
    }

    decreaseVelocities(dt) {
        const DECREASING_K = this.config.dec_vel_k;
        const TINY_SIDE = 0.05;

        this.vel_fwd = utils.decreaseValueToZero(this.vel_fwd, TINY_SIDE, this.config.accel_fwd * DECREASING_K * dt);
        this.vel_side= utils.decreaseValueToZero(this.vel_side,TINY_SIDE, this.config.accel_side* DECREASING_K * dt);

        const TINY = 0.001;
        this.roll_speed = utils.decreaseValueToZero(this.roll_speed, TINY, this.config.roll_accel * DECREASING_K * dt);
    }

    destroy() {
        // ship was blown up - make invisible
        if (this.mesh) {
            this.mesh.isVisible = false;
            this.mesh.setEnabled(false);

            if (this.aggregate.shape) {
                this.aggregate.shape.dispose();
                this.aggregate.shape = null;
            }
            if (this.aggregate.body) {
                this.aggregate.body.dispose();
                this.aggregate.body = null;
            }
        }
    }

    clear() {
        if (!this.mesh) {
            return;
        }
        for (const id in this.sounds) {
            const sound = this.sounds[id];
            sound.dispose();
        }
        this.left_flare_particles.stop();
        this.left_flare_particles.dispose(true);

        this.right_flare_particles.stop();
        this.right_flare_particles.dispose(true);

        for (const id in this.plasma_shots) {
            const shot = this.plasma_shots[id];
            shot.clear();
        }
        this.plasma_shots = {};

        this.game  = null;
        this.scene = null;

        if (this.health_bar) {
            this.health_bar.clear();
            this.health_bar = null;
        }
        if (this.aggregate.shape) {
            this.aggregate.shape.dispose();
        }
        if (this.aggregate.body) {
            this.aggregate.body.dispose();
        }
        this.aggregate = null;

        this.mesh.dispose(false, true);  // with textures and materials
        this.mesh = null;
    }
}
