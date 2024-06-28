import { Node, outgoingEdge } from '../common/common';

export function getLCA(node1: Node, node2: Node, root: Node, adjacencyList: Map<Node, outgoingEdge[]>): Node {
    const parent = parentsArray(root, root, adjacencyList, new Map<Node, boolean>())
    
    const node1Ancestors = [], node2Ancestors = []
    while(parent.has(node1) && parent.get(node1) !== node1) {
        node1Ancestors.push(node1)
        if(parent.has(node1))
        node1 = parent.get(node1) as Node;
    }

    while(parent.has(node2) && parent.get(node2) !== node2) {
        node2Ancestors.push(node2)
        if(parent.has(node2))
        node2 = parent.get(node2) as Node;
    }

    let LCA = root;
    while(node1Ancestors.length > 0 && node2Ancestors.length > 0) {
        if(node1Ancestors[node1Ancestors.length - 1] === node2Ancestors[node2Ancestors.length - 1]) {
            LCA = node1Ancestors.pop() as Node;
            node2Ancestors.pop()
        }
        else {
            break
        }
    }

    return LCA
}

function parentsArray(node: Node, parent: Node, adjacencyList: Map<Node, outgoingEdge[]>, visited: Map<Node, boolean>): Map<Node, Node> {
    let parents = new Map<Node, Node>();
    parents.set(node, parent);
    visited.set(node, true);
    for(let child of adjacencyList.get(node) || []) {
        if(!visited.get(child.node)) {
            parents = new Map([...parents, ...parentsArray(child.node, node, adjacencyList, visited)]);
        }
    }
    return parents
}

export {}