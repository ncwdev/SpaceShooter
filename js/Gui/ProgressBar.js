import * as utils from '../Utils/utils.js';

export class ProgressBar {

    parent = null;
    line   = null;
    
    x1 = 0;
    y1 = 0;

    x2 = 0;
    y2 = 0;

    color = "white";
    width = 1;

    constructor(parent) {
        let line = new BABYLON.GUI.Line();
        parent.addControl(line);

        this.line = line;
        this.parent = parent;
    }
    setStartPoint(x, y) {
        this.x1 = x;
        this.y1 = y;

        if (!this.line) {
            return;
        }
        this.line.x1 = x;
        this.line.y1 = y;
    }
    setEndPoint(x, y) {
        this.x2 = x;
        this.y2 = y;

        if (!this.line) {
            return;
        }
        this.line.x2 = x;
        this.line.y2 = y;
    }
    setWidth(v) {
        this.width = v;

        if (!this.line) {
            return;
        }
        this.line.lineWidth = v;
    }
    setColor(v) {
        this.color = v;

        if (!this.line) {
            return;
        }
        this.line.color = v;
    }
    setProgress(percent) {
        // calc end point
        let v0 = {x: this.x2 - this.x1, y: this.y2 - this.y1};
        let v1 = utils.mult3d(v0, percent);
        let v2 = utils.add3d({x: this.x1, y: this.y1}, v1);

        if (!this.line) {
            return;
        }
        this.line.x2 = v2.x;
        this.line.y2 = v2.y;
    }
    setVisible(v) {
        if (this.line) {
            this.line.isVisible = v;
        }
    }
    clear() {
        if (this.line) {
            this.line.dispose();
        }
        this.line = null;
        this.parent = null;
    }
}