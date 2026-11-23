import { createElement } from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    ProgressList,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'Equal-unit log axes compare fitted allocation growth with compute: Kaplan parameter growth has slope 0.73, Kaplan token growth slope 0.27, and Chinchilla balanced growth slope 0.50. At 100-fold compute, their normalized multipliers are 28.84/3.47 and 10/10. A separate bar strip shows model-specific D/N ratios of 1.7:1 for GPT-3, 20:1 for Chinchilla, and 38.5:1 for Llama 3 405B.'

export const width = 600
export const height = 800

const board = { width: 600, height: 516 }
const plot = { x: 110, y: 0, size: 380, padding: 42 }
const domain = { min: 0, max: 2.15 }
const inner = plot.size - plot.padding * 2
const endpoints = [
    { key: 'Kaplan parameters', slope: 0.73, tone: 'warm' as const },
    { key: 'Kaplan tokens', slope: 0.27, tone: 'purple' as const },
    { key: 'Chinchilla parameters and tokens', slope: 0.5, tone: 'blue' as const },
]

const project = (logCompute: number, logGrowth: number) => ({
    x: plot.x + plot.padding + ((logCompute - domain.min) / (domain.max - domain.min)) * inner,
    y:
        plot.y +
        plot.padding +
        inner -
        ((logGrowth - domain.min) / (domain.max - domain.min)) * inner,
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
    const curves = endpoints.map((series) => ({
        ...series,
        points: Array.from({ length: 49 }, (_, index) => {
            const x = index / 24
            return { x, y: series.slope * x }
        }),
    }))
    const endPoints = endpoints.map((series) => ({
        x: 2,
        y: series.slope * 2,
        tone: series.tone,
        r: 8,
        stroke: c.bgCard,
        strokeWidth: 2,
    }))

    return Scene({
        c,
        title: 'Growth frontiers and model token ratios',
        subtitle: 'Compute multiplier C on x · allocation multiplier on y · equal log units',
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
                    label('Allocation multiplier', plot.x, 0, 250, c, {
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
                            paths: curves.map((series) => ({
                                points: series.points,
                                tone: series.tone,
                                strokeWidth: 4,
                            })),
                            points: endPoints,
                        }),
                    }),
                    ...[0, 1, 2].map((value) => {
                        const point = project(value, domain.min)
                        return label(
                            `${10 ** value}×`,
                            point.x - 31,
                            plot.y + plot.padding + inner + 5,
                            62,
                            c,
                            { fontSize: 21, color: c.textMuted, align: 'center', mono: true },
                        )
                    }),
                    ...[0, 1, 2].map((value) => {
                        const point = project(domain.min, value)
                        return label(`${10 ** value}×`, 23, point.y - 13, 70, c, {
                            fontSize: 21,
                            color: c.textMuted,
                            align: 'right',
                            mono: true,
                        })
                    }),
                    label('Compute multiplier C →', plot.x + 58, plot.y + plot.size + 6, 260, c, {
                        fontSize: 21,
                        color: c.textSecondary,
                        align: 'center',
                        fontWeight: 700,
                    }),
                    label('At 100× compute:', 48, 410, 510, c, {
                        fontSize: 21,
                        color: c.textMuted,
                        fontWeight: 650,
                    }),
                    label('Kaplan N · 28.84×', 48, 433, 510, c, {
                        fontSize: 21,
                        color: getReadableToneColor('warm', c),
                        fontWeight: 750,
                    }),
                    label('Kaplan D · 3.47×', 48, 456, 510, c, {
                        fontSize: 21,
                        color: getReadableToneColor('purple', c),
                        fontWeight: 750,
                    }),
                    label('Chinchilla N and D · 10× each', 48, 479, 510, c, {
                        fontSize: 21,
                        color: getReadableToneColor('blue', c),
                        fontWeight: 750,
                    }),
                ],
            }),
            Column({
                width: 584,
                style: { marginLeft: 8 },
                gap: 5,
                align: 'stretch',
                children: [
                    TextLabel({
                        c,
                        text: 'Model-specific data-to-parameter ratios',
                        fontSize: 22,
                        fontWeight: 850,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Historical D/N snapshots · common bar scale to 42:1',
                        fontSize: 21,
                        color: c.textMuted,
                        align: 'center',
                    }),
                    ProgressList({
                        c,
                        gap: 8,
                        labelWidth: 150,
                        valueWidth: 84,
                        barHeight: 15,
                        fontSize: 21,
                        rows: [
                            { label: 'GPT-3', value: 1.7 / 42, valueLabel: '1.7:1', tone: 'warm' },
                            {
                                label: 'Chinchilla',
                                value: 20 / 42,
                                valueLabel: '20:1',
                                tone: 'blue',
                            },
                            {
                                label: 'Llama 3 405B',
                                value: 38.5 / 42,
                                valueLabel: '38.5:1',
                                tone: 'green',
                            },
                        ],
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
