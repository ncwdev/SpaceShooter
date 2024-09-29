export function create(scene, mesh, position) {
    const capacity = 2000;
    const ps = new BABYLON.ParticleSystem('MissileTrail', capacity, scene);

    ps.particleTexture = new BABYLON.Texture('./assets/images/smoke_particle.png');
    ps.gravity = new BABYLON.Vector3(0, 0, 0);

    ps.minLifeTime = 1.0;
    ps.maxLifeTime = 1.5;

    ps.emitRate = 100;
    ps.minEmitPower = 0;
    ps.maxEmitPower = 0;
    ps.updateSpeed  = 1/60;

    ps.addSizeGradient(0, 0.5, 0.8);
    ps.addSizeGradient(0.3, 0.8, 1.2);
    ps.addSizeGradient(0.5, 1.2, 1.5);
    ps.addSizeGradient(1.0, 1.5, 2.0);

    ps.color1 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
    ps.color2 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
    ps.colorDead = new BABYLON.Color4(0.5, 0.5, 0.5, 0.0);

    ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;

    const emitter = new BABYLON.CustomParticleEmitter();
    emitter.particlePositionGenerator = (index, particle, out) => {
        out.x = position.x;
        out.y = position.y;
        out.z = position.z;
    };
    emitter.particleDestinationGenerator = (index, particle, out) => {
        out.x = position.x;
        out.y = position.y;
        out.z = position.z;
    };
    ps.particleEmitterType = emitter;
    ps.emitter = mesh;

    ps.start();
    return ps;
}
