import {Node} from './Node.js';

export class Leaf extends Node {
    constructor(id, func) {
        super(id);

        this.func = func;
    }

    process(entity, context) {
        return this.func(entity, context);
    }
}