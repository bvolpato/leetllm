import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 660
export const height = 560
export const alt =
    'Scatter comparison of held-out validation perplexity against downstream task accuracy across three checkpoints: a memorized checkpoint scores low perplexity 6.4 with only 38 percent task accuracy, a base pretrained checkpoint scores perplexity 8.9 with 52 percent accuracy, and a post-trained instruction-tuned checkpoint reaches 84 percent accuracy despite slightly higher perplexity 9.8.'

const yTicks = [
    { y: 90, label: '90%' },
    { y: 60, label: '60%' },
    { y: 30, label: '30%' },
]

const xTicks = [
    { x: 5, label: 'PPL 5' },
    { x: 8, label: 'PPL 8' },
    { x: 11, label: 'PPL 11' },
]

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const boardW = 636
    const boardH = 304
    const plotX = 80
    const plotY = 14
    const plotW = 500
    const plotH = 248
    const pad = 20
    const xMin = 5
    const xMax = 11
    const yMin = 30
    const yMax = 90
    const innerW = plotW - pad * 2
    const innerH = plotH - pad * 2
    const sx = (x: number) => plotX + pad + ((x - xMin) / (xMax - xMin)) * innerW
    const sy = (y: number) => plotY + pad + innerH - ((y - yMin) / (yMax - yMin)) * innerH

    const gridH = yTicks.map(({ y }) => ({
        points: [
            { x: xMin, y },
            { x: xMax, y },
        ],
        tone: 'neutral' as const,
        strokeWidth: y === yMin ? 2 : 1,
        opacity: y === yMin ? 0.65 : 0.32,
    }))
    const gridV = xTicks.map(({ x }) => ({
        points: [
            { x, y: yMin },
            { x, y: yMax },
        ],
        tone: 'neutral' as const,
        strokeWidth: x === xMin ? 2 : 1,
        opacity: x === xMin ? 0.65 : 0.32,
    }))

    return Scene({
        c,
        title: 'Lower perplexity does not guarantee higher task accuracy',
        contentWidth: 636,
        padding: 12,
        gap: 10,
        children: [
            Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Lower perplexity does not guarantee task accuracy',
                        fontSize: 22,
                        fontWeight: 700,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Downstream task pass rate (%) vs held-out validation PPL',
                        fontSize: 20,
                        color: c.textMuted,
                        align: 'center',
                    }),
                ],
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
                            width: plotX - 8,
                            height: 24,
                            children: TextLabel({
                                c,
                                text: label,
                                width: plotX - 8,
                                fontSize: 19,
                                mono: true,
                                align: 'right',
                                color: c.textMuted,
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
                            showGrid: false,
                            showAxes: false,
                            paths: [
                                ...gridH,
                                ...gridV,
                                {
                                    points: [
                                        { x: 6.4, y: 38 },
                                        { x: 8.9, y: 52 },
                                        { x: 9.8, y: 84 },
                                    ],
                                    tone: 'neutral',
                                    dashed: true,
                                    strokeWidth: 2,
                                    opacity: 0.45,
                                },
                            ],
                            points: [
                                { x: 6.4, y: 38, tone: 'warm', r: 9 },
                                { x: 8.9, y: 52, tone: 'blue', r: 9 },
                                { x: 9.8, y: 84, tone: 'green', r: 10 },
                            ],
                            ariaLabel:
                                'Scatter plot of memorized checkpoint (PPL 6.4, 38% accuracy), base checkpoint (PPL 8.9, 52% accuracy), and aligned checkpoint (PPL 9.8, 84% accuracy)',
                        }),
                    }),
                    ...xTicks.map(({ x, label }) =>
                        CanvasItem({
                            x: sx(x) - 48,
                            y: plotY + plotH - pad / 2 + 6,
                            width: 96,
                            height: 26,
                            children: TextLabel({
                                c,
                                text: label,
                                width: 96,
                                fontSize: 19,
                                mono: true,
                                align: 'center',
                                color: c.textMuted,
                            }),
                        }),
                    ),
                ],
            }),
            Column({
                gap: 4,
                align: 'center',
                children: [
                    Row({
                        gap: 16,
                        justify: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Orange: overfit/leaked (6.4, 38%)',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getReadableToneColor('warm', c),
                            }),
                            TextLabel({
                                c,
                                text: 'Blue: base (8.9, 52%)',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getReadableToneColor('blue', c),
                            }),
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Green: instruction-tuned (9.8 alignment tax, 84% task acc)',
                        fontSize: 19,
                        fontWeight: 700,
                        color: getReadableToneColor('green', c),
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
