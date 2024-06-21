import { Edge, Node, outgoingEdge } from "../common/common";

export {};

// function getNumericAdjacencyList(Map<string, number>nodeNumber, ): unknown[][]{
    
// }

export function getAdjancecyList(edges: Edge[]): Map<Node, outgoingEdge[]> {
    const adjacencyList: Map<Node, outgoingEdge[]> = new Map()

    for(const edge of edges){
        if(!edge)continue
        if(!adjacencyList.has(edge.from)){
            adjacencyList.set(edge.from, [])
        }
        if(!adjacencyList.has(edge.to)){
            adjacencyList.set(edge.to, [])
        }
        adjacencyList.get(edge.from)?.push({
            node: edge.to,
            weight: edge.weight
        })
        adjacencyList.get(edge.to)?.push({
            node: edge.from,
            weight: edge.weight
        })
    }
    
    return adjacencyList
}