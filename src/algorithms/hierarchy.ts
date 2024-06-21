import {Node, outgoingEdge} from "../common/common";

export function getHierarchyData(node: Node, adjacencyList: Map<Node, outgoingEdge[]>, visited: Map<Node, boolean>, parent: Node) {
    let data: any = {}
    data["name"] = node
    data["children"] = []
    visited.set(node, true)
    for (const edge of Array.from(new Set(adjacencyList.get(node) || []))) {
        if (!visited.get(edge.node)) {
            data["children"].push(getHierarchyData(edge.node, adjacencyList, visited, node))
        }
    }
    return data
}