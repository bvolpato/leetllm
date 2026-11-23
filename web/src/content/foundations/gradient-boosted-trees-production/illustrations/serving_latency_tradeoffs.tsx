import {
    AxisPlot,
    BadgePill,
    Board,
    CanvasItem,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'The 160-tree search model has 1,100 stored nodes and at most 320 split comparisons per row. The selected 50-tree model has 350 nodes and at most 100 comparisons. Each metric pair uses the search model as its full-length reference. The selected model has fewer tree operations, but these structural counts do not measure request latency.'
export const width = 840
export const height = 520

const metrics = [
    { name: 'trees', search: 160, selected: 50, searchRatio: 1, selectedRatio: 50 / 160, y: 2.5 },
    {
        name: 'max compares',
        search: 320,
        selected: 100,
        searchRatio: 1,
        selectedRatio: 100 / 320,
        y: 1.5,
    },
    {
        name: 'stored nodes',
        search: 1100,
        selected: 350,
        searchRatio: 1,
        selectedRatio: 350 / 1100,
        y: 0.5,
    },
]

function chart(c: ThemeColors) {
    const plotLeft = 120
    const plotTop = 12
    const plotWidth = 280
    const plotHeight = 240
    const padding = 24
    const innerWidth = plotWidth - padding * 2
    const x = (ratio: number) => plotLeft + padding + ratio * innerWidth
    const y = (value: number) => plotTop + padding + ((3 - value) / 3) * (plotHeight - padding * 2)
    const label = (
        text: string,
        xPos: number,
        yPos: number,
        boxWidth: number,
        color: string,
        align: 'left' | 'right' = 'left',
        fontSize = 16,
    ) =>
        CanvasItem({
            x: xPos,
            y: yPos,
            width: boxWidth,
            height: 24,
            children: TextLabel({ c, text, width: boxWidth, fontSize, color, mono: true, align }),
        })

    return Board({
        c,
        width: 440,
        height: 290,
        children: [
            CanvasItem({
                x: plotLeft,
                y: plotTop,
                width: plotWidth,
                height: plotHeight,
                children: AxisPlot({
                    c,
                    width: plotWidth,
                    height: plotHeight,
                    padding,
                    xMin: 0,
                    xMax: 1,
                    yMin: 0,
                    yMax: 3,
                    showAxes: false,
                    showGrid: false,
                    frameFill: c.bgSubtle,
                    frameStroke: c.borderSubtle,
                    paths: [
                        ...[0.5, 1].map((ratio) => ({
                            points: [
                                { x: ratio, y: 0 },
                                { x: ratio, y: 3 },
                            ],
                            color: c.borderSubtle,
                            strokeWidth: 1,
                        })),
                        ...metrics.flatMap((metric) => [
                            {
                                points: [
                                    { x: 0, y: metric.y + 0.16 },
                                    { x: metric.searchRatio, y: metric.y + 0.16 },
                                ],
                                color: c.primary,
                                strokeWidth: 11,
                            },
                            {
                                points: [
                                    { x: 0, y: metric.y - 0.16 },
                                    { x: metric.selectedRatio, y: metric.y - 0.16 },
                                ],
                                color: c.info,
                                strokeWidth: 11,
                            },
                        ]),
                    ],
                }),
            }),
            ...metrics.flatMap((metric) => [
                CanvasItem({
                    x: 0,
                    y: y(metric.y) - 12,
                    width: plotLeft - 8,
                    height: 28,
                    children: TextLabel({
                        c,
                        text: metric.name,
                        width: plotLeft - 8,
                        fontSize: 16,
                        color: c.textPrimary,
                        align: 'right',
                    }),
                }),
                label(
                    String(metric.search),
                    x(metric.searchRatio) + 8,
                    y(metric.y + 0.16) - 11,
                    46,
                    c.primary,
                    'left',
                    16,
                ),
                label(
                    String(metric.selected),
                    x(metric.selectedRatio) + 8,
                    y(metric.y - 0.16) - 11,
                    46,
                    c.info,
                    'left',
                    16,
                ),
            ]),
            ...[0, 0.5, 1].map((ratio) =>
                label(
                    `${Math.round(ratio * 100)}%`,
                    x(ratio) - 20,
                    256,
                    40,
                    c.textSecondary,
                    'right',
                    14,
                ),
            ),
        ],
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 12,
        align: 'center',
        contentWidth: 804,
        title: 'Model Pruning Bounds Tree Traversal Operations',
        subtitle: 'The 50-tree candidate reduces traversal work while improving validation loss.',
        children: Row({
            width: 804,
            gap: 16,
            align: 'center',
            justify: 'space-between',
            children: [
                Panel({
                    c,
                    width: 460,
                    padding: 12,
                    gap: 8,
                    tone: 'neutral',
                    title: 'Structural Work Comparison (Relative to 160 Rounds)',
                    titleFontSize: 17,
                    children: Column({
                        gap: 6,
                        align: 'center',
                        children: [
                            Row({
                                gap: 10,
                                justify: 'center',
                                children: [
                                    BadgePill({
                                        c,
                                        text: '160-round search',
                                        tone: 'purple',
                                        fontSize: 15,
                                        height: 26,
                                    }),
                                    BadgePill({
                                        c,
                                        text: '50-round candidate',
                                        tone: 'cyan',
                                        fontSize: 15,
                                        height: 26,
                                    }),
                                ],
                            }),
                            chart(c),
                        ],
                    }),
                }),
                Column({
                    width: 328,
                    gap: 10,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            width: 328,
                            padding: 12,
                            gap: 8,
                            tone: 'green',
                            title: 'Validation Loss',
                            titleFontSize: 17,
                            children: Column({
                                gap: 6,
                                align: 'center',
                                children: [
                                    BadgePill({
                                        c,
                                        text: 'Search loss: 0.5922',
                                        tone: 'purple',
                                        fontSize: 15,
                                        height: 26,
                                    }),
                                    BadgePill({
                                        c,
                                        text: 'Candidate loss: 0.5643',
                                        tone: 'green',
                                        fontSize: 15,
                                        height: 26,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Early stopping at round 50 avoids over-fitting later rounds.',
                                        width: 300,
                                        fontSize: 14,
                                        color: c.textSecondary,
                                        align: 'center',
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            width: 328,
                            padding: 12,
                            gap: 8,
                            tone: 'warm',
                            title: 'Latency Considerations',
                            titleFontSize: 17,
                            children: Column({
                                gap: 6,
                                align: 'center',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Depth 2 bounds worst-case comparisons to at most 2 per tree.',
                                        width: 300,
                                        fontSize: 14,
                                        color: c.textPrimary,
                                        align: 'center',
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Structural node counts set algorithmic limits. Always measure end-to-end request p99 latency under production concurrency.',
                                        width: 300,
                                        fontSize: 14,
                                        color: c.textSecondary,
                                        align: 'center',
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
