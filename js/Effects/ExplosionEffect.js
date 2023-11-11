export async function create(pos, scene) {
    BABYLON.ParticleHelper.BaseAssetsUrl = "assets/particles/";
    
    const effect = await BABYLON.ParticleHelper.CreateAsync("explosion", scene);
    effect.systems.forEach(s => {
        s.disposeOnStop = true;
        s.worldOffset = pos;
    });
    effect.start();
}
