import React, { useState } from 'react';
import './controls.css';
import * as d3 from 'd3';
import { Edge, getRandomHexColor, Node } from '../common/common';
import { generateRandomGraph, generateRandomTree } from '../algorithms/generate-graphs'
import { getAdjancecyList } from '../algorithms/adjacency-list';
import { getHierarchyData } from '../algorithms/hierarchy';

export function Controls(props: any) {
    const [activeTab, setActiveTab] = useState('graphs');
    const [graphNodesNum, setGraphNodesNum] = useState(10)
    const [graphEdgesNum, setGraphEdgesNum] = useState(10)
    const [treeNodesNum, setTreeNodesNum] = useState(10)

    function changeColors() {
        const svg = d3.select(props.graphContainerRef)

        if (!props.isColorful) {
            d3.selectAll('circle')
                .each(function () {
                    d3.select(this).attr('stroke', getRandomHexColor());
                });
        }
        else {
            d3.selectAll('circle')
                .attr('stroke', 'black')
        }
        props.setIsColorful((prev: any) => !prev)
    }

    function setRandomGraph() {
        props.setEdges(generateRandomGraph(graphNodesNum, graphEdgesNum))
    }
    function setRandomTree() {
        props.setEdges(generateRandomTree(treeNodesNum))
    }

    const handleGraphNodeCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.valueAsNumber;
        setGraphNodesNum(value > 0 ? value : 1);
        const maxEdges = value * (value - 1) / 2;
        if (graphEdgesNum > maxEdges) {
            setGraphEdgesNum(maxEdges);
        }
    };

    const handleTreeNodeCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.valueAsNumber;
        setTreeNodesNum(value > 0 ? value : 1);
    };

    const handleGraphEdgeCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.valueAsNumber;
        const maxNumOfEdges = graphNodesNum * (graphNodesNum - 1) / 2
        if (value < 0) setGraphEdgesNum(1);
        else setGraphEdgesNum(value <= maxNumOfEdges ? value : maxNumOfEdges);
    };

    const tidyGraph = () => {
        if (!props.graphContainerRef.current) return;

        props.setIsTidy(true);

        const width = props.graphContainerRef.current.clientWidth;
        const height = props.graphContainerRef.current.clientHeight;
        const margin = 20;
        const nodeRadius = 20;

        const svg = d3.select(props.graphContainerRef.current)
            .attr('width', width)
            .attr('height', height);

        try {
            svg.selectAll('*').remove();
            const allNodes: Node[] = []
            const edges = props.edges.split('\n').map((edge: string) => {
                const parts = edge.split(' ');
                if (parts.length < 2 || parts.length > 3) return undefined;
                const [from, to, weight] = parts;

                allNodes.push(from);
                allNodes.push(to);

                return { from, to, weight };
            }).filter((edge: Edge) => edge !== undefined);

            if (allNodes.length === 0) {
                console.error('No node found');
                return;
            }

            allNodes.sort();

            const adjacencyList = getAdjancecyList(edges);
            const visited = new Map();

            const hierarchies = allNodes.map(rootNode => {
                if (visited.has(rootNode)) return null
                return getHierarchyData(rootNode, adjacencyList, visited, -1);
            }).filter(hierarchy => hierarchy !== null)

            const dummyRootName = "dummyRoot#1234567890!@#$%^&*()"

            const dummyRoot = { name: dummyRootName, children: hierarchies };
            const root = d3.hierarchy<any>(dummyRoot);
            const treeLayout = d3.tree().size([width - margin * 2, height - margin * 2]);
            treeLayout(root);

            const combinedNodes = root.descendants().filter(d => d.data.name !== dummyRootName);
            const combinedLinks = root.links().map(link => {
                const source = link.source.data.name;
                const target = link.target.data.name;
                if(source === dummyRootName || target === dummyRootName) return null;
                const weight = adjacencyList.get(source)?.find(edge => edge.node === target)?.weight;
            
                return { source: source, target: target, weight: weight };
            }).filter(link => link !== null) as d3.SimulationLinkDatum<d3.SimulationNodeDatum>[];

            combinedNodes.forEach(node => {
                if (node.parent && node.parent.data.name === dummyRootName) {
                    node.parent = null;
                }
            });

            if (props.simulationRef.current) {
                props.simulationRef.current.stop();
                props.simulationRef.current = null;
            }

            props.simulationRef.current = d3.forceSimulation(combinedNodes as any)
                .force('charge', d3.forceManyBody().strength(-30))
                .force('collision', d3.forceCollide().radius(nodeRadius + 20))
                .force('link', d3.forceLink(combinedLinks).distance(90).id((d: any) => d.data.name))
                .on('tick', ticked)
                .force('boundary', (alpha) => {
                    props.simulationRef.current.nodes().forEach((node: any) => {
                        node.x = Math.max(nodeRadius, Math.min(width - nodeRadius, node.x));
                        node.y = Math.max(nodeRadius, Math.min(height - nodeRadius, node.y));
                    });
                });

            let edgesGroup: any = svg.select('.edges');
            if (edgesGroup.empty()) {
                edgesGroup = svg.append('g').attr('class', 'edges');
            }

            let nodesGroup: any = svg.select('.nodes');
            if (nodesGroup.empty()) {
                nodesGroup = svg.append('g').attr('class', 'nodes');
            }

            const lines = edgesGroup.selectAll('line')
                .data(combinedLinks);

            lines.exit().remove();

            lines.enter()
                .append('line')
                .attr('class', 'edge')
                .attr('stroke', 'black')
                .attr('stroke-width', 2)
                .merge(lines as any);

            const weights = edgesGroup.selectAll('.edge-weight')
                .data(combinedLinks);

            weights.exit().remove();

            const weightsEnter = weights.enter()
                .append('text')
                .attr('class', 'edge-weight')
                .attr('fill', 'black')
                .attr('dy', -10)
                .merge(weights as any);

            const node = nodesGroup.selectAll('.node')
                .data(combinedNodes, (d: any) => d.data.name);

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
                .attr('stroke', (d: any) => (d.locked ? 'red' : (props.isColorful ? getRandomHexColor() : 'black')))
                .attr('stroke-width', 3);

            nodeEnter.append('text')
                .text((d: any) => d.data.name)
                .attr('text-anchor', 'middle')
                .attr('dy', '.35em')
                .style('pointer-events', 'none');

            nodeEnter.merge(node as any);

            lockGraph()
        } catch (e) {
            console.error(e);
            alert(e);
        }

        function ticked() {
            svg.selectAll('.node')
                .attr('transform', (d: any) => `translate(${Math.max(nodeRadius, Math.min(width - nodeRadius, d.x))},${Math.max(nodeRadius, Math.min(height - nodeRadius, d.y))})`);

            svg.selectAll('line')
                .attr('x1', (d: any) => Math.max(nodeRadius, Math.min(width - nodeRadius, d.source.x)))
                .attr('y1', (d: any) => Math.max(nodeRadius, Math.min(height - nodeRadius, d.source.y)))
                .attr('x2', (d: any) => Math.max(nodeRadius, Math.min(width - nodeRadius, d.target.x)))
                .attr('y2', (d: any) => Math.max(nodeRadius, Math.min(height - nodeRadius, d.target.y)));

            svg.selectAll('.edge-weight')
                .attr('x', function (d: any) {
                    let midX = (d.source.x + d.target.x) / 2;
                    let dx = d.target.x - d.source.x;
                    let dy = d.target.y - d.source.y;

                    let length = Math.sqrt(dx * dx + dy * dy);

                    let normalX = dy / length;

                    let offsetX = midX + 10 * normalX;
                    if (dx < 0) {
                        offsetX = midX - 10 * normalX;
                    }

                    return offsetX;
                })
                .attr('y', function (d: any) {
                    let midY = (d.source.y + d.target.y) / 2;
                    let dx = d.target.x - d.source.x;
                    let dy = d.target.y - d.source.y;
                    let length = Math.sqrt(dx * dx + dy * dy);
                    let normalY = -dx / length;

                    let offsetY = midY + 10 * normalY;
                    if (dx < 0) {
                        offsetY = midY - 10 * normalY;
                    }

                    return offsetY;
                })
                .text((d: any) => {console.log(d);return d.weight});
        }

        function dragStarted(event: any, d: any) {
            if (!event.active) props.simulationRef.current.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: any, d: any) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnded(event: any, d: any) {
            if (!event.active) props.simulationRef.current.alphaTarget(0);
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
    };

    const lockGraph = () => {
        if (!props.graphContainerRef.current) return;
        const svg = d3.select(props.graphContainerRef.current);
        const nodes = svg.selectAll('.node')

        svg.selectAll('circle')
            .attr("stroke-width", 5)

        nodes.each((d: any) => {
            d.locked = true;
            d.fx = d.x;
            d.fy = d.y;
        });
    }

    const unlockGraph = () => {
        if (!props.graphContainerRef.current) return;
        const svg = d3.select(props.graphContainerRef.current);
        const nodes = svg.selectAll('.node')

        svg.selectAll('circle')
            .attr("stroke-width", 3)

        nodes.each((d: any) => {
            d.locked = false;
            d.fx = null;
            d.fy = null;
        });
    }


    const renderControls = () => {
        switch (activeTab) {
            case 'graphs':
                return (
                    <div>
                        <h3 className="control-heading">Graphs Controls</h3>
                        <div className="control-item">
                            <label className="label-text" htmlFor="node-count">Number of nodes:</label>
                            <input
                                type="number"
                                id="node-count"
                                name="node-count"
                                min="1"
                                defaultValue="10"
                                value={graphNodesNum}
                                onChange={handleGraphNodeCountChange}
                            />
                        </div>
                        <div className="control-item">
                            <label className="label-text" htmlFor="edge-count">Number of edges:</label>
                            <input
                                type="number"
                                id="edge-count"
                                name="edge-count"
                                min="0"
                                defaultValue="0"
                                value={graphEdgesNum}
                                onChange={handleGraphEdgeCountChange}
                            />
                        </div>
                        <button className="button" onClick={setRandomGraph}>
                            Generate Random Graph
                        </button>
                    </div>
                );
            case 'trees':
                return (
                    <div>
                        <h3 className="control-heading">Trees Controls</h3>
                        <div className="control-item">
                            <label className="label-text" htmlFor="node-count">Number of nodes:</label>
                            <input
                                type="number"
                                id="node-count"
                                name="node-count"
                                min="1"
                                defaultValue="10"
                                value={treeNodesNum}
                                onChange={handleTreeNodeCountChange}
                            />
                        </div>
                        <button className="button" onClick={setRandomTree}>
                            Generate Random Tree
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <div className="controls">
            <div className="tabs">
                <div
                    className={`tab ${activeTab === 'graphs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('graphs')}
                >
                    Graphs
                </div>
                <div
                    className={`tab ${activeTab === 'trees' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trees')}
                >
                    Trees
                </div>
            </div>
            <div className="controls-content">
                {renderControls()}
            </div>

            <div className="interactive">
                <span>Fun Mode</span>
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={props.isColorful}
                        onChange={() => {
                            changeColors()
                        }}
                    />
                    <span className="slider round"></span>
                </label>
            </div>
            <div className="universal-controls">
                <button className="button" onClick={tidyGraph}>
                    Tidy graph
                </button>
            </div>
            <div className='universal-controls'>
                <button className="button" onClick={lockGraph}>
                    Lock all nodes
                </button>
            </div>
            <div className='universal-controls'>
                <button className="button" onClick={unlockGraph}>
                    Unlock all nodes
                </button>
            </div>
        </div>
    );
}

export default Controls;
