import {
    Board,
    CanvasItem,
    Matrix,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableTextColor,
    type ThemeColors,
} from 'vizmatic'

export const alt =
    'Eight training rows contribute signed gradients (p minus y) times each feature. Their column means are zero, minus 0.344, and minus 0.375; subtracting a 0.2 learning-rate step gives first weights 0, 0.069, and 0.075.'
const boardWidth = 600
const boardHeight = 640
export const width = 632
export const height = 672
const labelScale = width / boardWidth

const rows = [
    { id: 'R1', x: [1, 1.0, 1], y: 0 },
    { id: 'R2', x: [1, 1.5, 2], y: 0 },
    { id: 'R3', x: [1, 2.0, 3], y: 1 },
    { id: 'R4', x: [1, 3.5, 6], y: 1 },
    { id: 'R5', x: [1, 4.0, 7], y: 1 },
    { id: 'R6', x: [1, 4.5, 5], y: 1 },
    { id: 'R7', x: [1, 2.8, 4], y: 0 },
    { id: 'R8', x: [1, 3.2, 8], y: 0 },
]
const contributions = rows.map((row) => {
    const error = 0.5 - row.y
    return [error, ...row.x.map((feature) => error * feature)]
})
const means = [0, 1, 2].map(
    (column) => contributions.reduce((sum, row) => sum + row[column + 1], 0) / rows.length,
)
const updated = means.map((gradient) => -0.2 * gradient)
const format = (value: number) =>
    Math.abs(value) < 0.0005 ? '0' : `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`

const text = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    value: string,
    size = 19,
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
    const cellWidth = 108
    const cellHeight = 27
    const cellX = [84, 194, 304, 414]
    const heads = ['p − y', '× 1', '× x₁', '× x₂']
    const headLabels = heads.map((head, index) =>
        text(c, cellX[index], 80, cellWidth, head, 21, c.textSecondary),
    )
    const matrixValues = contributions.map((row) =>
        row.map((value) => (value < 0 ? 0.5 : value > 0 ? 0.85 : 0.1)),
    )
    const matrixLabels = contributions.map((row) =>
        row.map((value) => {
            const background = value < 0 ? c.infoDark : value > 0 ? c.positiveDark : c.bgHover
            return TextLabel({
                c,
                text: format(value),
                fontSize: 22 * labelScale,
                color: getReadableTextColor(background, c),
                mono: false,
                align: 'center',
            })
        }),
    )
    const rowLabels = rows.map((row, rowIndex) =>
        text(c, 27, 111 + rowIndex * (cellHeight + 2) + 2, 48, row.id, 21, c.textSecondary, 'left'),
    )
    const gradientText = `g = [${means[0].toFixed(0)}, −${Math.abs(means[1]).toFixed(3)}, −${Math.abs(means[2]).toFixed(3)}]`
    const weightText = `w⁺ = [${updated[0].toFixed(0)}, ${updated[1].toFixed(3)}, ${updated[2].toFixed(3)}]`

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
                text(c, 18, 12, 564, 'Each row pushes each weight', 24, c.textPrimary, 'left'),
                text(
                    c,
                    18,
                    43,
                    564,
                    'At p = .5, row gradient = (p − y) × feature',
                    21,
                    c.textSecondary,
                    'left',
                    false,
                ),
                ...headLabels,
                ...rowLabels,
                CanvasItem({
                    x: cellX[0],
                    y: 111,
                    width: cellWidth * 4 + 6,
                    height: cellHeight * 8 + 14,
                    children: Matrix({
                        c,
                        data: matrixValues,
                        labels: matrixLabels,
                        cellWidth,
                        cellHeight,
                        colorScale: 'strength',
                    }),
                }),
                text(c, 18, 353, 564, 'BATCH-MEAN GRADIENT', 21, c.textSecondary, 'left'),
                text(c, 18, 384, 564, gradientText, 21, c.textPrimary, 'left'),
                text(c, 18, 420, 564, 'w⁺ = w − 0.2g', 21, c.textPrimary, 'left'),
                text(c, 18, 454, 564, `first step  ${weightText}`, 21, c.textPrimary, 'left'),
                text(c, 18, 493, 564, 'For g < 0, subtracting g', 21, c.textMuted, 'left'),
                text(c, 18, 522, 564, 'raises its weight.', 21, c.textMuted, 'left'),
                text(c, 18, 558, 564, 'For g > 0, subtracting g', 21, c.textMuted, 'left'),
                text(c, 18, 587, 564, 'lowers its weight.', 21, c.textMuted, 'left'),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
