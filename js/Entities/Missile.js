import * as utils from '../Utils/utils.js';
import {PlasmaShot} from './PlasmaShot.js';
import {IdleMoveEffect} from '../Effects/IdleMoveEffect.js';
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
    is_shape_attached = false;

    speed = 0;
    
    move_effect  = null;
    engine_effect= null;
    trail_effect = null;

    constructor(game, counter, owner, target) {
        super(game, counter, owner, target);
        this.id = "Missile" + counter;
    }

    init(pos, quaternion, entity_class) {
        let parent_mesh = this.battle_area.missile_mesh;
        let mesh = parent_mesh.createInstance(this.id);
        mesh.position = pos;

        let q = new BABYLON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        mesh.rotationQuaternion = q;

        mesh.checkCollisions= true;
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
            new BABYLON.Vector3(0.5, 0, 0),   // starting point of the cylinder segment
            new BABYLON.Vector3(-0.5,0, 0),  // ending point of the cylinder segment
            1.0,                            // radius of the cylinder
            this.scene
        );
        const material = {friction: 0, restitution: 0};
        shape.material = material;
        
        // will attach shape after delay
        this.shape = shape;

        if (this.target) {
            // will rotate shot with quaternion
            body.disablePreStep = false;
        }
        this.create_time = Date.now();
        this.speed = this.owner.getFwdVelocity() + START_SPEED;

        this.move_effect = new IdleMoveEffect(5.12, 25.5);

        let eff_pos = new BABYLON.Vector3(0, -1.05, 0);
        let effect = EngineFlaresEffect.create(this.scene, mesh, eff_pos);
        effect.minSize = 0.65;
        effect.maxSize = 0.90;
        effect.color1  = new BABYLON.Color4(1.0, 0.0, 0.0, 1.0);
        effect.color2  = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
        effect.colorDead = new BABYLON.Color4(1.0, 0, 0, 1.0);
        this.engine_effect = effect;

        effect = TrailEffect.create(this.scene, mesh, eff_pos);
        this.trail_effect = effect;
    }

    update(dt) {
        if (!this.is_shape_attached && this.getLifeTime() > TIME_TO_ATTACH) {
            this.body.shape = this.shape;
            this.is_shape_attached = true;
        }
        // check distance to the center, actually it's a length of a vector that is a position of mesh
        let pos = this.mesh.position;
        if (this.battle_area.isPlasmaShotTooFar(pos) || this.getLifeTime() > LIFE_TIME) {
            this.battle_area.explodeMissile(this.mesh.position);
            return false;
        }
        if (this.target && !this.target.isDestroyed()) {
            let q1 = this.mesh.rotationQuaternion.clone();
            const fwd = {x: 0, y: 1, z: 0};
            const needed_dir = this.target.getPosition().clone().subtract(pos);
            let q2 = utils.quaternionShortestArc(fwd, needed_dir);
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
        let impulse_dir = dir.scale(speed);

        let offset = this.move_effect.update(dt);

        dir = this.mesh.getDirection(BABYLON.Axis.X).clone();
        impulse_dir = impulse_dir.add(dir.scale( offset.x ));

        dir = this.mesh.getDirection(BABYLON.Axis.Z).clone();
        impulse_dir = impulse_dir.add(dir.scale( offset.y ));

        this.body.setLinearVelocity(impulse_dir);
        this.speed = speed;

        return true;
    }

    clear() {
        this.engine_effect.stop();
        this.engine_effect.dispose(true);

        this.trail_effect.stop();
        this.trail_effect.dispose(true);

        super.clear();
    }
}