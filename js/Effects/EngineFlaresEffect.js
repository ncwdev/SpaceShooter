export function create(scene, mesh, position) {
    const capacity = 2000;
    const ps = new BABYLON.ParticleSystem('EngineFlares', capacity, scene);

    ps.particleTexture = new BABYLON.Texture('./assets/images/flare.png');
    ps.gravity = new BABYLON.Vector3(0, 0, 0);

    const customEmitter = new BABYLON.CustomParticleEmitter();
    customEmitter.particlePositionGenerator = (index, particle, out) => {
        out.x = position.x;
        out.y = position.y;
        out.z = position.z;
    };

    customEmitter.particleDestinationGenerator = (index, particle, out) => {
        out.x = position.x;
        out.y = position.y;
        out.z = position.z;
    };

    ps.particleEmitterType = customEmitter;

    ps.emitter = mesh;

    ps.minSize = 0.5;
    ps.maxSize = 0.6;

    ps.minLifeTime = 0.25;
    ps.maxLifeTime = 0.25;

    ps.emitRate = 25;
    ps.minEmitPower = 0;
    ps.maxEmitPower = 0;
    ps.updateSpeed  = 1 / 60;

    ps.isLocal = true;

    ps.color1 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
    ps.color2 = new BABYLON.Color4(0.0, 0.0, 1.0, 0.5);
    // ps.colorDead = new BABYLON.Color4(1.0, 0, 0, 0.0);

    ps.start();
    return ps;
}
