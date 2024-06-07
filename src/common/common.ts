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