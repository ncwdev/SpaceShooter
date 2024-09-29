const GUI_FONT_SIZE = 0.014;

const textBlocks = [];

export class BaseGui {
    game = null;
    scene = null;

    screen_width = 0;
    screen_height = 0;

    font_size = null;
    padding_left = 0;

    constructor(game) {
        this.game = game;
        this.scene = game.getScene();

        const engine = this.scene.getEngine();
        this.screen_width = engine.getRenderWidth();
        this.screen_height = engine.getRenderHeight();

        this.font_size = (this.screen_height + this.screen_width) * 0.5 * GUI_FONT_SIZE;

        this.padding_left = this.screen_width * 0.005;
    }

    createTextBlock(parent) {
        const txt = new BABYLON.GUI.TextBlock();
        txt.color = '#FFEBCD';
        txt.outlineColor = 'black';
        txt.outlineWidth = 1;
        txt.fontSize = this.font_size;
        txt.resizeToFit = true;
        txt.horizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        txt.paddingLeft = this.padding_left;
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
