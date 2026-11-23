import { Buffer } from 'node:buffer'
import { createElement, type ReactNode } from 'react'
import {
    Board,
    CanvasItem,
    Panel,
    Scene,
    TextLabel,
    VectorArrow,
    getToneColor,
    getToneFill,
    getThemeColors,
    renderMathSvg,
    type ToneName,
    type ThemeMode,
} from 'vizmatic'

type PositionedNode = {
    id: string
    x: number
    y: number
    width: number
    height: number
    label: ReactNode
    detail?: ReactNode
    tone: ToneName
}
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

const graphConnections = (
    c: ReturnType<typeof getThemeColors>,
    nodes: PositionedNode[],
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
        node: PositionedNode & { cx: number; cy: number },
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
    'A backward computation graph runs from squared loss L=1 through error e=1 and prediction ŷ=6, then splits into prompt and queue paths before returning to shared weight w=2. The prompt contribution is 2×1×2=4, the queue contribution is 2×1×1=2, and the shared weight gradient adds them to 6.'

export const width = 640
export const height = 850
export const preset = 'engineering'

const math = (tex: string, fontSize: number, color: string) => {
    const rendered = renderMathSvg(tex, { fontSize, color })
    const src = `data:image/svg+xml;base64,${Buffer.from(rendered.svg).toString('base64')}`
    return createElement('img', {
        src,
        alt: '',
        width: rendered.width,
        height: rendered.height,
        style: { display: 'block', width: rendered.width, height: rendered.height },
    })
}

const label = (c: ReturnType<typeof getThemeColors>, text: string, fontSize: number) =>
    TextLabel({
        c,
        text,
        fontSize,
        fontWeight: 750,
        color: c.textPrimary,
        width: '100%',
        align: 'center',
    })

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')

    return Scene({
        c,
        padding: 16,
        gap: 8,
        title: 'One shared weight collects both gradients',
        subtitle: 'The loss signal follows each route, then the two contributions meet at w.',
        contentWidth: 608,
        align: 'center',
        children: (() => {
            const nodes: PositionedNode[] = [
                {
                    id: 'loss',
                    label: label(c, 'Loss', 23),
                    detail: math(
                        String.raw`L=1,\;\frac{\partial L}{\partial L}=1`,
                        18,
                        c.textSecondary,
                    ),
                    x: 0.5,
                    y: 0.08,
                    width: 190,
                    height: 94,
                    tone: 'critical',
                },
                {
                    id: 'error',
                    label: label(c, 'Error · e=1', 23),
                    detail: math(String.raw`2e=2`, 19, c.textSecondary),
                    x: 0.5,
                    y: 0.29,
                    width: 190,
                    height: 94,
                    tone: 'warm',
                },
                {
                    id: 'prediction',
                    label: label(c, 'Prediction', 23),
                    detail: math(
                        String.raw`\hat{y}=6,\;\frac{\partial L}{\partial \hat{y}}=2`,
                        19,
                        c.textSecondary,
                    ),
                    x: 0.5,
                    y: 0.5,
                    width: 190,
                    height: 94,
                    tone: 'purple',
                },
                {
                    id: 'prompt-path',
                    label: math(String.raw`\text{Prompt}\;x_p=2`, 24, c.textPrimary),
                    detail: math(String.raw`2\times1\times x_p=4`, 19, c.textSecondary),
                    x: 0.24,
                    y: 0.7,
                    width: 220,
                    height: 100,
                    tone: 'blue',
                },
                {
                    id: 'queue-path',
                    label: math(String.raw`\text{Queue}\;x_q=1`, 24, c.textPrimary),
                    detail: math(String.raw`2\times1\times x_q=2`, 19, c.textSecondary),
                    x: 0.76,
                    y: 0.7,
                    width: 220,
                    height: 100,
                    tone: 'cyan',
                },
                {
                    id: 'shared-weight',
                    label: math(String.raw`\text{Shared weight}\;w=2`, 24, c.textPrimary),
                    detail: math(
                        String.raw`\frac{\partial L}{\partial w}=4+2=6`,
                        19,
                        c.textSecondary,
                    ),
                    x: 0.5,
                    y: 0.9,
                    width: 260,
                    height: 100,
                    tone: 'green',
                },
            ]
            const connections: Connection[] = [
                { from: 'loss', to: 'error', fromSide: 'bottom', toSide: 'top', tone: 'warm' },
                {
                    from: 'error',
                    to: 'prediction',
                    fromSide: 'bottom',
                    toSide: 'top',
                    tone: 'purple',
                },
                {
                    from: 'prediction',
                    to: 'prompt-path',
                    fromSide: 'bottom',
                    fromOffset: 0.28,
                    toSide: 'top',
                    tone: 'blue',
                },
                {
                    from: 'prediction',
                    to: 'queue-path',
                    fromSide: 'bottom',
                    fromOffset: 0.72,
                    toSide: 'top',
                    tone: 'cyan',
                },
                {
                    from: 'prompt-path',
                    to: 'shared-weight',
                    fromSide: 'bottom',
                    toSide: 'top',
                    toOffset: 0.32,
                    tone: 'blue',
                },
                {
                    from: 'queue-path',
                    to: 'shared-weight',
                    fromSide: 'bottom',
                    toSide: 'top',
                    toOffset: 0.68,
                    tone: 'cyan',
                },
            ]

            const nodeMap = new Map(
                nodes.map((node) => {
                    const cx = Math.max(
                        node.width / 2,
                        Math.min(600 - node.width / 2, 24 + node.x * 552),
                    )
                    const cy = Math.max(
                        node.height / 2,
                        Math.min(600 - node.height / 2, 24 + node.y * 552),
                    )
                    return [node.id, { ...node, cx, cy }]
                }),
            )
            const cards = nodes.map((node) => {
                const positioned = nodeMap.get(node.id)
                if (!positioned) return null
                const left = positioned.cx - node.width / 2
                const top = positioned.cy - node.height / 2

                return createElement(
                    CanvasItem,
                    {
                        key: `node-${node.id}`,
                        x: left,
                        y: top,
                        width: node.width,
                        height: node.height,
                    },
                    Panel({
                        c,
                        title: node.label,
                        children: node.detail,
                        tone: node.tone,
                        width: node.width - 2,
                        height: node.height - 2,
                        padding: 0,
                        gap: 5,
                        align: 'center',
                        justify: 'center',
                        shadow: false,
                        background: getToneFill(node.tone, c),
                        borderColor: getToneColor(node.tone, c),
                        titleFontSize: 23,
                        accentWidth: 0,
                        accentHeight: 0,
                        bodyStyle: { alignItems: 'center' },
                    }),
                )
            })

            return createElement(
                'div',
                {
                    role: 'img',
                    'aria-label': alt,
                    style: { width: 600, height: 600 },
                },
                Board({
                    c,
                    width: 600,
                    height: 600,
                    children: [
                        CanvasItem({
                            x: 0,
                            y: 0,
                            width: 600,
                            height: 600,
                            children: graphConnections(c, nodes, connections, 600, 600, 24),
                        }),
                        ...cards,
                    ],
                }),
            )
        })(),
    })
}

export default create()
