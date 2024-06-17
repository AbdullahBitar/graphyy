import React, { useState } from 'react';
import './controls.css';
import * as d3 from 'd3';
import { getRandomHexColor } from '../common/common';
import {generateRandomGraph, generateRandomTree} from '../algorithms/generate-graphs'

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

        let nodes = value > 0 ? value : 1
        const maxEdges = nodes * (nodes - 1) / 2
        if(graphEdgesNum > maxEdges)setGraphEdgesNum(maxEdges)
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
            <div className="controls-content">
                <button className="button">
                    Rearrange graph
                </button>
            </div>
        </div>
    );
}

export default Controls;
