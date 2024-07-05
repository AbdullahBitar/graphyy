import * as d3 from 'd3';

export type Node = string | number

export type Edge = {
    from: Node
    to: Node
    weight?: Node
}

export type outgoingEdge = {
    node: Node,
    weight?: Node
}

export function getRandomHexColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export const getWeight = (weight?: Node): number => {
    if (typeof weight === 'number') {
        return weight;
    } else if (typeof weight === 'string' && !isNaN(parseFloat(weight))) {
        return parseFloat(weight);
    } else {
        return 1;
    }
};

export function dfs(node: Node, adjacencyList: Map<Node, outgoingEdge[]>, visited: Map<Node, boolean>) {
    visited.set(node, true);

    for (const edge of adjacencyList.get(node) || []) {
        if (!visited.get(edge.node)) {
            dfs(edge.node, adjacencyList, visited);
        }
    }
}

export function paintEdgesBlack() {
    d3.selectAll('.edge').attr('stroke', 'black');
}

export function defineArrowheadMarker(svg: d3.Selection<any, unknown, null, undefined>, isDirected: boolean) {
    let defs = svg.select<SVGDefsElement>('defs');
    if (defs.empty()) {
        defs = svg.append('defs');
    }

    defs.selectAll('#arrowhead')
        .data([true])
        .enter()
        .append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '-0 -5 10 10')
        .attr('refX', 21)
        .attr('refY', 0)
        .attr('orient', 'auto')
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('xoverflow', 'visible')
        .append('path')
        .attr('d', 'M 0,-4 L 8 ,0 L 0,4')
        .attr('fill', '#000')
        .style('stroke', 'none')
        .attr('fill-opacity', isDirected ? 1 : 0);
}

export function setSimulationForce(simulationRef: any, nodesArray: any, validEdgesArray: any, nodeRadius: number, width: number, height: number, ticked: any, isTidy: boolean) {
    if (!simulationRef.current) {
        simulationRef.current = d3.forceSimulation(nodesArray as any)
            .force('charge', d3.forceManyBody().strength(-30))
            .force('collision', d3.forceCollide().radius(nodeRadius + 20))
            .force('link', d3.forceLink(validEdgesArray).distance(90).id((d: any) => (isTidy ? d.data.name : d.id)))
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
}

export function resetNodesPos(simulationRef: any, width: number, height: number) {
    if(!simulationRef.current)
        return

    const simulation = simulationRef.current;
    simulation.nodes().forEach((node: any) => {
        node.x = width/2;
        node.y = height/2;
    })
    simulation.alpha(1).restart();
}

export function ticked(svg: any, nodeRadius: number, width: number, height: number) {
    svg.selectAll('.node')
        .attr('transform', (d: any) => `translate(${Math.max(nodeRadius, Math.min(width - nodeRadius, d.x))},${Math.max(nodeRadius, Math.min(height - nodeRadius, d.y))})`);

    svg.selectAll('line')
        .attr('x1', (d: any) => Math.max(nodeRadius, Math.min(width - nodeRadius, d.source.x)))
        .attr('y1', (d: any) => Math.max(nodeRadius, Math.min(height - nodeRadius, d.source.y)))
        .attr('x2', (d: any) => Math.max(nodeRadius, Math.min(width - nodeRadius, d.target.x)))
        .attr('y2', (d: any) => Math.max(nodeRadius, Math.min(height - nodeRadius, d.target.y)))

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
        .text((d: any) => d.weight);
}

export function dragStarted(event: any, d: any, simulationRef: any) {
    if (!event.active) simulationRef.current.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

export function dragged(event: any, d: any) {
    d.fx = event.x;
    d.fy = event.y;
}

export function dragEnded(event: any, d: any, simulationRef: any) {
    if (!event.active) simulationRef.current.alphaTarget(0);
    if (d.locked) {
        d.fx = d.x;
        d.fy = d.y;
    } else {
        d.fx = null;
        d.fy = null;
    }
}

export function toggleLock(event: any, d: any) {
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

export function drawEdges(svg: any, EdgesArray: any, isTidy: boolean = false) {
    let edgesGroup: any = svg.select('.edges');
    if (edgesGroup.empty()) {
        edgesGroup = svg.append('g').attr('class', 'edges');
    }

    const lines = edgesGroup.selectAll('line')
        .data(EdgesArray);

    lines.exit().remove();

    lines.enter()
        .append('line')
        .attr('class', 'edge')
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
        .merge(lines as any)
        .attr('marker-end', 'url(#arrowhead)')
        .attr('id', (d: any) => `edge-${(isTidy ? d.source.data.name: d.source.id )}-${(isTidy ? d.target.data.name: d.target.id )}`)

    const weights = edgesGroup.selectAll('.edge-weight')
        .data(EdgesArray);

    weights.exit().remove();

    weights.enter()
        .append('text')
        .attr('class', 'edge-weight')
        .attr('fill', 'black')
        .attr('dy', -10)
        .merge(weights as any);
}

export function drawNodes(svg: any, nodesArray: any, nodeRadius: number, isColorful: boolean, simulationRef: any, isTidy: boolean = false) {
    let nodesGroup: any = svg.select('.nodes');
    if (nodesGroup.empty()) {
        nodesGroup = svg.append('g').attr('class', 'nodes');
    }

    const node = nodesGroup.selectAll('.node')
        .data(nodesArray, (d: any) => (isTidy ? d.data.name : d.id));

    node.exit().remove();

    const nodeEnter = node.enter()
        .append('g')
        .attr('class', 'node')
        .on('click', (event: any, d: any) => toggleLock(event, d))
        .call(d3.drag<any, any>()
            .on('start', (event: any, d: any) => dragStarted(event, d, simulationRef))
            .on('drag', dragged)
            .on('end', (event: any, d: any) => dragEnded(event, d, simulationRef))
        );

    nodeEnter.append('circle')
        .attr('r', nodeRadius)
        .attr('fill', 'white')
        .attr('stroke', (d: any) => (isColorful ? getRandomHexColor() : 'black'))
        .attr('stroke-width', 3);

    nodeEnter.append('text')
        .text((d: any) => (isTidy ? d.data.name : d.id))
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .style('pointer-events', 'none');

    nodeEnter.merge(node as any);
}