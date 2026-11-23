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
export const height = 540
export const alt =
    'Total lifetime compute FLOPs equal 6ND for training plus 2NQ for serving Q tokens. A 7B model trained on 140B tokens starts lower at 5.88 zettaFLOPs than a 3B model overtrained on 400B tokens at 7.20 zettaFLOPs, but crosses over at 165B served tokens (8.19 zettaFLOPs) and costs 12.88 vs 10.20 zettaFLOPs at 500B served tokens.'

const curve7B = [
    { x: 0, y: 5.88 },
    { x: 165, y: 8.19 },
    { x: 500, y: 12.88 },
]

const curve3B = [
    { x: 0, y: 7.2 },
    { x: 165, y: 8.19 },
    { x: 500, y: 10.2 },
]

const yTicks = [
    { y: 14, label: '14 ZF' },
    { y: 9, label: '9 ZF' },
    { y: 4, label: '4 ZF' },
]

const xTicks = [
    { x: 0, label: '0B', highlight: false },
    { x: 165, label: '165B', highlight: true },
    { x: 250, label: '250B', highlight: false },
    { x: 500, label: '500B', highlight: false },
]

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const boardW = 636
    const boardH = 304
    const plotX = 86
    const plotY = 14
    const plotW = 504
    const plotH = 248
    const pad = 18
    const xMin = 0
    const xMax = 500
    const yMin = 4
    const yMax = 14
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
    const gridV = [0, 250, 500].map((x) => ({
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
        title: 'Lifetime FLOPs: 6ND training plus 2NQ serving',
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
                        text: 'Lifetime FLOPs: 6ND training plus 2NQ serving',
                        fontSize: 22,
                        fontWeight: 700,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Total compute in zettaFLOPs (10^21) across served tokens Q',
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
                            width: plotX - 6,
                            height: 24,
                            children: TextLabel({
                                c,
                                text: label,
                                width: plotX - 6,
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
                                        { x: 165, y: 4 },
                                        { x: 165, y: 8.19 },
                                    ],
                                    tone: 'green',
                                    dashed: true,
                                    strokeWidth: 2,
                                },
                                { points: curve7B, tone: 'warm', strokeWidth: 4 },
                                { points: curve3B, tone: 'purple', strokeWidth: 4 },
                            ],
                            points: [
                                { x: 0, y: 5.88, tone: 'warm', r: 7 },
                                { x: 0, y: 7.2, tone: 'purple', r: 7 },
                                { x: 165, y: 8.19, tone: 'green', r: 8 },
                                { x: 500, y: 12.88, tone: 'warm', r: 7 },
                                { x: 500, y: 10.2, tone: 'purple', r: 7 },
                            ],
                            ariaLabel:
                                '7B model starts cheaper at 5.88 zettaFLOPs while overtrained 3B model starts at 7.20 zettaFLOPs and overtakes it at 165B served tokens',
                        }),
                    }),
                    ...xTicks.map(({ x, label, highlight }) =>
                        CanvasItem({
                            x: sx(x) - 34,
                            y: plotY + plotH - pad / 2 + 6,
                            width: 68,
                            height: 26,
                            children: TextLabel({
                                c,
                                text: label,
                                width: 68,
                                fontSize: 19,
                                mono: true,
                                fontWeight: highlight ? 700 : 400,
                                align: 'center',
                                color: highlight ? getReadableToneColor('green', c) : c.textMuted,
                            }),
                        }),
                    ),
                ],
            }),
            Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Orange: 7B / 140B train (5.88 ZF at 0B to 12.88 ZF at 500B)',
                        fontSize: 19,
                        fontWeight: 700,
                        color: getReadableToneColor('warm', c),
                    }),
                    Row({
                        gap: 10,
                        justify: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Purple: 3B / 400B train (10.20 ZF)',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getReadableToneColor('purple', c),
                            }),
                            TextLabel({
                                c,
                                text: 'Green: 165B crossover',
                                fontSize: 19,
                                fontWeight: 700,
                                color: getReadableToneColor('green', c),
                            }),
                        ],
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
