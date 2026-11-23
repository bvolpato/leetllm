import {
    AxisPlot,
    Column,
    Matrix,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const alt =
    'An equal-scale unit circle and its image under Gram matrix G equals A transpose A, forming an ellipse stretched by eigenvalue 3 along shared direction v_plus and kept at length 1 along contrast direction v_minus in code-prose space.'

export const width = 660
export const height = 560
export const preset = 'engineering'

const unitCircle = Array.from({ length: 97 }, (_, index) => {
    const angle = (index / 96) * Math.PI * 2
    return { x: Math.cos(angle), y: Math.sin(angle) }
})

const gramImage = unitCircle.map(({ x, y }) => ({
    x: 2 * x + y,
    y: x + 2 * y,
}))

const illustration = defineIllustration((c) => {
    const invSqrt2 = 1 / Math.sqrt(2)
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)

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
                    text: 'Gram Matrix G = AᵀA Stretches Unit Inputs into an Ellipse',
                    fontSize: 23,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                Row({
                    gap: 18,
                    align: 'center',
                    justify: 'center',
                    children: [
                        AxisPlot({
                            c,
                            width: 340,
                            height: 340,
                            xMin: -3.5,
                            xMax: 3.5,
                            yMin: -3.5,
                            yMax: 3.5,
                            padding: 32,
                            showGrid: true,
                            gridCount: 6,
                            ariaLabel: 'Unit circle mapped to ellipse by Gram matrix G',
                            paths: [
                                {
                                    points: unitCircle,
                                    tone: 'neutral',
                                    strokeWidth: 2,
                                    opacity: 0.75,
                                    dashed: true,
                                },
                                { points: gramImage, tone: 'purple', strokeWidth: 3, opacity: 0.9 },
                            ],
                            vectors: [
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: invSqrt2,
                                    y2: invSqrt2,
                                    tone: 'purple',
                                    strokeWidth: 2,
                                    opacity: 0.45,
                                    arrow: true,
                                    arrowSize: 4,
                                },
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 3 * invSqrt2,
                                    y2: 3 * invSqrt2,
                                    tone: 'purple',
                                    strokeWidth: 5,
                                    arrow: true,
                                    arrowSize: 6,
                                },
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: invSqrt2,
                                    y2: -invSqrt2,
                                    tone: 'cyan',
                                    strokeWidth: 4,
                                    arrow: true,
                                    arrowSize: 5,
                                },
                            ],
                        }),
                        Column({
                            gap: 10,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'G = AᵀA',
                                    fontSize: 24,
                                    fontWeight: 700,
                                    color: c.textPrimary,
                                }),
                                Matrix({
                                    c,
                                    data: [
                                        [2, 1],
                                        [1, 2],
                                    ],
                                    cellWidth: 64,
                                    cellHeight: 54,
                                    fontSize: 24,
                                    format: 'integer',
                                    colorize: false,
                                    ariaLabel: '2 by 2 Gram matrix [[2, 1], [1, 2]]',
                                }),
                                TextLabel({
                                    c,
                                    text: 'Gv₊ = 3v₊',
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: purple,
                                }),
                                TextLabel({
                                    c,
                                    text: 'Gv₋ = 1v₋',
                                    fontSize: 22,
                                    fontWeight: 700,
                                    color: cyan,
                                }),
                                TextLabel({
                                    c,
                                    text: 'λ₁=3 → σ₁=√3',
                                    fontSize: 21,
                                    color: c.textSecondary,
                                }),
                                TextLabel({
                                    c,
                                    text: 'λ₂=1 → σ₂=1',
                                    fontSize: 21,
                                    color: c.textSecondary,
                                }),
                            ],
                        }),
                    ],
                }),
                Row({
                    gap: 18,
                    justify: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'x: code · y: prose',
                            fontSize: 21,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }),
                        TextLabel({
                            c,
                            text: 'Dashed: unit circle',
                            fontSize: 21,
                            color: c.textMuted,
                        }),
                        TextLabel({ c, text: 'Solid: G(circle)', fontSize: 21, color: purple }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
