import {
    AxisPlot,
    Column,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const alt =
    'A two-panel summary of PPMI weighting and rank-2 SVD. Left panel shows the four-by-four PPMI table where apple and pear align on fruit and sweet while river and lake align on water and shore. Right panel plots the two resulting orthogonal SVD directions (singular values 1.42 and 1.35 kept, 0.16 and 0.07 dropped).'

export const width = 688
export const height = 550

const illustration = defineIllustration((c) => {
    const score = (val: string, tone: 'purple' | 'cyan') => ({
        label: val,
        tone,
        color: c.textPrimary,
    })

    return Scene({
        c,
        background: 'transparent',
        padding: 12,
        gap: 14,
        contentWidth: 664,
        align: 'center',
        children: Column({
            gap: 14,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'PPMI blocks compress into orthogonal axes',
                    fontSize: 28,
                    fontWeight: 750,
                    align: 'center',
                }),
                Row({
                    gap: 12,
                    align: 'stretch',
                    justify: 'center',
                    children: [
                        Panel({
                            c,
                            title: 'PPMI association table',
                            titleFontSize: 23,
                            tone: 'purple',
                            width: 388,
                            padding: 10,
                            gap: 10,
                            align: 'center',
                            children: Column({
                                gap: 10,
                                align: 'center',
                                children: [
                                    Grid({
                                        c,
                                        headerRows: 1,
                                        cellWidth: 70,
                                        cellHeight: 44,
                                        gap: 4,
                                        fontSize: 21,
                                        rows: [
                                            ['word', 'fruit', 'sweet', 'water', 'shore'],
                                            [
                                                'apple',
                                                score('0.70', 'purple'),
                                                score('0.64', 'purple'),
                                                '0',
                                                '0',
                                            ],
                                            [
                                                'pear',
                                                score('0.64', 'purple'),
                                                score('0.71', 'purple'),
                                                '0',
                                                '0',
                                            ],
                                            [
                                                'river',
                                                '0',
                                                '0',
                                                score('0.78', 'cyan'),
                                                score('0.62', 'cyan'),
                                            ],
                                            [
                                                'lake',
                                                '0',
                                                '0',
                                                score('0.64', 'cyan'),
                                                score('0.80', 'cyan'),
                                            ],
                                        ],
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Two disjoint context blocks',
                                        fontSize: 21,
                                        color: c.textSecondary,
                                        align: 'center',
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Rank-2 SVD word map',
                            titleFontSize: 23,
                            tone: 'cyan',
                            width: 264,
                            padding: 10,
                            gap: 8,
                            align: 'center',
                            children: Column({
                                gap: 8,
                                align: 'center',
                                children: [
                                    AxisPlot({
                                        c,
                                        width: 238,
                                        height: 224,
                                        padding: 18,
                                        xMin: -0.08,
                                        xMax: 1.05,
                                        yMin: -0.08,
                                        yMax: 1.05,
                                        showAxes: true,
                                        showGrid: true,
                                        gridCount: 4,
                                        vectors: [
                                            {
                                                x1: 0,
                                                y1: 0,
                                                x2: 0.86,
                                                y2: 0,
                                                tone: 'cyan',
                                                strokeWidth: 5,
                                                arrow: true,
                                                arrowSize: 8,
                                            },
                                            {
                                                x1: 0,
                                                y1: 0,
                                                x2: 0,
                                                y2: 0.83,
                                                tone: 'purple',
                                                strokeWidth: 5,
                                                arrow: true,
                                                arrowSize: 8,
                                            },
                                        ],
                                        points: [
                                            { x: 0, y: 0.82, tone: 'purple', r: 7 },
                                            { x: 0, y: 0.83, tone: 'purple', r: 7 },
                                            { x: 0.83, y: 0, tone: 'cyan', r: 7 },
                                            { x: 0.86, y: 0, tone: 'cyan', r: 7 },
                                        ],
                                        ariaLabel:
                                            'Rank-2 SVD orthogonal axes for water and fruit clusters',
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'y: fruit · x: water',
                                        fontSize: 21,
                                        color: getReadableToneColor('purple', c),
                                        align: 'center',
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Kept singular values: 1.418, 1.348 (dropped: 0.158, 0.067).',
                    fontSize: 22,
                    color: c.textSecondary,
                    align: 'center',
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
