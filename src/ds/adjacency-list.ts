import { Edge, Node, outgoingEdge } from "../common/common";

export {};

// function getNumericAdjacencyList(Map<string, number>nodeNumber, ): unknown[][]{
    
// }

function getAdjancecyList(edges: Edge[]): Map<Node, outgoingEdge[]> {
    const adjacencyList: Map<Node, outgoingEdge[]> = new Map()

    for(const edge of edges){
        if(!adjacencyList.has(edge.from)){
            adjacencyList.set(edge.from, [])
        }
        adjacencyList.get(edge.from)?.push({
            node: edge.to,
            weight: edge.weight
        })
    }
    
    return adjacencyList
}