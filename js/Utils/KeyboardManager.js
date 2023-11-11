export class KeyboardManager {

    scene = null;
    keys_observer = null;

    is_input_allowed = true;
    is_control_pressed = false;
    is_shift_pressed = false;

    keys_map = {}; // object for multiple key presses
    
    constructor(scene) {
        this.scene = scene;
        this.keys_observer = scene.onKeyboardObservable.add(this.onKeyboardHandler.bind(this));
    }

    setInputAllowed(allowed) {
        this.is_input_allowed = allowed;

        if (!allowed) {
            this.is_control_pressed = false;
            this.is_shift_pressed = false;
            this.keys_map = {}; // object for multiple key presses
        }
    }

    onKeyboardHandler(e) {
        if (!this.is_input_allowed) {
            return;
        }
        switch (e.type) {
            case BABYLON.KeyboardEventTypes.KEYDOWN:
                // save key code in dict for update() method
                this.keys_map[e.event.code] = true;

                if (e.event.code === 'ShiftLeft' && !this.is_shift_pressed) {
                    this.is_shift_pressed = true;
                }
                if (e.event.code === 'ControlLeft' && !this.is_control_pressed) {
                    this.is_control_pressed = true;
                }
                break;
            case BABYLON.KeyboardEventTypes.KEYUP:
                this.keys_map[e.event.code] = false;

                if (e.event.code === 'ShiftLeft' && this.is_shift_pressed) {
                    this.is_shift_pressed = false;
                }
                if (e.event.code === 'ControlLeft' && this.is_control_pressed) {
                    this.is_control_pressed = false;
                }
                break;
        }
        //console.log(e.event.code, e.event.keyCode);
    }

    isShiftPressed() {
        return this.is_shift_pressed;
    }

    isKeyPressed(key) {
        return this.keys_map[key];
    }

    clear() {
        if (this.keys_observer) {
            this.scene.onKeyboardObservable.remove(this.keys_observer);
        }
        this.keys_observer = null;
    }
}