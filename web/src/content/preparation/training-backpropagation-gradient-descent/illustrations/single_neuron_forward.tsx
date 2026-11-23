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
    'Forward values for one decode-latency example: input x=2 and weight w=1 produce m=2; bias b=0 gives prediction ŷ=2 ms. Compared with target y=6 ms, the residual is −4 ms and half-squared loss is 8 ms².'

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
        { x1: 218, y1: 143, x2: 235, y2: 275, tone: 'blue' as const },
        { x1: 452, y1: 143, x2: 435, y2: 275, tone: 'purple' as const },
        { x1: 335, y1: 331, x2: 335, y2: 390, tone: 'purple' as const },
        { x1: 218, y1: 433, x2: 235, y2: 433, tone: 'green' as const },
        { x1: 335, y1: 476, x2: 335, y2: 535, tone: 'blue' as const },
        { x1: 218, y1: 578, x2: 235, y2: 578, tone: 'green' as const },
        { x1: 435, y1: 578, x2: 452, y2: 578, tone: 'warm' as const },
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
                    key: `forward-${index}`,
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
                text(c, 20, 12, 630, 'Forward pass · each value feeds the next', 29, c.textPrimary),
                text(
                    c,
                    20,
                    50,
                    630,
                    'Prompt-complexity score x = 2 is unitless; target y = 6 ms.',
                    22,
                ),
                node(c, { x: 18, y: 100, title: 'prompt score', value: 'x = 2', tone: 'blue' }),
                node(c, { x: 452, y: 100, title: 'weight w', value: '1 ms/score', tone: 'purple' }),
                node(c, { x: 235, y: 245, title: 'w × x', value: 'm = 2 ms', tone: 'purple' }),
                node(c, { x: 18, y: 390, title: 'bias b', value: '0 ms', tone: 'green' }),
                node(c, { x: 235, y: 390, title: 'prediction', value: 'ŷ = 2 ms', tone: 'purple' }),
                node(c, { x: 18, y: 535, title: 'target y', value: '6 ms', tone: 'green' }),
                node(c, { x: 235, y: 535, title: 'residual', value: 'e = −4 ms', tone: 'blue' }),
                node(c, { x: 452, y: 535, title: 'loss', value: 'L = 8 ms²', tone: 'warm' }),
                text(c, 20, 666, 630, 'The forward pass saves values for the backward rules.', 22),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
