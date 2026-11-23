import {
    AxisPlot,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const alt =
    'Vector plots comparing river [10, 1] and loan [10, -1]. Before centering, the large shared horizontal component [10, 0] yields raw cosine 0.98. Subtracting the shared mean leaves opposite vertical residuals [0, 1] and [0, -1] with cosine -1.0.'

export const width = 660
export const height = 540

const illustration = defineIllustration((c) =>
    Scene({
        c,
        background: 'transparent',
        padding: 16,
        gap: 14,
        contentWidth: 628,
        align: 'center',
        children: Column({
            gap: 14,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'A shared direction inflates raw cosine similarity',
                    fontSize: 27,
                    fontWeight: 750,
                    align: 'center',
                }),
                Row({
                    gap: 14,
                    align: 'stretch',
                    justify: 'center',
                    children: [
                        Panel({
                            c,
                            title: 'Raw · cosine 0.980',
                            titleFontSize: 23,
                            tone: 'purple',
                            width: 304,
                            padding: 10,
                            gap: 8,
                            align: 'center',
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    AxisPlot({
                                        c,
                                        width: 276,
                                        height: 210,
                                        padding: 16,
                                        xMin: 0,
                                        xMax: 11,
                                        yMin: -2.4,
                                        yMax: 2.4,
                                        showAxes: true,
                                        showGrid: true,
                                        gridCount: 4,
                                        vectors: [
                                            {
                                                x1: 0,
                                                y1: 0,
                                                x2: 10,
                                                y2: 1,
                                                tone: 'purple',
                                                strokeWidth: 5,
                                                arrow: true,
                                                arrowSize: 8,
                                            },
                                            {
                                                x1: 0,
                                                y1: 0,
                                                x2: 10,
                                                y2: -1,
                                                tone: 'cyan',
                                                strokeWidth: 5,
                                                arrow: true,
                                                arrowSize: 8,
                                            },
                                            {
                                                x1: 0,
                                                y1: 0,
                                                x2: 10,
                                                y2: 0,
                                                tone: 'warm',
                                                strokeWidth: 3,
                                                arrow: true,
                                                arrowSize: 7,
                                            },
                                        ],
                                        ariaLabel:
                                            'Unrelated vectors sharing large horizontal component',
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'river [10, 1]',
                                        fontSize: 22,
                                        color: getReadableToneColor('purple', c),
                                        fontWeight: 700,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'loan [10, -1]',
                                        fontSize: 22,
                                        color: getReadableToneColor('cyan', c),
                                        fontWeight: 700,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'mean μ = [10, 0]',
                                        fontSize: 21,
                                        color: getReadableToneColor('warm', c),
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Centered · cosine -1.00',
                            titleFontSize: 23,
                            tone: 'green',
                            width: 304,
                            padding: 10,
                            gap: 8,
                            align: 'center',
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    AxisPlot({
                                        c,
                                        width: 276,
                                        height: 210,
                                        padding: 16,
                                        xMin: -2.2,
                                        xMax: 2.2,
                                        yMin: -1.4,
                                        yMax: 1.4,
                                        showAxes: true,
                                        showGrid: true,
                                        gridCount: 4,
                                        vectors: [
                                            {
                                                x1: 0,
                                                y1: 0,
                                                x2: 0,
                                                y2: 1,
                                                tone: 'purple',
                                                strokeWidth: 6,
                                                arrow: true,
                                                arrowSize: 8,
                                            },
                                            {
                                                x1: 0,
                                                y1: 0,
                                                x2: 0,
                                                y2: -1,
                                                tone: 'cyan',
                                                strokeWidth: 6,
                                                arrow: true,
                                                arrowSize: 8,
                                            },
                                        ],
                                        ariaLabel: 'Centered opposite residuals [0, 1] and [0, -1]',
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'river - μ = [0, 1]',
                                        fontSize: 22,
                                        color: getReadableToneColor('purple', c),
                                        fontWeight: 700,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'loan - μ = [0, -1]',
                                        fontSize: 22,
                                        color: getReadableToneColor('cyan', c),
                                        fontWeight: 700,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'mean μ subtracted',
                                        fontSize: 21,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Removing a dominant corpus mean separates unrelated cone neighbors.',
                    fontSize: 21,
                    color: c.textSecondary,
                    align: 'center',
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
