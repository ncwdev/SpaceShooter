export class Scene extends BABYLON.Scene {
    plasmaShotLayer = null;

    constructor(engine) {
        // scene contains skybox, light, camera and some effects (glow, fog, ...)
        super(engine);

        const scene = this;

        // this Inspector helps to debug scene
        // scene.debugLayer.show();
        // scene.debugLayer.show({
        //     embedMode: false,
        // });

        scene.createDefaultEnvironment({
            createGround: false,
            createSkybox: false,
        });
        scene.clearColor = new BABYLON.Color3(0, 0, 0);
        scene.environmentIntensity = 1.5;

        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0));
        light.intensity = 1.0;
        light.diffuse = new BABYLON.Color3(0.1, 0.1, 0.1);

        const light2 = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(0, 2, 1), scene);
        light2.position = new BABYLON.Vector3(0, 0, 0);
        light2.intensity = 1.0;
        light2.diffuse = new BABYLON.Color3(0.1, 0.1, 0.1);

        // scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        // scene.fogColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        // scene.fogDensity = 0.00006;

        const glowLayer = new BABYLON.GlowLayer('PlasmaShotGlow', scene);
        glowLayer.intensity = 0.95;
        this.plasmaShotLayer = glowLayer;

        const camera = new BABYLON.FreeCamera('MainCamera', BABYLON.Vector3.Zero(), scene);
        this.activeCamera = camera;
        camera.inertia = 0;

        const postProcess = new BABYLON.PostProcess('FadeIn', 'fade', ['fadeLevel'], null, 1.0, this.activeCamera);
        postProcess.fadeLevel = 0;
        postProcess.onApply = (effect) => {
            effect.setFloat('fadeLevel', postProcess.fadeLevel);
        };
        this.hideSceneEffect = postProcess;

        const postprocess = scene.imageProcessingConfiguration;
        postprocess.toneMappingEnabled = true;
        postprocess.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;

        // const postProcessFXAA = new BABYLON.FxaaPostProcess('fxaa', 1.0, camera);
    }

    getPlasmaShotLayer() {
        return this.plasmaShotLayer;
    }

    randomPoints(ctx, count, size) {
        const starColors = ['#4DB9FA', '#6ABDE9', '#92D3FB', '#8FD2ED', '#BFE3FB', '#D7EAF8', '#CFE0E7', '#F7FAF1', '#FAFBF5',
            '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF',
            '#FFFFFA', '#F3F6DB', '#FFFFD8', '#F0F2B1', '#FFFFB8', '#E9E85A', '#F9D67C', '#E9C46C', '#E0A465', '#DB8A5B'];
        for (let i = 0; i < count; ++i) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            ctx.fillStyle = starColors[Math.floor(Math.random() * starColors.length)];
            if (Math.random() < 0.1) {
                ctx.fillRect(x, y, 2, 2);
            } else {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    createSkyBox(config) {
        const scene = this;

        const dist = config.radiusMax * 3;
        const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: dist }, scene);

        const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene);
        skyboxMaterial.backFaceCulling = false;

        // Create dynamic textures for the skybox
        const size = config.skyboxTextureSize;
        const arr = [];
        for (let i = 0; i < 6; i++) {
            const dynamicTexture = new BABYLON.DynamicTexture('dynamicTexture_' + i, { width: size, height: size }, scene);

            const context = dynamicTexture.getContext();
            context.fillStyle = '#112';
            context.fillRect(0, 0, size, size);
            dynamicTexture.update();

            arr.push(dynamicTexture);
        }
        const img = new Image();
        img.src = 'assets/images/cloud.png';
        img.onload = async function() {
            for (let i = 0; i < 6; i++) {
                const dynamicTexture = arr[i];
                const context = dynamicTexture.getContext();

                context.drawImage(this, 0, 0);
                dynamicTexture.update();

                scene.randomPoints(context, config.starsCount, size);
                dynamicTexture.update();

                const data = await dynamicTexture.readPixels();
                arr[i] = data;
            }
            const cubeTexture = new BABYLON.RawCubeTexture(scene, arr, size);
            skyboxMaterial.reflectionTexture = cubeTexture;
            skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;

            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

            skybox.material = skyboxMaterial;

            skybox.infiniteDistance = true;
            skyboxMaterial.disableLighting = true;
            skyboxMaterial.freeze();
        };

        // skybox.isPickable = false;
        // skybox.renderingGroupId = 0; // behind any other objects
    }

    applyOptimizations() {
        this.pointerMoveTrianglePredicate = () => false;
        this.skipPointerMovePicking = true;

        // this gives a strange error: Uncaught TypeError: Cannot read properties of null (reading 'hpBodyId')
        // BABYLON.SceneOptimizer.OptimizeAsync(this);

        const targetFPS = 60;
        const updateRate = 250;
        const options = new BABYLON.SceneOptimizerOptions(targetFPS, updateRate);
        // options.addOptimization(new BABYLON.HardwareScalingOptimization(0, 1));

        this.optimizer = new BABYLON.SceneOptimizer(this, options, true, true);
        this.optimizer.targetFrameRate = targetFPS;
        this.optimizer.start();
    }
}
