import {
    AxisPlot,
    Board,
    CanvasItem,
    Matrix,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getReadableTextColor,
    type ThemeColors,
} from 'vizmatic'

export const alt =
    'The precision-recall curve marks thresholds 0.80, 0.50, and 0.20 beside the same eight validation responses ordered by score. As the verification queue widens, V4 enters just before V3 and lowers precision; the three queue rows show the true and false positives at each cut.'
const boardWidth = 600
const boardHeight = 472
export const width = 632
export const height = 504
const labelScale = width / boardWidth

const curve = [
    { x: 0, y: 1 },
    { x: 0.25, y: 1 },
    { x: 0.5, y: 1 },
    { x: 0.5, y: 2 / 3 },
    { x: 0.75, y: 0.75 },
    { x: 0.75, y: 0.6 },
    { x: 1, y: 2 / 3 },
    { x: 1, y: 4 / 7 },
    { x: 1, y: 0.5 },
]
const thresholds = [
    { t: 0.8, recall: 0.5, precision: 1, selected: 2, tp: 2, fp: 0 },
    { t: 0.5, recall: 0.75, precision: 0.75, selected: 4, tp: 3, fp: 1 },
    { t: 0.2, recall: 1, precision: 2 / 3, selected: 6, tp: 4, fp: 2 },
]
const ranked = [
    { id: 'V7', positive: true },
    { id: 'V5', positive: true },
    { id: 'V4', positive: false },
    { id: 'V3', positive: true },
    { id: 'V6', positive: false },
    { id: 'V8', positive: true },
    { id: 'V2', positive: false },
    { id: 'V1', positive: false },
]

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
    const plot = { x: 42, y: 103, width: 238, height: 245 }
    const px = (value: number) => plot.x + 8 + value * (plot.width - 16)
    const py = (value: number) => plot.y + 8 + (1 - value) * (plot.height - 16)
    const queueRows = thresholds.flatMap((threshold, rowIndex) => {
        const top = 101 + rowIndex * 96
        const startX = 344
        const cellW = 30
        const values = ranked.map((candidate, index) => {
            const isSelected = index < threshold.selected
            const isTp = isSelected && candidate.positive
            const isFp = isSelected && !candidate.positive
            return isTp ? 0.85 : isFp ? 0.5 : 0.1
        })
        const labels = ranked.map((candidate, index) => {
            const isSelected = index < threshold.selected
            const isTp = isSelected && candidate.positive
            const isFp = isSelected && !candidate.positive
            const background = isTp ? c.positiveDark : isFp ? c.infoDark : c.bgHover
            return TextLabel({
                c,
                text: candidate.id,
                fontSize: 21 * labelScale,
                color: getReadableTextColor(background, c),
                mono: false,
                align: 'center',
            })
        })
        return [
            text(c, 287, top + 5, 54, threshold.t.toFixed(2), 21, c.textPrimary, 'left'),
            CanvasItem({
                x: startX,
                y: top,
                width: 240,
                height: 31,
                children: Matrix({
                    c,
                    data: [values],
                    labels: [labels],
                    cellWidth: cellW,
                    cellHeight: 30,
                    colorScale: 'strength',
                }),
            }),
            text(
                c,
                344,
                top + 35,
                240,
                `${threshold.tp} TP  ${threshold.fp} FP`,
                21,
                c.textSecondary,
                'left',
            ),
            text(
                c,
                344,
                top + 59,
                240,
                `P ${threshold.precision.toFixed(2)}  R ${threshold.recall.toFixed(2)}`,
                21,
                c.textPrimary,
                'left',
            ),
        ]
    })
    const pointColors = [c.infoLight, c.warningLight, c.positiveLight]

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
                    'Lower the cutoff to catch more positives',
                    23,
                    c.textPrimary,
                    'left',
                ),
                text(c, 24, 55, 284, 'precision', 21, c.textSecondary, 'left'),
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
                        padding: 8,
                        showFrame: true,
                        showAxes: false,
                        showGrid: true,
                        gridCount: 4,
                        paths: [{ points: curve, color: c.infoLight, strokeWidth: 4 }],
                        points: thresholds.map((item, index) => ({
                            x: item.recall,
                            y: item.precision,
                            r: 8,
                            fill: pointColors[index],
                            stroke: c.bgSubtle,
                            strokeWidth: 2,
                        })),
                    }),
                }),
                ...[0, 0.5, 1].map((tick) =>
                    text(c, 0, py(tick) - 11, 34, tick.toFixed(1), 17, c.textSecondary, 'right'),
                ),
                ...[0, 0.5, 1].map((tick) =>
                    text(c, px(tick) - 22, 353, 44, tick.toFixed(1), 21, c.textSecondary),
                ),
                text(c, 124, 377, 154, 'recall', 21, c.textSecondary),
                text(c, 327, 55, 260, 'Queue: high p first', 21, c.textSecondary, 'left'),
                ...queueRows,
                text(
                    c,
                    18,
                    440,
                    564,
                    'V4 enters before V3: precision dips.',
                    21,
                    getReadableToneColor('warm', c),
                    'left',
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
