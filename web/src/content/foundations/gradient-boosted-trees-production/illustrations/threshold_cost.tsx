import {
    BadgePill,
    Board,
    CanvasItem,
    Column,
    Row,
    AxisPlot,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'Stacked April cost bars decompose false-alarm and missed-SLA costs. The selected threshold 0.062667 costs 568, all-alert costs 656, threshold 0.15 costs 1,316 including 1,020 missed-SLA cost, and threshold 0.50 costs 3,134 including 3,030 missed-SLA cost. The selected policy catches all 58 misses and suppresses 11 false alarms.'
export const width = 520
export const height = 560

const rows = [
    { name: 'τ ≈ 0.063', falseAlarm: 568, missed: 0, total: 568, y: 3.6, selected: true },
    { name: 'all alert', falseAlarm: 656, missed: 0, total: 656, y: 2.6, selected: false },
    { name: 'τ = 0.15', falseAlarm: 296, missed: 1020, total: 1316, y: 1.6, selected: false },
    { name: 'τ = 0.50', falseAlarm: 104, missed: 3030, total: 3134, y: 0.6, selected: false },
]

function chart(c: ThemeColors) {
    const plotLeft = 164
    const plotTop = 10
    // Keep room for the 3,134 total label after the longest April cost bar.
    const plotWidth = 286
    const plotHeight = 248
    const padding = 26
    const x = (value: number) => plotLeft + padding + (value / 3400) * (plotWidth - padding * 2)
    const y = (value: number) =>
        plotTop + padding + ((4.4 - value) / 4.4) * (plotHeight - padding * 2)
    const label = (
        text: string,
        xPos: number,
        yPos: number,
        boxWidth: number,
        color = c.textSecondary,
        align: 'left' | 'center' | 'right' = 'center',
        fontSize = 17,
    ) =>
        CanvasItem({
            x: xPos,
            y: yPos,
            width: boxWidth,
            height: 26,
            children: TextLabel({ c, text, width: boxWidth, fontSize, color, align, mono: true }),
        })

    return Board({
        c,
        width: 484,
        height: 320,
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
                    xMax: 3400,
                    yMin: 0,
                    yMax: 4.4,
                    showAxes: false,
                    showGrid: false,
                    frameFill: c.bgSubtle,
                    frameStroke: c.borderSubtle,
                    paths: [
                        ...[1000, 2000, 3000].map((cost) => ({
                            points: [
                                { x: cost, y: 0 },
                                { x: cost, y: 4.4 },
                            ],
                            color: c.borderSubtle,
                            strokeWidth: 1,
                        })),
                        ...rows.flatMap((row) => [
                            {
                                points: [
                                    { x: 0, y: row.y },
                                    { x: row.falseAlarm, y: row.y },
                                ],
                                color: c.warning,
                                strokeWidth: 20,
                            },
                            ...(row.missed > 0
                                ? [
                                      {
                                          points: [
                                              { x: row.falseAlarm, y: row.y },
                                              { x: row.total, y: row.y },
                                          ],
                                          color: c.critical,
                                          strokeWidth: 20,
                                      },
                                  ]
                                : []),
                        ]),
                    ],
                }),
            }),
            ...rows.flatMap((row) => [
                CanvasItem({
                    x: 0,
                    y: y(row.y) - 14,
                    width: plotLeft - 8,
                    height: 30,
                    children: TextLabel({
                        c,
                        text: row.name,
                        width: plotLeft - 8,
                        fontSize: 17,
                        color: row.selected ? c.warningDark : c.textPrimary,
                        mono: row.name.includes('0.') || row.name.includes('τ'),
                        align: 'right',
                    }),
                }),
                label(
                    String(row.total),
                    x(row.total) + 12,
                    y(row.y) - 13,
                    54,
                    row.selected ? c.warningDark : c.textPrimary,
                    'left',
                    19,
                ),
            ]),
            ...[0, 1000, 2000, 3000].map((cost) =>
                label(cost === 0 ? '0' : `${cost}`, x(cost) - 28, 262, 56),
            ),
            CanvasItem({
                x: plotLeft + 90,
                y: 291,
                width: 140,
                height: 24,
                children: TextLabel({
                    c,
                    text: 'April cost · units',
                    width: 140,
                    fontSize: 17,
                    color: c.textSecondary,
                    align: 'center',
                }),
            }),
        ],
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 8,
        align: 'center',
        contentWidth: 484,
        title: 'The Threshold Prices Each Mistake',
        subtitle: 'April · 140 jobs · 58 SLA misses · lower total cost wins.',
        children: Column({
            width: 484,
            gap: 6,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'April cost by policy',
                    width: 484,
                    fontSize: 19,
                    fontWeight: 700,
                    color: c.textPrimary,
                    align: 'center',
                }),
                Row({
                    gap: 10,
                    justify: 'center',
                    children: [
                        BadgePill({
                            c,
                            text: 'false-alarm cost',
                            tone: 'warm',
                            fontSize: 17,
                            height: 27,
                        }),
                        BadgePill({
                            c,
                            text: 'missed-SLA cost',
                            tone: 'critical',
                            fontSize: 17,
                            height: 27,
                        }),
                    ],
                }),
                chart(c),
                TextLabel({
                    c,
                    text: '58/58 misses caught · 71 false alarms',
                    width: 484,
                    fontSize: 19,
                    color: c.positive,
                    align: 'center',
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
