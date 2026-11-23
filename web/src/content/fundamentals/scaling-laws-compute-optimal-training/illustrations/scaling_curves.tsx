import { createElement } from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'Normalized allocation geometry at a 100-fold training-compute increase. Equal log-unit axes show Kaplan fitted-growth normalization at 28.84× parameters and 3.47× tokens, Chinchilla fitted-growth normalization at 10× each, and an overtrained alternative at 2.5× parameters and 40× tokens. The shared iso-FLOP contour is N multiplier × D multiplier = 100.'

export const width = 600
export const height = 786

const board = { width: 600, height: 632 }
const plot = { x: 76, y: 12, size: 448, padding: 50 }
const domain = { min: 0, max: 2 }
const inner = plot.size - plot.padding * 2

const project = (parameters: number, tokens: number) => {
    const logParameters = Math.log10(parameters)
    const logTokens = Math.log10(tokens)
    return {
        x:
            plot.x +
            plot.padding +
            ((logParameters - domain.min) / (domain.max - domain.min)) * inner,
        y:
            plot.y +
            plot.padding +
            inner -
            ((logTokens - domain.min) / (domain.max - domain.min)) * inner,
    }
}

function label(
    text: string,
    x: number,
    y: number,
    width: number,
    c: ThemeColors,
    options: {
        fontSize?: number
        color?: string
        align?: 'left' | 'center' | 'right'
        fontWeight?: number
        mono?: boolean
    } = {},
) {
    const fontSize = options.fontSize ?? 21
    return CanvasItem({
        x,
        y,
        width,
        height: fontSize * 1.45,
        children: createElement(TextLabel, {
            c,
            text,
            width,
            fontSize,
            fontWeight: options.fontWeight ?? 650,
            color: options.color ?? c.textPrimary,
            align: options.align ?? 'left',
            mono: options.mono,
        }),
    })
}

const allocation = {
    kaplan: { n: 100 ** 0.73, d: 100 ** 0.27, key: 'K', tone: 'warm' as const },
    chinchilla: { n: 10, d: 10, key: 'C', tone: 'blue' as const },
    overtrained: { n: 2.5, d: 40, key: 'A', tone: 'green' as const },
}

const illustration = defineIllustration((colors) => {
    const c = { ...colors, preset: 'engineering' as const, shadow: 'transparent' }
    const allocations = [
        {
            ...allocation.kaplan,
            label: `K  Kaplan fitted growth  ·  N ${allocation.kaplan.n.toFixed(2)}×  ·  D ${allocation.kaplan.d.toFixed(2)}×`,
        },
        { ...allocation.chinchilla, label: 'C  Chinchilla fitted growth  ·  N 10×  ·  D 10×' },
        { ...allocation.overtrained, label: 'A  Overtrained regime  ·  N 2.5×  ·  D 40×' },
    ]
    const dataPoints = allocations.map((item) => ({
        x: Math.log10(item.n),
        y: Math.log10(item.d),
        tone: item.tone,
        r: item.key === 'C' ? 12 : 11,
        stroke: c.bgCard,
        strokeWidth: 3,
    }))
    const contour = Array.from({ length: 65 }, (_, index) => {
        const logParameters = index / 32
        return { x: logParameters, y: 2 - logParameters }
    })

    return Scene({
        c,
        title: 'How should a 100× compute budget grow?',
        subtitle:
            'Kaplan and Chinchilla fitted-growth normalizations · equal log units on both axes',
        padding: 0,
        gap: 8,
        contentWidth: board.width,
        children: [
            Board({
                c,
                width: board.width,
                height: board.height,
                background: c.bg,
                children: [
                    label('Training tokens D ↑', plot.x, 0, 220, c, {
                        fontSize: 21,
                        color: c.textSecondary,
                        fontWeight: 700,
                    }),
                    CanvasItem({
                        x: plot.x,
                        y: plot.y,
                        width: plot.size,
                        height: plot.size,
                        children: AxisPlot({
                            c,
                            width: plot.size,
                            height: plot.size,
                            padding: plot.padding,
                            xMin: domain.min,
                            xMax: domain.max,
                            yMin: domain.min,
                            yMax: domain.max,
                            showFrame: false,
                            showGrid: true,
                            gridCount: 3,
                            paths: [
                                {
                                    points: contour,
                                    tone: 'neutral',
                                    strokeWidth: 3,
                                    dashed: true,
                                    opacity: 0.9,
                                },
                            ],
                            points: dataPoints,
                        }),
                    }),
                    ...[1, 10, 100].map((value) => {
                        const point = project(value, 1)
                        return label(
                            `${value}×`,
                            point.x - 26,
                            plot.y + plot.padding + inner + 6,
                            52,
                            c,
                            { fontSize: 20, color: c.textMuted, align: 'center', mono: true },
                        )
                    }),
                    ...[1, 10, 100].map((value) => {
                        const point = project(1, value)
                        return label(`${value}×`, 16, point.y - 14, 48, c, {
                            fontSize: 20,
                            color: c.textMuted,
                            align: 'right',
                            mono: true,
                        })
                    }),
                    ...allocations.map((item) => {
                        const point = project(item.n, item.d)
                        const color = getReadableToneColor(item.tone, c)
                        const offsets =
                            item.key === 'K'
                                ? { x: point.x + 13, y: point.y - 34 }
                                : item.key === 'C'
                                  ? { x: point.x + 13, y: point.y - 37 }
                                  : { x: point.x + 13, y: point.y - 34 }
                        return label(item.key, offsets.x, offsets.y, 32, c, {
                            fontSize: 22,
                            color,
                            fontWeight: 900,
                            mono: true,
                        })
                    }),
                    label('Parameter count N →', plot.x + 112, plot.y + plot.size + 7, 230, c, {
                        fontSize: 21,
                        color: c.textSecondary,
                        align: 'center',
                        fontWeight: 700,
                    }),
                    label('At 100× compute, N × D = 100', 34, 496, 532, c, {
                        fontSize: 22,
                        color: c.textPrimary,
                        align: 'center',
                        fontWeight: 750,
                    }),
                    ...allocations.map((item, index) => {
                        const color = getReadableToneColor(item.tone, c)
                        return label(item.label, 52, 532 + index * 25, 510, c, {
                            fontSize: 19,
                            color,
                            fontWeight: 700,
                        })
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
