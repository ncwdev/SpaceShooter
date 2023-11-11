export class ProgressBar3d {

    parent = null;
    
    underlay = null;
    progress = null;
    
    color = "white";
    width = 0;

    constructor(parent, width, height, alpha) {
        // height and width are a fraction of the canvas
        this.parent = parent;
        this.width = width;
    
        const underlay = new BABYLON.GUI.Rectangle();
        underlay.width = `${width * 100}%`;
        underlay.height= `${height* 100}%`;
        underlay.color = "white";
        underlay.thickness = 1;
        underlay.background = "black";
        underlay.alpha = alpha;
        this.parent.addControl(underlay);
        this.underlay = underlay;

        const progress = new BABYLON.GUI.Rectangle();
        progress.width = "100%";
        progress.height= "100%";
        progress.color = "white";
        progress.background = "red";
        progress.thickness = 0;
        //progress.alpha = alpha;

        progress.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        progress.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

        // Add the progress bar to the underlay
        underlay.addControl(progress);

        this.progress = progress;
    }
    setWidth(v) {
        this.width = v;

        if (!this.underlay) {
            return;
        }
        this.underlay.width = `${width * 100}%`;
    }
    setColor(v) {
        this.color = v;

        if (!this.progress) {
            return;
        }
        this.progress.background = v;
    }
    setTop(value) {
        this.underlay.top = `${value}px`;
    }
    setLeft(value) {
        this.underlay.left = `${value}px`;
    }
    setProgress(progress) {
        // progress is from 0 to 1
        this.progress.width = `${progress * 100}%`;
    }
    setVisible(v) {
        if (this.underlay) {
            this.underlay.isVisible = v;
        }
    }
    clear() {
        this.progress.dispose();
        this.progress = null;

        this.underlay.dispose();
        this.underlay = null;

        this.parent = null;
    }
}