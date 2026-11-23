import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
} from 'vizmatic'

export const alt =
    'Four calibration-bin points compare mean predicted probability with observed review frequency against the perfect-calibration diagonal. Their bin sizes weight absolute gaps of 0.175, 0.325, 0.110, and 0.020 into ECE contributions 0.066, 0.041, 0.027, and 0.005, totaling 0.139.'
const boardWidth = 600
const boardHeight = 584
export const width = 632
export const height = 616
const labelScale = width / boardWidth

const bins = [
    {
        id: 'B1',
        n: 3,
        score: (0.061 + 0.169 + 0.244) / 3,
        observed: 1 / 3,
        contribution: (1 - 0.061 - 0.169 - 0.244) / 8,
        color: 'infoLight' as const,
    },
    {
        id: 'B2',
        n: 1,
        score: 0.325,
        observed: 0,
        contribution: 0.325 / 8,
        color: 'warningLight' as const,
    },
    {
        id: 'B3',
        n: 2,
        score: (0.595 + 0.624) / 2,
        observed: 0.5,
        contribution: (0.595 + 0.624 - 1) / 8,
        color: 'primaryLight' as const,
    },
    {
        id: 'B4',
        n: 2,
        score: (0.971 + 0.99) / 2,
        observed: 1,
        contribution: (2 - 0.971 - 0.99) / 8,
        color: 'positiveLight' as const,
    },
]
const ece = bins.reduce((sum, bin) => sum + bin.contribution, 0)
const plot = { x: 76, y: 83, width: 430, height: 236 }
const px = (value: number) => plot.x + (value / 1.05) * plot.width
const py = (value: number) => plot.y + ((1.05 - value) / 1.1) * plot.height

const text = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    value: string,
    size = 18,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'center',
) =>
    CanvasItem({
        x,
        y,
        width: w,
        height: size + 8,
        children: TextLabel({
            c,
            text: value,
            width: w,
            fontSize: size * labelScale,
            color,
            mono: false,
            align,
        }),
    })

const illustration = defineIllustration((c) => {
    const labelOffsets = [
        { x: -26, y: -31 },
        { x: 7, y: -28 },
        { x: 5, y: -28 },
        { x: 10, y: 5 },
    ]
    const contributionRows = bins.flatMap((bin, index) => {
        const y = 421 + index * 31
        const labelColor = getReadableToneColor(
            bin.color === 'infoLight'
                ? 'cyan'
                : bin.color === 'warningLight'
                  ? 'warm'
                  : bin.color === 'primaryLight'
                    ? 'blue'
                    : 'green',
            c,
        )
        return [
            text(c, 20, y - 2, 122, `${bin.id}  n=${bin.n}`, 21, labelColor, 'left'),
            text(c, 490, y - 2, 88, bin.contribution.toFixed(3), 21, labelColor, 'right'),
        ]
    })
    const contributionPlot = CanvasItem({
        x: 152,
        y: 421,
        width: 326,
        height: 120,
        children: AxisPlot({
            c,
            width: 326,
            height: 120,
            xMin: 0,
            xMax: 0.07,
            yMin: 0,
            yMax: 4,
            padding: 0,
            showFrame: false,
            showAxes: false,
            showGrid: false,
            paths: [0, 0.035, 0.07].map((tick) => ({
                points: [
                    { x: tick, y: 0 },
                    { x: tick, y: 4 },
                ],
                color: c.borderSubtle,
                strokeWidth: 1,
            })),
            vectors: bins.map((bin, index) => ({
                x1: 0,
                y1: 3.5 - index,
                x2: bin.contribution,
                y2: 3.5 - index,
                color: c[bin.color],
                strokeWidth: 18,
            })),
        }),
    })

    return Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: boardWidth,
        children: Board({
            c,
            width: boardWidth,
            height: boardHeight,
            children: [
                text(
                    c,
                    18,
                    12,
                    564,
                    'Do scores match observed frequencies?',
                    23,
                    c.textPrimary,
                    'left',
                ),
                text(c, 76, 53, 450, 'observed positive fraction', 21, c.textSecondary, 'left'),
                CanvasItem({
                    x: plot.x,
                    y: plot.y,
                    width: plot.width,
                    height: plot.height,
                    children: AxisPlot({
                        c,
                        width: plot.width,
                        height: plot.height,
                        xMin: 0,
                        xMax: 1.05,
                        yMin: -0.05,
                        yMax: 1.05,
                        padding: 0,
                        showFrame: true,
                        showAxes: false,
                        showGrid: true,
                        gridCount: 4,
                        paths: [
                            {
                                points: [
                                    { x: 0, y: 0 },
                                    { x: 1, y: 1 },
                                ],
                                color: c.textMuted,
                                strokeWidth: 3,
                                dashed: true,
                            },
                        ],
                        vectors: bins.map((bin) => ({
                            x1: bin.score,
                            y1: bin.score,
                            x2: bin.score,
                            y2: bin.observed,
                            color: c[bin.color],
                            strokeWidth: 3,
                        })),
                        points: bins.map((bin) => ({
                            x: bin.score,
                            y: bin.observed,
                            r: bin.n === 3 ? 11 : 8,
                            fill: c[bin.color],
                            stroke: c.bgSubtle,
                            strokeWidth: 2,
                        })),
                    }),
                }),
                ...bins.map((bin, index) => {
                    const offset = labelOffsets[index]
                    const tone =
                        bin.color === 'infoLight'
                            ? 'cyan'
                            : bin.color === 'warningLight'
                              ? 'warm'
                              : bin.color === 'primaryLight'
                                ? 'blue'
                                : 'green'
                    return text(
                        c,
                        px(bin.score) + offset.x,
                        py(bin.observed) + offset.y,
                        66,
                        bin.id,
                        21,
                        getReadableToneColor(tone, c),
                    )
                }),
                ...[0, 0.5, 1].map((tick) =>
                    text(c, px(tick) - 20, 323, 40, tick.toFixed(1), 18, c.textSecondary),
                ),
                ...[0, 0.5, 1].map((tick) =>
                    text(c, 20, py(tick) - 11, 45, tick.toFixed(1), 18, c.textSecondary, 'right'),
                ),
                text(c, 126, 354, 406, 'mean predicted probability', 21, c.textSecondary),
                text(
                    c,
                    18,
                    389,
                    564,
                    'Weighted ECE pieces (bin share of 8)',
                    21,
                    c.textPrimary,
                    'left',
                ),
                contributionPlot,
                ...contributionRows,
                text(
                    c,
                    18,
                    544,
                    564,
                    `0.066 + 0.041 + 0.027 + 0.005 = ${ece.toFixed(3)}`,
                    21,
                    getReadableToneColor('green', c),
                    'left',
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
