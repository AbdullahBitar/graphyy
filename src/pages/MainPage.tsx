import { ChangeEvent, useEffect, useRef, useState } from 'react';
import './MainPage.css';
import * as d3 from 'd3';
import { Edge, Node, defineArrowheadMarker, drawEdges, drawNodes, paintEdgesBlack, setSimulationForce, ticked } from '../common/common';
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

    const handleEdgesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setEdges(event.target.value);
    };

    const drawGraph = () => {
        if (!graphContainerRef.current) return;

        paintEdgesBlack();

        const width = graphContainerRef.current.clientWidth, height = graphContainerRef.current.clientHeight, margin = 20;
        const nodeRadius = 20;

        const svg = d3.select(graphContainerRef.current)

        if (isTidy) {
            simulationRef.current?.stop();
            simulationRef.current = null;
            svg.selectAll('*').remove();
            setIsTidy(false);
        }

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


    return (
        <div>
            <div className="header">
                <h1>graphyy</h1>
            </div>
            {width > 900 ? (
                <div className="main-page row">
                    <svg ref={graphContainerRef} className="graph-container"></svg>
                    <div className="text-box">
                        <textarea className="text-input" placeholder="Enter graph edges" value={edges} onChange={handleEdgesChange} ></textarea>
                    </div>
                    <Controls isTidy={isTidy} setIsTidy={setIsTidy} graphContainerRef={graphContainerRef} isColorful={isColorful} setIsColorful={setIsColorful} setEdges={setEdges} edges={edges} drawGraph={drawGraph} simulationRef={simulationRef} isDirected={isDirected} setIsDirected={setIsDirected} />
                </div>
            ) : (
                <div className="main-page row">
                    <svg ref={graphContainerRef} className="graph-container"></svg>
                    <div className="row2">
                        <div className="text-box">
                            <textarea className="text-input" placeholder="Enter graph edges" value={edges} onChange={handleEdgesChange} ></textarea>
                        </div>
                        <Controls isTidy={isTidy} setIsTidy={setIsTidy} graphContainerRef={graphContainerRef} isColorful={isColorful} setIsColorful={setIsColorful} setEdges={setEdges} edges={edges} drawGraph={drawGraph} simulationRef={simulationRef} isDirected={isDirected} setIsDirected={setIsDirected} />
                    </div>
                </div>
            )

            }
        </div>
    );

}

