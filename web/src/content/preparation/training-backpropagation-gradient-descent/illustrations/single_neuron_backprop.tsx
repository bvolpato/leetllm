import React from 'react'
import {
    Board,
    CanvasItem,
    Card,
    Scene,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors, ToneName } from 'vizmatic'

export const alt =
    'The same latency graph now carries gradients backward from L=8. The seed 1 reaches residual e=−4, then prediction ŷ=2; it branches to bias gradient −4 and weighted-input gradient −4. The saved input x=2 scales that branch to weight gradient −8.'

export const width = 670
export const height = 710

type NodeSpec = {
    x: number
    y: number
    title: string
    value: string
    tone: ToneName
}

function text(
    c: ThemeColors,
    x: number,
    y: number,
    width: number,
    value: string,
    fontSize: number,
    color = c.textSecondary,
) {
    return CanvasItem({
        x,
        y,
        width,
        height: fontSize + 8,
        children: TextLabel({ c, text: value, width, fontSize, color }),
    })
}

function node(c: ThemeColors, spec: NodeSpec) {
    return CanvasItem({
        x: spec.x,
        y: spec.y,
        width: 200,
        height: 86,
        children: Card({
            c,
            tone: spec.tone,
            width: '100%',
            height: '100%',
            padding: 8,
            gap: 4,
            shadow: false,
            title: TextLabel({
                c,
                text: spec.title,
                width: '100%',
                fontSize: 22,
                color: c.textSecondary,
                align: 'center',
            }),
            children: TextLabel({
                c,
                text: spec.value,
                width: '100%',
                fontSize: 26,
                fontWeight: 750,
                color: c.textPrimary,
                align: 'center',
                mono: true,
            }),
        }),
    })
}

const illustration = defineIllustration((theme) => {
    const c = { ...theme, shadow: 'transparent' }
    const edges = [
        { x1: 452, y1: 578, x2: 435, y2: 578, tone: 'warm' as const },
        { x1: 335, y1: 535, x2: 335, y2: 476, tone: 'blue' as const },
        { x1: 335, y1: 390, x2: 335, y2: 331, tone: 'purple' as const },
        { x1: 435, y1: 275, x2: 452, y2: 143, tone: 'purple' as const },
        { x1: 235, y1: 433, x2: 218, y2: 433, tone: 'green' as const },
    ]
    const arrowLayer = CanvasItem({
        x: 0,
        y: 0,
        width,
        height,
        children: React.createElement(
            'svg',
            { width, height, viewBox: `0 0 ${width} ${height}` },
            ...edges.map((edge, index) =>
                VectorArrow({
                    key: `backward-${index}`,
                    ...edge,
                    color: getReadableToneColor(edge.tone, c),
                    strokeWidth: 3,
                    arrowSize: 8,
                }),
            ),
        ),
    })

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                arrowLayer,
                text(
                    c,
                    20,
                    12,
                    630,
                    'Backward pass · gradients follow the same graph',
                    27,
                    c.textPrimary,
                ),
                text(c, 20, 50, 630, 'Saved prompt-complexity score x is unitless.', 22),
                node(c, { x: 18, y: 100, title: 'stored score', value: 'x = 2', tone: 'blue' }),
                node(c, {
                    x: 452,
                    y: 100,
                    title: 'weight w = 1',
                    value: 'dL/dw = −8',
                    tone: 'purple',
                }),
                node(c, {
                    x: 235,
                    y: 245,
                    title: 'm = w × x',
                    value: 'dL/dm = −4',
                    tone: 'purple',
                }),
                node(c, { x: 18, y: 390, title: 'bias b = 0', value: 'dL/db = −4', tone: 'green' }),
                node(c, {
                    x: 235,
                    y: 390,
                    title: 'prediction',
                    value: 'dL/dŷ = −4',
                    tone: 'purple',
                }),
                node(c, { x: 18, y: 535, title: 'target y', value: '6 ms', tone: 'green' }),
                node(c, { x: 235, y: 535, title: 'residual', value: 'dL/de = −4', tone: 'blue' }),
                node(c, { x: 452, y: 535, title: 'loss', value: 'dL/dL = 1', tone: 'warm' }),
                text(c, 20, 666, 630, 'Saved x = 2 provides the multiplication slope for w.', 22),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
