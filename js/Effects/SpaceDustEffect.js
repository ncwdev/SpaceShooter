export class SpaceDustEffect {

    effect = null;

    constructor(mesh, size, scene) {
        const capacity = 2000;
        const ps = new BABYLON.ParticleSystem("SpaceDust", capacity, scene);
        
        ps.particleTexture = new BABYLON.Texture("./assets/images/dust.png");
        ps.gravity = new BABYLON.Vector3(0, 0, 0);
        
        ps.minSize = 0.1;
        ps.maxSize = 0.3;

        ps.minLifeTime = 5;
        ps.maxLifeTime = 10;
        
        ps.emitRate = 500;
        ps.minEmitPower = 1;
        ps.maxEmitPower = 3;
        ps.updateSpeed  = 1/60;

        ps.emitter = mesh;
        ps.minEmitBox = new BABYLON.Vector3(-size, -size, -size);
        ps.maxEmitBox = new BABYLON.Vector3(size, size, size);

        ps.direction1 = new BABYLON.Vector3(0, 0, 0);
        ps.direction2 = new BABYLON.Vector3(0, 0, 0);

        ps.color1    = new BABYLON.Color4(1, 1, 1, 1);
        ps.color2    = new BABYLON.Color4(1, 1, 1, 1);
        ps.colorDead = new BABYLON.Color4(0, 0, 0, 0.1);

        this.effect = ps;
    }

    start() {
        this.effect.start();
    }
    
    clear() {
        if (this.effect) {
            this.effect.dispose(true);
        }
        this.effect = null;
    }
}