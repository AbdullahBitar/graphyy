import { Edge, Node, getWeight, outgoingEdge } from "../common/common"

export function shortestPathBellmanFord(start: Node, end: Node, edges: Edge[], nodes: Set<Node>): string {
    const dist: Map<Node, number> = new Map()
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
                dist.set(edge.to, fromDist + weight);
                lastUpdated = i;
            }
        }
    }

    if(lastUpdated === nodes.size){
        return "-∞"
    }
    else if (dist.get(end) === Infinity) return '∞'
    else return dist.get(end)?.toString() ?? '∞'

}

export { }