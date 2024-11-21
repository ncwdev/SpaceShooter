// this class allows to set shader effect of white noise to meshes
export class WhiteNoiseEffect {
    scene = null;
    mesh = null;

    effectMaterial = null;
    defaultMaterial = null;

    constructor(scene, mesh, texturePath) {
        this.scene = scene;
        this.mesh = mesh;

        this.effectMaterial = new BABYLON.ShaderMaterial('whiteNoise', this.scene, './js/Effects/Shaders/whiteNoise', {
            attributes: ['position', 'normal', 'uv'],
            uniforms: ['world', 'worldView', 'worldViewProjection', 'view', 'projection'],
        });
        const shipTexture = new BABYLON.Texture(texturePath, this.scene);
        this.effectMaterial.setTexture('shipTexture', shipTexture);
    }

    start() {
        this.defaultMaterial = this.mesh.material;
        this.mesh.material = this.effectMaterial;
    }

    stop() {
        this.mesh.material = this.defaultMaterial;
        this.defaultMaterial = null;
    }

    clear() {
        this.effectMaterial.dispose();
        this.effectMaterial = null;

        this.mesh = null;
        this.defaultMaterial = null;
    }
}
