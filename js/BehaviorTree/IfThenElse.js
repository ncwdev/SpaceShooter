import { Node } from './Node.js';

export class IfThenElse extends Node {
    constructor(id) {
        super(id);

        this.nodes = [];
    }

    process(entity, context) {
        const condition = this.nodes[0];
        const result = condition.process(entity, context);

        if (result === Node.RES_SUCCESS) {
            const thenNode = this.nodes[1];
            return thenNode.process(entity, context);
        }
        const elseNode = this.nodes[2];
        if (elseNode) {
            return elseNode.process(entity, context);
        }
        return Node.RES_SUCCESS;
    }
}
