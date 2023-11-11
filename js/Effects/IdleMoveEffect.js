export class IdleMoveEffect {
    max_radius = 1;
    move_speed = 1;
    
    move_time = 1;  // in seconds
    time = 0;
    min_wait_time = 500;

    point = new BABYLON.Vector2(0, 0);
    dir   = null;

    constructor(max_radius, move_speed) {
        this.max_radius = max_radius;
        this.move_speed = move_speed;

        this.start();
    }

    start() {
        this.time = 0;
        
        const x2 = -this.max_radius + Math.random() * this.max_radius * 2;
        const y2 = -this.max_radius + Math.random() * this.max_radius * 2;

        const dx = x2 - this.point.x;
        const dy = y2 - this.point.y;
        
        const dist = Math.sqrt(dx*dx + dy*dy);
        this.move_time = dist / this.move_speed;

        this.dir = new BABYLON.Vector2(dx, dy).normalize();
    }

    update(dt) {
        if (this.time > this.move_time) {
            const timeout = this.min_wait_time + Math.random() * this.min_wait_time;
            
            setTimeout(() => {
                this.start();
            }, timeout);
            
            return this.point;
        }
        const offset = this.dir.scale(this.move_speed * dt);
        this.point = this.point.add(offset);

        this.time += dt;

        return this.point;
    }
}