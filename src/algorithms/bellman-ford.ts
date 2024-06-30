import { Edge, Node, getWeight, outgoingEdge } from "../common/common"
import * as d3 from 'd3'

export function shortestPathBellmanFord(start: Node, end: Node, edges: Edge[], nodes: Set<Node>, isDirected: boolean): string {
    const dist: Map<Node, number> = new Map()
    const parent: Map<Node, Node> = new Map()

    for (const node of nodes) {
        dist.set(node, Infinity)
    }

    dist.set(start, 0)

    let lastUpdated = -1
    for (let i = 1; i <= nodes.size; i++) {
        for (const edge of edges) {
            const fromDist = dist.get(edge.from) ?? Infinity;
            const toDist = dist.get(edge.to) ?? Infinity;
            const weight = getWeight(edge.weight);

            if (fromDist === Infinity) continue;

            if (toDist > fromDist + weight) {
                parent.set(edge.to, edge.from);
                dist.set(edge.to, fromDist + weight);
                lastUpdated = i;
            }
        }
    }

    if(lastUpdated === nodes.size){
        return "-∞"
    }
    else if (dist.get(end) === Infinity) return '∞'
    else {
        let node = end

        while (node !== start) {
            const edgeId = `edge-${parent.get(node)}-${node}`
            d3.select(`#${edgeId}`).each(function () {
                d3.select(this).attr('stroke', 'red')
            })
            if(!isDirected){
                const edgeId = `edge-${node}-${parent.get(node)}`
                d3.select(`#${edgeId}`).each(function () {
                    d3.select(this).attr('stroke', 'red')
                })
            }
            node = parent.get(node)!
        }

        return dist.get(end)?.toString() ?? '∞'
    }

}

export { }