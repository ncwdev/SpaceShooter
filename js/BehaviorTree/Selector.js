import {Node} from './Node.js';

export class Selector extends Node {
    constructor(id) {
        super(id);

        this.nodes = [];
    }

    process(entity, context) {
        for (let node of this.nodes) {
            const result = node.process(entity, context);
            
            if (result === Node.RES_SUCCESS || result === Node.RES_RUNNING) {
                return result;
            }
        }
        return Node.RES_FAIL;
    }
}