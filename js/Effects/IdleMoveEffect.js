export class IdleMoveEffect {
    maxRadius = 1;
    moveSpeed = 1;

    moveTime = 1; // in seconds
    time = 0;
    minWaitTime = 500;

    point = new BABYLON.Vector2(0, 0);
    dir = null;

    constructor(maxRadius, moveSpeed) {
        this.maxRadius = maxRadius;
        this.moveSpeed = moveSpeed;

        this.start();
    }

    start() {
        this.time = 0;

        const x2 = -this.maxRadius + Math.random() * this.maxRadius * 2;
        const y2 = -this.maxRadius + Math.random() * this.maxRadius * 2;

        const dx = x2 - this.point.x;
        const dy = y2 - this.point.y;

        const dist = Math.sqrt(dx*dx + dy*dy);
        this.moveTime = dist / this.moveSpeed;

        this.dir = new BABYLON.Vector2(dx, dy).normalize();
    }

    update(dt) {
        if (this.time > this.moveTime) {
            const timeout = this.minWaitTime + Math.random() * this.minWaitTime;

            setTimeout(() => {
                this.start();
            }, timeout);

            return this.point;
        }
        const offset = this.dir.scale(this.moveSpeed * dt);
        this.point = this.point.add(offset);

        this.time += dt;

        return this.point;
    }
}
