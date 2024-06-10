import { ChangeEvent, useEffect, useRef, useState } from 'react';
import './MainPage.css';
import * as d3 from 'd3';
import { Edge, Node } from '../common/common';

export function MainPage() {

    const graphContainerRef = useRef<SVGSVGElement>(null);
    const [edges, setEdges] = useState('')
    const [allNodes, setAllNodes] = useState<Map<Node, any>>(new Map<Node, any>())
    const [allEdges, setAllEdges] = useState<Map<Edge, any>>(new Map<Edge, any>())

    const handleEdgesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setEdges(event.target.value)
    }

    useEffect(() => {
        if (!graphContainerRef || !graphContainerRef.current) return

        const width = graphContainerRef.current.clientWidth, height = graphContainerRef.current.clientHeight, margin = 20

        const svg = d3.select(graphContainerRef.current)
            .attr('width', width)
            .attr('height', height);

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

                const randomX = Math.random() * (width - 2 * margin) + margin;
                const randomY = Math.random() * (height - 2 * margin) + margin;

                const circleWithText = svg.append('g')
                    .attr('transform', `translate(${randomX}, ${randomY})`);

                const circle = circleWithText.append('circle')
                    .attr('r', 25)
                    .style('fill', 'none')
                    .style('stroke', 'black')
                    .style('stroke-width', 3);

                const text = circleWithText.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('alignment-baseline', 'middle')
                    .style('font-size', '14px')
                    .style('fill', 'black')
                    .text(node);

                allNodes.set(node, circleWithText)
            }
        }

        for (const [node, circle] of allNodes) {
            if (!nodeSet.has(node)) {
                circle.remove()
                allNodes.delete(node)
            }
        }

        for (const edge of edgeSet) {
            const fromNode = allNodes.get(edge.from);
            const toNode = allNodes.get(edge.to);

            if (fromNode === toNode || !fromNode || !toNode || allEdges.has(edge)) continue;

            const fromTransform = fromNode.attr('transform');
            const toTransform = toNode.attr('transform');

            const [fromX, fromY] = fromTransform.split('(')[1].split(',').map(parseFloat);
            const fromRadius = parseFloat(fromNode.select('circle').attr('r'));

            const [toX, toY] = toTransform.split('(')[1].split(',').map(parseFloat);
            const toRadius = parseFloat(toNode.select('circle').attr('r'));

            const dx = toX - fromX;
            const dy = toY - fromY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const unitDx = dx / length;
            const unitDy = dy / length;

            const startX = fromX + unitDx * fromRadius;
            const startY = fromY + unitDy * fromRadius;
            const endX = toX - unitDx * toRadius;
            const endY = toY - unitDy * toRadius;

            const line = svg.append("line")
                .attr("x1", startX)
                .attr("y1", startY)
                .attr("x2", endX)
                .attr("y2", endY)
                .attr("stroke", "black")
                .attr("stroke-width", 2);

            allEdges.set(edge, line);
        }

        for (const edge of allEdges.keys()) {
            if (!edgeSet.has(edge)) {
                allEdges.get(edge).remove()
                allEdges.delete(edge)
            }
        }

        setAllNodes(new Map(allNodes))
        setAllEdges(new Map(allEdges))
    }, [edges])

    return (
        <div className="main-page">
            <svg ref={graphContainerRef} className="graph-container">

            </svg>
            <div className="text-box">
                <textarea className="text-input" placeholder="Enter graph edges" value={edges} onChange={handleEdgesChange} ></textarea>
            </div>
            <div className="controls">

            </div>
        </div>
    );
}

export default MainPage;
