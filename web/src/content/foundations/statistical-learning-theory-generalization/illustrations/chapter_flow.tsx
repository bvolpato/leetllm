import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withDensity,
    type ThemeColors,
} from 'vizmatic'

export const width = 680
export const height = 500
export const alt =
    'Three finite-sample Hoeffding upper error intervals for 40 evaluation queries with 4 errors (10% empirical error) at confidence 95%. For one prespecified candidate the upper endpoint is 31.5%, for ten candidates it is 37.4%, and for 1,000 searched candidates it reaches 46.4%. Every interval extends beyond the 20% target limit.'

const plot = { x: 136, y: 112, width: 452, height: 242 }
const xMin = 0
const xMax = 55
const yMin = 0.4
const yMax = 3.1
const px = (val: number) => plot.x + ((val - xMin) / (xMax - xMin)) * plot.width
const py = (row: number) => plot.y + plot.height - ((row - yMin) / (yMax - yMin)) * plot.height

const rows = [
    { label: 'M = 1', y: 2.55, upper: 31.5, colorKey: 'cyan' as const },
    { label: 'M = 10', y: 1.75, upper: 37.4, colorKey: 'green' as const },
    { label: 'M = 1,000', y: 0.95, upper: 46.4, colorKey: 'warm' as const },
]

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
        children: TextLabel({ c, text: value, fontSize, color, align, width: w, mono: false }),
    })

const illustration = defineIllustration((baseC) => {
    const cd = withDensity(baseC, 2.2)
    const c = baseC
    const palette = {
        cyan: c.infoLight,
        green: c.positiveLight,
        warm: c.warningLight,
    }
    const paths = [
        {
            points: [
                { x: 20, y: yMin },
                { x: 20, y: yMax },
            ],
            color: c.warningLight,
            strokeWidth: 3,
            dashed: true,
        },
        ...rows.flatMap((row) => [
            {
                points: [
                    { x: 10, y: row.y },
                    { x: row.upper, y: row.y },
                ],
                color: palette[row.colorKey],
                strokeWidth: 7,
            },
            {
                points: [
                    { x: row.upper, y: row.y - 0.14 },
                    { x: row.upper, y: row.y + 0.14 },
                ],
                color: palette[row.colorKey],
                strokeWidth: 4,
            },
        ]),
    ]
    const points = rows.flatMap((row) => [
        { x: 10, y: row.y, r: 8, fill: palette[row.colorKey], stroke: c.bgSubtle, strokeWidth: 2 },
        { x: row.upper, y: row.y, r: 5, fill: palette[row.colorKey] },
    ])

    return Scene({
        c: cd,
        padding: 16,
        gap: 0,
        contentWidth: 648,
        children: Board({
            c,
            width: 648,
            height: 468,
            children: [
                text(
                    c,
                    16,
                    12,
                    616,
                    'Upper error endpoints for n = 40 (95% confidence)',
                    24,
                    c.textPrimary,
                    'left',
                ),
                text(
                    c,
                    16,
                    44,
                    616,
                    'Observed error is 10%; dashed line marks the 20% target.',
                    21,
                    c.textSecondary,
                    'left',
                ),
                text(c, px(20) - 70, 82, 140, '20% target', 21, getReadableToneColor('warm', c)),
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
                ...rows.flatMap((row) => [
                    text(c, 12, py(row.y) - 14, 114, row.label, 22, c.textPrimary, 'right'),
                    text(
                        c,
                        px(row.upper) + 10,
                        py(row.y) - 14,
                        92,
                        `${row.upper.toFixed(1)}%`,
                        22,
                        getReadableToneColor(row.colorKey, c),
                        'left',
                    ),
                ]),
                ...[0, 10, 20, 30, 40, 50].map((tick) =>
                    text(c, px(tick) - 28, 362, 56, `${tick}%`, 21, c.textSecondary),
                ),
                text(c, plot.x, 392, plot.width, 'Population error rate (%)', 21, c.textSecondary),
                text(c, 16, 428, 616, '1,000 candidates add 14.9 points.', 21, c.textMuted, 'left'),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
