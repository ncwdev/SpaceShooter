import {Node} from './Node.js';

export class IfThenElse extends Node {
    constructor(id) {
        super(id);

        this.nodes = [];
    }

    process(entity, context) {
        const condition = this.nodes[0];
        const result = condition.process(entity, context);

        if (result === Node.RES_SUCCESS) {
            const then_node = this.nodes[1];
            return then_node.process(entity, context);
        }
        const else_node = this.nodes[2];
        if (else_node) {
            return else_node.process(entity, context);
        }
        return Node.RES_SUCCESS;
    }
}