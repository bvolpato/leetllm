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
    'With the frozen threshold, priority recall is 1.000 on 36 positives against a 0.90 minimum, and large-model recall is 1.000 on 31 positives against a 0.85 minimum; both slices pass a support floor of 10. Changing only the threshold to 0.50 lowers recall to 0.722 and 0.645, so both fail. Zero positives gives undefined recall, while nine perfectly detected positives still fail the support floor.'
export const width = 840
export const height = 520

const groups = [
    {
        name: 'Priority slice',
        xSelected: 0.8,
        xStress: 1.2,
        selected: 1,
        stress: 0.722,
        minimum: 0.9,
    },
    {
        name: 'Large model slice',
        xSelected: 1.8,
        xStress: 2.2,
        selected: 1,
        stress: 0.645,
        minimum: 0.85,
    },
]

function recallPlot(c: ThemeColors) {
    const left = 60
    const top = 16
    const width = 340
    const height = 240
    const padding = 28
    const x = (value: number) => left + padding + (value / 3) * (width - padding * 2)
    const y = (value: number) => top + padding + (1 - value) * (height - padding * 2)
    const label = (
        text: string,
        xPos: number,
        yPos: number,
        boxWidth: number,
        color = c.textSecondary,
        fontSize = 16,
        mono = true,
    ) =>
        CanvasItem({
            x: xPos,
            y: yPos,
            width: boxWidth,
            height: 24,
            children: TextLabel({
                c,
                text,
                width: boxWidth,
                fontSize,
                color,
                mono,
                align: 'center',
            }),
        })

    return Board({
        c,
        width: 420,
        height: 300,
        children: [
            CanvasItem({
                x: left,
                y: top,
                width,
                height,
                children: AxisPlot({
                    c,
                    width,
                    height,
                    padding,
                    xMin: 0,
                    xMax: 3,
                    yMin: 0,
                    yMax: 1,
                    showAxes: false,
                    showGrid: false,
                    frameFill: c.bgSubtle,
                    frameStroke: c.borderSubtle,
                    paths: [
                        ...[0.5, 1].map((recall) => ({
                            points: [
                                { x: 0, y: recall },
                                { x: 3, y: recall },
                            ],
                            color: c.borderSubtle,
                            strokeWidth: 1,
                        })),
                        ...groups.map((group) => ({
                            points: [
                                { x: group.xSelected - 0.1, y: group.minimum },
                                { x: group.xStress + 0.2, y: group.minimum },
                            ],
                            color: c.warning,
                            strokeWidth: 2,
                            dashed: true,
                        })),
                        ...groups.flatMap((group) => [
                            {
                                points: [
                                    { x: group.xSelected, y: 0 },
                                    { x: group.xSelected, y: group.selected },
                                ],
                                color: c.positive,
                                strokeWidth: 16,
                            },
                            {
                                points: [
                                    { x: group.xStress, y: 0 },
                                    { x: group.xStress, y: group.stress },
                                ],
                                color: c.warning,
                                strokeWidth: 16,
                            },
                        ]),
                    ],
                }),
            }),
            ...[0, 0.5, 1].map((recall) =>
                label(recall.toFixed(1), 0, y(recall) - 10, left - 8, c.textSecondary, 14),
            ),
            ...groups.flatMap((group) => [
                label('1.000', x(group.xSelected) - 26, y(group.selected) - 26, 52, c.positive, 16),
                label(
                    group.stress.toFixed(3),
                    x(group.xStress) - 28,
                    y(group.stress) - 26,
                    56,
                    c.warningDark,
                    16,
                ),
                label(
                    group.name,
                    (x(group.xSelected) + x(group.xStress)) / 2 - 65,
                    260,
                    130,
                    c.textPrimary,
                    15,
                    false,
                ),
            ]),
        ],
    })
}

function sliceSupportCard(c: ThemeColors, title: string, positives: number, gate: number) {
    return Panel({
        c,
        width: 320,
        padding: 10,
        gap: 6,
        tone: 'green',
        title,
        titleFontSize: 16,
        children: Column({
            gap: 4,
            align: 'center',
            children: [
                Row({
                    gap: 12,
                    justify: 'center',
                    children: [
                        BadgePill({
                            c,
                            text: `${positives} positives`,
                            tone: 'green',
                            fontSize: 14,
                            height: 24,
                        }),
                        BadgePill({
                            c,
                            text: 'Floor: 10',
                            tone: 'neutral',
                            fontSize: 14,
                            height: 24,
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: `Required recall floor: ≥ ${gate.toFixed(2)}`,
                    width: 290,
                    fontSize: 14,
                    color: c.textPrimary,
                    mono: true,
                    align: 'center',
                }),
            ],
        }),
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 12,
        align: 'center',
        contentWidth: 804,
        title: 'Predeclared Slice Gates Guard Mission-Critical Subgroups',
        subtitle:
            'Both slice recall and positive sample support must satisfy predeclared thresholds.',
        children: Row({
            width: 804,
            gap: 16,
            align: 'center',
            justify: 'space-between',
            children: [
                Panel({
                    c,
                    width: 440,
                    padding: 10,
                    gap: 8,
                    tone: 'neutral',
                    title: 'Slice Recall vs Predeclared Minimums',
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
                                        text: 'Frozen threshold (0.063)',
                                        tone: 'green',
                                        fontSize: 14,
                                        height: 25,
                                    }),
                                    BadgePill({
                                        c,
                                        text: 'Stress test (0.50)',
                                        tone: 'warm',
                                        fontSize: 14,
                                        height: 25,
                                    }),
                                ],
                            }),
                            recallPlot(c),
                        ],
                    }),
                }),
                Column({
                    width: 348,
                    gap: 10,
                    align: 'stretch',
                    children: [
                        sliceSupportCard(c, 'Priority Jobs', 36, 0.9),
                        sliceSupportCard(c, 'Large Model Workloads', 31, 0.85),
                        Panel({
                            c,
                            width: 348,
                            padding: 10,
                            gap: 6,
                            tone: 'warm',
                            title: 'Boundary Conditions',
                            titleFontSize: 15,
                            children: Column({
                                gap: 4,
                                align: 'center',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'Zero positives: recall is undefined and fails the gate.',
                                        width: 320,
                                        fontSize: 14,
                                        color: c.textPrimary,
                                        align: 'center',
                                    }),
                                    TextLabel({
                                        c,
                                        text: '< 10 positives: insufficient sample support, regardless of observed precision.',
                                        width: 320,
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
