export class KeyboardManager {
    scene = null;
    keysObserver = null;

    isInputAllowed = true;
    isControlPressed = false;
    #isShiftPressed = false;

    keysMap = {}; // object for multiple key presses

    constructor(scene) {
        this.scene = scene;
        this.keysObserver = scene.onKeyboardObservable.add(this.onKeyboardHandler.bind(this));
    }

    setInputAllowed(allowed) {
        this.isInputAllowed = allowed;

        if (!allowed) {
            this.isControlPressed = false;
            this.#isShiftPressed = false;
            this.keysMap = {}; // object for multiple key presses
        }
    }

    onKeyboardHandler(e) {
        if (!this.isInputAllowed) {
            return;
        }
        switch (e.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                // save key code in dict for update() method
                this.keysMap[e.event.code] = true;

                if (e.event.code === 'ShiftLeft' && !this.#isShiftPressed) {
                    this.#isShiftPressed = true;
                }
                if (e.event.code === 'ControlLeft' && !this.isControlPressed) {
                    this.isControlPressed = true;
                }
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                this.keysMap[e.event.code] = false;

                if (e.event.code === 'ShiftLeft' && this.#isShiftPressed) {
                    this.#isShiftPressed = false;
                }
                if (e.event.code === 'ControlLeft' && this.isControlPressed) {
                    this.isControlPressed = false;
                }
                break;
        }
        // console.log(e.event.code, e.event.keyCode);
    }

    isShiftPressed() {
        return this.#isShiftPressed;
    }

    isKeyPressed(key) {
        return this.keysMap[key];
    }

    clear() {
        if (this.keysObserver) {
            this.scene.onKeyboardObservable.remove(this.keysObserver);
        }
        this.keysObserver = null;
    }
}
