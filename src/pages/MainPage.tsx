import { ChangeEvent, useEffect, useRef, useState } from 'react';
import './MainPage.css';
import * as d3 from 'd3';
import { Edge, Node, getRandomHexColor } from '../common/common';
import Controls from './controls';

export function MainPage() {

    const graphContainerRef = useRef<SVGSVGElement>(null);
    const simulationRef = useRef<any>(null);
    const [edges, setEdges] = useState('');
    const [isColorful, setIsColorful] = useState(true);
    const [isTidy, setIsTidy] = useState(false);
    const [allNodes, setAllNodes] = useState<Map<Node, any>>(new Map<Node, any>());

    const handleEdgesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setEdges(event.target.value);
    };

    const drawGraph = () => {
        if (!graphContainerRef.current) return;

        if(isTidy){
            simulationRef.current?.stop();
            simulationRef.current = null;
        }

        const width = graphContainerRef.current.clientWidth, height = graphContainerRef.current.clientHeight, margin = 20;
        const nodeRadius = 20;

        const svg = d3.select(graphContainerRef.current)
            .attr('width', width)
            .attr('height', height);

        let edgesGroup: any = svg.select('.edges');
        if (edgesGroup.empty()) {
            edgesGroup = svg.append('g').attr('class', 'edges');
        }

        let nodesGroup: any = svg.select('.nodes');
        if (nodesGroup.empty()) {
            nodesGroup = svg.append('g').attr('class', 'nodes');
        }

        let edgeSet = new Set<Edge>();
        let nodeSet = new Set<Node>();

        edges.split('\n').forEach(edge => {
            const numOfInputs = edge.split(' ').length;
            if (numOfInputs < 1 || numOfInputs > 3) return;

            const [from, to, weight] = edge.split(' ');

            if (from){
                nodeSet.add(from);
                if(!allNodes.has(from))
                    allNodes.set(from, { id: from, locked: false, x: width / 2 + Math.random() * 20 - 10, y: height / 2 + Math.random() * 20 - 10 });
            }
            if (to){
                nodeSet.add(to);
                if(!allNodes.has(to))
                    allNodes.set(to, { id: to, locked: false, x: width / 2 + Math.random() * 20 - 10, y: height / 2 + Math.random() * 20 - 10 });
            }
            edgeSet.add({ from, to, weight });
        });

        for(let node of allNodes.keys()){
            if(!nodeSet.has(node)){
                allNodes.delete(node);
            }
        }

        setAllNodes(new Map(allNodes))

        let nodesArray = Array.from(allNodes.values())

        let edgesArray = Array.from(edgeSet).map(edge => ({
            source: edge.from,
            target: edge.to,
            weight: edge?.weight
        }));

        const validEdgesArray = edgesArray.filter(edge => allNodes.has(edge.source) && allNodes.has(edge.target));

        if (!simulationRef.current) {
            simulationRef.current = d3.forceSimulation(nodesArray as any)
                .force('charge', d3.forceManyBody().strength(-30))
                .force('collision', d3.forceCollide().radius(nodeRadius + 20))
                .force('link', d3.forceLink(validEdgesArray).distance(90).id((d: any) => d.id))
                .on('tick', ticked)
                .force('boundary', (alpha) => {
                    simulationRef.current.nodes().forEach((node: any) => {
                        node.x = Math.max(nodeRadius, Math.min(width - nodeRadius, node.x));
                        node.y = Math.max(nodeRadius, Math.min(height - nodeRadius, node.y));
                    });
                });
        } else {
            const simulation = simulationRef.current;
            simulation.nodes(nodesArray as any);
            simulation.force('link').links(validEdgesArray);
            simulation.alpha(1).restart();
        }

        const lines = edgesGroup.selectAll('line')
            .data(validEdgesArray);

        lines.exit().remove();

        lines.enter()
            .append('line')
            .attr('class', 'edge')
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .merge(lines as any);

        const node = nodesGroup.selectAll('.node')
            .data(nodesArray, (d: any) => d.id);

        node.exit().remove();

        const nodeEnter = node.enter()
            .append('g')
            .attr('class', 'node')
            .on('click', toggleLock)
            .call(d3.drag<any, any>()
                .on('start', dragStarted)
                .on('drag', dragged)
                .on('end', dragEnded)
            );

        nodeEnter.append('circle')
            .attr('r', nodeRadius)
            .attr('fill', 'white')
            .attr('stroke', (d: any) => (d.locked ? 'red' : (isColorful ? getRandomHexColor() : 'black')))
            .attr('stroke-width', 3);

        nodeEnter.append('text')
            .text((d: any) => d.id)
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .style('pointer-events', 'none');

        nodeEnter.merge(node as any);

        function ticked() {
            svg.selectAll('.node')
                .attr('transform', (d: any) => `translate(${Math.max(nodeRadius, Math.min(width - nodeRadius, d.x))},${Math.max(nodeRadius, Math.min(height - nodeRadius, d.y))})`);

            svg.selectAll('line')
                .attr('x1', (d: any) => Math.max(nodeRadius, Math.min(width - nodeRadius, d.source.x)))
                .attr('y1', (d: any) => Math.max(nodeRadius, Math.min(height - nodeRadius, d.source.y)))
                .attr('x2', (d: any) => Math.max(nodeRadius, Math.min(width - nodeRadius, d.target.x)))
                .attr('y2', (d: any) => Math.max(nodeRadius, Math.min(height - nodeRadius, d.target.y)));
        }

        function dragStarted(event: any, d: any) {
            if (!event.active) simulationRef.current.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: any, d: any) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnded(event: any, d: any) {
            if (!event.active) simulationRef.current.alphaTarget(0);
            if (d.locked) {
                d.fx = d.x;
                d.fy = d.y;
            } else {
                d.fx = null;
                d.fy = null;
            }
        }

        function toggleLock(event: any, d: any) {
            d.locked = !d.locked;
            d3.select(event.currentTarget).select('circle').attr('stroke-width', d.locked ? 5 : 3);
        
            if (d.locked) {
                d.fx = d.x;
                d.fy = d.y;
            } else {
                d.fx = null;
                d.fy = null;
            }
        }
        
    }

    useEffect(() => {
        drawGraph();
    }, [edges]);

    return (
        <div className="main-page">
            <svg ref={graphContainerRef} className="graph-container"></svg>
            <div className="text-box">
                <textarea className="text-input" placeholder="Enter graph edges" value={edges} onChange={handleEdgesChange} ></textarea>
            </div>
            <Controls isTidy={isTidy} setIsTidy={setIsTidy} graphContainerRef={graphContainerRef} isColorful={isColorful} setIsColorful={setIsColorful} setEdges={setEdges} edges={edges} drawGraph={drawGraph} simulationRef={simulationRef} />
        </div>
    );
}

export default MainPage;
