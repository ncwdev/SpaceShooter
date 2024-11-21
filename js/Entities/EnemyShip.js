import * as utils from '../Utils/utils.js';

import { ProgressBar3d } from '../Gui/ProgressBar3d.js';
import { SoundManager } from '../Utils/SoundManager.js';

import { Ship } from './Ship.js';

const EFM_SIZES = [ 1.4, 1.5 ];

import enemyConfig from '../Config/EnemyShipCfg.js';

import CONST from '../const.js';

export class EnemyShip extends Ship {
    radarIcon = null;

    aiInterval = null; // interval to update behavior tree

    constructor(game, mesh) {
        super(game, mesh, enemyConfig);

        mesh.isPickable = true;

        this.setArmor(this.config.armor);
        this.setHealth(this.config.health);

        // Create a shape and the associated body. Size will be determined automatically.
        const body = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, this.scene);
        body.setMassProperties({
            mass: enemyConfig.mass,
            inertia: new BABYLON.Vector3(10, 10, 10),
            centerOfMass: new BABYLON.Vector3(0, 0, 0),
        });
        body.setLinearDamping(enemyConfig.linearDamping);
        body.setAngularDamping(enemyConfig.angularDamping);
        body.setCollisionCallbackEnabled(true);
        body.disablePreStep = false;

        body.mfg = { name: 'EnemyShip', entityClass: CONST.ENTITY_CLASS_ENEMY_SHIP, entity: this };

        const shape = new BABYLON.PhysicsShapeCapsule(
            new BABYLON.Vector3(3, 0, 0), // starting point of the cylinder segment
            new BABYLON.Vector3(-11,0, 0), // ending point of the cylinder segment
            5.5, // radius of the cylinder
            this.scene
        );
        const material = {friction: 0.99, restitution: 0.99};
        shape.material = material;
        body.shape = shape;
        this.aggregate = {body: body, shape: shape};

        this.leftFlareParticles = this.createEngineFlares(mesh, enemyConfig.leftFlarePos);
        this.rightFlareParticles = this.createEngineFlares(mesh, enemyConfig.rightFlarePos);

        // debug
        // const lengthOfAxes = 20;
        // const axes = new BABYLON.AxesViewer(this.scene, lengthOfAxes);
        // axes.xAxis.parent = mesh;
        // axes.yAxis.parent = mesh;
        // axes.zAxis.parent = mesh;
    }

    isEnemy() {
        return true;
    }

    getRadarIcon() {
        return this.radarIcon;
    }

    createHud() {
        const hud = this.game.getHud();

        const WIDTH = this.config.healthBarWidth;
        const HEIGHT = this.config.healthBarHeight;
        const ALPHA = this.config.healthBarAlpha;
        const healthBar = new ProgressBar3d(hud.parent, WIDTH, HEIGHT, ALPHA);
        this.healthBar = healthBar;

        const textBlock = new BABYLON.GUI.TextBlock();
        textBlock.text = '[357m]';
        textBlock.color = this.config.hpTextColor;

        const h = this.scene.getEngine().getRenderHeight();
        const TEXT_HEIGHT = this.config.hpTextFontSize;
        textBlock.fontSize = h * TEXT_HEIGHT + 'px';
        textBlock.horizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.verticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
        hud.parent.addControl(textBlock);
        this.radarIcon = textBlock;

        textBlock.widthNumeric = 0.04;
    }

    hideHud() {
        this.healthBar.setVisible(false);
        this.radarIcon.isVisible = false;
    }

    initAI(behaviorTree) {
        const context = {
            scene: this.scene,
            playerShip: this.battleArea.getPlayerShip(),
        };
        Object.assign(context, this.config.ai);

        const AI_TICK = context.AI_TICK;
        this.aiInterval = setInterval(() => {
            if (!this.isDestroyed()) {
                behaviorTree.process(this, context);
            }
        }, AI_TICK);
    }

    update(dt) {
        super.update(dt);

        if (this.isDestroyed()) {
            return;
        }
        // Get the position of the mesh in world coordinates
        const pos = this.mesh.getAbsolutePosition();

        // Convert the world position to screen coordinates
        const engine = this.scene.getEngine();
        const screenWidth = engine.getRenderWidth();
        const screenHeight = engine.getRenderHeight();

        const screenPos = BABYLON.Vector3.Project(
            pos,
            BABYLON.Matrix.Identity(),
            this.scene.getTransformMatrix(),
            this.scene.activeCamera.viewport.toGlobal(screenWidth, screenHeight)
        );
        if (this.healthBar) {
            const isVisible = this.scene.activeCamera.isInFrustum(this.mesh);
            if (isVisible) {
                this.healthBar.setVisible(true);
                this.healthBar.setTop(screenPos.y - screenHeight * 0.5 - screenHeight * this.config.healthBarOffset);
                this.healthBar.setLeft(screenPos.x - screenWidth * 0.5);
            } else {
                this.healthBar.setVisible(false);
            }
        }
        if (this.radarIcon) {
            const playerShip = this.battleArea.getPlayerShip();
            const playerPos = playerShip.getPosition();
            let dist = playerPos.subtract(this.getPosition()).length();
            if (dist >= 1000) {
                dist = dist / 1000;
                this.radarIcon.text = `[${dist.toFixed(1)}km]`;
            } else {
                this.radarIcon.text = `[${dist.toFixed(0)}m]`;
            }
        }
        this.setEngineFlaresMode(EFM_SIZES);
        this.decreaseVelocities(dt);
    }

    turnToPlayerShip(dt) {
        // this.aggregate.body.disablePreStep = false;

        const playerShip = this.battleArea.getPlayerShip();
        const playerPos = playerShip.getPosition();

        const pos = this.getPosition();
        const neededDir = playerPos.clone().subtract(pos);

        const q1 = this.mesh.rotationQuaternion.clone();

        const fwd = {x: 1, y: 0, z: 0};
        let q2 = utils.quaternionShortestArc(fwd, neededDir);
        q2 = new BABYLON.Quaternion(q2.x, q2.y, q2.z, q2.w);

        const ROT_SPEED = this.config.ai.AI_TURN_SPEED;
        const q = BABYLON.Quaternion.Slerp(q1, q2, ROT_SPEED * dt);

        this.mesh.rotationQuaternion = q;
    }

    moveForward(dt) {
        const accel = this.config.accelFwd;
        let v = this.velFwd + accel * dt;

        v = Math.min(v, this.config.velFwdTurbo);
        v = Math.max(v, this.config.velFwdMin);
        this.velFwd = v;
    }

    firePlasmaShot(distToTarget) {
        const fwd = {x: 1, y: 0, z: 0};

        const playerShip = this.battleArea.getPlayerShip();
        const targetPos = playerShip.getPosition().clone();

        const targetDir = targetPos.subtract(this.getPosition()).normalize();
        const fwdDir = this.mesh.getDirection(BABYLON.Axis.X).clone().normalize();
        const scalar = utils.dotProduct3d(targetDir, fwdDir);

        const MAX_DOT_PRODUCT = this.config.maxAngleToFire;
        if (scalar < MAX_DOT_PRODUCT) {
            return;
        }
        this.mesh.computeWorldMatrix();
        const matrix = this.mesh.getWorldMatrix();
        const leftPos = BABYLON.Vector3.TransformCoordinates(this.config.plasmaShotLeftPos, matrix);
        const rightPos = BABYLON.Vector3.TransformCoordinates(this.config.plasmaShotRightPos, matrix);

        let target = playerShip;
        const TOO_CLOSE_DIST = this.config.stopFireDistance;
        if (distToTarget < TOO_CLOSE_DIST) {
            target = null;
        }
        const dir1 = targetPos.subtract(leftPos);
        const q1 = utils.quaternionShortestArc(fwd, dir1);
        this.createPlasmaShot(leftPos, q1, CONST.ENTITY_CLASS_ENEMY_SHOT, target);

        const dir2 = targetPos.subtract(rightPos);
        const q2 = utils.quaternionShortestArc(fwd, dir2);
        this.createPlasmaShot(rightPos, q2, CONST.ENTITY_CLASS_ENEMY_SHOT, target);

        const clone = SoundManager.cloneSound(SoundManager.SND_PLASMA_ENEMY);
        if (clone) {
            clone.attachToMesh(this.mesh);
            clone.play();
            setTimeout(() => clone.dispose(), 1000);
        }
    }

    getPlasmaShotDamage() {
        return this.config.plasmaShotDamage;
    }

    clear() {
        this.radarIcon.dispose();
        this.radarIcon = null;

        if (this.aiInterval) {
            clearInterval(this.aiInterval);
            this.aiInterval = null;
        }
        super.clear();
    }
}
