import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    DataTable,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Curve of positive probability 1 divided by (1 + exp(-0.70 / tau)) plotted over temperature tau from 0.02 to 1.20 on a full 0 to 1 vertical axis. Exact reference values are 0.999999 at tau=0.05, 0.999089 at tau=0.10, 0.802184 at tau=0.50, and 0.668188 at tau=1.00.'

export const width = 640
export const height = 740

const positiveProb = (tau: number) => 1 / (1 + Math.exp(-0.7 / tau))
const curve = Array.from({ length: 60 }, (_, idx) => {
    const tau = (idx + 1) / 50
    return { x: tau, y: positiveProb(tau) }
})
const markers = [0.05, 0.1, 0.5, 1.0]
const yTicks = [
    { y: 1.0, label: '1.0' },
    { y: 0.5, label: '0.5' },
    { y: 0.0, label: '0.0' },
]
const xTicks = [
    { x: 0.0, label: '0.0' },
    { x: 0.3, label: '0.3' },
    { x: 0.6, label: '0.6' },
    { x: 0.9, label: '0.9' },
    { x: 1.2, label: '1.2' },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = getReadableToneColor('purple', c)

    const boardW = 608
    const boardH = 296
    const plotX = 68
    const plotY = 12
    const plotW = 500
    const plotH = 240
    const pad = 20
    const xMin = 0
    const xMax = 1.2
    const yMin = 0
    const yMax = 1.0
    const innerW = plotW - pad * 2
    const innerH = plotH - pad * 2
    const sx = (x: number) => plotX + pad + ((x - xMin) / (xMax - xMin)) * innerW
    const sy = (y: number) => plotY + pad + innerH - ((y - yMin) / (yMax - yMin)) * innerH

    const gridH = [0, 0.5, 1.0].map((y) => ({
        points: [
            { x: 0, y },
            { x: 1.2, y },
        ],
        tone: 'neutral' as const,
        strokeWidth: y === 0 ? 2 : 1,
        opacity: y === 0 ? 0.65 : 0.3,
    }))
    const gridV = [0, 0.3, 0.6, 0.9, 1.2].map((x) => ({
        points: [
            { x, y: 0 },
            { x, y: 1.0 },
        ],
        tone: 'neutral' as const,
        strokeWidth: x === 0 ? 2 : 1,
        opacity: x === 0 ? 0.65 : 0.3,
    }))

    return Scene({
        c,
        title: 'Lower temperature sharpens softmax probability toward 1',
        subtitle: 'Positive probability P(pos) for a fixed similarity margin Δs = 0.70',
        padding: 16,
        gap: 10,
        contentWidth: 608,
        align: 'center',
        children: Column({
            width: 608,
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'P(positive) = 1 / (1 + exp(−0.70 / τ))',
                    width: 600,
                    fontSize: 22,
                    fontWeight: 850,
                    align: 'center',
                    color: purple,
                    math: true,
                }),
                Board({
                    c,
                    width: boardW,
                    height: boardH,
                    children: [
                        ...yTicks.map(({ y, label }) =>
                            CanvasItem({
                                x: 0,
                                y: sy(y) - 12,
                                width: plotX - 10,
                                height: 24,
                                children: TextLabel({
                                    c,
                                    text: label,
                                    width: plotX - 10,
                                    fontSize: 19,
                                    fontWeight: 700,
                                    align: 'right',
                                    color: c.textSecondary,
                                    mono: true,
                                }),
                            }),
                        ),
                        CanvasItem({
                            x: plotX,
                            y: plotY,
                            width: plotW,
                            height: plotH,
                            children: AxisPlot({
                                c,
                                width: plotW,
                                height: plotH,
                                padding: pad,
                                xMin,
                                xMax,
                                yMin,
                                yMax,
                                showFrame: false,
                                showGrid: false,
                                paths: [
                                    ...gridH,
                                    ...gridV,
                                    { points: curve, tone: 'purple', strokeWidth: 4 },
                                ],
                                points: markers.map((tau, idx) => ({
                                    x: tau,
                                    y: positiveProb(tau),
                                    tone: idx < 2 ? 'warm' : 'blue',
                                    r: 7,
                                    stroke: c.bg,
                                    strokeWidth: 2,
                                })),
                            }),
                        }),
                        CanvasItem({
                            x: 0,
                            y: plotY + plotH - pad / 2 + 6,
                            width: 44,
                            height: 26,
                            children: TextLabel({
                                c,
                                text: 'τ =',
                                width: 44,
                                fontSize: 19,
                                fontWeight: 700,
                                align: 'right',
                                color: c.textSecondary,
                                mono: true,
                            }),
                        }),
                        ...xTicks.map(({ x, label }) =>
                            CanvasItem({
                                x: sx(x) - 28,
                                y: plotY + plotH - pad / 2 + 6,
                                width: 56,
                                height: 26,
                                children: TextLabel({
                                    c,
                                    text: label,
                                    width: 56,
                                    fontSize: 19,
                                    fontWeight: 700,
                                    align: 'center',
                                    color: c.textSecondary,
                                    mono: true,
                                }),
                            }),
                        ),
                    ],
                }),
                DataTable({
                    c,
                    rows: [
                        ['temperature τ', 'P(positive) for Δs = 0.70'],
                        ['0.05', '0.999999'],
                        ['0.10', '0.999089'],
                        ['0.50', '0.802184'],
                        ['1.00', '0.668188'],
                    ],
                    firstColWidth: 230,
                    cellWidth: 290,
                    cellHeight: 40,
                    gap: 5,
                    fontSize: 19,
                    headerRows: 1,
                    math: true,
                }),
                TextLabel({
                    c,
                    text: 'Sampled from τ = 0.02 to 1.20; gradient magnitude P_j / τ depends on every row logit.',
                    width: 600,
                    fontSize: 19,
                    fontWeight: 650,
                    align: 'center',
                    color: c.textSecondary,
                }),
            ],
        }),
    })
}

export default create()
