import { AxisPlot, Column, Grid, Panel, Row, Scene, TextLabel, defineIllustration } from 'vizmatic'

export const alt =
    'A two-dimensional plot and coordinate table showing static vector bank at [0.8, 0.2] splitting into two distinct contextual states when averaged equally with river [0.2, 1.0] to yield [0.5, 0.6], or with loan [1.0, 0.1] to yield [0.9, 0.15].'

export const width = 680
export const height = 540

const illustration = defineIllustration((c) => {
    const cell = (label: string, tone: 'blue' | 'purple' | 'warm') => ({
        label,
        tone,
        color: c.textPrimary,
    })

    return Scene({
        c,
        background: 'transparent',
        padding: 16,
        gap: 14,
        contentWidth: 648,
        align: 'center',
        children: Column({
            gap: 14,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'One lookup, two context clues, two states',
                    fontSize: 28,
                    fontWeight: 750,
                    align: 'center',
                }),
                Row({
                    gap: 14,
                    align: 'center',
                    justify: 'center',
                    children: [
                        AxisPlot({
                            c,
                            width: 286,
                            height: 286,
                            padding: 20,
                            xMin: 0,
                            xMax: 1.15,
                            yMin: 0,
                            yMax: 1.15,
                            showAxes: true,
                            showGrid: true,
                            gridCount: 4,
                            vectors: [
                                {
                                    x1: 0.8,
                                    y1: 0.2,
                                    x2: 0.5,
                                    y2: 0.6,
                                    tone: 'purple',
                                    strokeWidth: 5,
                                    arrow: true,
                                    arrowSize: 8,
                                },
                                {
                                    x1: 0.8,
                                    y1: 0.2,
                                    x2: 0.9,
                                    y2: 0.15,
                                    tone: 'warm',
                                    strokeWidth: 5,
                                    arrow: true,
                                    arrowSize: 8,
                                },
                            ],
                            points: [
                                { x: 0.8, y: 0.2, tone: 'blue', r: 8 },
                                { x: 0.2, y: 1.0, tone: 'purple', r: 7 },
                                { x: 1.0, y: 0.1, tone: 'warm', r: 7 },
                                { x: 0.5, y: 0.6, tone: 'purple', r: 8 },
                                { x: 0.9, y: 0.15, tone: 'warm', r: 8 },
                            ],
                            ariaLabel: 'Two contextual shifts from static lookup bank',
                        }),
                        Panel({
                            c,
                            title: 'Embedding & mixed states',
                            titleFontSize: 22,
                            tone: 'blue',
                            width: 344,
                            padding: 10,
                            gap: 8,
                            align: 'center',
                            children: Grid({
                                c,
                                headerRows: 1,
                                cellWidth: 156,
                                cellHeight: 42,
                                gap: 5,
                                fontSize: 21,
                                rows: [
                                    ['State', 'Vector'],
                                    [cell('A · bank', 'blue'), '[0.80, 0.20]'],
                                    [cell('B · river', 'purple'), '[0.20, 1.00]'],
                                    [cell('C · loan', 'warm'), '[1.00, 0.10]'],
                                    [cell('D · +river', 'purple'), '[0.50, 0.60]'],
                                    [cell('E · +loan', 'warm'), '[0.90, 0.15]'],
                                ],
                            }),
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Averaging the shared lookup with a neighbor separates both senses.',
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
