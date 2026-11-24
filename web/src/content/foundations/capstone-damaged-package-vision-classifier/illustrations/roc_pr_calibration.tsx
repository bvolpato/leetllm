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
import data from '../assets/figure_data.json'

export const width = 640
export const height = 780
export const autoSize = false
export const alt =
    'Measured curves on 108 test frames: CNN average precision 0.893 versus Sobel 0.668. Reliability points compare mean predicted probability with observed damage fraction; Platt scaling reduces five-bin ECE from 0.316 to 0.057.'

const text = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    value: string,
    size = 20,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
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
            fontSize: size,
            color,
            align,
        }),
    })
const plot = { x: 65, width: 525 }
const px = (x: number) => plot.x + ((x + 0.025) / 1.05) * plot.width
const label = (value: number) => String(value)

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const red = getReadableToneColor('red', c)
    const green = getReadableToneColor('green', c)
    const ticks = [0, 0.25, 0.5, 0.75, 1]
    const grid = ticks.flatMap((v) => [
        {
            points: [
                { x: v, y: 0 },
                { x: v, y: 1 },
            ],
            color: c.borderSubtle,
            strokeWidth: 1,
        },
        {
            points: [
                { x: 0, y: v },
                { x: 1, y: v },
            ],
            color: c.borderSubtle,
            strokeWidth: 1,
        },
    ])
    const axes = (top: number, h: number, xLabel: string) => [
        ...ticks.flatMap((v) => [
            text(c, px(v) - 25, top + h + 5, 50, label(v), 19, c.textSecondary, 'center'),
            text(
                c,
                6,
                top + ((1.025 - v) / 1.05) * h - 12,
                44,
                label(v),
                19,
                c.textSecondary,
                'right',
            ),
        ]),
        text(c, plot.x, top + h + 34, plot.width, xLabel, 21, c.textSecondary, 'center'),
    ]
    return Scene({
        c,
        padding: 12,
        gap: 0,
        contentWidth: 616,
        children: Board({
            c,
            width: 616,
            height: 756,
            children: [
                text(c, 12, 0, 590, 'Ranking: precision at each recall', 25),
                text(c, 65, 38, 255, `CNN AP ${data.models.raw.ap.toFixed(3)}`, 22, blue),
                text(c, 330, 38, 270, `Sobel AP ${data.models.sobel.ap.toFixed(3)}`, 22, warm),
                text(c, 65, 70, 530, 'precision  ·  108 test frames', 20, c.textSecondary),
                CanvasItem({
                    x: plot.x,
                    y: 104,
                    width: plot.width,
                    height: 225,
                    children: AxisPlot({
                        c,
                        width: plot.width,
                        height: 225,
                        padding: 0,
                        xMin: -0.025,
                        xMax: 1.025,
                        yMin: -0.025,
                        yMax: 1.025,
                        showGrid: false,
                        showFrame: false,
                        showAxes: false,
                        paths: [
                            ...grid,
                            {
                                points: data.models.sobel.pr,
                                color: warm,
                                strokeWidth: 2.5,
                                interpolation: 'step-after',
                            },
                            {
                                points: data.models.raw.pr,
                                color: blue,
                                strokeWidth: 2.5,
                                interpolation: 'step-after',
                            },
                        ],
                    }),
                }),
                ...axes(104, 225, 'recall'),
                text(c, 12, 400, 590, 'Calibration: do probabilities match?', 25),
                text(c, 65, 438, 255, `Raw ECE ${data.models.raw.ece.toFixed(3)}`, 22, red),
                text(c, 330, 438, 270, `Platt ECE ${data.models.platt.ece.toFixed(3)}`, 22, green),
                text(c, 65, 470, 530, 'observed damage fraction', 20, c.textSecondary),
                CanvasItem({
                    x: plot.x,
                    y: 504,
                    width: plot.width,
                    height: 180,
                    children: AxisPlot({
                        c,
                        width: plot.width,
                        height: 180,
                        padding: 0,
                        xMin: -0.025,
                        xMax: 1.025,
                        yMin: -0.025,
                        yMax: 1.025,
                        showGrid: false,
                        showFrame: false,
                        showAxes: false,
                        paths: [
                            ...grid,
                            {
                                points: [
                                    { x: 0, y: 0 },
                                    { x: 1, y: 1 },
                                ],
                                color: c.textSecondary,
                                dashed: true,
                                strokeWidth: 1.5,
                            },
                            {
                                points: data.models.raw.reliability,
                                color: red,
                                strokeWidth: 2.5,
                            },
                            {
                                points: data.models.platt.reliability,
                                color: green,
                                strokeWidth: 2.5,
                            },
                        ],
                        points: [
                            ...data.models.raw.reliability.map((p) => ({
                                ...p,
                                fill: red,
                                r: 4,
                            })),
                            ...data.models.platt.reliability.map((p) => ({
                                ...p,
                                fill: green,
                                r: 4,
                            })),
                        ],
                    }),
                }),
                ...axes(504, 180, 'mean predicted probability in each bin'),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
