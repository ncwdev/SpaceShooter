import * as utils from '../Utils/utils.js';

const ROT_SPEED_MIN =  10;
const ROT_SPEED_MAX =  40;
const ROT_SPEED_K   =  120;

export class Asteroid {
    scene= null;
    mesh = null;
    body = null;

    rotationAxis = null;

    constructor(scene, mesh) {
        this.scene = scene;

        // get random rotation axis
        let dir = utils.getRandomSpherePos(100);
        dir = utils.normalize(dir);
        dir = new BABYLON.Vector3(dir.x, dir.y, dir.z);

        mesh.rotate(dir, 0, BABYLON.Space.WORLD);

        mesh.receiveShadows = true;
        mesh.checkCollisions= true;
        mesh.isPickable = true; // enemy AI uses it to avoid collisions
        mesh.isVisible = true;
        mesh.setEnabled(true);

        mesh.mfg = { entity_class: ENTITY_CLASS_ASTEROID, entity: this };

        this.mesh = mesh;

        let rot_speed = utils.randomInt(ROT_SPEED_MIN, ROT_SPEED_MAX);
        rot_speed /= ROT_SPEED_K;
        this.rot_speed = rot_speed;
        this.rotationAxis = dir.clone().scale(rot_speed);

        // Create a shape and the static body. Size will be determined automatically.
        const body = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.STATIC, false, this.scene);
        //const body = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.ANIMATED, false, scene);
        body.setMassProperties({
            mass: 1000000,
            inertia: new BABYLON.Vector3(10, 10, 10),
            centerOfMass: new BABYLON.Vector3(0, 0, 0),
        });
        body.setLinearDamping(1.0);
        body.setAngularDamping(0.0);
        body.setCollisionCallbackEnabled(true);
        body.disablePreStep = false;    // to rotate with mesh.rotate()

        body.mfg = { name: 'Asteroid', entity_class: ENTITY_CLASS_ASTEROID };

        const shape = new BABYLON.PhysicsShapeConvexHull(mesh, scene);
        const material = {friction: 0.2, restitution: 0.3};
        shape.material = material;
        body.shape = shape;

        this.body = body;
    }
    update(dt) {
        // if (this.body && this.rotationAxis) {
        //     this.body.setAngularVelocity(this.rotationAxis);
        // }

        if (this.mesh && this.rotationAxis) {
            const angle = this.rot_speed * dt;
            this.mesh.rotate(this.rotationAxis, angle, BABYLON.Space.WORLD);
        }
    }
    isDestroyed() {
        return false;
    }
    getPosition() {
        return this.mesh.position;
    }
    getMesh() {
        return this.mesh;
    }
    clear() {
        this.body.dispose();
        this.body = null;

        this.mesh.dispose(true, true);
        this.mesh = null;

        this.scene = null;
    }
}
