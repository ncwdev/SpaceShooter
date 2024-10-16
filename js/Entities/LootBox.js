// LootBox drops from enemy ship after destroying.
// Gives a one missile to player.
export class LootBox {
    game = null;
    scene = null;

    mesh = null;
    body = null;

    static counter = 0;

    id = null;

    getId() {
        return this.id;
    }

    constructor(game, parent_mesh, pos) {
        this.game = game;
        this.scene = game.getScene();

        this.id = 'LootBox' + LootBox.counter;
        LootBox.counter++;

        //const mesh = parent_mesh.createInstance(this.id);
        const mesh = parent_mesh.clone(this.id);
        mesh.position = pos;
        mesh.setEnabled(true);
        this.mesh = mesh;

        mesh.renderOutline = true;
        mesh.outlineColor = new BABYLON.Color3(0, 0, 0);
        mesh.outlineWidth = 0.05;

        const body = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, this.scene);
        body.setMassProperties({
            mass: 1.01,
            inertia: new BABYLON.Vector3(10, 10, 10),
            centerOfMass: new BABYLON.Vector3(0, 0, 0),
        });
        body.setLinearDamping(1.0);
        body.setAngularDamping(0.0);
        body.setCollisionCallbackEnabled(true);
        this.body = body;

        body.mfg = { name: 'LootBox', id: this.id, entity_class: ENTITY_CLASS_LOOTBOX, entity: this };

        const shape = new BABYLON.PhysicsShapeCylinder(
            new BABYLON.Vector3(0, -2.5, 0),
            new BABYLON.Vector3(0,  2.5, 0),
            3,
            this.scene
        );
        const material = {friction: 0.5, restitution: 0.9};
        shape.material = material;
        body.shape = shape;

        body.applyImpulse(
            new BABYLON.Vector3(10, 0, 0),
            mesh.absolutePosition.clone().add(new BABYLON.Vector3(Math.random(), Math.random(), Math.random()))
        );
    }

    clear() {
        this.body.shape.dispose();
        this.body.dispose();
        this.body = null;

        this.mesh.dispose();
        this.mesh = null;

        this.game = null;
        this.scene = null;
    }
}
