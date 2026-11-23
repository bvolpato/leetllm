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
    renderMathSvg,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'Log-compute plot for the power law L(C)=2+C to the negative 0.05 shows losses 3.000, 2.944, 2.891, 2.841, and 2.794 across equal 3.16-fold compute steps. Four bars below use a shared 0.060 scale and show the successive loss drops shrinking from 0.056 to 0.047.'

export const width = 600
export const height = 760

const board = { width: 600, height: 372 }
const plot = { x: 38, y: 4, width: 524, height: 306, padding: 48 }
const xDomain = { min: 0, max: 2 }
const yDomain = { min: 2.76, max: 3.04 }
const innerWidth = plot.width - plot.padding * 2
const innerHeight = plot.height - plot.padding * 2
const compute = [1, 10 ** 0.5, 10, 10 ** 1.5, 100]
const losses = compute.map((value) => 2 + value ** -0.05)
const drops = losses.slice(0, -1).map((loss, index) => loss - losses[index + 1])

const project = (logCompute: number, loss: number) => ({
    x:
        plot.x +
        plot.padding +
        ((logCompute - xDomain.min) / (xDomain.max - xDomain.min)) * innerWidth,
    y:
        plot.y +
        plot.padding +
        innerHeight -
        ((loss - yDomain.min) / (yDomain.max - yDomain.min)) * innerHeight,
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
    const law = renderMathSvg(String.raw`L(C)=2+C^{-0.05}`, {
        fontSize: 21,
        color: c.textSecondary,
    })
    const points = compute.map((value, index) => ({ x: Math.log10(value), y: losses[index] }))
    const curve = Array.from({ length: 81 }, (_, index) => {
        const logCompute = index / 40
        return { x: logCompute, y: 2 + 10 ** (-0.05 * logCompute) }
    })
    const intervals = drops.map((drop, index) => ({
        x1: Math.log10(compute[index]) + 0.25,
        y1: losses[index],
        x2: Math.log10(compute[index]) + 0.25,
        y2: losses[index + 1],
        tone: 'warm' as const,
        strokeWidth: 4,
    }))

    return Scene({
        c,
        title: 'Equal log steps, smaller loss drops',
        subtitle: 'Power law L(C) = 2 + C⁻⁰·⁰⁵ · C is a normalized compute multiplier',
        padding: 0,
        gap: 10,
        contentWidth: board.width,
        children: [
            Board({
                c,
                width: board.width,
                height: board.height,
                background: c.bg,
                children: [
                    label('Power law', 8, 0, 138, c, {
                        fontSize: 21,
                        color: c.textSecondary,
                        fontWeight: 700,
                    }),
                    CanvasItem({
                        x: 148,
                        y: 0,
                        width: law.width,
                        height: law.height,
                        children: createElement('img', {
                            src: `data:image/svg+xml;utf8,${encodeURIComponent(law.svg)}`,
                            width: law.width,
                            height: law.height,
                            alt: 'L of C equals 2 plus C to the negative 0.05',
                        }),
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
                            paths: [{ points: curve, tone: 'blue', strokeWidth: 4 }],
                            vectors: intervals,
                            points: points.map((point) => ({
                                ...point,
                                tone: 'blue',
                                r: 7,
                                stroke: c.bgCard,
                                strokeWidth: 2,
                            })),
                        }),
                    }),
                    ...points.map((point, index) => {
                        const pos = project(point.x, point.y)
                        return label(losses[index].toFixed(3), pos.x - 34, pos.y - 31, 68, c, {
                            fontSize: 21,
                            color: getReadableToneColor('blue', c),
                            align: 'center',
                            mono: true,
                            fontWeight: 750,
                        })
                    }),
                    ...[0, 0.5, 1, 1.5, 2].map((tick, index) => {
                        const position = project(tick, yDomain.min)
                        const labels = ['1×', '3.16×', '10×', '31.6×', '100×']
                        return label(
                            labels[index],
                            position.x - 35,
                            plot.y + plot.padding + innerHeight + 4,
                            70,
                            c,
                            { fontSize: 21, color: c.textMuted, align: 'center', mono: true },
                        )
                    }),
                    ...[2.8, 2.9, 3.0].map((value) => {
                        const position = project(xDomain.min, value)
                        return label(value.toFixed(1), 0, position.y - 12, 44, c, {
                            fontSize: 21,
                            color: c.textMuted,
                            align: 'right',
                            mono: true,
                        })
                    }),
                    label('Compute multiplier C →', 153, 332, 270, c, {
                        fontSize: 21,
                        color: c.textSecondary,
                        align: 'center',
                        fontWeight: 700,
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
                        text: 'Absolute loss drop per ×3.16 compute step',
                        fontSize: 21,
                        fontWeight: 800,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Bar lengths share a 0.060 reference scale.',
                        fontSize: 21,
                        color: c.textMuted,
                        align: 'center',
                    }),
                    ProgressList({
                        c,
                        gap: 7,
                        labelWidth: 130,
                        valueWidth: 120,
                        barHeight: 14,
                        fontSize: 21,
                        rows: drops.map((drop, index) => ({
                            label: ['1 → 3.16×', '3.16 → 10×', '10 → 31.6×', '31.6 → 100×'][index],
                            value: drop / 0.06,
                            valueLabel: `ΔL ${drop.toFixed(3)}`,
                            tone: 'warm' as const,
                        })),
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
