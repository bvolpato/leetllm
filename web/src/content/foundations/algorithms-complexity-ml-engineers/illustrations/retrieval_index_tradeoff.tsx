import { AxisPlot, Column, Grid, Panel, Row, Scene, TextLabel, defineIllustration } from 'vizmatic'

export const alt =
    'An exact scan compares a 768-dimensional query with all 50,000 vectors, requiring 38.4 million coordinate multiplications. A separate two-dimensional graph walk moves toward the query as distance falls from 12.0 to 1.4 units. Scoring 160 vectors requires 122,880 coordinate multiplications, excluding graph traversal. Approximate recall must be measured against exact top-k.'

export const width = 660
export const height = 670
export const preset = 'architecture'

const illustration = defineIllustration((c) => {
    const exactRows = Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 4 }, (_, column) => ({
            label: `v${row * 4 + column + 1}`,
            tone: 'blue' as const,
        })),
    )

    const query = { x: 0, y: 0 }
    const route = [
        { x: 9, y: 8 },
        { x: 6, y: 5 },
        { x: 3, y: 2 },
        { x: 1, y: 1 },
    ]

    const exactPanel = Panel({
        c,
        title: 'Exact scan · Θ(n · d)',
        titleFontSize: 21,
        tone: 'blue',
        width: 308,
        padding: '12px 12px',
        gap: 8,
        shadow: false,
        children: Column({
            gap: 8,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Query q ∈ ℝ⁷⁶⁸ scores every row',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                Grid({
                    c,
                    rows: exactRows,
                    cellWidth: 62,
                    cellHeight: 30,
                    gap: 4,
                    fontSize: 20,
                    radius: 5,
                }),
                TextLabel({
                    c,
                    text: '16 shown of 50,000 vectors',
                    fontSize: 20,
                    color: c.textMuted,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: '50,000 × 768 = 38.4M products',
                    fontSize: 20,
                    fontWeight: 760,
                    color: c.secondaryLight,
                    align: 'center',
                }),
            ],
        }),
    })

    const graphPanel = Panel({
        c,
        title: 'Graph walk toward q',
        titleFontSize: 21,
        tone: 'green',
        width: 308,
        padding: '12px 12px',
        gap: 8,
        shadow: false,
        children: Column({
            gap: 6,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Euclidean steps toward q=(0,0)',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                AxisPlot({
                    c,
                    width: 276,
                    height: 158,
                    xMin: -1,
                    xMax: 10,
                    yMin: -1,
                    yMax: 10,
                    padding: 18,
                    showGrid: true,
                    gridCount: 4,
                    points: [
                        { ...query, tone: 'purple', r: 7, stroke: c.bg, strokeWidth: 2 },
                        ...route.map((point) => ({
                            ...point,
                            tone: 'green' as const,
                            r: 6,
                            stroke: c.bg,
                            strokeWidth: 2,
                        })),
                    ],
                    vectors: route.slice(0, -1).map((point, index) => ({
                        x1: point.x,
                        y1: point.y,
                        x2: route[index + 1].x,
                        y2: route[index + 1].y,
                        tone: 'green',
                        strokeWidth: 3,
                        arrow: true,
                        arrowSize: 7,
                    })),
                    ariaLabel:
                        '2D path moving from A(9,8) through B(6,5) and C(3,2) to D(1,1) near query q(0,0)',
                }),
                TextLabel({
                    c,
                    text: 'A(9,8) 12.0 → B(6,5) 7.8',
                    fontSize: 20,
                    fontWeight: 700,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'C(3,2) 3.6 → D(1,1) 1.4 → q(0,0)',
                    fontSize: 20,
                    fontWeight: 700,
                    color: c.primaryLight,
                    align: 'center',
                }),
            ],
        }),
    })

    const countPanel = Panel({
        c,
        title: 'Separate operation-count example (160 scored vectors)',
        titleFontSize: 20,
        tone: 'purple',
        width: 628,
        padding: '12px 14px',
        gap: 6,
        shadow: false,
        children: Column({
            gap: 6,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: '160 × 768 = 122,880 coordinate multiplications',
                    fontSize: 20,
                    fontWeight: 760,
                    color: c.primaryLight,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Graph traversal is extra; measure latency and recall vs. exact top-k.',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
            ],
        }),
    })

    return Scene({
        c,
        padding: 16,
        gap: 10,
        contentWidth: width - 32,
        align: 'center',
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Scan All Vectors, or Navigate a Graph',
                    fontSize: 23,
                    fontWeight: 760,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Exact scoring reads every row; approximate search visits fewer candidates',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                Row({
                    gap: 12,
                    align: 'stretch',
                    justify: 'center',
                    children: [exactPanel, graphPanel],
                }),
                countPanel,
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
