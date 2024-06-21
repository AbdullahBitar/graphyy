import React, { useState } from 'react';
import './controls.css';
import * as d3 from 'd3';
import { Edge, getRandomHexColor, Node } from '../common/common';
import {generateRandomGraph, generateRandomTree} from '../algorithms/generate-graphs'
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
        if(value < 0)setGraphEdgesNum(1);
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
            let minNode: any = undefined;
            const edges = props.edges.split('\n').map((edge: string) => {
                const parts = edge.split(' ');
                if (parts.length < 2 || parts.length > 3) return undefined;
                const [from, to, weight] = parts;

                if (!minNode) minNode = from;
                if (minNode > to) minNode = to;
                if (minNode > from) minNode = from;

                return { from, to, weight };
            }).filter((edge: Edge ) => edge !== undefined);

            if (!minNode) {
                console.error('No minimum node found');
                return;
            }

            const adjacencyList = getAdjancecyList(edges);
            const visited = new Map();

            const hierarchy = getHierarchyData(minNode, adjacencyList, visited, -1);
            const root = d3.hierarchy(hierarchy);
            const treeLayout = d3.tree().size([width - margin * 2, height - margin * 2]);
            treeLayout(root);

            if (props.simulationRef.current) {
                props.simulationRef.current.stop();
                props.simulationRef.current = null;
            }

            const simulation = props.simulationRef.current = d3.forceSimulation()
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('link', d3.forceLink().id((d: any) => d.id))
                .force('charge', d3.forceManyBody().strength(-300))
                .force('collision', d3.forceCollide().radius(nodeRadius + 2));

            simulation.nodes(root.descendants())
                .on('tick', () => {
                    nodes.attr('transform', (d: any) => `translate(${Math.max(nodeRadius, Math.min(width - nodeRadius, d.x))},${Math.max(nodeRadius, Math.min(height - nodeRadius, d.y))})`);
                    links.attr('x1', (d: any) => Math.max(nodeRadius, Math.min(width - nodeRadius, d.source.x)))
                        .attr('y1', (d: any) => Math.max(nodeRadius, Math.min(height - nodeRadius, d.source.y)))
                        .attr('x2', (d: any) => Math.max(nodeRadius, Math.min(width - nodeRadius, d.target.x)))
                        .attr('y2', (d: any) => Math.max(nodeRadius, Math.min(height - nodeRadius, d.target.y)));
                });

            simulation.force<any>('link').links(root.links());

            const links = svg.selectAll('.edge')
                .data(root.links())

            const nodes = svg.selectAll('.node')
                .data(root.descendants())
                
            lockGraph()
        } catch (e) {
            console.error(e);
            alert(e);
        }
    };

    const lockGraph = () => {
        if(!props.graphContainerRef.current)return;
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
        if(!props.graphContainerRef.current)return;
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
