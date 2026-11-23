import {
    AxisPlot,
    Board,
    CanvasItem,
    Grid,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getReadableTextColor,
    type ThemeColors,
} from 'vizmatic'

export const alt =
    'The ROC staircase marks validation thresholds 0.80, 0.50, and 0.20. A four-by-four grid compares each positive score with each negative score: 13 of 16 pairwise comparisons rank the positive higher, for AUC 0.8125.'
const boardWidth = 600
const boardHeight = 530
export const width = 632
export const height = 562
const labelScale = width / boardWidth

const roc = [
    { x: 0, y: 0 },
    { x: 0, y: 0.25 },
    { x: 0, y: 0.5 },
    { x: 0.25, y: 0.5 },
    { x: 0.25, y: 0.75 },
    { x: 0.5, y: 0.75 },
    { x: 0.5, y: 1 },
    { x: 0.75, y: 1 },
    { x: 1, y: 1 },
]
const checkpoints = [
    { t: 0.8, fpr: 0, tpr: 0.5, color: 'infoLight' as const },
    { t: 0.5, fpr: 0.25, tpr: 0.75, color: 'warningLight' as const },
    { t: 0.2, fpr: 0.5, tpr: 1, color: 'positiveLight' as const },
]
const positives = [0.244, 0.595, 0.971, 0.99]
const negatives = [0.061, 0.169, 0.325, 0.624]

const text = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    value: string,
    size = 18,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'center',
    mono = false,
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
            mono,
            align,
        }),
    })

const illustration = defineIllustration((c) => {
    const plot = { x: 58, y: 111, width: 232, height: 246 }
    const plotPadding = 9
    const px = (value: number) => plot.x + plotPadding + value * (plot.width - 2 * plotPadding)
    const py = (value: number) =>
        plot.y + plotPadding + (1 - value) * (plot.height - 2 * plotPadding)
    const comparisonLabels = positives.map((positive) =>
        negatives.map((negative) => {
            const win = positive > negative
            const background = win ? c.positiveDark : c.infoDark
            return TextLabel({
                c,
                text: win ? '✓' : '×',
                fontSize: 23 * labelScale,
                color: getReadableTextColor(background, c),
                align: 'center',
            })
        }),
    )

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
                    'Ranking quality comes from every pair',
                    24,
                    c.textPrimary,
                    'left',
                ),
                text(
                    c,
                    24,
                    57,
                    284,
                    'ROC: lower the score cut',
                    21,
                    c.textSecondary,
                    'left',
                    false,
                ),
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
                        xMax: 1,
                        yMin: 0,
                        yMax: 1,
                        padding: plotPadding,
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
                                strokeWidth: 2,
                                dashed: true,
                            },
                            { points: roc, color: c.infoLight, strokeWidth: 5 },
                        ],
                        points: checkpoints.map((point) => ({
                            x: point.fpr,
                            y: point.tpr,
                            r: 8,
                            fill: c[point.color],
                            stroke: c.bgSubtle,
                            strokeWidth: 2,
                        })),
                    }),
                }),
                ...[0, 0.5, 1].map((tick) =>
                    text(
                        c,
                        tick === 0 ? px(tick) - 2 : tick === 1 ? px(tick) - 48 : px(tick) - 24,
                        361,
                        48,
                        tick.toFixed(1),
                        21,
                        c.textSecondary,
                        tick === 0 ? 'left' : tick === 1 ? 'right' : 'center',
                    ),
                ),
                ...[0, 0.5, 1].map((tick) =>
                    text(c, 0, py(tick) - 11, 50, tick.toFixed(1), 21, c.textSecondary, 'right'),
                ),
                text(c, 126, 384, 100, 'FPR', 21, c.textSecondary),
                text(c, 50, 85, 90, 'TPR ↑', 21, c.textSecondary, 'left'),
                text(c, 357, 57, 226, 'Compare score pairs', 21, c.textSecondary, 'left', false),
                text(
                    c,
                    335,
                    84,
                    250,
                    'positive score  ↓',
                    21,
                    getReadableToneColor('green', c),
                    'left',
                ),
                CanvasItem({
                    x: 300,
                    y: 130,
                    width: 296,
                    height: 216,
                    children: Grid({
                        c,
                        rows: [
                            [
                                {
                                    label: '',
                                    backgroundColor: c.bgSubtle,
                                    borderColor: 'transparent',
                                },
                                ...negatives.map((value) => ({
                                    label: value.toFixed(2),
                                    color: getReadableToneColor('cyan', c),
                                    backgroundColor: c.bgSubtle,
                                    borderColor: 'transparent',
                                })),
                            ],
                            ...positives.map((positive, row) => [
                                {
                                    label: positive.toFixed(2),
                                    color: getReadableToneColor('green', c),
                                    backgroundColor: c.bgSubtle,
                                    borderColor: 'transparent',
                                },
                                ...negatives.map((negative, col) => ({
                                    label: comparisonLabels[row][col],
                                    backgroundColor:
                                        positive > negative ? c.positiveDark : c.infoDark,
                                    borderColor: 'transparent',
                                })),
                            ]),
                        ],
                        cellWidth: 56,
                        cellHeight: 40,
                        gap: 4,
                        fontSize: 21 * labelScale,
                        headerRows: 1,
                        headerCols: 1,
                    }),
                }),
                text(
                    c,
                    335,
                    352,
                    250,
                    'negative score  →',
                    21,
                    getReadableToneColor('cyan', c),
                    'left',
                ),
                text(c, 18, 418, 564, 'Green = positive wins;', 21, c.textSecondary, 'left'),
                text(c, 18, 448, 564, 'blue = negative wins.', 21, c.textSecondary, 'left'),
                text(
                    c,
                    18,
                    482,
                    564,
                    '13 / 16 wins  →  AUC = 0.8125',
                    23,
                    getReadableToneColor('green', c),
                    'left',
                ),
                text(c, 335, 385, 250, 't: .80 / .50 / .20', 21, c.textMuted, 'left'),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
