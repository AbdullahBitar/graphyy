import { ChangeEvent, useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize'
import './MainPage.css';
import * as d3 from 'd3';
import { Edge, Node, defineArrowheadMarker, drawEdges, drawNodes, paintEdgesBlack, setSimulationForce, ticked, resetNodesPos } from '../common/common';
import Controls from './controls';
import { useWindowSize } from '../common/WindowSize'

export function MainPage() {

    const graphContainerRef = useRef<SVGSVGElement>(null);
    const simulationRef = useRef<any>(null);
    const [edges, setEdges] = useState('1 2 1\n1 3');
    const [isColorful, setIsColorful] = useState(false);
    const [isTidy, setIsTidy] = useState(false);
    const [allNodes, setAllNodes] = useState<Map<Node, any>>(new Map<Node, any>());
    const [isDirected, setIsDirected] = useState(false);
    const [width] = useWindowSize();
    const [nodeRadius, setNodeRadius] = useState(20);

    const handleEdgesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setEdges(event.target.value);
    };

    const drawGraph = () => {
        if (!graphContainerRef.current) return;

        paintEdgesBlack();

        const width = graphContainerRef.current.clientWidth, height = graphContainerRef.current.clientHeight, margin = 20;

        const svg = d3.select(graphContainerRef.current)

        defineArrowheadMarker(svg, isDirected);

        let edgeSet = new Set<Edge>();
        let nodeSet = new Set<Node>();

        edges.split('\n').forEach(edge => {
            const numOfInputs = edge.trim().split(' ').length;
            if (numOfInputs < 1 || numOfInputs > 3) return;

            const [from, to, weight] = edge.trim().split(' ');

            if (from) {
                nodeSet.add(from);
                if (!allNodes.has(from))
                    allNodes.set(from, { id: from, locked: false, x: width / 2 + Math.random() * 20 - 10, y: height / 2 + Math.random() * 20 - 10 });
            }
            if (to) {
                nodeSet.add(to);
                if (!allNodes.has(to))
                    allNodes.set(to, { id: to, locked: false, x: width / 2 + Math.random() * 20 - 10, y: height / 2 + Math.random() * 20 - 10 });
            }
            edgeSet.add({ from, to, weight });
        });

        for (let node of allNodes.keys()) {
            if (!nodeSet.has(node)) {
                allNodes.delete(node);
            }
        }

        setAllNodes(new Map(allNodes))

        if(nodeSet.size > 500) {
            svg.selectAll('*').remove();
            return;
        }

        let nodesArray = Array.from(allNodes.values())

        let edgesArray = Array.from(edgeSet).map(edge => ({
            source: edge.from,
            target: edge.to,
            weight: edge?.weight
        }));

        const validEdgesArray = edgesArray.filter(edge => allNodes.has(edge.source) && allNodes.has(edge.target));

        setSimulationForce(simulationRef, nodesArray, validEdgesArray, nodeRadius, width, height, () => ticked(svg, nodeRadius, width, height), false);

        drawEdges(svg, validEdgesArray)

        drawNodes(svg, nodesArray, nodeRadius, isColorful, simulationRef)
    }

    const updateArrowVisibility = () => {
        const svg = d3.select(graphContainerRef.current);
        svg.select('marker#arrowhead path')
            .attr('fill-opacity', isDirected ? 1 : 0);
    };

    useEffect(() => {
        drawGraph();
    }, [edges]);

    useEffect(() => {
        updateArrowVisibility();
    }, [isDirected]);

    useEffect(() => {
        if(graphContainerRef.current && simulationRef.current) {
            const width = graphContainerRef.current.clientWidth, height = graphContainerRef.current.clientHeight;
            simulationRef.current.force('boundary', () => {
                simulationRef.current.nodes().forEach((node: any) => {
                    node.x = Math.max(nodeRadius, Math.min(width - nodeRadius, node.x));
                    node.y = Math.max(nodeRadius, Math.min(height - nodeRadius, node.y));
                });
            });
            simulationRef.current.alpha(1).restart();
        }
    }, [width])

    useEffect(() => {
        d3.selectAll('circle')
            .each(function () {
                d3.select(this).attr('r', nodeRadius)
            });
        d3.selectAll('text')
            .each(function() {
                d3.select(this).attr('font-size', 0.8*nodeRadius)
            })
    }, [nodeRadius])

    return (
        <div className="content">
            <div className="header">
                <h1>graphyy</h1>
            </div>
            <div className="main-page">
                <svg ref={graphContainerRef} className="graph-container"></svg>
                {
                    width <= 700 ?
                        <TextareaAutosize className="text-input" placeholder="Enter graph edges" value={edges} onChange={handleEdgesChange} ></TextareaAutosize>
                        : <textarea className="text-input" placeholder="Enter graph edges" value={edges} onChange={handleEdgesChange} ></textarea>
                }
                <Controls isTidy={isTidy} setIsTidy={setIsTidy} graphContainerRef={graphContainerRef} isColorful={isColorful} setIsColorful={setIsColorful} setEdges={setEdges} edges={edges} drawGraph={drawGraph} simulationRef={simulationRef} isDirected={isDirected} setIsDirected={setIsDirected} nodeRadius={nodeRadius} setNodeRadius={setNodeRadius}/>
            </div>
        </div>
    );

}

