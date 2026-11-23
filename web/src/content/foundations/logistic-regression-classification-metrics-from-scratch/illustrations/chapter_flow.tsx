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
    'A fitted logistic model places eight assistant responses on an ambiguity and retrieval-support map. Parallel probability contours at 0.20, 0.50, and 0.80 show how the decision boundary moves with the threshold; R3 is missed at 0.50 and R7 is sent to verification.'
const boardWidth = 600
const boardHeight = 512
export const width = 632
export const height = 544
const labelScale = width / boardWidth

const weights = { intercept: -4.894, ambiguity: 3.399, support: -0.959 }
const cases = [
    { id: 'R1', x: 1.0, y: 1, label: 0, p: 0.079 },
    { id: 'R2', x: 1.5, y: 2, label: 0, p: 0.153 },
    { id: 'R3', x: 2.0, y: 3, label: 1, p: 0.274 },
    { id: 'R4', x: 3.5, y: 6, label: 1, p: 0.777 },
    { id: 'R5', x: 4.0, y: 7, label: 1, p: 0.88 },
    { id: 'R6', x: 4.5, y: 5, label: 1, p: 0.996 },
    { id: 'R7', x: 2.8, y: 4, label: 0, p: 0.687 },
    { id: 'R8', x: 3.2, y: 8, label: 0, p: 0.156 },
]
const xMin = 0.5
const xMax = 5
const yMin = 0
const yMax = 9
const plot = { x: 66, y: 84, width: 500, height: 280 }
const px = (x: number) => plot.x + ((x - xMin) / (xMax - xMin)) * plot.width
const py = (y: number) => plot.y + plot.height - ((y - yMin) / (yMax - yMin)) * plot.height
const logit = (p: number) => Math.log(p / (1 - p))
const contour = (threshold: number) => {
    const crossingX = (support: number) =>
        (logit(threshold) - weights.intercept - weights.support * support) / weights.ambiguity
    return [
        { x: crossingX(yMin), y: yMin },
        { x: crossingX(yMax), y: yMax },
    ]
}

const text = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    value: string,
    size = 19,
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
    const paths = [
        { points: contour(0.2), color: c.infoLight, strokeWidth: 3, dashed: true },
        { points: contour(0.5), color: c.textPrimary, strokeWidth: 4 },
        { points: contour(0.8), color: c.criticalLight, strokeWidth: 3, dashed: true },
    ]
    const points = cases.map((item) => ({
        x: item.x,
        y: item.y,
        r: item.id === 'R3' || item.id === 'R7' ? 10 : 7,
        fill: item.label === 1 ? c.positiveLight : c.infoLight,
        stroke: item.id === 'R3' || item.id === 'R7' ? c.warningLight : c.bgSubtle,
        strokeWidth: item.id === 'R3' || item.id === 'R7' ? 3 : 2,
    }))

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
                text(c, 18, 12, 564, 'One fitted line, three cutoffs', 24, c.textPrimary, 'left'),
                text(c, 66, 51, 148, 'support x₂', 21, c.textSecondary, 'left'),
                CanvasItem({
                    x: plot.x,
                    y: plot.y,
                    width: plot.width,
                    height: plot.height,
                    children: AxisPlot({
                        c,
                        width: plot.width,
                        height: plot.height,
                        xMin,
                        xMax,
                        yMin,
                        yMax,
                        padding: 0,
                        showFrame: true,
                        showAxes: false,
                        showGrid: true,
                        gridCount: 4,
                        paths,
                        points,
                    }),
                }),
                ...[1, 3, 5].map((tick) =>
                    text(c, px(tick) - 22, 368, 44, String(tick), 21, c.textSecondary),
                ),
                ...[0, 3, 6, 9].map((tick) =>
                    text(c, 18, py(tick) - 12, 40, String(tick), 21, c.textSecondary, 'right'),
                ),
                text(c, 220, 392, 250, 'ambiguity  x₁', 21, c.textSecondary),
                ...cases
                    .filter((item) => item.id === 'R3' || item.id === 'R7')
                    .map((item) => {
                        const labelX = px(item.x) + (item.id === 'R7' ? 8 : 8)
                        const labelY = py(item.y) + (item.id === 'R7' ? -30 : 8)
                        return text(
                            c,
                            labelX,
                            labelY,
                            52,
                            item.id,
                            21,
                            getReadableToneColor('warm', c),
                        )
                    }),
                text(c, 224, 51, 166, 'green: y = 1', 21, getReadableToneColor('green', c), 'left'),
                text(c, 398, 51, 160, 'blue: y = 0', 21, getReadableToneColor('cyan', c), 'left'),
                text(c, 33, 423, 155, 't = 0.20', 21, getReadableToneColor('cyan', c)),
                text(c, 210, 423, 155, 't = 0.50', 21, c.textPrimary),
                text(c, 387, 423, 155, 't = 0.80', 21, getReadableToneColor('critical', c)),
                text(
                    c,
                    18,
                    458,
                    564,
                    'R3 .274 is missed; R7 .687 is verified.',
                    21,
                    getReadableToneColor('warm', c),
                    'left',
                ),
                text(
                    c,
                    18,
                    486,
                    564,
                    'Contours move; fitted weights stay fixed.',
                    21,
                    c.textMuted,
                    'left',
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
