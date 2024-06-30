import React, { useEffect, useState } from 'react';
import './controls.css';
import * as d3 from 'd3';
import { defineArrowheadMarker, dfs, dragEnded, dragged, dragStarted, drawEdges, drawNodes, Edge, getRandomHexColor, Node, paintEdgesBlack, setSimulationForce, ticked, toggleLock } from '../common/common';
import { generateRandomGraph, generateRandomTree } from '../algorithms/generate-graphs'
import { getAdjancecyList } from '../algorithms/adjacency-list';
import { getHierarchyData } from '../algorithms/hierarchy';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { isTree } from '../algorithms/tree-check';
import { getLCA } from '../algorithms/LCA';
import { shortestPathBellmanFord } from '../algorithms/bellman-ford';
import { kruskal } from '../algorithms/mst';

export function Controls(props: any) {
    const [activeTab, setActiveTab] = useState('graphs');
    const [graphNodesNum, setGraphNodesNum] = useState(10)
    const [graphEdgesNum, setGraphEdgesNum] = useState(10)
    const [treeNodesNum, setTreeNodesNum] = useState(10)
    const [isEditGraphDropDownOpen, setIsEditGraphDropDownOpen] = useState(false);
    const [isAlgorithmDropDownOpen, setIsAlgorithmDropDownOpen] = useState(false);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null);
    const [node1, setNode1] = useState<Node>();
    const [node2, setNode2] = useState<Node>();
    const [root, setRoot] = useState<Node>();
    const [result, setResult] = useState<Node | undefined>(undefined);
    const [genWeight, setGenWeight] = useState<boolean>(false);

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
        props.setIsColorful((prev: boolean) => !prev)
    }

    function toggleDirected() {
        props.setIsDirected((prev: boolean) => !prev)
    }

    function setRandomGraph() {
        props.setEdges(generateRandomGraph(graphNodesNum, graphEdgesNum, genWeight))
    }
    function setRandomTree() {
        props.setEdges(generateRandomTree(treeNodesNum, genWeight))
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

            defineArrowheadMarker(svg, props.isDirected);

            const allNodes: Node[] = []
            const edges = props.edges.trim().split('\n').map((edge: string) => {
                const parts = edge.trim().split(' ');
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

            const duplicateNodes: Set<Node> = new Set<Node>()

            const combinedNodes = root.descendants().filter(d => d.data.name !== dummyRootName && !duplicateNodes.has(d.data.name) && duplicateNodes.add(d.data.name));
            const combinedLinks = edges.map((edge: any) => {
                return { source: edge.from, target: edge.to, weight: edge.weight };
            });

            combinedNodes.forEach(node => {
                if (node.parent && node.parent.data.name === dummyRootName) {
                    node.parent = null;
                }
            });

            if (props.simulationRef.current) {
                props.simulationRef.current.stop();
                props.simulationRef.current = null;
            }

            setSimulationForce(props.simulationRef, combinedNodes, combinedLinks, nodeRadius, width, height, () => ticked(svg, nodeRadius, width, height), true);

            drawEdges(svg, combinedLinks, true);

            drawNodes(svg, combinedNodes, nodeRadius, props.isColorful, props.simulationRef, true);

            lockGraph()
        } catch (e) {
            console.error(e);
            alert(e);
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

    const displayErrorMessage = (message: string) => {
        setResult(undefined)
        toast.error(message, {
            position: "bottom-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    const displayLCA = () => {
        try {
            if (props.isDirected) {
                displayErrorMessage('Make graph undirected');
                return;
            }
            if (!node1 || !node2 || !root) {
                displayErrorMessage('Please fill all the fields');
                return;
            }
            const nodes = new Set<Node>();
            const edges = props.edges.trim().split('\n').map((edge: string) => {
                const parts = edge.trim().split(' ');
                if (parts.length < 2 || parts.length > 3) return undefined;
                const [from, to, weight] = parts;

                nodes.add(from);
                nodes.add(to);

                return { from, to, weight };
            }).filter((edge: Edge) => edge !== undefined);

            if (!nodes.has(node1)) {
                displayErrorMessage(`Node ${node1} does not exist in the graph`);
                return
            }
            if (!nodes.has(node2)) {
                displayErrorMessage(`Node ${node2} does not exist in the graph`);
                return
            }
            if (!nodes.has(root)) {
                displayErrorMessage(`Node ${root} does not exist in the graph`);
                return
            }

            const visited = new Map<Node, boolean>()
            if (!isTree(node1, getAdjancecyList(edges), visited, node1) || visited.size !== nodes.size) {
                displayErrorMessage(`The graph should be a single tree`);
                return;
            }

            setResult(getLCA(node1, node2, root, getAdjancecyList(edges)))
        }
        catch (e) {
            displayErrorMessage(String(e))
        }
    }

    const displayShortestPathWeight = () => {
        try {

            if (!node1 || !node2) {
                displayErrorMessage('Please fill all the fields');
                return;
            }

            const edges: Edge[] = [];
            const nodes = new Set<Node>()
            props.edges.trim().split('\n').forEach((edge: string) => {
                const parts = edge.trim().split(' ');
                if (parts.length < 2 || parts.length > 3) return;
                const [from, to, weight] = parts;

                nodes.add(from);
                nodes.add(to);

                edges.push({ from, to, weight });

                if (!props.isDirected) {
                    edges.push({ from: to, to: from, weight });
                }
            });

            if (!nodes.has(node1) || !nodes.has(node2)) {
                displayErrorMessage(`Node ${!nodes.has(node1) ? node1 : node2} does not exist in the graph`);
                return
            }
            paintEdgesBlack()
            setResult(shortestPathBellmanFord(node1, node2, edges, nodes, props.isDirected));
        }
        catch (e) {
            displayErrorMessage(String(e))
        }
    }

    const displayMSTWeight = () => {
        try {
            if (props.isDirected) {
                displayErrorMessage('Graph needs to be undirected')
                return;
            }

            const nodes = new Set<Node>()
            let root = null
            const edges = props.edges.trim().split('\n').map((edge: string) => {
                const parts = edge.trim().split(' ')
                if (parts.length < 2 || parts.length > 3) return undefined
                const [from, to, weight] = parts

                root = from

                nodes.add(from)
                nodes.add(to)

                return { from, to, weight }
            }).filter((edge: Edge) => edge !== undefined)

            const visited: Map<Node, boolean> = new Map()
            if (root) dfs(root, getAdjancecyList(edges), visited)
            if (visited.size !== nodes.size) {
                displayErrorMessage('Graph needs to be connected')
                return
            }
            setResult(kruskal(edges, nodes))
        }
        catch (e) {
            displayErrorMessage(String(e))
        }
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
                        <div className="margin-up-bottom">
                            <label className="label-text">Weights</label>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={genWeight}
                                    onChange={() => {
                                        setGenWeight((prev: boolean) => !prev)
                                    }}
                                />
                                <span className="slider"></span>
                            </label>
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
                        <div className="margin-up-bottom">
                            <label className="label-text">Weights</label>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={genWeight}
                                    onChange={() => {
                                        setGenWeight((prev: boolean) => !prev)
                                    }}
                                />
                                <span className="slider"></span>
                            </label>
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

    const renderAlgorithms = () => {
        switch (selectedAlgorithm) {
            case 'lca':
                return (
                    <div>
                        <div className="control-item">
                            <label className="label-text">Root:</label>
                            <input
                                type="text"
                                name="root"
                                value={root}
                                onChange={(e) => setRoot(e.target.value.replace(/\s/g, ''))}
                            />
                        </div>
                        <div className="control-item">
                            <label className="label-text">Node #1:</label>
                            <input
                                type="text"
                                name="node1"
                                value={node1}
                                onChange={(e) => setNode1(e.target.value.replace(/\s/g, ''))}
                            />
                        </div>
                        <div className="control-item">
                            <label className="label-text">Node #2:</label>
                            <input
                                type="text"
                                name="node2"
                                value={node2}
                                onChange={(e) => setNode2(e.target.value.replace(/\s/g, ''))}
                            />
                        </div>
                        <div>
                            {result && <h3>LCA = {result}</h3>}
                        </div>
                        <button className="button" onClick={displayLCA}>
                            Calculate LCA
                        </button>
                    </div>
                );
            case 'sp':
                return (
                    <div>
                        <div className="control-item">
                            <label className="label-text">From Node:</label>
                            <input
                                type="text"
                                value={node1}
                                onChange={(e) => setNode1(e.target.value.replace(/\s/g, ''))}
                            />
                        </div>
                        <div className="control-item">
                            <label className="label-text">To Node:</label>
                            <input
                                type="text"
                                value={node2}
                                onChange={(e) => setNode2(e.target.value.replace(/\s/g, ''))}
                            />
                        </div>
                        <div>
                            {result && <h3>Weight = {result}</h3>}
                        </div>
                        <button className="button" onClick={displayShortestPathWeight}>
                            Calculate Shortest Path
                        </button>
                        <div className="note-box">
                            <p>If an edge has no weight or a non-numeric weight, it will be treated as having a weight of 1.</p>
                        </div>

                    </div>
                );
            case 'mst':
                return (
                    <div>
                        <button className="button" onClick={displayMSTWeight}>
                            Calculate MST weight
                        </button>
                        <div>
                            {result !== undefined && <h3>Weight = {result}</h3>}
                        </div>
                    </div>
                )
            default:
                return null;
        }
    };

    useEffect(() => {
        setResult(undefined)
    }, [props.edges]);

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
                <span>Directed graph</span>
                <label className="switch">
                    <input
                        type="checkbox"
                        checked={props.isDirected}
                        onChange={() => {
                            toggleDirected()
                        }}
                    />
                    <span className="slider round"></span>
                </label>
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
                <div className="dropdown">
                    <button className="dropdown-toggle button" onClick={() => {
                        setIsEditGraphDropDownOpen((prev: boolean) => !prev)
                        if (!isEditGraphDropDownOpen) {
                            setIsAlgorithmDropDownOpen(false)
                        }
                    }}>
                        Edit Graph
                    </button>
                    {isEditGraphDropDownOpen && (
                        <div className="dropdown-menu">
                            <button className="button" onClick={() => { tidyGraph(); setIsEditGraphDropDownOpen(false) }}>
                                Tidy graph
                            </button>
                            <button className="button" onClick={() => { lockGraph(); setIsEditGraphDropDownOpen(false) }}>
                                Lock all nodes
                            </button>
                            <button className="button" onClick={() => { unlockGraph(); setIsEditGraphDropDownOpen(false) }}>
                                Unlock all nodes
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="universal-controls">
                <div className="dropdown">
                    <button className="dropdown-toggle button" onClick={() => {
                        setIsAlgorithmDropDownOpen((prev: boolean) => !prev)
                        if (!isAlgorithmDropDownOpen) {
                            setIsEditGraphDropDownOpen(false)
                        }
                    }}>
                        Apply Algorithm
                    </button>
                    {isAlgorithmDropDownOpen && (
                        <div className="dropdown-menu">
                            <button className="button" onClick={() => {
                                setSelectedAlgorithm('lca');
                                setIsAlgorithmDropDownOpen(false);
                                setNode1('');
                                setNode2('');
                                setRoot('');
                                setResult(undefined);
                                paintEdgesBlack()
                            }}>
                                Lowest Common Ancestor
                            </button>
                            <button className="button" onClick={() => {
                                setSelectedAlgorithm('sp');
                                setIsAlgorithmDropDownOpen(false);
                                setNode1('');
                                setNode2('');
                                setRoot('');
                                setResult(undefined);
                                paintEdgesBlack()
                            }}>
                                Shortest Path
                            </button>
                            <button className="button" onClick={() => {
                                setSelectedAlgorithm('mst');
                                setIsAlgorithmDropDownOpen(false);
                                setNode1('');
                                setNode2('');
                                setRoot('');
                                setResult(undefined);
                                paintEdgesBlack()
                            }}>
                                Minimum Spanning Tree
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="universal-controls">
                {
                    renderAlgorithms()
                }
            </div>
            <ToastContainer />
        </div>
    );
}

export default Controls;
