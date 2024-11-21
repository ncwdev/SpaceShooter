import { BaseGui } from './BaseGui.js';
import { InOutMoveEffect } from '../Effects/InOutMoveEffect.js';

export class GradientBoardText extends BaseGui {
    panel = null;
    textBlock = null;

    alphaEffect = null;

    #isFinished = false;

    constructor(game, parent, text, backColor) {
        // backColor must be specified as text in format "#RRGGBB"
        super(game);

        this.createPanel(parent, text);
        this.setBackColor(backColor);
    }

    createPanel(parent, text) {
        const h = this.screenHeight;
        // const w = this.screenWidth;

        const panel = new BABYLON.GUI.Rectangle();
        panel.width = 1.00;
        panel.height = 0.08;
        panel.zIndex = 50;
        parent.addControl(panel);

        this.panel = panel;
        this.panel.isVisible = false;

        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        const txt = this.createTextBlock(panel);
        txt.text = text;
        txt.verticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
        txt.horizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        txt.fontSize = h * 0.04 + 'px';
        this.textBlock = txt;
    }

    setText(text) {
        this.textBlock.text = text;
    }

    setBackColor(backColor) {
        const h = this.screenHeight;
        const w = this.screenWidth;

        const gradient = new BABYLON.GUI.LinearGradient(0, h/2, w, h/2);
        gradient.addColorStop(0.0, backColor + '00');
        gradient.addColorStop(0.5, backColor + 'ff');
        gradient.addColorStop(1.0, backColor + '00');
        this.panel.backgroundGradient = gradient;
        this.panel.color = backColor + '00';
    }

    show(showTime = 0.7, waitTime = 0.9, hideTime = 1.3) {
        if (this.panel.isVisible) {
            return;
        }
        this.panel.isVisible = true;

        this.alphaEffect = new InOutMoveEffect(0.0, 1.0, showTime, waitTime, hideTime);
        this.panel.alpha = 0;

        this.#isFinished = false;
    }

    update(dt) {
        if (this.alphaEffect) {
            const alpha = this.alphaEffect.update(dt);
            this.panel.alpha = alpha;

            if (this.alphaEffect.isFinished()) {
                this.alphaEffect = null;
                this.panel.isVisible = false;
                this.#isFinished = true;
            }
        }
    }

    isFinished() {
        return this.#isFinished;
    }

    clear() {
        this.panel.dispose();
        this.panel = null;
    }
}
