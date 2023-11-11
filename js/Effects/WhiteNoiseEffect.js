// this class allows to set shader effect of white noise to meshes
export class WhiteNoiseEffect {
    scene = null;
    mesh  = null;

    effect_material = null;
    default_material= null;

    constructor(scene, mesh, texture_path) {
        this.scene = scene;
        this.mesh = mesh;

        this.effect_material = new BABYLON.ShaderMaterial("whiteNoise", this.scene, "./js/Effects/Shaders/whiteNoise", {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
        });
        const ship_texture = new BABYLON.Texture(texture_path, this.scene);
        this.effect_material.setTexture("shipTexture", ship_texture);
    }
    start() {
        this.default_material = this.mesh.material;
        this.mesh.material = this.effect_material;
    }
    stop() {
        this.mesh.material = this.default_material;
        this.default_material = null;
    }
    clear() {
        this.effect_material.dispose();
        this.effect_material = null;

        this.mesh = null;
        this.default_material = null;
    }
}