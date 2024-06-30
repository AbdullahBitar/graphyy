import { Edge, Node, getWeight } from '../common/common';

function findRoot(node: Node, parent: Map<Node, Node>): Node{
    if(node == parent.get(node))return node
    const root = findRoot(parent.get(node)!, parent)
    parent.set(node, root)
    return root
}

export function kruskal(edges: Edge[], nodes: Set<Node>) {
    edges.sort((a, b) => getWeight(a.weight) - getWeight(b.weight))
    const parent = new Map<Node, Node>()

    for(const node of nodes){
        parent.set(node, node)
    }

    let mstWeight = 0
    for(let i = 0; i < edges.length; i++){
        const edge = edges[i]
        const root1 = findRoot(edge.from, parent)
        const root2 = findRoot(edge.to, parent)

        console.log(`Edge: ${edge.from} - ${edge.to} Weight: ${getWeight(edge.weight)} Root1: ${root1} Root2: ${root2}`)

        if(root1 != root2){
            mstWeight += getWeight(edge.weight)
            parent.set(root1, root2)
        }
    }
    return mstWeight
}

export { };