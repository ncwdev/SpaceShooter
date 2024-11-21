const GUI_FONT_SIZE = 0.014;

const textBlocks = [];

export class BaseGui {
    game = null;
    scene = null;

    screenWidth = 0;
    screenHeight = 0;

    fontSize = null;
    paddingLeft = 0;

    constructor(game) {
        this.game = game;
        this.scene = game.getScene();

        const engine = this.scene.getEngine();
        this.screenWidth = engine.getRenderWidth();
        this.screenHeight = engine.getRenderHeight();

        this.fontSize = (this.screenHeight + this.screenWidth) * 0.5 * GUI_FONT_SIZE;

        this.paddingLeft = this.screenWidth * 0.005;
    }

    createTextBlock(parent) {
        const txt = new BABYLON.GUI.TextBlock();
        txt.color = '#FFEBCD';
        txt.outlineColor = 'black';
        txt.outlineWidth = 1;
        txt.fontSize = this.fontSize;
        txt.resizeToFit = true;
        txt.horizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        txt.paddingLeft = this.paddingLeft;
        parent.addControl(txt);

        const ref = new WeakRef(txt);
        textBlocks.push(ref);

        return txt;
    }
}

window.addEventListener('resize', function () {
    const newFontSize = (window.innerHeight + window.innerWidth) * 0.5 * GUI_FONT_SIZE;

    textBlocks.forEach(ref => {
        const txt = ref.deref();
        if (txt) {
            txt.fontSize = newFontSize;
        }
    });
});
