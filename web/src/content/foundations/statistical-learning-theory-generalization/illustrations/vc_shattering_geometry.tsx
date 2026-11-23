import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    MetricCard,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withDensity,
    type ThemeColors,
} from 'vizmatic'

export const width = 720
export const height = 760
export const alt =
    'Linear threshold classifiers shatter any three non-collinear points in R^2 by separating all eight sign assignments. Adding a fourth point in XOR arrangement forces opposite diagonal hulls to intersect at (0.5, 0.5), proving no line can realize XOR and fixing VC(R^2) = 3.'

const triPts = [
    { x: 0.16, y: 0.16 },
    { x: 0.84, y: 0.16 },
    { x: 0.5, y: 0.84 },
]
const sepAbove = [
    { x: -0.25, y: -0.05 },
    { x: 1.25, y: -0.05 },
]
const sepTop = [
    { x: -0.25, y: 0.5 },
    { x: 1.25, y: 0.5 },
]
const sepRight = [
    { x: 0.54, y: -0.18 },
    { x: 0.96, y: 0.72 },
]
const sepLeft = [
    { x: 0.46, y: -0.18 },
    { x: 0.04, y: 0.72 },
]

const patterns = [
    { id: '#1 +++', signs: [1, 1, 1], line: sepAbove },
    { id: '#2 ++-', signs: [1, 1, -1], line: sepTop },
    { id: '#3 +-+', signs: [1, -1, 1], line: sepRight },
    { id: '#4 -++', signs: [-1, 1, 1], line: sepLeft },
    { id: '#5 +--', signs: [1, -1, -1], line: sepLeft },
    { id: '#6 -+-', signs: [-1, 1, -1], line: sepRight },
    { id: '#7 --+', signs: [-1, -1, 1], line: sepTop },
    { id: '#8 ---', signs: [-1, -1, -1], line: sepAbove },
]

const miniCell = (c: ThemeColors, p: (typeof patterns)[number]) =>
    Board({
        c,
        width: 158,
        height: 122,
        children: [
            CanvasItem({
                x: 8,
                y: 6,
                width: 142,
                height: 82,
                children: AxisPlot({
                    c,
                    width: 142,
                    height: 82,
                    xMin: -0.25,
                    xMax: 1.25,
                    yMin: -0.2,
                    yMax: 1.15,
                    padding: 0,
                    showFrame: true,
                    showAxes: false,
                    showGrid: false,
                    paths: [{ points: p.line, color: c.warningLight, strokeWidth: 3 }],
                    points: triPts.map((pt, i) => ({
                        x: pt.x,
                        y: pt.y,
                        r: 7,
                        fill: p.signs[i] > 0 ? c.positiveLight : c.infoLight,
                        stroke: c.bgSubtle,
                        strokeWidth: 2,
                    })),
                }),
            }),
            CanvasItem({
                x: 8,
                y: 92,
                width: 142,
                height: 26,
                children: TextLabel({
                    c,
                    text: p.id,
                    fontSize: 22,
                    color: c.textPrimary,
                    align: 'center',
                    mono: false,
                }),
            }),
        ],
    })

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.2)
    return Scene({
        c,
        padding: 14,
        gap: 10,
        contentWidth: 692,
        children: Column({
            gap: 10,
            children: [
                Panel({
                    c,
                    width: 692,
                    padding: 12,
                    tone: 'blue',
                    title: 'Eight labelings of 3 points',
                    subtitle: 'Green +1, blue -1, yellow: separator',
                    children: Column({
                        gap: 8,
                        children: [
                            Row({
                                gap: 10,
                                children: patterns.slice(0, 4).map((p) => miniCell(c, p)),
                            }),
                            Row({
                                gap: 10,
                                children: patterns.slice(4, 8).map((p) => miniCell(c, p)),
                            }),
                        ],
                    }),
                }),
                Row({
                    gap: 12,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            width: 340,
                            padding: 12,
                            tone: 'red',
                            title: 'Four-point XOR',
                            children: Board({
                                c,
                                width: 314,
                                height: 176,
                                children: [
                                    CanvasItem({
                                        x: 8,
                                        y: 4,
                                        width: 298,
                                        height: 140,
                                        children: AxisPlot({
                                            c,
                                            width: 298,
                                            height: 140,
                                            xMin: -0.25,
                                            xMax: 1.25,
                                            yMin: -0.15,
                                            yMax: 1.15,
                                            padding: 0,
                                            showFrame: true,
                                            showAxes: false,
                                            showGrid: true,
                                            gridCount: 3,
                                            paths: [
                                                {
                                                    points: [
                                                        { x: 0.15, y: 0.15 },
                                                        { x: 0.85, y: 0.85 },
                                                    ],
                                                    color: c.positiveLight,
                                                    strokeWidth: 4,
                                                },
                                                {
                                                    points: [
                                                        { x: 0.85, y: 0.15 },
                                                        { x: 0.15, y: 0.85 },
                                                    ],
                                                    color: c.infoLight,
                                                    strokeWidth: 4,
                                                },
                                            ],
                                            points: [
                                                {
                                                    x: 0.15,
                                                    y: 0.15,
                                                    r: 8,
                                                    fill: c.positiveLight,
                                                    stroke: c.bgSubtle,
                                                    strokeWidth: 2,
                                                },
                                                {
                                                    x: 0.85,
                                                    y: 0.85,
                                                    r: 8,
                                                    fill: c.positiveLight,
                                                    stroke: c.bgSubtle,
                                                    strokeWidth: 2,
                                                },
                                                {
                                                    x: 0.85,
                                                    y: 0.15,
                                                    r: 8,
                                                    fill: c.infoLight,
                                                    stroke: c.bgSubtle,
                                                    strokeWidth: 2,
                                                },
                                                {
                                                    x: 0.15,
                                                    y: 0.85,
                                                    r: 8,
                                                    fill: c.infoLight,
                                                    stroke: c.bgSubtle,
                                                    strokeWidth: 2,
                                                },
                                                {
                                                    x: 0.5,
                                                    y: 0.5,
                                                    r: 7,
                                                    fill: c.warningLight,
                                                    stroke: c.bgSubtle,
                                                    strokeWidth: 2,
                                                },
                                            ],
                                        }),
                                    }),
                                    CanvasItem({
                                        x: 8,
                                        y: 150,
                                        width: 298,
                                        height: 28,
                                        children: TextLabel({
                                            c,
                                            text: 'Hulls cross at (0.5, 0.5)',
                                            fontSize: 22,
                                            color: getReadableToneColor('warm', c),
                                            align: 'center',
                                        }),
                                    }),
                                ],
                            }),
                        }),
                        Column({
                            gap: 10,
                            children: [
                                MetricCard({
                                    c,
                                    width: 340,
                                    tone: 'green',
                                    padding: 12,
                                    valueFontSize: 30,
                                    label: 'VC Dimension of Lines',
                                    value: 'VC(R²) = 3',
                                    detail: 'Hyperplanes in R^d: d + 1',
                                }),
                                Panel({
                                    c,
                                    width: 340,
                                    tone: 'warm',
                                    padding: 12,
                                    title: 'Counting labelings',
                                    children: TextLabel({
                                        c,
                                        text: '3 points: 8 of 8 labelings. 4 points: 14 of 16.',
                                        fontSize: 22,
                                        color: c.textPrimary,
                                        align: 'left',
                                    }),
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
