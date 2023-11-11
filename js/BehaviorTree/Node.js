export class Node {
    id = null;
    nodes = null;
    func  = null;

    static RES_FAIL = 0;
    static RES_SUCCESS = 1;
    static RES_RUNNING = 2;

    constructor(id) {
        this.id = id;
    }

    addChild(node) {
        this.nodes.push(node);
    }
  
    process(entity, context) {
    }
}