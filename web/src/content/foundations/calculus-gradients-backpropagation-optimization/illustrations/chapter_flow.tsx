import { Buffer } from 'node:buffer'
import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    GraphDiagram,
    Scene,
    TextLabel,
    VectorArrow,
    getToneColor,
    getThemeColors,
    renderMathSvg,
    type GraphDiagramNode,
    type ThemeMode,
} from 'vizmatic'

type LayoutNode = GraphDiagramNode & { x: number; y: number; width: number; height: number }
type PortSide = 'top' | 'right' | 'bottom' | 'left'
type Connection = {
    from: string
    to: string
    fromSide: PortSide
    toSide: PortSide
    fromOffset?: number
    toOffset?: number
    tone: 'warm' | 'purple' | 'blue' | 'cyan'
}

const backwardConnections = (
    c: ReturnType<typeof getThemeColors>,
    nodes: LayoutNode[],
    edges: Connection[],
    width: number,
    height: number,
    padding: number,
) => {
    const nodeMap = new Map(
        nodes.map((node) => {
            const cx = Math.max(
                node.width / 2,
                Math.min(width - node.width / 2, padding + node.x * (width - padding * 2)),
            )
            const cy = Math.max(
                node.height / 2,
                Math.min(height - node.height / 2, padding + node.y * (height - padding * 2)),
            )
            return [node.id, { ...node, cx, cy }]
        }),
    )

    const port = (
        node: LayoutNode & { cx: number; cy: number },
        side: PortSide,
        offset: number,
    ) => ({
        x:
            side === 'left'
                ? node.cx - node.width / 2
                : side === 'right'
                  ? node.cx + node.width / 2
                  : node.cx - node.width / 2 + node.width * offset,
        y:
            side === 'top'
                ? node.cy - node.height / 2
                : side === 'bottom'
                  ? node.cy + node.height / 2
                  : node.cy - node.height / 2 + node.height * offset,
    })

    const arrows = edges.map((edge, index) => {
        const from = nodeMap.get(edge.from)
        const to = nodeMap.get(edge.to)
        if (!from || !to) return null
        const start = port(from, edge.fromSide, edge.fromOffset ?? 0.5)
        const end = port(to, edge.toSide, edge.toOffset ?? 0.5)
        const dx = end.x - start.x
        const dy = end.y - start.y
        const length = Math.hypot(dx, dy)
        const ux = dx / length
        const uy = dy / length

        return VectorArrow({
            key: `backward-edge-${index}`,
            x1: start.x + ux * 0.5,
            y1: start.y + uy * 0.5,
            x2: end.x - ux * 1.5,
            y2: end.y - uy * 1.5,
            color: getToneColor(edge.tone, c),
            strokeWidth: 2.3,
            arrowSize: 5.5,
        })
    })

    return createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
            style: { display: 'block', overflow: 'visible' },
        },
        ...arrows,
    )
}

export const alt =
    'Two aligned computation graphs trace one latency example. The forward pass carries feature and weight values through prediction 6, error 1, and squared loss 1. The backward pass starts with loss sensitivity 1, multiplies by 2e and by the subtraction derivative 1, then branches to separate gradients 4 for the prompt weight and 2 for the queue weight.'

export const width = 640
export const height = 800
export const preset = 'engineering'

const formula = (text: string, fontSize: number, color: string) => {
    const rendered = renderMathSvg(text, { fontSize, color })
    const src = `data:image/svg+xml;base64,${Buffer.from(rendered.svg).toString('base64')}`
    return createElement('img', {
        src,
        alt: '',
        width: rendered.width,
        height: rendered.height,
        style: { display: 'block', width: rendered.width, height: rendered.height },
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')

    return Scene({
        c,
        padding: 16,
        gap: 8,
        title: 'One calculation, two passes',
        subtitle:
            'The forward values become ingredients for the gradients that return through the graph.',
        contentWidth: 608,
        align: 'center',
        children: [
            TextLabel({
                c,
                text: 'FORWARD · values move toward the loss',
                fontSize: 23,
                fontWeight: 800,
                color: c.textSecondary,
                width: '100%',
            }),
            GraphDiagram({
                c,
                width: 600,
                height: 206,
                padding: 24,
                layout: 'manual',
                routing: 'straight',
                nodeWidth: 116,
                nodeHeight: 80,
                labelFontSize: 24,
                detailFontSize: 19,
                arrowSize: 8,
                nodes: [
                    {
                        id: 'prompt-term',
                        label: TextLabel({
                            c,
                            text: 'Prompt · 4',
                            fontSize: 24,
                            fontWeight: 700,
                            color: c.textPrimary,
                            width: '100%',
                            align: 'center',
                        }),
                        detail: formula(String.raw`w_p x_p = 2 \times 2`, 19, c.textSecondary),
                        x: 0.14,
                        y: 0.22,
                        width: 184,
                        height: 94,
                        tone: 'blue',
                    },
                    {
                        id: 'queue-term',
                        label: TextLabel({
                            c,
                            text: 'Queue · 2',
                            fontSize: 24,
                            fontWeight: 700,
                            color: c.textPrimary,
                            width: '100%',
                            align: 'center',
                        }),
                        detail: formula(String.raw`w_q x_q = 2 \times 1`, 19, c.textSecondary),
                        x: 0.14,
                        y: 0.78,
                        width: 184,
                        height: 80,
                        tone: 'cyan',
                    },
                    {
                        id: 'prediction',
                        label: formula(String.raw`\hat{y} = 6`, 24, c.textPrimary),
                        detail: formula('4 + 2', 19, c.textSecondary),
                        x: 0.44,
                        y: 0.5,
                        width: 116,
                        height: 82,
                        tone: 'purple',
                    },
                    {
                        id: 'error',
                        label: formula('e = 1', 24, c.textPrimary),
                        detail: formula('6 - 5', 19, c.textSecondary),
                        x: 0.68,
                        y: 0.5,
                        width: 116,
                        height: 82,
                        tone: 'warm',
                    },
                    {
                        id: 'loss',
                        label: formula('L = 1', 24, c.textPrimary),
                        detail: formula('e^2', 19, c.textSecondary),
                        x: 0.94,
                        y: 0.5,
                        width: 108,
                        height: 82,
                        tone: 'critical',
                    },
                ],
                edges: [
                    {
                        from: 'prompt-term',
                        to: 'prediction',
                        fromSide: 'right',
                        toSide: 'left',
                        tone: 'blue',
                    },
                    {
                        from: 'queue-term',
                        to: 'prediction',
                        fromSide: 'right',
                        toSide: 'left',
                        tone: 'cyan',
                    },
                    {
                        from: 'prediction',
                        to: 'error',
                        fromSide: 'right',
                        toSide: 'left',
                        tone: 'purple',
                    },
                    { from: 'error', to: 'loss', fromSide: 'right', toSide: 'left', tone: 'warm' },
                ],
            }),
            TextLabel({
                c,
                text: 'BACKWARD · local derivatives carry the signal back',
                fontSize: 23,
                fontWeight: 800,
                color: c.textSecondary,
                width: '100%',
            }),
            (() => {
                const nodes: LayoutNode[] = [
                    {
                        id: 'seed',
                        label: formula(
                            String.raw`\frac{\partial L}{\partial L} = 1`,
                            24,
                            c.textPrimary,
                        ),
                        detail: TextLabel({
                            c,
                            text: 'loss seed',
                            fontSize: 19,
                            color: c.textSecondary,
                            width: '100%',
                            align: 'center',
                        }),
                        x: 0.95,
                        y: 0.5,
                        width: 120,
                        height: 80,
                        tone: 'critical',
                    },
                    {
                        id: 'error-adjoint',
                        label: formula(
                            String.raw`\frac{\partial L}{\partial e} = 2`,
                            24,
                            c.textPrimary,
                        ),
                        detail: formula(String.raw`1 \times 2e`, 19, c.textSecondary),
                        x: 0.69,
                        y: 0.5,
                        width: 118,
                        height: 94,
                        tone: 'warm',
                    },
                    {
                        id: 'prediction-adjoint',
                        label: formula(
                            String.raw`\frac{\partial L}{\partial \hat{y}} = 2`,
                            24,
                            c.textPrimary,
                        ),
                        detail: formula(String.raw`2 \times 1`, 19, c.textSecondary),
                        x: 0.44,
                        y: 0.5,
                        width: 118,
                        height: 94,
                        tone: 'purple',
                    },
                    {
                        id: 'prompt-gradient',
                        label: formula(
                            String.raw`\frac{\partial L}{\partial w_p} = 4`,
                            24,
                            c.textPrimary,
                        ),
                        detail: formula(String.raw`2 \times x_p`, 19, c.textSecondary),
                        x: 0.14,
                        y: 0.23,
                        width: 170,
                        height: 96,
                        tone: 'blue',
                    },
                    {
                        id: 'queue-gradient',
                        label: formula(
                            String.raw`\frac{\partial L}{\partial w_q} = 2`,
                            24,
                            c.textPrimary,
                        ),
                        detail: formula(String.raw`2 \times x_q`, 19, c.textSecondary),
                        x: 0.14,
                        y: 0.77,
                        width: 170,
                        height: 96,
                        tone: 'cyan',
                    },
                ]
                const connections: Connection[] = [
                    {
                        from: 'seed',
                        to: 'error-adjoint',
                        fromSide: 'left',
                        toSide: 'right',
                        tone: 'warm',
                    },
                    {
                        from: 'error-adjoint',
                        to: 'prediction-adjoint',
                        fromSide: 'left',
                        toSide: 'right',
                        tone: 'purple',
                    },
                    {
                        from: 'prediction-adjoint',
                        to: 'prompt-gradient',
                        fromSide: 'left',
                        fromOffset: 0.28,
                        toSide: 'right',
                        tone: 'blue',
                    },
                    {
                        from: 'prediction-adjoint',
                        to: 'queue-gradient',
                        fromSide: 'left',
                        fromOffset: 0.72,
                        toSide: 'right',
                        tone: 'cyan',
                    },
                ]

                return Board({
                    c,
                    width: 600,
                    height: 250,
                    children: [
                        CanvasItem({
                            x: 0,
                            y: 0,
                            width: 600,
                            height: 250,
                            children: backwardConnections(c, nodes, connections, 600, 250, 24),
                        }),
                        CanvasItem({
                            x: 0,
                            y: 0,
                            width: 600,
                            height: 250,
                            children: GraphDiagram({
                                c,
                                width: 600,
                                height: 250,
                                padding: 24,
                                layout: 'manual',
                                routing: 'straight',
                                nodeWidth: 118,
                                nodeHeight: 94,
                                labelFontSize: 24,
                                detailFontSize: 19,
                                nodes,
                                edges: [],
                                ariaLabel:
                                    'The backward pass starts at the loss, moves left through error and prediction, then branches to separate prompt and queue gradients.',
                                description:
                                    'Each triangle follows the local derivative path and ends at its destination node.',
                            }),
                        }),
                    ],
                })
            })(),
        ],
    })
}

export default create()
