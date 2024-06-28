import { Node, outgoingEdge } from "../common/common";

export function isTree(node: Node, adjacencyList: Map<Node, outgoingEdge[]>, visited: Map<Node, boolean>, parent: Node): boolean {
    let tree = true
    visited.set(node, true)

    for(const edge of adjacencyList.get(node) || []){
        if(!visited.get(edge.node)){
            tree = tree && isTree(edge.node, adjacencyList, visited, node)
        }
        else if(edge.node !== parent){
            tree = false
        }
    }

    return tree
}

export {}