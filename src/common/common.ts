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