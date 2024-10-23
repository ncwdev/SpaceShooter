let engine = null;
let canvas = null;
let scene  = null;

let havokInstance = null;

const MAX_WIDHT = 1920;
const MAX_HEIGHT = 1080;

let game = null;

async function createEngine() {
    const options = { preserveDrawingBuffer: false, stencil: true, disableWebGL2Support: false };

    // const webGPUSupported = await BABYLON.WebGPUEngine.IsSupportedAsync;
    const webGPUSupported = false; // last chrome update broke webGPU performance
    if (webGPUSupported) {
        engine = new BABYLON.WebGPUEngine(canvas, options);
        await engine.initAsync();
    } else {
        const antialias = true;
        const adaptToDeviceRatio = false;
        engine = new BABYLON.Engine(canvas, antialias, options, adaptToDeviceRatio);
    }
}

const init = async function() {
    canvas = document.getElementById('renderCanvas');
    if (!canvas) {
        throw 'init(): canvas was not found';
    }
    await createEngine();
    if (!engine) {
        throw 'init(): engine should not be null';
    }
    havokInstance = await HavokPhysics();

    const { default: gameConfig } = await import('./Config/GameCfg.js');
    const { MyGame } = await import('./Game.js');
    game = new MyGame(engine, gameConfig);

    scene = game.getScene();
    if (!scene) {
        throw 'initFunction(): cannot get MyGame scene';
    }
    runRenderLoop();

    canvas.focus();
};

function runRenderLoop() {
    engine.runRenderLoop(function () {
        if (scene && scene.activeCamera) {
            scene.render();
        }
    });
}

function startGame() {
    // menu button click handler
    if (!game) {
        console.error('startGame(): game should not be null');
        return;
    }
    resize();

    engine.enterPointerlock();

    game.hideMenu();
}

function pauseGame() {
    engine.stopRenderLoop();

    scene.physicsEnabled = false;
}

function resumeGame() {
    scene.physicsEnabled = true;

    runRenderLoop();
}

document.addEventListener('pointerlockchange', () => {
    // Pointer lock is disabled (user pressed Escape)
    if (document.pointerLockElement === null && game.isPlayState()) {
        pauseGame();

        const result = confirm(getLocText('TXT_EXIT_CONFIRM'));
        resumeGame();

        if (result) {
            game.returnToMenu();
        } else {
            engine.enterPointerlock();
        }
    }
});

function resize() {
    let w = window.innerWidth;
    let h = window.innerHeight;

    // limit resolution to optimize performance
    w = Math.min(w, MAX_WIDHT);
    h = Math.min(h, MAX_HEIGHT);

    const resizableContainer = document.getElementById('resizableContainer');
    resizableContainer.style.width = w + 'px';
    resizableContainer.style.height = h + 'px';

    engine.setSize(w, h);
}
window.addEventListener('resize', resize);

// Entry point
init();
