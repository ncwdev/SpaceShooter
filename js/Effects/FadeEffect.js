BABYLON.Effect.ShadersStore['fadePixelShader'] =
    'precision highp float;' +
    'varying vec2 vUV;' +
    'uniform sampler2D textureSampler; ' +
    'uniform float fadeLevel; ' +
    'void main(void){' +
    'vec4 baseColor = texture2D(textureSampler, vUV) * fadeLevel;' +
    'baseColor.a = 1.0;' +
    'gl_FragColor = baseColor;' +
'}';

export function fadeSceneIn(scene, time, callback) {
    const postProcess = new BABYLON.PostProcess('FadeIn', 'fade', ['fadeLevel'], null, 1.0, scene.activeCamera);
    postProcess.fadeLevel = 1.0;
    postProcess.onApply = (effect) => {
        effect.setFloat('fadeLevel', postProcess.fadeLevel);
    };

    const frameRate = 60;
    const animation = new BABYLON.Animation('fadeAnimIn', 'fadeLevel', frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    const keys = [
        { frame: 0, value: 1 },
        { frame: frameRate * time, value: 0 }
    ];
    animation.setKeys(keys);
    postProcess.animations.push(animation);

    scene.beginAnimation(postProcess, 0, frameRate * time, false, undefined, ()=>{
        postProcess.dispose();

        if (callback) {
            callback();
        }
    });
}

export function fadeSceneOut(scene, time, callback) {
    const postProcess = new BABYLON.PostProcess('FadeOut', 'fade', ['fadeLevel'], null, 1.0, scene.activeCamera);
    postProcess.fadeLevel = 0.0;
    postProcess.onApply = (effect) => {
        effect.setFloat('fadeLevel', postProcess.fadeLevel);
    };

    const frameRate = 60;
    const animation = new BABYLON.Animation('fadeAnimOut', 'fadeLevel', frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    const keys = [
        { frame: 0, value: 0 },
        { frame: frameRate * time, value: 1 }
    ];
    animation.setKeys(keys);
    postProcess.animations.push(animation);

    scene.beginAnimation(postProcess, 0, frameRate * time, false, undefined, () => {
        postProcess.dispose();

        if (callback) {
            callback();
        }
    });
}
