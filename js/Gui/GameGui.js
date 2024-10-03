import { BaseGui } from './BaseGui.js';
import { InOutMoveEffect } from '../Effects/InOutMoveEffect.js';
import { GradientBoardText } from './GradientBoardText.js';

export class GameGui extends BaseGui {
    parent = null;

    blackScreen = null;
    loadingText = null;

    infoPanel = null;
    tutorPanel = null;

    moveTutorEffect = null;

    goalBoardText = null;
    gameOverText = null;

    constructor(game) {
        super(game);

        // defines whether to automatically scale root to match hardwarescaling (false by default)
        const adaptiveScaling = true;
        const parent = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI(
            'UI', true, this.scene, BABYLON.Texture.BILINEAR_SAMPLINGMODE, adaptiveScaling);
        this.parent = parent;

        const back = new BABYLON.GUI.Image('back', 'assets/images/black_pixel.png');
        parent.addControl(back);
        this.blackScreen = back;
        this.blackScreen.isVisible = false;

        const txt = new BABYLON.GUI.TextBlock();
        txt.text = getLocText('TXT_LOADING');
        txt.color = '#ddd';
        txt.fontSize = this.font_size;
        parent.addControl(txt);
        txt.horizontalAlignment = BABYLON.GUI.TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
        txt.verticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;
        this.loadingText = txt;
        this.loadingText.isVisible = false;

        this.gameOverText = new GradientBoardText(game, parent, getLocText('TXT_WIN'), '#128F12');

        this.createInfoPanel(parent);
        this.createTutorPanel(parent);
    }

    createInfoPanel(parent) {
        // info panel contains help about controls
        const info = new BABYLON.GUI.Rectangle();
        info.width = 0.14;
        info.height= 0.08;
        parent.addControl(info);
        this.infoPanel = info;
        this.infoPanel.isVisible = false;
        info.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        info.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        info.background = '#8F644933';
        info.color = '#8F644933';

        const h = this.screen_height;

        let txt = this.createTextBlock(info);
        txt.text = getLocText('TXT_ESCAPE_INFO');
        txt.paddingTop = h * 0.010;
        txt.verticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_TOP;

        txt = this.createTextBlock(info);
        txt.text = getLocText('TXT_CONTROLS');
        txt.paddingTop = h * 0.040;
        txt.verticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_TOP;
    }

    createTutorPanel(parent) {
        // message about missiles in loot boxes
        const h = this.screen_height;
        const w = this.screen_width;

        const info = new BABYLON.GUI.Rectangle();
        info.height = 0.06;

        info.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        info.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

        info.background = '#8F644933';
        info.color = '#8F644933';

        parent.addControl(info);
        this.tutorPanel = info;
        this.tutorPanel.isVisible = false;

        const txt = this.createTextBlock(info);
        txt.text = getLocText('TXT_MISSILE_INFO');
        txt.paddingTop = h * 0.010;
        txt.verticalAlignment = BABYLON.GUI.TextBlock.VERTICAL_ALIGNMENT_CENTER;

        let width = this.parent.getContext().measureText(txt.text).width;
        width = width / w + 0.08;
        info.width = width;

        info.top = 0.12 * h;

        this.tutor_start_pos = -width * w;
        info.left = -width * w + 'px';
    }

    showTutor() {
        if (this.tutorPanel.isVisible) {
            return;
        }
        this.tutorPanel.isVisible = true;

        this.moveTutorEffect = new InOutMoveEffect(this.tutor_start_pos, 0, 0.7, 4.0, 0.7);
    }

    showGoal() {
        this.goalBoardText = new GradientBoardText(this.game, this.parent, getLocText('TXT_GOAL'), '#8F6449');
        this.goalBoardText.show();
    }

    isGoalEffectFinished() {
        if (!this.goalBoardText) {
            return true;
        }
        return this.goalBoardText.isFinished();
    }

    update(dt) {
        if (this.moveTutorEffect) {
            const x = this.moveTutorEffect.update(dt);
            this.tutorPanel.left = x + 'px';

            if (this.moveTutorEffect.isFinished()) {
                this.moveTutorEffect = null;
                this.tutorPanel.isVisible = false;
            }
        }
        if (this.goalBoardText) {
            this.goalBoardText.update(dt);

            if (this.goalBoardText.isFinished()) {
                this.goalBoardText = null;
            }
        }
        if (this.gameOverText) {
            this.gameOverText.update(dt);

            if (this.gameOverText.isFinished()) {
                this.gameOverText = null;
            }
        }
    }

    clear() {
        this.parent.dispose();
        this.parent = null;
    }
}
