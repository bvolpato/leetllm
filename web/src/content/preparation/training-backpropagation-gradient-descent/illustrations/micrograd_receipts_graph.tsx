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
    'For a=3 and s=a×a=9, the forward value enters both operand slots. In the reverse pass, seed s.grad=1 yields +3 through each slot. Both contributions return to one shared a.grad buffer, which accumulates 3+3=6.'

export const width = 620
export const height = 716

type NodeSpec = {
    x: number
    y: number
    width: number
    height: number
    title: string
    value: string
    tone: ToneName
}

function text(
    c: ThemeColors,
    x: number,
    y: number,
    boxWidth: number,
    value: string,
    fontSize: number,
    color = c.textSecondary,
) {
    return CanvasItem({
        x,
        y,
        width: boxWidth,
        height: fontSize + 8,
        children: TextLabel({ c, text: value, width: boxWidth, fontSize, color }),
    })
}

function node(c: ThemeColors, spec: NodeSpec) {
    return CanvasItem({
        x: spec.x,
        y: spec.y,
        width: spec.width,
        height: spec.height,
        children: Card({
            c,
            tone: spec.tone,
            width: '100%',
            height: '100%',
            padding: 6,
            gap: 3,
            shadow: false,
            title: TextLabel({
                c,
                text: spec.title,
                width: '100%',
                fontSize: 19,
                color: c.textSecondary,
                align: 'center',
            }),
            children: TextLabel({
                c,
                text: spec.value,
                width: '100%',
                fontSize: 22,
                fontWeight: 750,
                color: c.textPrimary,
                align: 'center',
                mono: true,
            }),
        }),
    })
}

const nodes: NodeSpec[] = [
    { x: 20, y: 185, width: 145, height: 82, title: 'leaf a', value: 'a = 3', tone: 'blue' },
    { x: 228, y: 135, width: 164, height: 80, title: 'left slot', value: 'a = 3', tone: 'blue' },
    { x: 228, y: 265, width: 164, height: 80, title: 'right slot', value: 'a = 3', tone: 'blue' },
    { x: 455, y: 185, width: 145, height: 82, title: 'multiply', value: 's = 9', tone: 'warm' },
    {
        x: 20,
        y: 470,
        width: 158,
        height: 92,
        title: 'shared grad',
        value: '3 + 3 = 6',
        tone: 'green',
    },
    {
        x: 230,
        y: 425,
        width: 160,
        height: 90,
        title: 'left path',
        value: '1 × 3 = +3',
        tone: 'green',
    },
    {
        x: 230,
        y: 548,
        width: 160,
        height: 90,
        title: 'right path',
        value: '1 × 3 = +3',
        tone: 'green',
    },
    {
        x: 442,
        y: 470,
        width: 158,
        height: 92,
        title: 'loss seed',
        value: 's.grad = 1',
        tone: 'warm',
    },
]

const edges = [
    { x1: 165, y1: 220, x2: 228, y2: 175, tone: 'blue' as const },
    { x1: 165, y1: 232, x2: 228, y2: 305, tone: 'blue' as const },
    { x1: 392, y1: 175, x2: 455, y2: 220, tone: 'warm' as const },
    { x1: 392, y1: 305, x2: 455, y2: 232, tone: 'warm' as const },
    { x1: 442, y1: 508, x2: 390, y2: 470, tone: 'green' as const },
    { x1: 442, y1: 524, x2: 390, y2: 593, tone: 'green' as const },
    { x1: 230, y1: 470, x2: 178, y2: 508, tone: 'green' as const },
    { x1: 230, y1: 593, x2: 178, y2: 524, tone: 'green' as const },
]

const illustration = defineIllustration((theme) => {
    const c = { ...theme, shadow: 'transparent' }
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
                    key: `micrograd-${index}`,
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
                    14,
                    580,
                    'One value, two paths, one gradient buffer',
                    25,
                    c.textPrimary,
                ),
                text(c, 20, 50, 580, 'Micrograd makes reverse-mode bookkeeping visible.', 19),
                text(
                    c,
                    20,
                    88,
                    580,
                    'Forward · one leaf fills both operand slots',
                    21,
                    c.textPrimary,
                ),
                text(
                    c,
                    20,
                    362,
                    580,
                    'Backward · add both contributions at a.grad',
                    21,
                    c.textPrimary,
                ),
                ...nodes.map((spec) => node(c, spec)),
                text(c, 20, 672, 580, 'Each path adds its derivative to one leaf buffer.', 19),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
