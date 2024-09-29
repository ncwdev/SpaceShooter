export class Scene extends BABYLON.Scene {
    plasma_shot_layer = null;

    getPlasmaShotLayer() {
        return this.plasma_shot_layer;
    }

    constructor(engine) {
        // scene contains skybox, light, camera and some effects (glow, fog, ...)
        super(engine);

        const scene = this;

        // this Inspector helps to debug scene
        // scene.debugLayer.show();
        // scene.debugLayer.show({
        //     embedMode: false,
        // });

        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0));
        light.intensity = 0.001;
        light.diffuse = new BABYLON.Color3(0.1, 0.1, 0.1);

        scene.createDefaultEnvironment({
            createGround: false,
            createSkybox: false,
        });

        scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
        scene.fogColor = new BABYLON.Color3(0.2, 0.2, 0.4);
        scene.fogDensity = 0.00025;

        const glow_layer = new BABYLON.GlowLayer('PlasmaShotGlow', scene);
        glow_layer.intensity = 0.95;
        this.plasma_shot_layer = glow_layer;

        const camera = new BABYLON.FreeCamera('MainCamera', BABYLON.Vector3.Zero(), scene);
        this.activeCamera = camera;
    }

    createSkyBox(space_radius_max) {
        const scene = this;

        const dist = space_radius_max * 3;
        const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: dist }, scene);

        const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', scene);
        skyboxMaterial.backFaceCulling = false;

        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('./assets/skybox/sky', scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;

        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor= new BABYLON.Color3(0, 0, 0);

        skybox.material = skyboxMaterial;

        skybox.infiniteDistance = true;
        skyboxMaterial.disableLighting = true;
        skyboxMaterial.freeze();

        //skybox.isPickable = false;
        //skybox.renderingGroupId = 0; // behind any other objects
    }

    applyOptimizations() {
        this.pointerMoveTrianglePredicate = () => false;
        this.skipPointerMovePicking = true;

        // this gives a strange error: Uncaught TypeError: Cannot read properties of null (reading 'hpBodyId')
        //BABYLON.SceneOptimizer.OptimizeAsync(this);

        // const target_FPS = 60;
        // const update_rate= 250;
        // let options = new BABYLON.SceneOptimizerOptions(target_FPS, update_rate);
        // this.optimizer = new BABYLON.SceneOptimizer(this.scene, options);
        // this.optimizer.targetFrameRate = target_FPS;
        // this.optimizer.start();
    }
}
