import * as utils from '../Utils/utils.js';
import * as dbg from '../Utils/DebugPanel.js';

import { Octree } from '../Utils/Octree.js';

import { PlayerShip } from './PlayerShip.js';
import { EnemyShip } from './EnemyShip.js';
import { Asteroid } from './Asteroid.js';
import { PlasmaShot } from './PlasmaShot.js';
import { Missile } from './Missile.js';
import { LootBox } from './LootBox.js';

import { SpaceDustEffect } from '../Effects/SpaceDustEffect.js';
import * as ExplosionEffect from '../Effects/ExplosionEffect.js';

import { enemy_bt } from '../AI/EnemyBehavior.js';
import { TreeBuilder } from '../BehaviorTree/TreeBuilder.js';

import CONST from '../const.js';

// contains player's ship, enemy ships, asteroids, space dust
// uses physics engine to detect collisions between plasma shots and ships
export class BattleArea {
    scene = null;
    game = null;
    config = null;

    getScene() {
        return this.scene;
    }

    space_radius_min = 100;
    space_radius_max = 500;

    isMaxRadiusExit(pos) {
        const distance_to_center = pos.length();

        dbg.setDistanceToCenter(distance_to_center);

        return distance_to_center > this.space_radius_max;
    }

    isPlasmaShotTooFar(pos) {
        const distance_to_center = pos.length();
        return distance_to_center > this.space_radius_max * 2;
    }

    octree = null;

    player_ship = null;

    getPlayerShip() {
        return this.player_ship;
    }

    parent_meshes = []; // parents for all mesh instances and clones (enemy, asteroids, plasma shots, missiles)

    loot_box_mesh = null; // parent for loot boxes
    missileMesh = null; // parent for missiles

    enemiesNumber = 0;
    enemies = [];

    asteroids_num = 0;
    asteroids = [];

    loot_boxes = new Map();

    dust_particles = null;

    havok_plugin = null;
    collision_observer = null;

    need_to_show_tutor = true;

    constructor(game, config) {
        this.game  = game;
        this.scene = game.getScene();
        this.config= config;

        this.asteroids_num = config.asteroids_num;
        this.space_radius_min = config.radius_min;
        this.space_radius_max = config.radius_max;

        const min = { x: -this.space_radius_min, y: -this.space_radius_min, z: -this.space_radius_min };
        const max = { x:  this.space_radius_min, y:  this.space_radius_min, z:  this.space_radius_min };
        this.octree = new Octree(min, max);
    }

    getEnemies() {
        return this.enemies;
    }

    getEnemiesCount() {
        return this.enemiesNumber;
    }

    async initPhysics() {
        //const havokInstance = await HavokPhysics();
        this.havok_plugin = new BABYLON.HavokPlugin(true, havokInstance);

        const gravity = new BABYLON.Vector3(0, 0, 0);
        const result = this.scene.enablePhysics(gravity, this.havok_plugin);
        if (result) {
            console.log('Physics engine enabled');
        } else {
            console.log('Physics engine could not be enabled');
        }
        const observable = this.havok_plugin.onCollisionObservable;
        this.collision_observer = observable.add(this.onCollisionHandler.bind(this));
    }

    disposePhysics() {
        const observable = this.havok_plugin.onCollisionObservable;
        observable.remove(this.collision_observer);
        this.collision_observer = null;

        this.scene.disablePhysicsEngine();
        this.havok_plugin = null;
    }

    async spawnEntities() {
        let mesh_data = meshes_list.MyShip;
        let result = await BABYLON.SceneLoader.ImportMeshAsync('', mesh_data.path, mesh_data.file, this.scene);
        this.instancePlayerShip(result);

        mesh_data = meshes_list.EnemyShip;
        result = await BABYLON.SceneLoader.ImportMeshAsync('', mesh_data.path, mesh_data.file, this.scene);
        this.instanceEnemyShips(result, this.enemiesNumber);

        // create a bunch of asteroids - use all 6 models
        const asteroids = meshes_list.Asteroids;
        asteroids.forEach( ast_data => {
            BABYLON.SceneLoader.ImportMesh('', ast_data.path, ast_data.file, this.scene, this.instanceAsteroids.bind(this));
        });

        mesh_data = meshes_list.LootBox;
        result = await BABYLON.SceneLoader.ImportMeshAsync('', mesh_data.path, mesh_data.file, this.scene);
        this.instanceLootBox(result);

        mesh_data = meshes_list.Missile;
        result = await BABYLON.SceneLoader.ImportMeshAsync('', mesh_data.path, mesh_data.file, this.scene);
        this.instanceMissile(result);

        const parents = PlasmaShot.getParentMeshAndShape(this.scene);
        this.parent_meshes.push(...parents);

        //console.log(this.parent_meshes);
    }

    instancePlayerShip(data) {
        // place ship in 80% distance from center to min radius
        const mesh = data.meshes[0];
        this.warpShipToRadius(mesh, this.config.pl_ship_spawn_radius);

        this.octree.addMesh(mesh);

        this.player_ship = new PlayerShip(this.game, mesh);
    }

    instanceLootBox(data) {
        const mesh = data.meshes[0];
        mesh.checkCollisions = true;
        mesh.isPickable = false;
        mesh.material.transparencyMode = 0; // OPAQUE = 0
        mesh.setEnabled(false);

        this.loot_box_mesh = mesh;
        this.parent_meshes.push(mesh);
    }

    instanceMissile(data) {
        const mesh = data.meshes[0];
        mesh.setEnabled(false);
        this.missileMesh = mesh;
        this.parent_meshes.push(mesh);
    }

    instanceEnemyShips(data, number) {
        // create a bunch of enemy ships in random positions with fixed radius
        const parentMesh = data.meshes[0];
        parentMesh.isVisible = false;
        this.parent_meshes.push(parentMesh);

        const ship_min_dist = this.config.spawn_ships_min_dist; // minimal distance between ships = 250
        const radius = this.space_radius_min * this.config.spawn_enemies_radius;    // 0.8;

        // create in random positions using octree
        for (let i = 0; i < number; ++i) {
            // make maximum 10 attempts
            for (let j = 0; j < 10; ++j) {
                const pos = utils.getRandomSphereRadiusPos(radius);

                if (!this.octree.findClosestObject(pos, ship_min_dist)) {
                    // use clones because we need to set shaders to every instance
                    const mesh = parentMesh.clone(parentMesh.name + i);
                    mesh.isVisible = true;
                    mesh.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);

                    const ship = new EnemyShip(this.game, mesh);
                    mesh.mfg = {entity_class: CONST.ENTITY_CLASS_ENEMY_SHIP, entity: ship};
                    this.enemies.push(ship);

                    this.octree.addMesh(mesh);
                    break;
                }
            }
        }
    }

    instanceAsteroids(newMeshes) {
        const parentMesh = newMeshes[0];
        parentMesh.receiveShadows = true;
        parentMesh.checkCollisions= true;
        parentMesh.isVisible = false;
        this.parent_meshes.push(parentMesh);

        console.log('instanceAsteroids() entered', parentMesh.name);

        const ast_min_dist = this.config.spawn_asteroids_min_dist;  // minimal distance between asteroids = 250

        // create in random positions using octree
        for (let i = 0; i < this.asteroids_num; ++i) {
            // make maximum 10 attempts
            for (let j = 0; j < 10; ++j) {
                const pos = utils.getRandomSpherePos(this.space_radius_min);

                if (!this.octree.findClosestObject(pos, ast_min_dist)) {
                    const mesh = parentMesh.createInstance(parentMesh.name + i);
                    mesh.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);

                    const ast = new Asteroid(this.scene, mesh);
                    this.asteroids.push(ast);

                    this.octree.addMesh(mesh);
                    break;
                }
            }
        }
    }

    isReady() {
        // check if all asteroids is ready
        return this.asteroids.every( ast => ast.getMesh().isReady(true, true) );
    }

    warpShipToRadius(mesh, dist_from_center) {
        const pos = utils.getRandomSphereRadiusPos(dist_from_center * this.space_radius_min);
        mesh.position = pos;

        // turn ship to origin of coordinates - just invert pos
        const dir = utils.mult3d(pos, -1);
        const fwd = {x: 1, y: 0, z: 0};
        let q = utils.quaternionShortestArc(fwd, dir);
        q = new BABYLON.Quaternion(q.x, q.y, q.z, q.w);
        mesh.rotationQuaternion = q;

        return pos;
    }

    createSpaceDust() {
        const DUST_CLOUD_RADIUS = this.config.dust_cloud_radius;    // 250
        this.dust_particles = new SpaceDustEffect(this.player_ship.mesh, DUST_CLOUD_RADIUS, this.scene);
        this.dust_particles.start();
    }

    startBattle() {
        this.createSpaceDust();

        this.player_ship.init();

        const bt = TreeBuilder.createTree(enemy_bt);
        this.enemies.forEach( enemy => {
            enemy.createHud();
            enemy.initAI(bt);
        });
    }

    onMissileCollided(data, forceExplosion = false) {
        const shot_id = data.id;
        const missile = data.entity;
        const owner   = data.owner;

        if (missile.getLifeTime() < this.config.time_missile_no_collision && !forceExplosion) {
            return;
        }
        this.explodeMissile(missile.getPosition());
        owner.deletePlasmaShot(shot_id);
    }

    onPlayerHitLootBox(loot_box) {
        const id = loot_box.getId();
        loot_box.clear();

        this.loot_boxes.delete(id);
        this.player_ship.addMissile(1);
    }

    onCollisionHandler(event) {
        if (!event.collider.mfg || !event.collidedAgainst.mfg) {
            return;
        }
        if (event.collider.mfg.entity_class === CONST.ENTITY_CLASS_MISSILE) {
            this.onMissileCollided(event.collider.mfg);
            return;
        }
        if (event.collidedAgainst.mfg.entity_class === CONST.ENTITY_CLASS_MISSILE) {
            this.onMissileCollided(event.collidedAgainst.mfg);
            return;
        }
        if (event.collider.mfg.entity_class === CONST.ENTITY_CLASS_ASTEROID &&
            event.collidedAgainst.mfg.entity_class == CONST.ENTITY_CLASS_MY_SHOT)
        {
            const shot_id = event.collidedAgainst.mfg.id;
            this.player_ship.deletePlasmaShot(shot_id);
            return;
        }
        // enemy hit
        if (event.collider.mfg.entity_class === CONST.ENTITY_CLASS_ENEMY_SHIP &&
            event.collidedAgainst.mfg.entity_class == CONST.ENTITY_CLASS_MY_SHOT)
        {
            const shot_id = event.collidedAgainst.mfg.id;
            this.player_ship.deletePlasmaShot(shot_id);

            const ship = event.collider.mfg.entity;
            const damage = this.player_ship.getPlasmaShotDamage();
            ship.takeDamage(damage);

            const hp = ship.getHealth();
            if (hp <= 0) {
                this.destroyEnemyShip(ship);
            }
            return;
        }
        // enemy hits player's ship
        if (event.collider.mfg.entity_class === CONST.ENTITY_CLASS_MY_SHIP &&
            event.collidedAgainst.mfg.entity_class == CONST.ENTITY_CLASS_ENEMY_SHOT)
        {
            const shot_id = event.collidedAgainst.mfg.id;
            const shot = event.collidedAgainst.mfg.entity;
            const enemy_ship = shot.getOwner();
            enemy_ship.deletePlasmaShot(shot_id);

            const damage = enemy_ship.getPlasmaShotDamage();
            this.player_ship.takeDamage(damage);

            const hp = this.player_ship.getHealth();
            if (hp <= 0) {
                this.destroyPlayerShip();
            }
            return;
        }
        // player's ship hit loot box
        if (event.collider.mfg.entity_class === CONST.ENTITY_CLASS_MY_SHIP &&
            event.collidedAgainst.mfg.entity_class === CONST.ENTITY_CLASS_LOOTBOX)
        {
            const loot_box = event.collidedAgainst.mfg.entity;
            this.onPlayerHitLootBox(loot_box);
            return;
        }
        if (event.collider.mfg.entity_class === CONST.ENTITY_CLASS_LOOTBOX &&
            event.collidedAgainst.mfg.entity_class === CONST.ENTITY_CLASS_MY_SHIP)
        {
            const loot_box = event.collider.mfg.entity;
            this.onPlayerHitLootBox(loot_box);
            return;
        }
    }

    destroyEnemyShip(ship) {
        if (ship.isDestroyed() || !this.game.isPlayState()) {
            return;
        }
        ship.setDesroyed(true);
        ship.hideHud();

        const pos = ship.getPosition();
        ExplosionEffect.create(pos, this.scene);

        setTimeout(() => {
            ship.destroy();

            const loot = new LootBox(this.game, this.loot_box_mesh, pos);
            this.loot_boxes.set(loot.getId(), loot);

        }, this.config.time_destroy_ship_after_explode);

        --this.enemiesNumber;
        if (this.enemiesNumber <= 0) {
            this.player_ship.hideHud();

            this.game.onPlayerWin();
        } else {
            if (this.need_to_show_tutor) {
                this.need_to_show_tutor = false;

                this.game.getHud().showTutor();
            }
        }
    }

    destroyPlayerShip() {
        if (this.player_ship.isDestroyed() || !this.game.isPlayState()) {
            return;
        }
        this.player_ship.setDesroyed(true);
        this.player_ship.hideHud();

        const pos = this.player_ship.getPosition();
        ExplosionEffect.create(pos, this.scene);

        setTimeout( () => {
            if (this.player_ship) {
                this.player_ship.destroy();
            }
        }, this.config.time_destroy_ship_after_explode);

        this.game.onPlayerLost();
    }

    explodeMissile(position) {
        ExplosionEffect.create(position, this.scene);

        // get all ships in damage radius
        const ships = new Map();
        const DAMAGE_RADIUS = this.config.missile_damage_radius; // 50
        const MISSILE_DAMAGE = this.config.missile_damage; // 1000

        const pos = this.player_ship.getPosition();
        const dist= BABYLON.Vector3.Distance(position, pos);
        if (dist <= DAMAGE_RADIUS) {
            ships.set(this.player_ship, dist);
        }
        this.enemies.forEach(enemy => {
            const pos = enemy.getPosition();
            const dist= BABYLON.Vector3.Distance(position, pos);
            if (dist <= DAMAGE_RADIUS) {
                ships.set(enemy, dist);
            }
        });

        // apply damage to ships
        for (const [ship, distance] of ships) {
            const damage = MISSILE_DAMAGE * (1 - distance / DAMAGE_RADIUS);
            ship.takeDamage(damage);

            const hp = ship.getHealth();
            if (hp <= 0) {
                ship.isEnemy() ? this.destroyEnemyShip(ship) : this.destroyPlayerShip(ship);
            }
        }
    }

    update(dt) {
        this.asteroids.forEach(ast => {
            ast.update(dt);
        });
        this.enemies.forEach(enemy => {
            enemy.update(dt);
        });
    }

    clear() {
        if (this.dust_particles) {
            this.dust_particles.clear();
        }
        this.dust_particles = null;

        this.octree.clear();

        PlasmaShot.parentShape = null;
        PlasmaShot.parentMesh = null;

        Missile.parent_shape = null;
        Missile.parent_mesh = null;

        this.asteroids.forEach(ast => {
            ast.clear();
        });
        this.asteroids = null;

        this.enemies.forEach(enemy => {
            enemy.clear();
        });
        this.enemies = null;

        this.loot_boxes.forEach(loot => {
            loot.clear();
        });
        this.loot_boxes.clear();
        this.loot_boxes = null;

        this.player_ship.clear();
        this.player_ship = null;

        this.parent_meshes.forEach(mesh => {
            mesh.dispose(false, true);
        });
        this.parent_meshes = [];
        this.loot_box_mesh = null;
        this.missileMesh = null;

        this.disposePhysics();
    }

    createTestLootBox() {
        const dir = this.player_ship.getMesh().getDirection(BABYLON.Axis.X).clone();
        const pos = this.player_ship.getPosition().clone().add(dir.scale(15));

        const loot = new LootBox(this.game, this.loot_box_mesh, pos);
        this.loot_boxes.set(loot.getId(), loot);

        console.log(`test loot created: ${loot.getId()}`);
    }
}
