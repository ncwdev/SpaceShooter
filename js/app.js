let engine = null;
let canvas = null;
let scene  = null;

let havokInstance = null;

let game = null;

const ENTITY_CLASS_MY_SHIP    = 1;
const ENTITY_CLASS_ENEMY_SHIP = 2;
const ENTITY_CLASS_ASTEROID   = 3;
const ENTITY_CLASS_MY_SHOT    = 4;
const ENTITY_CLASS_ENEMY_SHOT = 5;
const ENTITY_CLASS_MISSILE    = 6;
const ENTITY_CLASS_LOOTBOX    = 7;

async function createEngine() {
    const options = { preserveDrawingBuffer: false, stencil: true, disableWebGL2Support: false };

    const webGPUSupported = await BABYLON.WebGPUEngine.IsSupportedAsync;
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
            // engine.resize();
            const w = engine.getRenderWidth();
            const h = engine.getRenderHeight();
            engine.setSize(Math.min(w, 1920), Math.min(h, 1080)); // to optimize FPS on different resolutions

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

// Entry point
init();
