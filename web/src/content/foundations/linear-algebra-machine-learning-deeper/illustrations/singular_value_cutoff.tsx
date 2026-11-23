import {
    AxisPlot,
    Column,
    Matrix,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const alt =
    'Rank-one truncation collapses distinct token vectors kernel [1, 0] and essay [0, 1] onto the shared diagonal [0.5, 0.5] while keeping notebook [1, 1] exact. Side-by-side matrices and a stacked bar show 75 percent of squared energy retained and 25 percent dropped.'

export const width = 660
export const height = 670
export const preset = 'engineering'

const A_ORIG = [
    [1.0, 0.0],
    [0.0, 1.0],
    [1.0, 1.0],
]

const A_RANK1 = [
    [0.5, 0.5],
    [0.5, 0.5],
    [1.0, 1.0],
]

const illustration = defineIllustration((c) => {
    const purple = getReadableToneColor('purple', c)
    const blue = getReadableToneColor('blue', c)
    const cyan = getReadableToneColor('cyan', c)
    const green = getReadableToneColor('green', c)
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
                    text: 'Rank-1 Truncation Collapses the Contrast Axis',
                    fontSize: 24,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                Row({
                    gap: 16,
                    align: 'center',
                    justify: 'center',
                    children: [
                        AxisPlot({
                            c,
                            width: 280,
                            height: 270,
                            xMin: -0.25,
                            xMax: 1.25,
                            yMin: -0.25,
                            yMax: 1.25,
                            padding: 28,
                            showGrid: true,
                            gridCount: 5,
                            ariaLabel: 'Orthogonal projection onto rank-one diagonal',
                            paths: [
                                {
                                    points: [
                                        { x: 0, y: 0 },
                                        { x: 1.2, y: 1.2 },
                                    ],
                                    tone: 'purple',
                                    strokeWidth: 3,
                                },
                                {
                                    points: [
                                        { x: 1, y: 0 },
                                        { x: 0.5, y: 0.5 },
                                    ],
                                    tone: 'blue',
                                    strokeWidth: 2,
                                    dashed: true,
                                },
                                {
                                    points: [
                                        { x: 0, y: 1 },
                                        { x: 0.5, y: 0.5 },
                                    ],
                                    tone: 'cyan',
                                    strokeWidth: 2,
                                    dashed: true,
                                },
                            ],
                            points: [
                                { x: 1, y: 0, tone: 'blue', r: 7 },
                                { x: 0, y: 1, tone: 'cyan', r: 7 },
                                { x: 1, y: 1, tone: 'green', r: 7 },
                                { x: 0.5, y: 0.5, tone: 'warm', r: 8 },
                            ],
                        }),
                        Column({
                            gap: 10,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'Original A',
                                    fontSize: 21,
                                    fontWeight: 700,
                                    color: c.textPrimary,
                                }),
                                Matrix({
                                    c,
                                    data: A_ORIG,
                                    rowLabels: ['kernel', 'essay', 'note'],
                                    cellWidth: 66,
                                    cellHeight: 34,
                                    rowLabelWidth: 74,
                                    fontSize: 20,
                                    format: 'decimal',
                                    colorize: true,
                                    colorDomain: [0, 1],
                                    ariaLabel: 'Original 3 by 2 matrix A',
                                }),
                                TextLabel({
                                    c,
                                    text: 'Rank-1 A₁',
                                    fontSize: 21,
                                    fontWeight: 700,
                                    color: warm,
                                }),
                                Matrix({
                                    c,
                                    data: A_RANK1,
                                    rowLabels: ['kernel', 'essay', 'note'],
                                    cellWidth: 66,
                                    cellHeight: 34,
                                    rowLabelWidth: 74,
                                    fontSize: 20,
                                    format: 'decimal',
                                    colorize: true,
                                    colorDomain: [0, 1],
                                    highlightRow: 0,
                                    highlightColor: warm,
                                    ariaLabel: 'Rank-1 approximation matrix A1',
                                }),
                            ],
                        }),
                    ],
                }),
                Row({
                    gap: 14,
                    justify: 'center',
                    children: [
                        TextLabel({ c, text: '● kernel [1,0]', fontSize: 20, color: blue }),
                        TextLabel({ c, text: '● essay [0,1]', fontSize: 20, color: cyan }),
                        TextLabel({
                            c,
                            text: '→ [0.5, 0.5]',
                            fontSize: 20,
                            fontWeight: 700,
                            color: warm,
                        }),
                        TextLabel({ c, text: '● note [1,1]', fontSize: 20, color: green }),
                    ],
                }),
                preparePrintTypography(
                    StackedBar({
                        c,
                        width: 600,
                        height: 40,
                        title: 'Squared Frobenius Energy Split (σ₁²=3, σ₂²=1)',
                        showLegend: true,
                        ariaLabel: '75 percent kept vs 25 percent dropped energy',
                        segments: [
                            { label: 'Kept rank-1', value: 75, color: purple, valueLabel: '75%' },
                            {
                                label: 'Discarded contrast',
                                value: 25,
                                color: warm,
                                valueLabel: '25%',
                            },
                        ],
                    }),
                    20,
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
