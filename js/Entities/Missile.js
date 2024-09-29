import * as utils from '../Utils/utils.js';
import { PlasmaShot } from './PlasmaShot.js';
import { IdleMoveEffect } from '../Effects/IdleMoveEffect.js';
import * as EngineFlaresEffect from '../Effects/EngineFlaresEffect.js';
import * as TrailEffect from '../Effects/TrailEffect.js';

const LIFE_TIME = 12000;
const TIME_TO_ATTACH = 2000;
const START_SPEED = 20;
const MAX_SPEED = 100.5;
const SPEED = 4.5;

// const LIFE_TIME = 123434000;
// const TIME_TO_ATTACH = 2234000;
// const START_SPEED = 0;
// const MAX_SPEED = 100.5;
// const SPEED = 0;

export class Missile extends PlasmaShot {
    shape = null;
    isShapeAttached = false;

    speed = 0;

    moveEffect = null;
    engineEffect = null;
    trailEffect = null;

    constructor(game, counter, owner, target) {
        super(game, counter, owner, target);
        this.id = 'Missile' + counter;
    }

    init(pos, quaternion, entity_class) {
        const parentMesh = this.battleArea.missileMesh;
        const mesh = parentMesh.createInstance(this.id);
        mesh.position = pos;

        const q = new BABYLON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        mesh.rotationQuaternion = q;

        mesh.checkCollisions = true;
        mesh.setEnabled(true);
        this.mesh = mesh;

        // shot has a physics body
        const body = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, this.scene);
        body.setMassProperties({
            mass: 0.01,
            inertia: new BABYLON.Vector3(0, 0, 0),
            centerOfMass: new BABYLON.Vector3(0, 0, 0),
        });
        body.setLinearDamping(0.0);
        body.setAngularDamping(1.0);
        body.setCollisionCallbackEnabled(true);
        this.body = body;

        body.mfg = { name: 'Missile', id: this.id, entity_class: entity_class, entity: this, owner: this.owner };

        const shape = new BABYLON.PhysicsShapeCapsule(
            new BABYLON.Vector3(0.5, 0, 0), // starting point of the cylinder segment
            new BABYLON.Vector3(-0.5,0, 0), // ending point of the cylinder segment
            1.0,                            // radius of the cylinder
            this.scene,
        );
        const material = { friction: 0, restitution: 0 };
        shape.material = material;

        // will attach shape after delay
        this.shape = shape;

        if (this.target) {
            // will rotate shot with quaternion
            body.disablePreStep = false;
        }
        this.createTime = Date.now();
        this.speed = this.owner.getFwdVelocity() + START_SPEED;

        this.moveEffect = new IdleMoveEffect(5.12, 25.5);

        const eff_pos = new BABYLON.Vector3(0, -1.05, 0);
        let effect = EngineFlaresEffect.create(this.scene, mesh, eff_pos);
        effect.minSize = 0.65;
        effect.maxSize = 0.90;
        effect.color1  = new BABYLON.Color4(1.0, 0.0, 0.0, 1.0);
        effect.color2  = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
        effect.colorDead = new BABYLON.Color4(1.0, 0, 0, 1.0);
        this.engineEffect = effect;

        effect = TrailEffect.create(this.scene, mesh, eff_pos);
        this.trailEffect = effect;
    }

    update(dt) {
        if (!this.isShapeAttached && this.getLifeTime() > TIME_TO_ATTACH) {
            this.body.shape = this.shape;
            this.isShapeAttached = true;
        }
        // check distance to the center, actually it's a length of a vector that is a position of mesh
        const pos = this.mesh.position;
        if (this.battleArea.isPlasmaShotTooFar(pos) || this.getLifeTime() > LIFE_TIME) {
            this.battleArea.explodeMissile(this.mesh.position);
            return false;
        }
        if (this.target && !this.target.isDestroyed()) {
            const q1 = this.mesh.rotationQuaternion.clone();
            const fwd = {x: 0, y: 1, z: 0};
            const neededDir = this.target.getPosition().clone().subtract(pos);
            let q2 = utils.quaternionShortestArc(fwd, neededDir);
            q2 = new BABYLON.Quaternion(q2.x, q2.y, q2.z, q2.w);
            const ROT_SPEED = 2.5;
            const q = BABYLON.Quaternion.Slerp(q1, q2, ROT_SPEED * dt);
            this.mesh.rotationQuaternion = q;
        }
        let speed = this.speed + dt * SPEED;
        if (speed > MAX_SPEED) {
            speed = MAX_SPEED;
        }
        let dir = this.mesh.getDirection(BABYLON.Axis.Y).clone();
        let impulseDir = dir.scale(speed);

        const offset = this.moveEffect.update(dt);

        dir = this.mesh.getDirection(BABYLON.Axis.X).clone();
        impulseDir = impulseDir.add(dir.scale( offset.x ));

        dir = this.mesh.getDirection(BABYLON.Axis.Z).clone();
        impulseDir = impulseDir.add(dir.scale( offset.y ));

        this.body.setLinearVelocity(impulseDir);
        this.speed = speed;

        return true;
    }

    clear() {
        this.engineEffect.stop();
        this.engineEffect.dispose(true);

        this.trailEffect.stop();
        this.trailEffect.dispose(true);

        super.clear();
    }
}
