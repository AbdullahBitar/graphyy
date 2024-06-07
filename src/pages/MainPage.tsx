import { ChangeEvent, useEffect, useRef, useState } from 'react';
import './MainPage.css';
import Two from 'two.js'
import { Edge, Node } from '../common/common';

export function MainPage() {

    const graphContainerRef = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState('')
    const [allNodes, setAllNodes] = useState<Map<Node, any>>(new Map<Node, any>())
    const [allEdges, setAllEdges] = useState<Map<Edge, any>>(new Map<Edge, any>())

    const two = useRef<Two | null>(null);

    const handleEdgesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setEdges(event.target.value)
    }

    useEffect(() => {
        if (graphContainerRef.current) {
            two.current = new Two({
                fullscreen: true,
                type: Two.Types.canvas
            }).appendTo(graphContainerRef.current)

            two.current.width = graphContainerRef.current.offsetWidth;
            two.current.height = graphContainerRef.current.offsetHeight;
        }
    }, []);

    useEffect(() => {
        if (!two.current) return
        const nodeSet = new Set<Node>()

        const edgeSet = new Set<Edge>();
        edges.split('\n').forEach(edge => {
            const numOfInputs = edge.split(' ').length;
            if (numOfInputs !== 2 && numOfInputs !== 3) return;

            const [from, to, weight] = edge.split(' ');

            if (from) nodeSet.add(from);
            if (to) nodeSet.add(to);
            edgeSet.add({ from, to, weight });
        });


        for (const node of nodeSet) {
            if (!allNodes.has(node)) {
                const circle = two.current.makeCircle(two.current.width * Math.random(), two.current.height * Math.random(), 20)
                circle.linewidth = 3
                const text = two.current.makeText(node.toString(), circle.translation.x, circle.translation.y);
                const circleWithText = two.current.makeGroup(circle, text)
                allNodes.set(node, circleWithText)
            }
        }

        for (const [node, circle] of allNodes) {
            if (!nodeSet.has(node)) {
                two.current.remove(circle)
                allNodes.delete(node)
            }
        }

        for (const edge of edgeSet) {
            const fromNode = allNodes.get(edge.from)
            const toNode = allNodes.get(edge.to)

            if(fromNode === toNode)continue
        
            if (fromNode && toNode && fromNode.children && toNode.children && !allEdges.has(edge)) {
                const fromCircle = fromNode.children[0]
                const toCircle = toNode.children[0]
        
                const angle = Math.atan2(toCircle.translation.y - fromCircle.translation.y, toCircle.translation.x - fromCircle.translation.x)
        
                const fromX = fromCircle.translation.x + (Math.cos(angle) * fromCircle.radius)
                const fromY = fromCircle.translation.y + (Math.sin(angle) * fromCircle.radius)
                const toX = toCircle.translation.x - (Math.cos(angle) * toCircle.radius)
                const toY = toCircle.translation.y - (Math.sin(angle) * toCircle.radius)
        
                const line = two.current.makeLine(
                    fromX,
                    fromY,
                    toX,
                    toY
                );
                line.linewidth = 2
                allEdges.set(edge, line)
            }
        }
        
        for(const edge of allEdges.keys()){
            if(!edgeSet.has(edge)){
                two.current.remove(allEdges.get(edge))
                allEdges.delete(edge)
            }
        }

        setAllNodes(new Map(allNodes))
        setAllEdges(new Map(allEdges))

        two.current.update()
    }, [edges])

    return (
        <div className="main-page">
            <div ref={graphContainerRef} className="graph-container">

            </div>
            <div className="text-box">
                <textarea className="text-input" placeholder="Enter graph edges" value={edges} onChange={handleEdgesChange} ></textarea>
            </div>
            <div className="controls">

            </div>
        </div>
    );
}

export default MainPage;
