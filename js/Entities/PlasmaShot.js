const SHOT_VEL = 30.5;
const LIFE_TIME= 2000;

export class PlasmaShot {
    id = null;

    getId() {
        return this.id;
    }

    static parentMesh = null;
    static parentShape = null;

    game = null;
    scene = null;
    battleArea = null;

    mesh = null;
    body = null;

    getPosition() {
        return this.mesh.position;
    }

    createTime = 0;

    owner = null; // ship which owns this shot

    getOwner() {
        return this.owner;
    }

    target = null; // ship which shot is shot to

    constructor(game, counter, owner, target) {
        this.id = 'PlasmaShot' + counter;

        this.game = game;
        this.scene = game.getScene();
        this.battleArea = game.getBattleArea();

        this.owner = owner;
        this.target = target;
    }

    init(pos, quaternion, entity_class) {
        const mesh = PlasmaShot.parentMesh.createInstance(this.id);
        mesh.position = pos;

        const q = new BABYLON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        mesh.rotationQuaternion = q;

        mesh.receiveShadows = false;
        mesh.checkCollisions= true;
        mesh.setEnabled(true);
        this.mesh = mesh;

        const glowLayer = this.scene.getPlasmaShotLayer();
        glowLayer.addIncludedOnlyMesh(mesh);

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

        body.mfg = { name: 'PlasmaShot', id: this.id, entity_class: entity_class, entity: this };

        body.shape = PlasmaShot.parentShape;

        if (this.target) {
            // will rotate shot with quaternion
            //body.disablePreStep = false;
        }
        this.createTime = Date.now();

        // give impulse only one time
        const vel = SHOT_VEL;
        const dir = this.mesh.getDirection(BABYLON.Axis.X).clone();
        const impulseDir = dir.scale(vel);
        this.body.setLinearVelocity(impulseDir);
    }

    static getParentMeshAndShape(scene) {
        // use one parent mesh for all instances of shots
        if (!PlasmaShot.parentMesh) {
            const parentMesh = new BABYLON.MeshBuilder.CreateBox('PlasmaShot', {}, scene);
            parentMesh.scaling = new BABYLON.Vector3(5.0, 0.1, 0.1);

            const material = new BABYLON.StandardMaterial('PlasmaShotMat');
            material.diffuseColor = new BABYLON.Color3(0, 1, 0);
            material.emissiveColor= new BABYLON.Color3(0, 1, 0);
            parentMesh.material = material;

            parentMesh.setEnabled(false);
            PlasmaShot.parentMesh = parentMesh;

            PlasmaShot.parentShape = new BABYLON.PhysicsShapeConvexHull(
                parentMesh,
                scene,
            );
            const shapeMaterial = { friction: 0.99, restitution: 0 };
            PlasmaShot.parentShape.material = shapeMaterial;

            console.log('PlasmaShot: parent mesh was created');
        }
        return [PlasmaShot.parentMesh, PlasmaShot.parentShape];
    }

    getLifeTime() {
        return Date.now() - this.createTime;
    }

    update(dt) {
        // check distance to the center, actually it's a length of a vector that is a position of mesh
        const pos = this.mesh.position;
        if (this.battleArea.isPlasmaShotTooFar(pos) || this.getLifeTime() > LIFE_TIME) {
            return false;
        }
        // if (this.target && !this.target.isDestroyed()) {
        //     let q1 = this.mesh.rotationQuaternion.clone();
        //     const fwd = {x: 1, y: 0, z: 0};
        //     const needed_dir = this.target.getPosition().clone().subtract(pos);
        //     let q2 = utils.quaternionShortestArc(fwd, needed_dir);
        //     q2 = new BABYLON.Quaternion(q2.x, q2.y, q2.z, q2.w);
        //     const ROT_SPEED = 2.5;
        //     const q = BABYLON.Quaternion.Slerp(q1, q2, ROT_SPEED * dt);
        //     this.mesh.rotationQuaternion = q;
        // }
        const dir = this.mesh.getDirection(BABYLON.Axis.X).clone();
        const impulseDir = dir.scale(SHOT_VEL);
        this.body.setLinearVelocity(impulseDir);

        return true;
    }

    clear() {
        this.body.mfg = null;

        this.body.dispose();
        this.mesh.dispose(); // don't dispose material

        this.battleArea = null;
        this.scene = null;
        this.mesh = null;
        this.body = null;
        this.owner = null;
    }
}
