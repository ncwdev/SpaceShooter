import { SoundManager } from '../Utils/SoundManager.js';

export async function create(pos, scene) {
    BABYLON.ParticleHelper.BaseAssetsUrl = '/particles/';

    const effect = await BABYLON.ParticleHelper.CreateAsync('explosion', scene);
    effect.systems.forEach(s => {
        s.disposeOnStop = true;
        s.worldOffset = pos;
    });
    effect.start();

    SoundManager.playExplosionSound(pos);
}
