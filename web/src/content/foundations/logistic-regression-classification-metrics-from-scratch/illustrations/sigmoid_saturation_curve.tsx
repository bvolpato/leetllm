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
    'The sigmoid curve maps scores from minus six to six into probabilities from zero to one. Its derivative peaks at 0.25 at score zero. Equal two-point score changes move probability by 0.462 near the center and 0.016 in the positive tail.'
const boardWidth = 600
const boardHeight = 548
export const width = 632
export const height = 580
const labelScale = width / boardWidth

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
const slope = (z: number) => sigmoid(z) * (1 - sigmoid(z))
const samples = Array.from({ length: 49 }, (_, index) => -6 + index * 0.25)

const label = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    value: string,
    fontSize = 22,
    color = c.textPrimary,
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
            align: 'center',
        }),
    })

const illustration = defineIllustration((c) =>
    Scene({
        c,
        padding: 16,
        gap: 0,
        contentWidth: boardWidth,
        children: Board({
            c,
            width: boardWidth,
            height: boardHeight,
            children: [
                label(c, 20, 12, 560, 'Scores become probabilities', 24),
                label(c, 34, 49, 250, 'probability  σ(z)', 21, c.textPrimary),
                CanvasItem({
                    x: 58,
                    y: 78,
                    width: 504,
                    height: 174,
                    children: AxisPlot({
                        c,
                        width: 504,
                        height: 174,
                        xMin: -6,
                        xMax: 6,
                        yMin: -0.02,
                        yMax: 1.02,
                        padding: 0,
                        showFrame: true,
                        showAxes: false,
                        showGrid: true,
                        gridCount: 4,
                        paths: [
                            {
                                points: [
                                    { x: -6, y: 0.5 },
                                    { x: 6, y: 0.5 },
                                ],
                                color: c.borderLight,
                                strokeWidth: 2,
                                dashed: true,
                            },
                            {
                                points: [
                                    { x: 0, y: 0 },
                                    { x: 0, y: 1 },
                                ],
                                color: c.borderLight,
                                strokeWidth: 2,
                                dashed: true,
                            },
                            {
                                points: samples.map((z) => ({ x: z, y: sigmoid(z) })),
                                color: c.accent,
                                strokeWidth: 5,
                            },
                        ],
                        points: [
                            {
                                x: -1,
                                y: sigmoid(-1),
                                r: 7,
                                fill: c.info,
                                stroke: c.bgCard,
                                strokeWidth: 2,
                            },
                            {
                                x: 0,
                                y: 0.5,
                                r: 8,
                                fill: c.positive,
                                stroke: c.bgCard,
                                strokeWidth: 2,
                            },
                            {
                                x: 1,
                                y: sigmoid(1),
                                r: 7,
                                fill: c.info,
                                stroke: c.bgCard,
                                strokeWidth: 2,
                            },
                        ],
                    }),
                }),
                label(c, 0, 68, 46, '1', 21),
                label(c, 0, 151, 46, '0.5', 21),
                label(c, 0, 235, 46, '0', 21),
                label(c, 36, 254, 48, '−6', 21),
                label(c, 286, 254, 48, '0', 21, getReadableToneColor('green', c)),
                label(c, 538, 254, 48, '+6', 21),
                label(c, 34, 285, 260, 'slope  σ′(z)', 21, c.textPrimary),
                CanvasItem({
                    x: 58,
                    y: 314,
                    width: 504,
                    height: 82,
                    children: AxisPlot({
                        c,
                        width: 504,
                        height: 82,
                        xMin: -6,
                        xMax: 6,
                        yMin: 0,
                        yMax: 0.28,
                        padding: 0,
                        showFrame: true,
                        showAxes: false,
                        showGrid: true,
                        gridCount: 2,
                        paths: [
                            {
                                points: [
                                    { x: 0, y: 0 },
                                    { x: 0, y: 0.25 },
                                ],
                                color: c.borderLight,
                                strokeWidth: 2,
                                dashed: true,
                            },
                            {
                                points: samples.map((z) => ({ x: z, y: slope(z) })),
                                color: c.positive,
                                strokeWidth: 5,
                            },
                        ],
                        points: [
                            {
                                x: 0,
                                y: 0.25,
                                r: 7,
                                fill: c.positive,
                                stroke: c.bgCard,
                                strokeWidth: 2,
                            },
                        ],
                    }),
                }),
                label(c, 34, 402, 260, 'peak 0.25 at z = 0', 21, getReadableToneColor('green', c)),
                label(c, 22, 439, 270, '−1 → 1   Δp = 0.462', 21, getReadableToneColor('green', c)),
                label(c, 308, 439, 270, '4 → 6   Δp = 0.016', 21, getReadableToneColor('warm', c)),
                label(c, 20, 476, 560, 'Same score step,', 21),
                label(c, 20, 506, 560, 'different probability change.', 21),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
