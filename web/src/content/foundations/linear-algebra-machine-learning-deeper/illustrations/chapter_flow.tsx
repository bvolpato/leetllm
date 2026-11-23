import {
    AxisPlot,
    Column,
    Matrix,
    MiniBarChart,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const alt =
    'Token matrix A with rows for kernel [1, 0], essay [0, 1], and notebook [1, 1] plotted in code-versus-prose space alongside unit directions v_plus and v_minus. Output lengths are square root of 3 for the shared topic direction and 1 for the code-versus-prose contrast.'

export const width = 660
export const height = 620
export const preset = 'engineering'

const A_ROWS = [
    [1, 0],
    [0, 1],
    [1, 1],
]

const illustration = defineIllustration((c) => {
    const invSqrt2 = 1 / Math.sqrt(2)
    const blue = getReadableToneColor('blue', c)
    const cyan = getReadableToneColor('cyan', c)
    const green = getReadableToneColor('green', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)

    return Scene({
        c,
        padding: 16,
        gap: 10,
        contentWidth: 628,
        align: 'center',
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'SVD Measures Output Stretch Across Directions',
                    fontSize: 25,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                Row({
                    gap: 18,
                    align: 'center',
                    justify: 'center',
                    children: [
                        Column({
                            gap: 6,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Matrix A (code, prose)',
                                    fontSize: 21,
                                    fontWeight: 700,
                                    color: c.textPrimary,
                                }),
                                Matrix({
                                    c,
                                    data: A_ROWS,
                                    rowLabels: ['kernel', 'essay', 'notebook'],
                                    colLabels: ['code', 'prose'],
                                    cellWidth: 74,
                                    cellHeight: 42,
                                    rowLabelWidth: 106,
                                    fontSize: 21,
                                    format: 'integer',
                                    colorize: true,
                                    colorScale: 'strength',
                                    colorDomain: [0, 1],
                                    ariaLabel: 'Three token vectors in code and prose coordinates',
                                }),
                            ],
                        }),
                        Column({
                            gap: 6,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Unit inputs v₊ and v₋',
                                    fontSize: 21,
                                    fontWeight: 700,
                                    color: purple,
                                }),
                                AxisPlot({
                                    c,
                                    width: 270,
                                    height: 230,
                                    xMin: -0.35,
                                    xMax: 1.35,
                                    yMin: -0.85,
                                    yMax: 1.35,
                                    padding: 26,
                                    showGrid: true,
                                    gridCount: 4,
                                    ariaLabel:
                                        'Token points and orthogonal unit vectors in 2D space',
                                    points: [
                                        { x: 1, y: 0, fill: blue, r: 7 },
                                        { x: 0, y: 1, fill: cyan, r: 7 },
                                        { x: 1, y: 1, fill: green, r: 7 },
                                    ],
                                    vectors: [
                                        {
                                            x1: 0,
                                            y1: 0,
                                            x2: invSqrt2,
                                            y2: invSqrt2,
                                            color: purple,
                                            strokeWidth: 4,
                                            arrow: true,
                                            arrowSize: 6,
                                        },
                                        {
                                            x1: 0,
                                            y1: 0,
                                            x2: invSqrt2,
                                            y2: -invSqrt2,
                                            color: warm,
                                            strokeWidth: 4,
                                            arrow: true,
                                            arrowSize: 6,
                                        },
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                Column({
                    gap: 4,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Output length ||Av|| (singular values σ₁ = √3, σ₂ = 1)',
                            fontSize: 21,
                            fontWeight: 700,
                            color: c.textPrimary,
                            align: 'center',
                        }),
                        MiniBarChart({
                            c,
                            height: 120,
                            barWidth: 140,
                            gap: 90,
                            fontSize: 21,
                            max: 2.1,
                            minBarHeight: 4,
                            showValues: true,
                            ariaLabel: 'Singular values sqrt(3) and 1',
                            data: [
                                {
                                    label: 'v₊ shared',
                                    value: Math.sqrt(3),
                                    color: purple,
                                    valueLabel: '√3 = 1.732',
                                },
                                {
                                    label: 'v₋ contrast',
                                    value: 1.0,
                                    color: warm,
                                    valueLabel: '1.000',
                                },
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
