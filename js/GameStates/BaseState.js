// definition of state interface
export class BaseState {
    game = null;

    constructor(game) {
        this.game = game;
    }

    enter() {}

    update() {}

    exit() {}
}
