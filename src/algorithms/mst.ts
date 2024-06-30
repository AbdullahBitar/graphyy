import { Edge, Node, getWeight } from '../common/common';
import * as d3 from 'd3';

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

        if(root1 != root2){
            mstWeight += getWeight(edge.weight)
            parent.set(root1, root2)
            const edgeId = `edge-${edge.from}-${edge.to}`
            d3.select(`#${edgeId}`).each(function(){
                d3.select(this).attr('stroke', 'red')
            })
        }
    }
    return mstWeight
}

export { };