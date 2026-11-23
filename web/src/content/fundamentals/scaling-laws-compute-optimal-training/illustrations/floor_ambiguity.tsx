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
    'Two parametric power-law curves both pass exactly through the normalized observations L(1)=3 and L(100)=2.5. With alpha 0.1, the fitted floor is 1.645 and loss at 1,000,000 is 1.985; with alpha 0.2, the floor is 2.169 and the forecast is 2.222. The curves separate beyond the two shared anchors.'

export const width = 600
export const height = 680

const board = { width: 600, height: 480 }
const plot = { x: 0, y: 12, width: 410, height: 396, padding: 48 }
const xDomain = { min: -0.2, max: 6.35 }
const yDomain = { min: 1.5, max: 3.1 }
const innerWidth = plot.width - plot.padding * 2
const innerHeight = plot.height - plot.padding * 2

function fit(alpha: number) {
    const k = 0.5 / (1 - 100 ** -alpha)
    const floor = 3 - k
    return {
        alpha,
        k,
        floor,
        loss: (compute: number) => floor + k * compute ** -alpha,
    }
}

const families = [fit(0.1), fit(0.2)]

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
    const familyData = families.map((family, index) => {
        const tone = index === 0 ? ('purple' as const) : ('cyan' as const)
        const forecast = family.loss(1e6)
        const curve = Array.from({ length: 97 }, (_, point) => {
            const logCompute = (point * 6) / 96
            return { x: logCompute, y: family.loss(10 ** logCompute) }
        })
        return { ...family, tone, forecast, curve }
    })
    const sharedAnchors = [
        { x: 0, y: 3.0, tone: 'neutral' as const, r: 9, stroke: c.bgCard, strokeWidth: 3 },
        { x: 2, y: 2.5, tone: 'neutral' as const, r: 9, stroke: c.bgCard, strokeWidth: 3 },
    ]
    const forecastPoints = familyData.map((family) => ({
        x: 6,
        y: family.forecast,
        tone: family.tone,
        r: 10,
        stroke: c.bgCard,
        strokeWidth: 3,
    }))
    const leaderVectors = familyData.map((family) => ({
        x1: 6,
        y1: family.forecast,
        x2: 6.2,
        y2: family.forecast,
        tone: family.tone,
        strokeWidth: 3,
    }))

    return Scene({
        c,
        title: 'Two exact anchors leave the floor unknown',
        subtitle: 'Two power laws · L(C) = E + K C⁻ᵅ · both fit L(1) = 3 and L(100) = 2.5',
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
                    label('Loss', 4, 0, 43, c, {
                        fontSize: 21,
                        color: c.textSecondary,
                        fontWeight: 700,
                    }),
                    label('Compute C (log scale) →', 50, 0, 310, c, {
                        fontSize: 21,
                        color: c.textSecondary,
                        align: 'center',
                        fontWeight: 700,
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
                                ...familyData.map((family) => ({
                                    points: family.curve,
                                    tone: family.tone,
                                    strokeWidth: 4,
                                })),
                                ...familyData.map((family) => ({
                                    points: [
                                        { x: 0, y: family.floor },
                                        { x: 6.2, y: family.floor },
                                    ],
                                    tone: family.tone,
                                    strokeWidth: 2,
                                    dashed: true,
                                    opacity: 0.65,
                                })),
                            ],
                            vectors: leaderVectors,
                            points: [...sharedAnchors, ...forecastPoints],
                        }),
                    }),
                    ...[0, 2, 6].map((logCompute) => {
                        const point = project(logCompute, yDomain.min)
                        const text = logCompute === 0 ? '1' : logCompute === 2 ? '100' : '10⁶'
                        return label(
                            text,
                            point.x - 34,
                            plot.y + plot.padding + innerHeight + 5,
                            68,
                            c,
                            { fontSize: 21, color: c.textMuted, align: 'center', mono: true },
                        )
                    }),
                    ...[1.5, 2.0, 2.5, 3.0].map((loss) => {
                        const point = project(xDomain.min, loss)
                        return label(loss.toFixed(1), 2, point.y - 13, 42, c, {
                            fontSize: 21,
                            color: c.textMuted,
                            align: 'right',
                            mono: true,
                        })
                    }),
                    label('A · 3.000', 54, 86, 118, c, {
                        fontSize: 21,
                        color: c.textPrimary,
                        fontWeight: 750,
                    }),
                    label('B · 2.500', 128, 196, 118, c, {
                        fontSize: 21,
                        color: c.textPrimary,
                        fontWeight: 750,
                    }),
                    ...familyData.flatMap((family, index) => {
                        const color = getReadableToneColor(family.tone, c)
                        const top = index === 0 ? 102 : 222
                        return [
                            label(`α = ${family.alpha.toFixed(1)}`, 426, top, 160, c, {
                                fontSize: 23,
                                color,
                                fontWeight: 850,
                            }),
                            label(`E = ${family.floor.toFixed(3)}`, 426, top + 31, 174, c, {
                                fontSize: 21,
                                color: c.textSecondary,
                                fontWeight: 700,
                            }),
                            label(`L(10⁶) = ${family.forecast.toFixed(3)}`, 426, top + 59, 174, c, {
                                fontSize: 21,
                                color,
                                fontWeight: 800,
                            }),
                        ]
                    }),
                    label('Two shared anchors', 27, 444, 370, c, {
                        fontSize: 21,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
            TextLabel({
                c,
                text: 'The fitted floor and long-range forecast depend on the chosen exponent.',
                fontSize: 21,
                color: c.textMuted,
                align: 'center',
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
