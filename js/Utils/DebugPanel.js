const divPanel = document.getElementById('DebugPanel');
const divFPS = document.getElementById('game_fps');
const divDist = document.getElementById('dist');
const divFwdVel = document.getElementById('fwd_vel');

let starttick = 0;
let currenttick = 0;
let ticks = 0;
let fps = 0;

export function setVisible(flag) {
    divPanel.style.display = flag ? 'grid' : 'none';
}

export function updateFps() {
    ++ticks;
    currenttick = Date.now();

    if (currenttick - starttick >= 1000) {
        fps = ticks;
        starttick = currenttick;
        ticks = 0;
    }
    divFPS.innerHTML = fps + ' fps';
}

export function setDistanceToCenter(value) {
    divDist.innerHTML = value.toFixed(2);
}

export function setShipVelocity(value) {
    divFwdVel.innerHTML = value.toFixed(2);
}

export function createAxises(lenX, lenY, lenZ) {
    const xAxis = [
        new BABYLON.Vector3(-lenX, 0, 0),
        new BABYLON.Vector3(lenX * 10, 0, 0),
    ];
    const xLines = BABYLON.MeshBuilder.CreateLines('lines', { points: xAxis });
    xLines.color = new BABYLON.Color3(1, 0, 0);

    const yAxis = [
        new BABYLON.Vector3(0, -lenY, 0),
        new BABYLON.Vector3(0, lenY * 10, 0),
    ];
    const yLines = BABYLON.MeshBuilder.CreateLines('lines', { points: yAxis });
    yLines.color = new BABYLON.Color3(0, 1, 0);

    const zAxis = [
        new BABYLON.Vector3(0, 0, -lenZ),
        new BABYLON.Vector3(0, 0, lenZ * 10),
    ];
    const zLines = BABYLON.MeshBuilder.CreateLines('lines', { points: zAxis });
    zLines.color = new BABYLON.Color3(0, 0, 1);
}
