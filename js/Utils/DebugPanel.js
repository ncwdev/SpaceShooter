const div_panel = document.getElementById("DebugPanel");
const div_fps   = document.getElementById("game_fps");
const div_dist  = document.getElementById("dist");
const div_fwd_vel = document.getElementById("fwd_vel");

let starttick = 0;
let currenttick = 0;
let ticks = 0;
let fps = 0;

export function setVisible(flag) {
    div_panel.style.display = flag ? "grid" : "none";
}

export function updateFps() {
    ++ticks;
    currenttick = Date.now();

    if (currenttick - starttick >= 1000) {
        fps = ticks;
        starttick = currenttick;
        ticks = 0;
    }
    div_fps.innerHTML = fps + " fps";
}

export function setDistanceToCenter(value) {
    div_dist.innerHTML = value.toFixed(2);
}

export function setShipVelocity(value) {
    div_fwd_vel.innerHTML = value.toFixed(2);
}

export function createAxises(len_x, len_y, len_z) {
    const xAxis = [
        new BABYLON.Vector3(-len_x, 0, 0),
        new BABYLON.Vector3(len_x*10, 0, 0),
    ];
    const x_lines = BABYLON.MeshBuilder.CreateLines("lines", {points: xAxis});
    x_lines.color = new BABYLON.Color3(1, 0, 0);

    const yAxis = [
        new BABYLON.Vector3(0, -len_y, 0),
        new BABYLON.Vector3(0, len_y*10, 0),
    ];
    const y_lines = BABYLON.MeshBuilder.CreateLines("lines", {points: yAxis});
    y_lines.color = new BABYLON.Color3(0, 1, 0);

    const zAxis = [
        new BABYLON.Vector3(0, 0, -len_z),
        new BABYLON.Vector3(0, 0, len_z*10),
    ];
    const z_lines = BABYLON.MeshBuilder.CreateLines("lines", {points: zAxis});
    z_lines.color = new BABYLON.Color3(0, 0, 1);
}