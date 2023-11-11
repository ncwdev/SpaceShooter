import {BaseGui} from './BaseGui.js';
import {InOutMoveEffect} from '../Effects/InOutMoveEffect.js';

export class GradientBoardText extends BaseGui {
    panel = null;
    text_block = null;

    alpha_effect = null;

    is_finished = false;

    constructor(game, parent, text, back_color) {
        // back_color must be specified as text in format "#RRGGBB"
        super(game);

        this.createPanel(parent, text);
        this.setBackColor(back_color);
    }

    createPanel(parent, text) {
        const h = this.screen_height;
        const w = this.screen_width;

        const panel = new BABYLON.GUI.Rectangle();
        panel.width = 1.00;
        panel.height= 0.08;
        panel.zIndex= 50;
        parent.addControl(panel);

        this.panel = panel;
        this.panel.isVisible = false;

        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        let txt = this.createTextBlock(panel);
        txt.text = text;
        txt.verticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
        txt.horizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        txt.fontSize = h * 0.04 + "px";
        this.text_block = txt;
    }

    setText(text) {
        this.text_block.text = text;
    }

    setBackColor(back_color) {
        const h = this.screen_height;
        const w = this.screen_width;

        const gradient = new BABYLON.GUI.LinearGradient(0, h/2, w, h/2);
        gradient.addColorStop(0.0, back_color + "00");
        gradient.addColorStop(0.5, back_color + "ff");
        gradient.addColorStop(1.0, back_color + "00");
        this.panel.backgroundGradient = gradient;
        this.panel.color = back_color + "00";
    }

    show(show_time = 0.7, wait_time = 0.9, hide_time = 1.3) {
        if (this.panel.isVisible) {
            return;
        }
        this.panel.isVisible = true;

        this.alpha_effect = new InOutMoveEffect(0.0, 1.0, show_time, wait_time, hide_time);
        this.panel.alpha = 0;

        this.is_finished = false;
    }

    update(dt) {
        if (this.alpha_effect) {
            const alpha = this.alpha_effect.update(dt);
            this.panel.alpha = alpha;

            if (this.alpha_effect.isFinished()) {
                this.alpha_effect = null;
                this.panel.isVisible = false;
                this.is_finished = true;
            }
        }
    }

    isFinished() {
        return this.is_finished;
    }

    clear() {
        this.panel.dispose();
        this.panel = null;
    }
}