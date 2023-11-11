import {Node} from './Node.js';

// This node stores an index of currently running node in the incoming context.
export class Sequence extends Node {
    constructor(id) {
        super(id);

        this.nodes = [];
    }

    process(entity, context) {
        let index = context[this.id] ?? 0;
        for (let i = index; i < this.nodes.length; ++i) {
            context[this.id] = i;   // update index of currently running node
            
            const node = this.nodes[i];
            const result = node.process(entity, context);
            
            if (result === Node.RES_FAIL) {
                context[this.id] = 0;   // reset index to start from the beginning
                return Node.RES_FAIL;
            }
            if (result === Node.RES_RUNNING) {
                return Node.RES_RUNNING;
            }
            // if result === Node.RES_SUCCESS go to the next node
        }
        context[this.id] = 0;
        return Node.RES_SUCCESS;
    }
}