const SHOT_VEL = 30.5;
const LIFE_TIME= 2000;

export class PlasmaShot {

    id = null;
    getId() {
        return this.id;
    }
    static parent_mesh = null;
    static parent_shape= null;

    game = null;
    scene= null;
    battle_area = null;
    
    mesh = null;
    body = null;
    getPosition() {
        return this.mesh.position;
    }

    create_time = 0;

    owner = null;   // ship which owns this shot
    getOwner() {
        return this.owner;
    }
    target = null;  // ship which shot is shot to

    constructor(game, counter, owner, target) {
        this.id = "PlasmaShot" + counter;
        
        this.game = game;
        this.scene= game.getScene();
        this.battle_area = game.getBattleArea();
        
        this.owner = owner;
        this.target= target;
    }

    init(pos, quaternion, entity_class) {
        let mesh = PlasmaShot.parent_mesh.createInstance(this.id);
        mesh.position = pos;

        let q = new BABYLON.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
        mesh.rotationQuaternion = q;

        mesh.receiveShadows = false;
        mesh.checkCollisions= true;
        mesh.setEnabled(true);
        this.mesh = mesh;

        const glow_layer = this.scene.getPlasmaShotLayer();
        glow_layer.addIncludedOnlyMesh(mesh);

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
        
        body.shape = PlasmaShot.parent_shape;

        if (this.target) {
            // will rotate shot with quaternion
            //body.disablePreStep = false;
        }
        this.create_time = Date.now();

        // give impulse only one time
        const vel = SHOT_VEL;
        let dir = this.mesh.getDirection(BABYLON.Axis.X).clone();
        let impulse_dir = dir.scale(vel);        
        this.body.setLinearVelocity(impulse_dir);
    }

    static getParentMeshAndShape(scene) {
        // use one parent mesh for all instances of shots
        if (!PlasmaShot.parent_mesh) {
            const parent_mesh = new BABYLON.MeshBuilder.CreateBox("PlasmaShot", {}, scene);
            parent_mesh.scaling = new BABYLON.Vector3(5.0, 0.1, 0.1);

            const material = new BABYLON.StandardMaterial("PlasmaShotMat");
            material.diffuseColor = new BABYLON.Color3(0, 1, 0);
            material.emissiveColor= new BABYLON.Color3(0, 1, 0);
            parent_mesh.material = material;

            parent_mesh.setEnabled(false);
            PlasmaShot.parent_mesh = parent_mesh;

            PlasmaShot.parent_shape = new BABYLON.PhysicsShapeConvexHull(
                parent_mesh,
                scene
            );
            const shape_material = {friction: 0.99, restitution: 0};
            PlasmaShot.parent_shape.material = shape_material;

            console.log('PlasmaShot: parent mesh was created');
        }
        return [PlasmaShot.parent_mesh, PlasmaShot.parent_shape];
    }

    getLifeTime() {
        return Date.now() - this.create_time;
    }

    update(dt) {
        // check distance to the center, actually it's a length of a vector that is a position of mesh
        let pos = this.mesh.position;
        if (this.battle_area.isPlasmaShotTooFar(pos) || this.getLifeTime() > LIFE_TIME) {
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
        const vel = SHOT_VEL;
        let dir = this.mesh.getDirection(BABYLON.Axis.X).clone();
        let impulse_dir = dir.scale(vel);
        this.body.setLinearVelocity(impulse_dir);

        return true;
    }

    clear() {
        this.body.mfg = null;

        this.body.dispose();
        this.mesh.dispose();    // don't dispose material

        this.battle_area = null;
        this.scene= null;
        this.mesh = null;
        this.body = null;
        this.owner= null;
    }
}