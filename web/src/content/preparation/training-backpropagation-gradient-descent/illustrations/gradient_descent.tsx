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
    'The loss curve L(ŷ)=½(ŷ−6)² has slope −4 at prediction 2. With η=0.1, the update moves the prediction from (2,8) to (4,2), toward the minimum at (6,0). The matching parameter-space view moves (w,b) from (1,0) to (1.8,0.4) toward the zero-loss line 2w+b=6.'

export const width = 600
export const height = 796

function label(
    c: ThemeColors,
    x: number,
    y: number,
    boxWidth: number,
    text: string,
    fontSize = 19,
    color = c.textSecondary,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: boxWidth,
        height: fontSize + 8,
        children: TextLabel({ c, text, width: boxWidth, fontSize, color, align, mono }),
    })
}

const lossCurve = Array.from({ length: 49 }, (_, index) => {
    const prediction = index / 6
    return { x: prediction, y: 0.5 * (prediction - 6) ** 2 }
})

const illustration = defineIllustration((theme) => {
    const c = { ...theme, shadow: 'transparent' }
    const plotX = 24
    const plotW = 552
    const topPlotY = 128
    const topPlotH = 224
    const botPlotY = 472
    const botPlotH = 224
    const pad = 34

    const px = (v: number) => plotX + pad + (v / 8) * (plotW - 2 * pad)
    const py = (v: number) => topPlotY + pad + (1 - v / 16) * (topPlotH - 2 * pad)
    const rx = (v: number) => plotX + pad + ((v - 0.5) / 2.7) * (plotW - 2 * pad)
    const ry = (v: number) => botPlotY + pad + (1 - (v + 0.5) / 3) * (botPlotH - 2 * pad)

    const lossGrid = [
        ...[0, 4, 8, 12, 16].map((v) => ({
            points: [
                { x: 0, y: v },
                { x: 8, y: v },
            ],
            color: c.borderSubtle,
            strokeWidth: v === 0 ? 2 : 1,
        })),
        ...[0, 2, 4, 6, 8].map((v) => ({
            points: [
                { x: v, y: 0 },
                { x: v, y: 16 },
            ],
            color: c.borderSubtle,
            strokeWidth: v === 0 ? 2 : 1,
        })),
        {
            points: [
                { x: 0.5, y: 14 },
                { x: 4, y: 0 },
            ],
            tone: 'warm' as const,
            strokeWidth: 2.5,
            dashed: true,
        },
        { points: lossCurve, tone: 'purple' as const, strokeWidth: 4 },
    ]

    const paramGrid = [
        ...[-0.5, 0.5, 1.5, 2.5].map((v) => ({
            points: [
                { x: 0.5, y: v },
                { x: 3.2, y: v },
            ],
            color: c.borderSubtle,
            strokeWidth: v === 0.5 ? 2 : 1,
        })),
        ...[0.5, 1.4, 2.3, 3.2].map((v) => ({
            points: [
                { x: v, y: -0.5 },
                { x: v, y: 2.5 },
            ],
            color: c.borderSubtle,
            strokeWidth: v === 0.5 ? 2 : 1,
        })),
        {
            points: [
                { x: 1.75, y: 2.5 },
                { x: 3.2, y: -0.4 },
            ],
            tone: 'purple' as const,
            strokeWidth: 3,
            dashed: true,
        },
    ]

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
                label(c, 24, 12, 552, 'One SGD step, viewed in two spaces', 26, c.textPrimary),
                label(c, 24, 46, 552, 'One change moves prediction and parameters.', 19),
                label(c, 24, 80, 552, 'Prediction space · L(ŷ) = ½(ŷ − 6)²', 21, c.textPrimary),
                label(c, 24, 104, 552, 'loss L (ms²) ↓', 18),
                CanvasItem({
                    x: plotX,
                    y: topPlotY,
                    width: plotW,
                    height: topPlotH,
                    children: AxisPlot({
                        c,
                        width: plotW,
                        height: topPlotH,
                        xMin: 0,
                        xMax: 8,
                        yMin: 0,
                        yMax: 16,
                        padding: pad,
                        showAxes: false,
                        showGrid: false,
                        paths: lossGrid,
                        vectors: [
                            {
                                x1: 2,
                                y1: 8,
                                x2: 4,
                                y2: 2,
                                tone: 'green',
                                strokeWidth: 5,
                                arrow: true,
                                arrowSize: 8,
                            },
                        ],
                        points: [
                            { x: 2, y: 8, tone: 'warm', r: 8, stroke: c.bgCard, strokeWidth: 3 },
                            { x: 4, y: 2, tone: 'green', r: 8, stroke: c.bgCard, strokeWidth: 3 },
                            { x: 6, y: 0, tone: 'purple', r: 7, stroke: c.bgCard, strokeWidth: 3 },
                        ],
                    }),
                }),
                ...[0, 2, 4, 6, 8].map((v) =>
                    label(
                        c,
                        px(v) - 18,
                        topPlotY + topPlotH - 2,
                        36,
                        String(v),
                        18,
                        c.textSecondary,
                        'center',
                        true,
                    ),
                ),
                label(c, 160, 378, 280, 'prediction ŷ (ms) →', 18, c.textSecondary, 'center'),
                label(
                    c,
                    px(2.35),
                    py(11.4),
                    156,
                    'before (2,8)',
                    19,
                    getReadableToneColor('warm', c),
                    'left',
                    true,
                ),
                label(
                    c,
                    px(4.2),
                    py(5.8),
                    148,
                    'after (4,2)',
                    19,
                    getReadableToneColor('green', c),
                    'left',
                    true,
                ),
                label(
                    c,
                    px(5.15),
                    py(3.6),
                    130,
                    'min (6,0)',
                    19,
                    getReadableToneColor('purple', c),
                    'center',
                    true,
                ),
                label(
                    c,
                    px(0.3),
                    py(3.8),
                    116,
                    'slope −4',
                    19,
                    getReadableToneColor('warm', c),
                    'left',
                    true,
                ),
                label(
                    c,
                    24,
                    420,
                    552,
                    'Parameter space · zero-loss line: 2w + b = 6',
                    21,
                    c.textPrimary,
                ),
                label(c, 24, 446, 552, 'bias b (ms) ↑', 18),
                CanvasItem({
                    x: plotX,
                    y: botPlotY,
                    width: plotW,
                    height: botPlotH,
                    children: AxisPlot({
                        c,
                        width: plotW,
                        height: botPlotH,
                        xMin: 0.5,
                        xMax: 3.2,
                        yMin: -0.5,
                        yMax: 2.5,
                        padding: pad,
                        showAxes: false,
                        showGrid: false,
                        paths: paramGrid,
                        vectors: [
                            {
                                x1: 1,
                                y1: 0,
                                x2: 1.8,
                                y2: 0.4,
                                tone: 'green',
                                strokeWidth: 5,
                                arrow: true,
                                arrowSize: 8,
                            },
                        ],
                        points: [
                            { x: 1, y: 0, tone: 'warm', r: 8, stroke: c.bgCard, strokeWidth: 3 },
                            {
                                x: 1.8,
                                y: 0.4,
                                tone: 'green',
                                r: 8,
                                stroke: c.bgCard,
                                strokeWidth: 3,
                            },
                        ],
                    }),
                }),
                ...[0.5, 1.4, 2.3, 3.2].map((v) =>
                    label(
                        c,
                        rx(v) - 18,
                        botPlotY + botPlotH - 2,
                        36,
                        v.toFixed(1),
                        18,
                        c.textSecondary,
                        'center',
                        true,
                    ),
                ),
                label(c, 160, 722, 280, 'weight w (ms / score) →', 18, c.textSecondary, 'center'),
                label(
                    c,
                    rx(0.65),
                    ry(0.95),
                    144,
                    'start (1,0)',
                    19,
                    getReadableToneColor('warm', c),
                    'left',
                    true,
                ),
                label(
                    c,
                    rx(1.45),
                    ry(-0.2),
                    180,
                    'step (1.8,0.4)',
                    19,
                    getReadableToneColor('green', c),
                    'left',
                    true,
                ),
                label(
                    c,
                    rx(2.42),
                    ry(2.05),
                    124,
                    'zero loss',
                    19,
                    getReadableToneColor('purple', c),
                    'left',
                    true,
                ),
                label(
                    c,
                    24,
                    756,
                    552,
                    'η = 0.1:  (1,0) − 0.1(−8,−4) = (1.8,0.4)',
                    19,
                    c.textPrimary,
                    'center',
                    true,
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
