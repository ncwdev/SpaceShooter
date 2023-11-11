import {Selector} from './Selector.js';
import {Sequence} from './Sequence.js';
import {IfThenElse} from './IfThenElse.js';
import {Leaf} from './Leaf.js';

export class TreeBuilder {
    static NT_LEAF = 0;
    static NT_SELECTOR = 1;
    static NT_SEQUENCE = 2;
    static NT_IF_THEN_ELSE = 3;

    // this method has camel case style because was created with help of ChatGPT
    static createTree(tree_declaration) {
        // Create a map to store the node instances
        const nodeMap = {};
        
        // Create the appropriate node for each node declaration
        Object.keys(tree_declaration).forEach( nodeId => {
            const nodeDecl = tree_declaration[nodeId];
            let node;

            switch (nodeDecl.type) {
                case TreeBuilder.NT_SELECTOR:
                    node = new Selector(nodeId);
                    break;
                case TreeBuilder.NT_SEQUENCE:
                    node = new Sequence(nodeId);
                    break;
                case TreeBuilder.NT_IF_THEN_ELSE:
                    node = new IfThenElse(nodeId);
                    break;
                case TreeBuilder.NT_LEAF:
                    node = new Leaf(nodeId, nodeDecl.func);
                    break;
                default:
                    throw new Error(`Invalid node type: ${nodeDecl.type}`);
            }
            // Store the node instance in the map
            nodeMap[nodeId] = node;
        });
        
        // Recursively build the tree by creating the children nodes
        Object.keys(tree_declaration).forEach( nodeId => {
            const nodeDecl = tree_declaration[nodeId];
            const node = nodeMap[nodeId];

            if (nodeDecl.nodes) {
                nodeDecl.nodes.forEach( childId => {
                    const childNode = nodeMap[childId];
                    if (!childNode) {
                        throw new Error(`Invalid child node ID: ${childId}`);
                    }
                    node.addChild(childNode);
                });
            }
        });
        // Return the root node of the tree
        return nodeMap["root"];
    }
}