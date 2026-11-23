import { createElement } from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'Log-log map of eight small-scale runs, a distinct held-out point at 1B parameters and 100B tokens, and a forecast marker at 70B parameters and 1.4T tokens. The fit region covers only 0.1B–1B parameters and 1B–20B tokens. The fitted law predicts 2.408 at holdout versus 2.408 observed, residual +0.0002, and forecasts 2.091 at the target.'

export const width = 600
export const height = 710

const board = { width: 600, height: 520 }
const plot = { x: 60, y: 10, size: 450, padding: 54 }
const logDomain = { minParameters: -1.5, maxParameters: 2.2, minTokens: -0.3, maxTokens: 3.4 }
const inner = plot.size - plot.padding * 2

const experiments = [
    { parametersB: 0.1, tokensB: 1, loss: 2.895 },
    { parametersB: 0.1, tokensB: 5, loss: 2.745 },
    { parametersB: 0.1, tokensB: 20, loss: 2.634 },
    { parametersB: 0.5, tokensB: 1, loss: 2.813 },
    { parametersB: 0.5, tokensB: 5, loss: 2.663 },
    { parametersB: 0.5, tokensB: 20, loss: 2.552 },
    { parametersB: 1, tokensB: 5, loss: 2.631 },
    { parametersB: 1, tokensB: 20, loss: 2.52 },
]
const heldOut = {
    parametersB: 1,
    tokensB: 100,
    prediction: 2.408,
    observed: 2.408,
    residual: 0.0002,
}
const target = { parametersB: 70, tokensB: 1400, forecast: 2.091 }

const project = (parametersB: number, tokensB: number) => {
    const logParameters = Math.log10(parametersB)
    const logTokens = Math.log10(tokensB)
    return {
        x:
            plot.x +
            plot.padding +
            ((logParameters - logDomain.minParameters) /
                (logDomain.maxParameters - logDomain.minParameters)) *
                inner,
        y:
            plot.y +
            plot.padding +
            inner -
            ((logTokens - logDomain.minTokens) / (logDomain.maxTokens - logDomain.minTokens)) *
                inner,
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

const illustration = defineIllustration((colors) => {
    const c = { ...colors, preset: 'engineering' as const, shadow: 'transparent' }
    const fitRegion = [
        { x: Math.log10(0.1), y: Math.log10(1) },
        { x: Math.log10(1), y: Math.log10(1) },
        { x: Math.log10(1), y: Math.log10(20) },
        { x: Math.log10(0.1), y: Math.log10(20) },
        { x: Math.log10(0.1), y: Math.log10(1) },
    ]
    const fitPoints = experiments.map((run) => ({
        x: Math.log10(run.parametersB),
        y: Math.log10(run.tokensB),
        tone: 'blue' as const,
        r: 8,
        stroke: c.bgCard,
        strokeWidth: 2,
    }))
    const holdPoint = {
        x: Math.log10(heldOut.parametersB),
        y: Math.log10(heldOut.tokensB),
        tone: 'green' as const,
        r: 11,
        stroke: c.bgCard,
        strokeWidth: 3,
    }
    const targetPoint = {
        x: Math.log10(target.parametersB),
        y: Math.log10(target.tokensB),
        tone: 'warm' as const,
        r: 12,
        stroke: c.bgCard,
        strokeWidth: 3,
    }

    return Scene({
        c,
        title: 'A small-scale fit reaches beyond its grid',
        subtitle: 'Fitted surface · training grid, held-out check, and target forecast',
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
                    label('Tokens D ↑', plot.x, 0, 120, c, {
                        fontSize: 21,
                        color: c.textSecondary,
                        fontWeight: 700,
                    }),
                    label('Extrapolated loss surface', 192, 0, 398, c, {
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
                            xMin: logDomain.minParameters,
                            xMax: logDomain.maxParameters,
                            yMin: logDomain.minTokens,
                            yMax: logDomain.maxTokens,
                            showFrame: false,
                            showGrid: true,
                            gridCount: 3,
                            paths: [
                                {
                                    points: fitRegion,
                                    tone: 'neutral',
                                    dashed: true,
                                    strokeWidth: 3,
                                    opacity: 0.9,
                                },
                            ],
                            points: [...fitPoints, holdPoint, targetPoint],
                        }),
                    }),
                    ...[-1, 0, 1, 2].map((logN) => {
                        const point = project(10 ** logN, 1)
                        const text = logN === -1 ? '0.1B' : `${10 ** logN}B`
                        return label(text, point.x - 36, plot.y + plot.padding + inner + 5, 72, c, {
                            fontSize: 21,
                            color: c.textMuted,
                            align: 'center',
                            mono: true,
                        })
                    }),
                    ...[0, 1, 2, 3].map((logD) => {
                        const point = project(0.1, 10 ** logD)
                        const text = logD === 3 ? '1T' : `${10 ** logD}B`
                        return label(text, 0, point.y - 13, 53, c, {
                            fontSize: 21,
                            color: c.textMuted,
                            align: 'right',
                            mono: true,
                        })
                    }),
                    label(
                        'Parameters N (billions) →',
                        plot.x + 67,
                        plot.y + plot.size + 6,
                        320,
                        c,
                        { fontSize: 21, color: c.textSecondary, align: 'center', fontWeight: 700 },
                    ),
                    label('FIT · 8 fit points', 159, 204, 178, c, {
                        fontSize: 21,
                        color: getReadableToneColor('blue', c),
                        fontWeight: 850,
                    }),
                    label('Holdout · 1B / 100B', 280, 177, 225, c, {
                        fontSize: 21,
                        color: getReadableToneColor('green', c),
                        fontWeight: 850,
                    }),
                    label('Target · 70B / 1.4T', 281, 43, 215, c, {
                        fontSize: 21,
                        color: getReadableToneColor('warm', c),
                        fontWeight: 850,
                    }),
                ],
            }),
            Column({
                width: '100%',
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: `Held out: ${heldOut.prediction.toFixed(3)} predicted · ${heldOut.observed.toFixed(3)} observed · residual +${heldOut.residual.toFixed(4)}`,
                        fontSize: 21,
                        color: getReadableToneColor('green', c),
                        align: 'center',
                        fontWeight: 800,
                    }),
                    TextLabel({
                        c,
                        text: `70B / 1.4T extrapolated forecast: ${target.forecast.toFixed(3)}`,
                        fontSize: 21,
                        color: getReadableToneColor('warm', c),
                        align: 'center',
                        fontWeight: 800,
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
