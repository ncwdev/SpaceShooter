import * as utils from '../Utils/utils.js';

//import {SoundEffect} from './Effects/SoundEffect.js';
import { ProgressBar3d } from '../Gui/ProgressBar3d.js';

import { Ship } from './Ship.js';

const EFM_SIZES = [ 1.4, 1.5 ];

import enemy_config from '../Config/EnemyShipCfg.js';

export class EnemyShip extends Ship {
    radarIcon = null;

    getRadarIcon() {
        return this.radarIcon;
    }

    aiInterval = null; // interval to update behavior tree

    constructor(game, mesh) {
        super(game, mesh, enemy_config);

        mesh.isPickable = true;

        this.setArmor (this.config.armor);
        this.setHealth(this.config.health);

        // Create a shape and the associated body. Size will be determined automatically.
        const body = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, this.scene);
        body.setMassProperties({
            mass: enemy_config.mass, // 100
            inertia: new BABYLON.Vector3(10, 10, 10),
            centerOfMass: new BABYLON.Vector3(0, 0, 0),
        });
        body.setLinearDamping(enemy_config.linear_damping);
        body.setAngularDamping(enemy_config.angular_damping);
        body.setCollisionCallbackEnabled(true);
        body.disablePreStep = false;

        body.mfg = { name: 'EnemyShip', entity_class: ENTITY_CLASS_ENEMY_SHIP, entity: this };

        const shape = new BABYLON.PhysicsShapeCapsule(
            new BABYLON.Vector3(3, 0, 0),   // starting point of the cylinder segment
            new BABYLON.Vector3(-11,0, 0),  // ending point of the cylinder segment
            5.5,                            // radius of the cylinder
            this.scene
        );
        const material = {friction: 0.99, restitution: 0.99};
        shape.material = material;
        body.shape = shape;
        this.aggregate = {body: body, shape: shape};

        this.left_flare_particles = this.createEngineFlares(mesh, enemy_config.left_flare_pos);
        this.right_flare_particles= this.createEngineFlares(mesh, enemy_config.right_flare_pos);

        // debug
        // const length_of_axes = 20;
        // const axes = new BABYLON.AxesViewer(this.scene, length_of_axes);
        // axes.xAxis.parent = mesh;
        // axes.yAxis.parent = mesh;
        // axes.zAxis.parent = mesh;
    }

    isEnemy() {
        return true;
    }

    createHud() {
        const hud = this.game.getHud();

        const WIDTH = this.config.health_bar_width;
        const HEIGHT= this.config.health_bar_height;
        const ALPHA = this.config.health_bar_alpha;
        const health_bar = new ProgressBar3d(hud.parent, WIDTH, HEIGHT, ALPHA);
        this.health_bar = health_bar;

        const textBlock = new BABYLON.GUI.TextBlock();
        textBlock.text = '[357m]';
        textBlock.color = this.config.hp_text_color;

        const h = this.scene.getEngine().getRenderHeight();
        const TEXT_HEIGHT = this.config.hp_text_font_size;
        textBlock.fontSize = h * TEXT_HEIGHT + 'px';
        textBlock.horizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        textBlock.verticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
        hud.parent.addControl(textBlock);
        this.radarIcon = textBlock;

        textBlock.width_numeric = 0.04;
    }

    hideHud() {
        this.health_bar.setVisible(false);
        this.radarIcon.isVisible = false;
    }

    initAI(behaviorTree) {
        const context = {
            scene: this.scene,
            player_ship: this.battle_area.getPlayerShip(),
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

        const screen_pos = BABYLON.Vector3.Project(
            pos,
            BABYLON.Matrix.Identity(),
            this.scene.getTransformMatrix(),
            this.scene.activeCamera.viewport.toGlobal(screenWidth, screenHeight)
        );
        if (this.health_bar) {
            const is_visible = this.scene.activeCamera.isInFrustum(this.mesh);
            if (is_visible) {
                this.health_bar.setVisible(true);
                this.health_bar.setTop(screen_pos.y - screenHeight * 0.5 - screenHeight * this.config.health_bar_offset);
                this.health_bar.setLeft(screen_pos.x - screenWidth * 0.5);
            } else {
                this.health_bar.setVisible(false);
            }
        }
        if (this.radarIcon) {
            const playerShip = this.battle_area.getPlayerShip();
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
        //this.aggregate.body.disablePreStep = false;

        const playerShip = this.battle_area.getPlayerShip();
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
        const accel = this.config.accel_fwd;
        let v = this.vel_fwd + accel * dt;

        v = Math.min(v, this.config.vel_fwd_turbo);
        v = Math.max(v, this.config.vel_fwd_min);
        this.vel_fwd = v;
    }

    firePlasmaShot(distToTarget) {
        const fwd = {x: 1, y: 0, z: 0};

        const playerShip = this.battle_area.getPlayerShip();
        const targetPos = playerShip.getPosition().clone();

        const targetDir = targetPos.subtract(this.getPosition()).normalize();
        const fwdDir = this.mesh.getDirection(BABYLON.Axis.X).clone().normalize();
        const scalar = utils.dotProduct3d(targetDir, fwdDir);

        const MAX_DOT_PRODUCT = this.config.max_angle_to_fire;
        if (scalar < MAX_DOT_PRODUCT) {
            return;
        }
        this.mesh.computeWorldMatrix();
        const matrix = this.mesh.getWorldMatrix();
        const leftPos = BABYLON.Vector3.TransformCoordinates(this.config.plasma_shot_left_pos,  matrix);
        const rightPos = BABYLON.Vector3.TransformCoordinates(this.config.plasma_shot_right_pos, matrix);

        let target = playerShip;
        const TOO_CLOSE_DIST = this.config.stop_fire_distance;
        if (distToTarget < TOO_CLOSE_DIST) {
            target = null;
        }
        const dir1 = targetPos.subtract(leftPos);
        const q1 = utils.quaternionShortestArc(fwd, dir1);
        this.createPlasmaShot(leftPos, q1, ENTITY_CLASS_ENEMY_SHOT, target);

        const dir2 = targetPos.subtract(rightPos);
        const q2 = utils.quaternionShortestArc(fwd, dir2);
        this.createPlasmaShot(rightPos, q2, ENTITY_CLASS_ENEMY_SHOT, target);
    }

    getPlasmaShotDamage() {
        return this.config.plasma_shot_damage;
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
