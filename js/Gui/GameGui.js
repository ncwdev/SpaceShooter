import { BaseGui } from './BaseGui.js';
import { InOutMoveEffect } from '../Effects/InOutMoveEffect.js';
import { GradientBoardText } from './GradientBoardText.js';

export class GameGui extends BaseGui {
    parent = null;

    blackScreen = null;
    loadingText = null;

    infoPanel = null;
    tutorPanel = null;
    tutorStartPos = 0;

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

        this.infoPanel = document.getElementById('HelpPanel');

        this.tutorPanel = document.getElementById('TutorPanel');
        const style = window.getComputedStyle(this.tutorPanel);
        this.tutorStartPos = -parseFloat(style.width);
        this.tutorPanel.style.left = this.tutorStartPos + 'px';
    }

    setInfoPanelVisible(flag) {
        this.infoPanel.style.display = flag ? 'block' : 'none';
    }

    showTutor() {
        if (this.tutorPanel.isVisible) {
            return;
        }
        this.tutorPanel.isVisible = true;
        this.tutorPanel.style.display = 'block';

        const endPos = 0;
        const inTime = 0.7;
        const waitTime = 4.0;
        const outTime = 0.7;
        this.moveTutorEffect = new InOutMoveEffect(this.tutorStartPos, endPos, inTime, waitTime, outTime);
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
            this.tutorPanel.style.left = x + 'px';

            if (this.moveTutorEffect.isFinished()) {
                this.moveTutorEffect = null;
                this.tutorPanel.style.display = 'none';
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
