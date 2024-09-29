let engine = null;
let canvas = null;
let scene  = null;

let havokInstance = null;

let game = null;
let menu = null;

const ENTITY_CLASS_MY_SHIP    = 1;
const ENTITY_CLASS_ENEMY_SHIP = 2;
const ENTITY_CLASS_ASTEROID   = 3;
const ENTITY_CLASS_MY_SHOT    = 4;
const ENTITY_CLASS_ENEMY_SHOT = 5;
const ENTITY_CLASS_MISSILE    = 6;
const ENTITY_CLASS_LOOTBOX    = 7;

const initEngine = async function() {
    canvas = document.getElementById('renderCanvas');
    if (!canvas) {
        throw 'initEngine(): canvas was not found';
    }
    const antialias = true;
    const adaptToDeviceRatio = false;
    const options = { preserveDrawingBuffer: false, stencil: true, disableWebGL2Support: false };
    engine = new BABYLON.Engine(canvas, antialias, options, adaptToDeviceRatio);
    // engine = new BABYLON.WebGPUEngine(canvas, options);
    // await engine.initAsync();

    if (!engine) {
        throw 'initEngine(): engine should not be null';
    }
    const { MyGame } = await import('./Game.js');
    const { MainMenu } = await import('./Gui/MainMenu.js');

    havokInstance = await HavokPhysics();

    const { default: game_config } = await import('./Config/GameCfg.js');
    game = new MyGame(engine, game_config);

    menu = MainMenu;
    menu.setMaxEnemiesNumber(game_config.max_enemies_num);

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
            engine.resize();
            scene.render();
        }
    });
}

async function startGame() {
    // menu button click handler
    if (!game) {
        console.error('startGame(): game should not be null');
        return;
    }
    menu.setVisible(false);

    engine.enterPointerlock();

    const enemiesNumber = menu.getEnemiesNumber();
    game.start(enemiesNumber);
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
    if (document.pointerLockElement === null) {
        if (game.isStateInMenu()) {
            return;
        }
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
initEngine();
