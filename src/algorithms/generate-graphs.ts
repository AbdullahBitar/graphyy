import { Edge, Node } from "../common/common";
export { };

export const generateRandomTree = (numberOfNodes: number) => {
    let edges: string = ""
    for (let i = 2; i <= numberOfNodes; i++) {
        const randomNode = Math.floor(Math.random() * (i - 1)) + 1;
        edges += `${i} ${randomNode}\n`
    }
    if(numberOfNodes == 1)edges += '1'
    return edges
}

export const generateRandomGraph = (numberOfNodes: number, numberOfEdges: number) => {

    if(numberOfEdges > numberOfNodes * (numberOfNodes - 1) / 2)return ""

    let edges: string = ""
    const edgeSet = new Set<string>()
    const nodeSet = new Set<Node>()

    for(let e = 1 ; e <= numberOfEdges ; e++){
        let i = (e % numberOfNodes) + 1
        let randomNode = Math.floor(Math.random() * (numberOfNodes)) + 1;

        let loop = 0

        while(loop < 10000 && (edgeSet.has(`${i}-${randomNode}`) || randomNode == i)){
            randomNode = Math.floor(Math.random() * (numberOfNodes)) + 1;
            loop++
        }

        nodeSet.add(i)
        nodeSet.add(randomNode)

        edgeSet.add(`${i}-${randomNode}`)
        edgeSet.add(`${randomNode}-${i}`)

        edges += `${i} ${randomNode}\n`
    }

    for(let i = 1 ; i <= numberOfNodes ; i++){
        if(!nodeSet.has(i)){
            edges += `${i}\n`
        }
    }

    return edges
}