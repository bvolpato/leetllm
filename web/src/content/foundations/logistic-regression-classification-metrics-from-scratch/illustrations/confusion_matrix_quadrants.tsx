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
    'Eight validation response scores occupy two lanes for their verified outcome. The probability axis marks a 0.20 verification threshold. Two grounded responses stay below the cut, two grounded responses cross it, and all four responses needing verification cross it.'
const boardWidth = 600
const boardHeight = 442
export const width = 632
export const height = 474
const labelScale = width / boardWidth

const cases = [
    { id: 'V1', p: 0.061, actual: 0 },
    { id: 'V2', p: 0.169, actual: 0 },
    { id: 'V6', p: 0.325, actual: 0 },
    { id: 'V4', p: 0.624, actual: 0 },
    { id: 'V8', p: 0.244, actual: 1 },
    { id: 'V3', p: 0.595, actual: 1 },
    { id: 'V5', p: 0.971, actual: 1 },
    { id: 'V7', p: 0.99, actual: 1 },
] as const
const labelOffsets = {
    V1: { dx: -8, dy: 12 },
    V2: { dx: -26, dy: -34 },
    V6: { dx: -22, dy: 12 },
    V4: { dx: -21, dy: -34 },
    V8: { dx: 8, dy: -34 },
    V3: { dx: -22, dy: 12 },
    V5: { dx: -88, dy: -37 },
    V7: { dx: -32, dy: 12 },
} satisfies Record<(typeof cases)[number]['id'], { dx: number; dy: number }>

const plot = { x: 144, y: 88, width: 424, height: 164 }
const scoreAxisMax = 1.04
const scoreX = (p: number) => plot.x + (p / scoreAxisMax) * plot.width
const lane = (item: (typeof cases)[number]) =>
    item.id === 'V5' ? 1.12 : item.id === 'V7' ? 0.88 : item.actual
const rowY = (actual: number) => plot.y + ((1.5 - actual) / 2) * plot.height

const text = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    value: string,
    fontSize = 22,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'center',
) =>
    CanvasItem({
        x,
        y,
        width: w,
        height: fontSize + 8,
        children: TextLabel({
            c,
            text: value,
            width: w,
            fontSize: fontSize * labelScale,
            color,
            mono: false,
            align,
        }),
    })

const illustration = defineIllustration((c) => {
    const pointColor = (item: (typeof cases)[number]) => {
        if (item.actual === 1) return c.positive
        return item.p >= 0.2 ? c.critical : c.info
    }
    const pointLabelColor = (item: (typeof cases)[number]) => {
        if (item.actual === 1) return getReadableToneColor('green', c)
        return getReadableToneColor(item.p >= 0.2 ? 'critical' : 'cyan', c)
    }

    const pointLabels = cases.map((item) => {
        const offsets = labelOffsets[item.id]
        return text(
            c,
            scoreX(item.p) + offsets.dx,
            rowY(lane(item)) + offsets.dy,
            58,
            item.id,
            22,
            pointLabelColor(item),
        )
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
                text(c, 14, 10, 572, 'A cut at 0.20 routes these cases', 25, c.textPrimary, 'left'),
                text(c, 12, 50, 128, 'REVIEW', 21, getReadableToneColor('green', c), 'left'),
                text(c, 12, 79, 128, 'REQUIRED', 21, getReadableToneColor('green', c), 'left'),
                text(c, 12, 182, 128, 'NO REVIEW', 21, c.textPrimary, 'left'),
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
                        xMax: scoreAxisMax,
                        yMin: -0.5,
                        yMax: 1.5,
                        padding: 0,
                        showFrame: false,
                        showAxes: false,
                        showGrid: true,
                        gridCount: 5,
                        paths: [
                            ...[0, 1].map((y) => ({
                                points: [
                                    { x: 0, y },
                                    { x: 1, y },
                                ],
                                color: c.borderLight,
                                strokeWidth: 2,
                            })),
                            {
                                points: [
                                    { x: 0.2, y: -0.45 },
                                    { x: 0.2, y: 1.45 },
                                ],
                                color: c.warning,
                                strokeWidth: 4,
                                dashed: true,
                            },
                        ],
                        points: cases.map((item) => ({
                            x: item.p,
                            y: lane(item),
                            r: 9,
                            fill: pointColor(item),
                            stroke: c.bgSubtle,
                            strokeWidth: 3,
                        })),
                    }),
                }),
                ...pointLabels,
                text(c, scoreX(0.2) - 40, 62, 84, 't=.20', 21, getReadableToneColor('warm', c)),
                ...[0, 0.2, 0.4, 0.6, 0.8, 1].map((value) =>
                    text(c, scoreX(value) - 25, 263, 50, value.toFixed(1), 21, c.textPrimary),
                ),
                text(c, 180, 292, 346, 'unsupported-claim score', 21, c.textPrimary),
                text(c, 22, 332, 120, 'TN  2', 21, getReadableToneColor('cyan', c), 'left'),
                text(c, 157, 332, 120, 'FP  2', 21, getReadableToneColor('critical', c), 'left'),
                text(c, 292, 332, 120, 'TP  4', 21, getReadableToneColor('green', c), 'left'),
                text(c, 426, 332, 158, 'FN  0', 21, c.textMuted, 'left'),
                text(c, 20, 365, 560, 'V1–V2 stay below the cut;', 21, c.textPrimary, 'left'),
                text(c, 20, 395, 560, 'V6 and V4 cross it.', 21, c.textPrimary, 'left'),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
