import { createElement } from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'Assuming equal model quality, total training-plus-serving FLOPs cross at 1.65 trillion served tokens. At the crossing each candidate costs 8.19×10²³ FLOPs: the 70B model is 5.88 training plus 2.31 serving, while the 30B model is 7.20 training plus 0.99 serving. Stacked bars share the same total scale.'

export const width = 600
export const height = 780

const board = { width: 600, height: 420 }
const plot = { x: 34, y: 58, width: 532, height: 254, padding: 46 }
const xDomain = { min: 0, max: 3 }
const yDomain = { min: 5, max: 10.5 }
const innerWidth = plot.width - plot.padding * 2
const innerHeight = plot.height - plot.padding * 2
const breakEven = { tokens: 1.65, total: 8.19 }

const project = (tokensTrillion: number, totalFLOPs: number) => ({
    x:
        plot.x +
        plot.padding +
        ((tokensTrillion - xDomain.min) / (xDomain.max - xDomain.min)) * innerWidth,
    y:
        plot.y +
        plot.padding +
        innerHeight -
        ((totalFLOPs - yDomain.min) / (yDomain.max - yDomain.min)) * innerHeight,
})

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

const illustration = defineIllustration((colors) => {
    const c = { ...colors, preset: 'engineering' as const, shadow: 'transparent' }
    const lines = [
        { name: '70B model', training: 5.88, servingPerT: 1.4, tone: 'warm' as const },
        { name: '30B model', training: 7.2, servingPerT: 0.6, tone: 'blue' as const },
    ]
    const chartPaths = lines.map((line) => ({
        tone: line.tone,
        strokeWidth: 4,
        points: Array.from({ length: 49 }, (_, index) => {
            const tokens = (index * 3) / 48
            return { x: tokens, y: line.training + line.servingPerT * tokens }
        }),
    }))
    return Scene({
        c,
        title: 'Serving volume changes the lower-cost model',
        subtitle: 'Equal quality is assumed · total FLOPs are shown in 10²³ units',
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
                    label('Equal-quality scenario', plot.x, 0, 260, c, {
                        fontSize: 21,
                        color: c.textSecondary,
                        fontWeight: 700,
                    }),
                    label('Dense FLOP proxy · ×10²³', plot.x, 27, 270, c, {
                        fontSize: 21,
                        color: c.textSecondary,
                        fontWeight: 700,
                    }),
                    label('Break-even', 314, 0, 272, c, {
                        fontSize: 21,
                        color: getReadableToneColor('green', c),
                        fontWeight: 850,
                    }),
                    label('1.65T · 8.19×10²³', 314, 26, 272, c, {
                        fontSize: 21,
                        color: getReadableToneColor('green', c),
                        fontWeight: 850,
                    }),
                    CanvasItem({
                        x: plot.x,
                        y: plot.y,
                        width: plot.width,
                        height: plot.height,
                        children: AxisPlot({
                            c,
                            width: plot.width,
                            height: plot.height,
                            padding: plot.padding,
                            xMin: xDomain.min,
                            xMax: xDomain.max,
                            yMin: yDomain.min,
                            yMax: yDomain.max,
                            showFrame: false,
                            showGrid: true,
                            gridCount: 3,
                            paths: [
                                ...chartPaths,
                                {
                                    points: [
                                        { x: breakEven.tokens, y: yDomain.min },
                                        { x: breakEven.tokens, y: yDomain.max },
                                    ],
                                    tone: 'neutral',
                                    strokeWidth: 2,
                                    dashed: true,
                                    opacity: 0.8,
                                },
                            ],
                            points: [
                                {
                                    x: 0,
                                    y: lines[0].training,
                                    tone: 'warm',
                                    r: 8,
                                    stroke: c.bgCard,
                                    strokeWidth: 2,
                                },
                                {
                                    x: 0,
                                    y: lines[1].training,
                                    tone: 'blue',
                                    r: 8,
                                    stroke: c.bgCard,
                                    strokeWidth: 2,
                                },
                                {
                                    x: breakEven.tokens,
                                    y: breakEven.total,
                                    fill: c.positive,
                                    r: 12,
                                    stroke: c.bgCard,
                                    strokeWidth: 3,
                                },
                            ],
                        }),
                    }),
                    ...[0, 1, 1.65, 3].map((tokens) => {
                        const point = project(tokens, yDomain.min)
                        const tick = tokens === 0 ? '0' : tokens === 1.65 ? '1.65T' : `${tokens}T`
                        return label(
                            tick,
                            point.x - 36,
                            plot.y + plot.padding + innerHeight + 5,
                            72,
                            c,
                            { fontSize: 21, color: c.textMuted, align: 'center', mono: true },
                        )
                    }),
                    ...[5, 7, 9, 10].map((value) => {
                        const point = project(xDomain.min, value)
                        return label(value.toFixed(0), 0, point.y - 13, 30, c, {
                            fontSize: 21,
                            color: c.textMuted,
                            align: 'right',
                            mono: true,
                        })
                    }),
                    label('Served tokens', plot.x + 125, plot.y + plot.height + 6, 250, c, {
                        fontSize: 21,
                        color: c.textSecondary,
                        align: 'center',
                        fontWeight: 700,
                    }),
                    label('70B · 5.88 + 1.40 per served T', 42, 352, 516, c, {
                        fontSize: 21,
                        color: getReadableToneColor('warm', c),
                        fontWeight: 750,
                    }),
                    label('30B · 7.20 + 0.60 per served T', 42, 384, 516, c, {
                        fontSize: 21,
                        color: getReadableToneColor('blue', c),
                        fontWeight: 750,
                    }),
                ],
            }),
            Column({
                width: '100%',
                gap: 8,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Cost composition at the crossing',
                        fontSize: 22,
                        fontWeight: 850,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Crossing totals: 8.19×10²³ FLOPs each · common scale',
                        fontSize: 21,
                        color: c.textMuted,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: '70B · training 5.88 + serving 2.31',
                        fontSize: 21,
                        color: c.textPrimary,
                        align: 'center',
                        fontWeight: 750,
                    }),
                    StackedBar({
                        c,
                        width: 520,
                        height: 30,
                        showLegend: false,
                        segments: [
                            { label: 'Training', value: 5.88, color: c.primary, valueLabel: '' },
                            { label: 'Serving', value: 2.31, color: c.warning, valueLabel: '' },
                        ],
                    }),
                    TextLabel({
                        c,
                        text: '30B · training 7.20 + serving 0.99',
                        fontSize: 21,
                        color: c.textPrimary,
                        align: 'center',
                        fontWeight: 750,
                    }),
                    StackedBar({
                        c,
                        width: 520,
                        height: 30,
                        showLegend: false,
                        segments: [
                            { label: 'Training', value: 7.2, color: c.primary, valueLabel: '' },
                            { label: 'Serving', value: 0.99, color: c.warning, valueLabel: '' },
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Blue = training FLOPs · amber = serving FLOPs',
                        fontSize: 21,
                        color: c.textMuted,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
