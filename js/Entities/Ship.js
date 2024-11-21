import * as utils from '../Utils/utils.js';
import * as DamageEffect from '../Effects/DamageEffect.js';
import * as EngineFlaresEffect from '../Effects/EngineFlaresEffect.js';

import { Missile } from './Missile.js';
import { PlasmaShot } from './PlasmaShot.js';

export class Ship {
    game = null;
    scene = null;
    battleArea = null;

    mesh = null;
    aggregate = null;

    config = null;

    velFwd = 0; // velocity along the main axis, keys W and S
    velSide = 0; // velocity perpendicular to the main axis, keys A and D
    rollSpeed = 0; // keys Q and E
    yawSpeed = 0; // yaw and pitch changes with mouse
    pitchSpeed = 0;

    sounds = {};

    leftFlareParticles = null;
    rightFlareParticles = null;

    plasmaShots = {};
    plasmaShotsCount = 0;

    health = 0;
    healthBar = null;

    armor = 0;
    armorBar = null;

    missilesNum = 0;

    addMissile(num) {
        this.missilesNum += num;
    }

    #isDestroyed = false;

    setDestroyed(flag) {
        this.#isDestroyed = flag;
    }

    isDestroyed() {
        return this.#isDestroyed;
    }

    constructor(game, mesh, config) {
        this.game = game;
        this.scene = game.getScene();
        this.battleArea = game.getBattleArea();
        this.mesh = mesh;
        this.config = config;

        mesh.receiveShadows = true;
        mesh.checkCollisions = true;
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

        if (this.healthBar) {
            this.updateHealthBar();
        }
    }

    getHealth() {
        return this.health;
    }

    updateHealthBar() {
        const progress = this.health / this.config.health;
        this.healthBar.setProgress(progress);
    }

    setArmor(value) {
        if (isNaN(value) || value < 0) {
            value = 0;
        }
        if (value > this.config.armor) {
            value = this.config.armor;
        }
        this.armor = value;

        if (this.armorBar) {
            this.updateArmorBar();
        }
    }

    getArmor() {
        return this.armor;
    }

    updateArmorBar() {
        const progress = this.armor / this.config.armor;
        this.armorBar.setProgress(progress);
    }

    getFwdVelocity() {
        return this.velFwd;
    }

    getMaxVelocity() {
        return this.config.velFwdTurbo;
    }

    getMinVelocity() {
        return this.config.velFwdMin;
    }

    createEngineFlares(mesh, position) {
        return EngineFlaresEffect.create(this.scene, mesh, position);
    }

    setEngineFlaresMode(sizes) {
        this.leftFlareParticles.minSize = sizes[0];
        this.leftFlareParticles.maxSize = sizes[1];

        this.rightFlareParticles.minSize = sizes[0];
        this.rightFlareParticles.maxSize = sizes[1];
    }

    createPlasmaShot(pos, quaternion, entityClass, target) {
        const shot = new PlasmaShot(this.game, this.plasmaShotsCount, this, target);
        shot.init(pos, quaternion, entityClass);

        const id = shot.getId();
        this.plasmaShots[id] = shot;
        this.plasmaShotsCount++;
        return shot;
    }

    deletePlasmaShot(id) {
        const shot = this.plasmaShots[id];
        delete this.plasmaShots[id];
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

    createMissile(pos, quaternion, entityClass, target) {
        const shot = new Missile(this.game, this.plasmaShotsCount, this, target);
        shot.init(pos, quaternion, entityClass);
        const id = shot.getId();

        this.plasmaShots[id] = shot;
        this.plasmaShotsCount++;
        return shot;
    }

    roll(isLeft, dt) {
        const side = isLeft ? 1 : -1;

        let v = this.rollSpeed + side * this.config.rollAccel * dt;
        v = utils.clamp(v, this.config.rollSpeedMin, this.config.rollSpeedMax);
        this.rollSpeed = v;
    }

    yawPitch(yaw, pitch, dt) {
        // linear dependency
        let yaw2 = yaw * this.config.yawMult;
        yaw2 = Math.min(yaw2, this.config.yawSpeedMax);
        yaw2 = Math.max(yaw2, -this.config.yawSpeedMax);

        const TINY = 0.01;
        const deltaYaw = yaw2 - this.yawSpeed;
        if (Math.abs(deltaYaw) > TINY) {
            if (deltaYaw > 0) {
                this.yawSpeed += this.config.yawAccel * dt;
            } else {
                this.yawSpeed -= this.config.yawAccel * dt;
            }
        } else {
            this.yawSpeed = yaw2;
        }
        let pitch2 = pitch * this.config.pitchMult;
        pitch2 = Math.min(pitch2, this.config.pitchSpeedMax);
        pitch2 = Math.max(pitch2, -this.config.pitchSpeedMax);

        const deltaPitch = pitch2 - this.pitchSpeed;
        if (Math.abs(deltaPitch) > TINY) {
            if (deltaPitch > 0) {
                this.pitchSpeed += this.config.pitchAccel * dt;
            } else {
                this.pitchSpeed -= this.config.pitchAccel * dt;
            }
        } else {
            this.pitchSpeed = pitch2;
        }
    }

    stopYawAndPitch(dt) {
        const TINY = 0.001;
        const rotDecreasing = this.config.rotDecreasing;
        const changeSpeed = rotDecreasing * dt;

        this.yawSpeed = utils.decreaseValueToZero(this.yawSpeed, TINY, changeSpeed);
        this.pitchSpeed = utils.decreaseValueToZero(this.pitchSpeed, TINY, changeSpeed);
    }

    moveSide(isLeft, dt) {
        const side = isLeft ? 1 : -1;

        let v = this.velSide + side * this.config.accelSide * dt;
        v = Math.min(v, this.config.velSideMax);
        v = Math.max(v, -this.config.velSideMax);
        this.velSide = v;
    }

    update(dt) {
        for (const id in this.plasmaShots) {
            const shot = this.plasmaShots[id];
            const isAlive = shot.update(dt);
            if (!isAlive) {
                delete this.plasmaShots[id];
                shot.clear();
            }
        }
        if (this.#isDestroyed) {
            return;
        }
        // moving
        let impulseDir = BABYLON.Vector3.Zero();

        const dir = this.mesh.getDirection(BABYLON.Axis.X).clone();
        impulseDir = impulseDir.add(dir.scale(this.velFwd));

        // get ship's right vector and multiply by side velocity
        const sideDir = this.mesh.getDirection(BABYLON.Axis.Z).clone();
        impulseDir = impulseDir.add(sideDir.scale(this.velSide));

        this.aggregate.body.setLinearVelocity(impulseDir);

        // rotations
        let rotVel = this.mesh.getDirection(BABYLON.Axis.X).clone();
        rotVel = rotVel.scale(this.rollSpeed);

        let yawVel = this.mesh.getDirection(BABYLON.Axis.Y).clone();
        yawVel = yawVel.scale(this.yawSpeed);
        rotVel = rotVel.add(yawVel);

        let pitchVel = this.mesh.getDirection(BABYLON.Axis.Z).clone();
        pitchVel = pitchVel.scale(this.pitchSpeed);
        rotVel = rotVel.add(pitchVel);

        this.aggregate.body.setAngularVelocity(rotVel);
    }

    decreaseVelocities(dt) {
        const DECREASING_K = this.config.decVelK;
        const TINY_SIDE = 0.05;

        this.velFwd = utils.decreaseValueToZero(this.velFwd, TINY_SIDE, this.config.accelFwd * DECREASING_K * dt);
        this.velSide = utils.decreaseValueToZero(this.velSide, TINY_SIDE, this.config.accelSide * DECREASING_K * dt);

        const TINY = 0.001;
        this.rollSpeed = utils.decreaseValueToZero(this.rollSpeed, TINY, this.config.rollAccel * DECREASING_K * dt);
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
        this.leftFlareParticles.stop();
        this.leftFlareParticles.dispose(true);

        this.rightFlareParticles.stop();
        this.rightFlareParticles.dispose(true);

        for (const id in this.plasmaShots) {
            const shot = this.plasmaShots[id];
            shot.clear();
        }
        this.plasmaShots = {};

        this.game = null;
        this.scene = null;

        if (this.healthBar) {
            this.healthBar.clear();
            this.healthBar = null;
        }
        if (this.aggregate.shape) {
            this.aggregate.shape.dispose();
        }
        if (this.aggregate.body) {
            this.aggregate.body.dispose();
        }
        this.aggregate = null;

        this.mesh.dispose(false, true); // with textures and materials
        this.mesh = null;
    }
}
