import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    MetricCard,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withDensity,
    type ThemeColors,
} from 'vizmatic'

export const width = 680
export const height = 760
export const alt =
    'Ridgeless ordinary least squares test risk against parameter ratio gamma = d/n. In the underparameterized regime below gamma = 1, variance grows as gamma/(1 - gamma) while bias squared is zero. At gamma = 1 interpolation risk diverges. Above gamma = 1, variance falls as 1/(gamma - 1) while squared bias rises as 1 - 1/gamma, producing a double-descent valley at gamma = 2 with variance 1.00, squared bias 0.50, and total risk 1.50.'

const plot = { x: 64, y: 92, width: 564, height: 294 }
const xMin = 0
const xMax = 3.6
const yMin = 0
const yMax = 5.5
const px = (gamma: number) => plot.x + ((gamma - xMin) / (xMax - xMin)) * plot.width
const py = (risk: number) => plot.y + plot.height - ((risk - yMin) / (yMax - yMin)) * plot.height

const sample = (start: number, end: number, step: number, fn: (g: number) => number) => {
    const pts: Array<{ x: number; y: number }> = []
    for (let g = start; g <= end + 1e-9; g += step) {
        pts.push({ x: g, y: Math.min(yMax, fn(g)) })
    }
    return pts
}

const underVar = (g: number) => g / (1 - g)
const overVar = (g: number) => 1 / (g - 1)
const overBias = (g: number) => 1 - 1 / g
const overRisk = (g: number) => overVar(g) + overBias(g)

const text = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    value: string,
    fontSize = 21,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'center',
) =>
    CanvasItem({
        x,
        y,
        width: w,
        height: fontSize + 8,
        children: TextLabel({ c, text: value, fontSize, color, align, width: w, mono: false }),
    })

const illustration = defineIllustration((baseC) => {
    const cd = withDensity(baseC, 2.2)
    const c = baseC
    const paths = [
        {
            points: [
                { x: 1, y: 0 },
                { x: 1, y: yMax },
            ],
            color: c.warningLight,
            strokeWidth: 3,
            dashed: true,
        },
        { points: sample(0.02, 0.84, 0.025, underVar), color: c.textPrimary, strokeWidth: 4 },
        { points: sample(1.19, 3.6, 0.04, overRisk), color: c.textPrimary, strokeWidth: 4 },
        {
            points: sample(0.02, 0.83, 0.025, underVar),
            color: c.criticalLight,
            strokeWidth: 3,
            dashed: true,
        },
        {
            points: sample(1.19, 3.6, 0.04, overVar),
            color: c.criticalLight,
            strokeWidth: 3,
            dashed: true,
        },
        {
            points: [
                { x: 0.02, y: 0.04 },
                { x: 1, y: 0.04 },
            ],
            color: c.infoLight,
            strokeWidth: 3,
            dashed: true,
        },
        {
            points: sample(1.0, 3.6, 0.04, overBias),
            color: c.infoLight,
            strokeWidth: 3,
            dashed: true,
        },
    ]
    const points = [
        { x: 2, y: 1.5, r: 7, fill: c.textPrimary, stroke: c.bgSubtle, strokeWidth: 2 },
        { x: 2, y: 1.0, r: 6, fill: c.criticalLight, stroke: c.bgSubtle, strokeWidth: 2 },
        { x: 2, y: 0.5, r: 6, fill: c.infoLight, stroke: c.bgSubtle, strokeWidth: 2 },
    ]

    return Scene({
        c: cd,
        padding: 14,
        gap: 10,
        contentWidth: 652,
        children: Column({
            gap: 10,
            children: [
                Board({
                    c,
                    width: 652,
                    height: 468,
                    children: [
                        text(
                            c,
                            16,
                            12,
                            620,
                            'Test risk peaks at d = n, then descends',
                            24,
                            c.textPrimary,
                            'left',
                        ),
                        text(c, 16, 48, 190, 'Solid: total risk', 21, c.textPrimary, 'left'),
                        text(
                            c,
                            200,
                            48,
                            185,
                            'Red: variance',
                            21,
                            getReadableToneColor('critical', c),
                            'left',
                        ),
                        text(
                            c,
                            395,
                            48,
                            150,
                            'Blue: bias²',
                            21,
                            getReadableToneColor('cyan', c),
                            'left',
                        ),
                        text(c, 548, 48, 92, 'd = n', 21, getReadableToneColor('warm', c), 'left'),
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
                                gridCount: 5,
                                paths,
                                points,
                            }),
                        }),
                        ...[0, 1, 2, 3].map((tick) =>
                            text(c, px(tick) - 24, 392, 48, String(tick), 21, c.textSecondary),
                        ),
                        ...[0, 1, 2, 3, 4, 5].map((tick) =>
                            text(
                                c,
                                16,
                                py(tick) - 14,
                                40,
                                String(tick),
                                21,
                                c.textSecondary,
                                'right',
                            ),
                        ),
                        text(
                            c,
                            plot.x,
                            424,
                            plot.width,
                            'Parameter ratio gamma = d / n',
                            21,
                            c.textSecondary,
                        ),
                        text(c, px(0.48) - 68, 102, 136, 'd < n', 21, c.textSecondary),
                        text(c, px(2.3) - 20, 102, 136, 'd > n', 21, c.textSecondary),
                        text(
                            c,
                            px(2.05),
                            py(1.68) - 40,
                            250,
                            'R = 1.50 at gamma = 2',
                            21,
                            c.textPrimary,
                            'left',
                        ),
                    ],
                }),
                Row({
                    gap: 8,
                    align: 'stretch',
                    children: [
                        MetricCard({
                            c: cd,
                            width: 212,
                            tone: 'red',
                            padding: 10,
                            valueFontSize: 28,
                            label: 'Variance at gamma = 2',
                            value: '1.00',
                            detail: '1 / (gamma - 1)',
                        }),
                        MetricCard({
                            c: cd,
                            width: 212,
                            tone: 'blue',
                            padding: 10,
                            valueFontSize: 28,
                            label: 'Bias² at gamma = 2',
                            value: '0.50',
                            detail: '1 - 1 / gamma',
                        }),
                        MetricCard({
                            c: cd,
                            width: 212,
                            tone: 'warm',
                            padding: 10,
                            valueFontSize: 28,
                            label: 'Risk at gamma = 2',
                            value: '1.50',
                            detail: 'Minimum-norm OLS',
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
