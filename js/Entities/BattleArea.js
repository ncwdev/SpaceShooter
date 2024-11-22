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

import { enemyBT } from '../AI/EnemyBehavior.js';
import { TreeBuilder } from '../BehaviorTree/TreeBuilder.js';

import CONST from '../const.js';
import { SoundManager } from '../Utils/SoundManager.js';

// contains player's ship, enemy ships, asteroids, space dust
// uses physics engine to detect collisions between plasma shots and ships
export class BattleArea {
    scene = null;
    game = null;
    config = null;

    spaceRadiusMin = 100;
    spaceRadiusMax = 500;

    octree = null;

    playerShip = null;

    parentMeshes = []; // parents for all mesh instances and clones (enemy, asteroids, plasma shots, missiles)

    lootBoxMesh = null; // parent for loot boxes
    missileMesh = null; // parent for missiles

    enemiesNumber = 0;
    enemies = [];

    asteroidsNum = 0;
    asteroids = [];

    lootBoxes = new Map();

    dustParticles = null;

    havokPlugin = null;
    collisionObserver = null;

    needToShowTutor = true;

    constructor(game, config) {
        this.game = game;
        this.scene = game.getScene();
        this.config = config;

        this.asteroidsNum = config.asteroidsNum;
        this.spaceRadiusMin = config.radiusMin;
        this.spaceRadiusMax = config.radiusMax;

        const min = { x: -this.spaceRadiusMin, y: -this.spaceRadiusMin, z: -this.spaceRadiusMin };
        const max = { x: this.spaceRadiusMin, y: this.spaceRadiusMin, z: this.spaceRadiusMin };
        this.octree = new Octree(min, max);
    }

    getScene() {
        return this.scene;
    }

    getPlayerShip() {
        return this.playerShip;
    }

    getEnemies() {
        return this.enemies;
    }

    getEnemiesCount() {
        return this.enemiesNumber;
    }

    isMaxRadiusExit(pos) {
        const distanceToCenter = pos.length();

        dbg.setDistanceToCenter(distanceToCenter);

        return distanceToCenter > this.spaceRadiusMax;
    }

    isPlasmaShotTooFar(pos) {
        const distanceToCenter = pos.length();
        return distanceToCenter > this.spaceRadiusMax * 2;
    }

    async initPhysics() {
        // const havokInstance = await HavokPhysics();
        this.havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);

        const gravity = new BABYLON.Vector3(0, 0, 0);
        const result = this.scene.enablePhysics(gravity, this.havokPlugin);
        if (result) {
            console.log('Physics engine enabled');
        } else {
            console.log('Physics engine could not be enabled');
        }
        const observable = this.havokPlugin.onCollisionObservable;
        this.collisionObserver = observable.add(this.onCollisionHandler.bind(this));
    }

    disposePhysics() {
        const observable = this.havokPlugin.onCollisionObservable;
        observable.remove(this.collisionObserver);
        this.collisionObserver = null;

        this.scene.disablePhysicsEngine();
        this.havokPlugin = null;
    }

    async spawnEntities() {
        let meshData = meshesList.MyShip;
        let result = await BABYLON.SceneLoader.ImportMeshAsync('', meshData.path, meshData.file, this.scene);
        this.instancePlayerShip(result);

        this.game.getHud().setLoadingProgress(10);

        meshData = meshesList.EnemyShip;
        result = await BABYLON.SceneLoader.ImportMeshAsync('', meshData.path, meshData.file, this.scene);
        this.instanceEnemyShips(result, this.enemiesNumber);

        this.game.getHud().setLoadingProgress(20);

        // create a bunch of asteroids - use all 6 models
        const asteroids = meshesList.Asteroids;
        asteroids.forEach(data => {
            BABYLON.SceneLoader.ImportMesh('', data.path, data.file, this.scene, this.instanceAsteroids.bind(this));
        });
        this.game.getHud().setLoadingProgress(80);

        meshData = meshesList.LootBox;
        result = await BABYLON.SceneLoader.ImportMeshAsync('', meshData.path, meshData.file, this.scene);
        this.instanceLootBox(result);

        this.game.getHud().setLoadingProgress(90);

        meshData = meshesList.Missile;
        result = await BABYLON.SceneLoader.ImportMeshAsync('', meshData.path, meshData.file, this.scene);
        this.instanceMissile(result);

        this.game.getHud().setLoadingProgress(100);

        const parents = PlasmaShot.getParentMeshAndShape(this.scene);
        this.parentMeshes.push(...parents);

        // console.log(this.parentMeshes);
    }

    instancePlayerShip(data) {
        // place ship in 80% distance from center to min radius
        const mesh = data.meshes[0];
        this.warpShipToRadius(mesh, this.config.plShipSpawnRadius);

        this.octree.addMesh(mesh);

        this.playerShip = new PlayerShip(this.game, mesh);
    }

    instanceLootBox(data) {
        const mesh = data.meshes[0];
        mesh.checkCollisions = true;
        mesh.isPickable = false;
        mesh.material.transparencyMode = 0; // OPAQUE = 0
        mesh.setEnabled(false);

        this.lootBoxMesh = mesh;
        this.parentMeshes.push(mesh);
    }

    instanceMissile(data) {
        const mesh = data.meshes[0];
        mesh.setEnabled(false);
        this.missileMesh = mesh;
        this.parentMeshes.push(mesh);
    }

    instanceEnemyShips(data, number) {
        // create a bunch of enemy ships in random positions with fixed radius
        const parentMesh = data.meshes[0];
        parentMesh.isVisible = false;
        this.parentMeshes.push(parentMesh);

        const shipMinDist = this.config.spawnShipsMinDist;
        const radius = this.spaceRadiusMin * this.config.spawnEnemiesRadius;

        // create in random positions using octree
        for (let i = 0; i < number; ++i) {
            // make maximum 10 attempts
            for (let j = 0; j < 10; ++j) {
                const pos = utils.getRandomSphereRadiusPos(radius);

                if (!this.octree.findClosestObject(pos, shipMinDist)) {
                    // use clones because we need to set shaders to every instance
                    const mesh = parentMesh.clone(parentMesh.name + i);
                    mesh.isVisible = true;
                    mesh.position = new BABYLON.Vector3(pos.x, pos.y, pos.z);

                    const ship = new EnemyShip(this.game, mesh);
                    mesh.mfg = {entityClass: CONST.ENTITY_CLASS_ENEMY_SHIP, entity: ship};
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
        parentMesh.checkCollisions = true;
        parentMesh.material.roughness = 0.5;
        parentMesh.material.freeze();
        parentMesh.isVisible = false;
        this.parentMeshes.push(parentMesh);

        console.log('instanceAsteroids() entered', parentMesh.name);

        const astMinDist = this.config.spawnAsteroidsMinDist;

        // create in random positions using octree
        for (let i = 0; i < this.asteroidsNum; ++i) {
            // make maximum 10 attempts
            for (let j = 0; j < 10; ++j) {
                const pos = utils.getRandomSpherePos(this.spaceRadiusMin);

                if (!this.octree.findClosestObject(pos, astMinDist)) {
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
        return this.asteroids.every(ast => ast.getMesh().isReady(true, true));
    }

    warpShipToRadius(mesh, distFromCenter) {
        const pos = utils.getRandomSphereRadiusPos(distFromCenter * this.spaceRadiusMin);
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
        const DUST_CLOUD_RADIUS = this.config.dustCloudRadius;
        this.dustParticles = new SpaceDustEffect(this.playerShip.mesh, DUST_CLOUD_RADIUS, this.scene);
        this.dustParticles.start();
    }

    startBattle() {
        this.createSpaceDust();

        this.playerShip.init();

        const bt = TreeBuilder.createTree(enemyBT);
        this.enemies.forEach( enemy => {
            enemy.createHud();
            enemy.initAI(bt);
        });
    }

    onMissileCollided(data, forceExplosion = false) {
        const shotId = data.id;
        const missile = data.entity;
        const owner = data.owner;

        if (missile.getLifeTime() < this.config.timeMissileNoCollision && !forceExplosion) {
            return;
        }
        this.explodeMissile(missile.getPosition());
        owner.deletePlasmaShot(shotId);
    }

    onPlayerHitLootBox(lootBox) {
        const id = lootBox.getId();
        lootBox.clear();

        this.lootBoxes.delete(id);
        this.playerShip.addMissile(1);

        SoundManager.playSound(SoundManager.SND_LOOTBOX);
    }

    onCollisionHandler(event) {
        if (!event.collider.mfg || !event.collidedAgainst.mfg) {
            return;
        }
        if (event.collider.mfg.entityClass === CONST.ENTITY_CLASS_MISSILE) {
            this.onMissileCollided(event.collider.mfg);
            return;
        }
        if (event.collidedAgainst.mfg.entityClass === CONST.ENTITY_CLASS_MISSILE) {
            this.onMissileCollided(event.collidedAgainst.mfg);
            return;
        }
        if (event.collidedAgainst.mfg.entityClass === CONST.ENTITY_CLASS_ASTEROID &&
            event.collider.mfg.entityClass == CONST.ENTITY_CLASS_MY_SHOT)
        {
            const shotId = event.collider.mfg.id;
            this.playerShip.deletePlasmaShot(shotId);
            return;
        }
        // enemy hit
        if (event.collider.mfg.entityClass === CONST.ENTITY_CLASS_ENEMY_SHIP &&
            event.collidedAgainst.mfg.entityClass == CONST.ENTITY_CLASS_MY_SHOT)
        {
            const shotId = event.collidedAgainst.mfg.id;
            this.playerShip.deletePlasmaShot(shotId);

            const ship = event.collider.mfg.entity;
            const damage = this.playerShip.getPlasmaShotDamage();
            ship.takeDamage(damage);

            const hp = ship.getHealth();
            if (hp <= 0) {
                this.destroyEnemyShip(ship);
            }
            return;
        }
        // enemy hits player's ship
        if (event.collider.mfg.entityClass === CONST.ENTITY_CLASS_MY_SHIP &&
            event.collidedAgainst.mfg.entityClass == CONST.ENTITY_CLASS_ENEMY_SHOT)
        {
            const shotId = event.collidedAgainst.mfg.id;
            const shot = event.collidedAgainst.mfg.entity;
            const enemyShip = shot.getOwner();
            enemyShip.deletePlasmaShot(shotId);

            const damage = enemyShip.getPlasmaShotDamage();
            this.playerShip.takeDamage(damage);

            const hp = this.playerShip.getHealth();
            if (hp <= 0) {
                this.destroyPlayerShip();
            }
            return;
        }
        // player's ship hit loot box
        if (event.collider.mfg.entityClass === CONST.ENTITY_CLASS_MY_SHIP &&
            event.collidedAgainst.mfg.entityClass === CONST.ENTITY_CLASS_LOOTBOX)
        {
            const lootBox = event.collidedAgainst.mfg.entity;
            this.onPlayerHitLootBox(lootBox);
            return;
        }
        if (event.collider.mfg.entityClass === CONST.ENTITY_CLASS_LOOTBOX &&
            event.collidedAgainst.mfg.entityClass === CONST.ENTITY_CLASS_MY_SHIP)
        {
            const lootBox = event.collider.mfg.entity;
            this.onPlayerHitLootBox(lootBox);
            return;
        }
    }

    destroyEnemyShip(ship) {
        if (ship.isDestroyed() || !this.game.isPlayState()) {
            return;
        }
        ship.setDestroyed(true);
        ship.hideHud();

        const pos = ship.getPosition();
        ExplosionEffect.create(pos, this.scene);

        setTimeout(() => {
            ship.destroy();

            const loot = new LootBox(this.game, this.lootBoxMesh, pos);
            this.lootBoxes.set(loot.getId(), loot);

        }, this.config.timeDestroyShipAfterExplode);

        --this.enemiesNumber;
        if (this.enemiesNumber <= 0) {
            this.playerShip.hideHud();

            this.game.onPlayerWin();
        } else {
            if (this.needToShowTutor) {
                this.needToShowTutor = false;

                this.game.getHud().showTutor();
            }
        }
    }

    destroyPlayerShip() {
        if (this.playerShip.isDestroyed() || !this.game.isPlayState()) {
            return;
        }
        this.playerShip.setDestroyed(true);
        this.playerShip.hideHud();

        const pos = this.playerShip.getPosition();
        ExplosionEffect.create(pos, this.scene);

        setTimeout(() => {
            if (this.playerShip) {
                this.playerShip.destroy();
            }
        }, this.config.timeDestroyShipAfterExplode);

        this.game.onPlayerLost();
    }

    explodeMissile(position) {
        ExplosionEffect.create(position, this.scene);

        // get all ships in damage radius
        const ships = new Map();
        const DAMAGE_RADIUS = this.config.missileDamageRadius;
        const MISSILE_DAMAGE = this.config.missileDamage;

        const pos = this.playerShip.getPosition();
        const dist = BABYLON.Vector3.Distance(position, pos);
        if (dist <= DAMAGE_RADIUS) {
            ships.set(this.playerShip, dist);
        }
        this.enemies.forEach(enemy => {
            const pos = enemy.getPosition();
            const dist = BABYLON.Vector3.Distance(position, pos);
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
        if (this.dustParticles) {
            this.dustParticles.clear();
        }
        this.dustParticles = null;

        this.octree.clear();

        PlasmaShot.parentShape = null;
        PlasmaShot.parentMesh = null;

        Missile.parentShape = null;
        Missile.parentMesh = null;

        this.asteroids.forEach(ast => {
            ast.clear();
        });
        this.asteroids = null;

        this.enemies.forEach(enemy => {
            enemy.clear();
        });
        this.enemies = null;

        this.lootBoxes.forEach(loot => {
            loot.clear();
        });
        this.lootBoxes.clear();
        this.lootBoxes = null;

        this.playerShip.clear();
        this.playerShip = null;

        this.parentMeshes.forEach(mesh => {
            mesh.dispose(false, true);
        });
        this.parentMeshes = [];
        this.lootBoxMesh = null;
        this.missileMesh = null;

        this.disposePhysics();
    }

    createTestLootBox() {
        const dir = this.playerShip.getMesh().getDirection(BABYLON.Axis.X).clone();
        const pos = this.playerShip.getPosition().clone().add(dir.scale(15));

        const loot = new LootBox(this.game, this.lootBoxMesh, pos);
        this.lootBoxes.set(loot.getId(), loot);

        console.log(`test loot created: ${loot.getId()}`);
    }
}
