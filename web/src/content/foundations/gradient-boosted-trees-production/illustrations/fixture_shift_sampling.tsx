import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'For the same job features, the May environment adds 0.18 to the logit, so sigmoid of F plus 0.18 gives higher expected miss risk than sigmoid of F. The seeded samples contain 119 misses in 360 January-to-March rows, 58 in 140 April rows, and 55 in 140 May rows. The lower sampled May count reflects different rows and random draws, not a reversal of the per-row shift.'
export const width = 820
export const height = 520

const samples = [
    { month: 'Jan–Mar', missed: 119, rows: 360, x: 1, tone: 'cyan' as const },
    { month: 'April', missed: 58, rows: 140, x: 2, tone: 'purple' as const },
    { month: 'May', missed: 55, rows: 140, x: 3, tone: 'warm' as const },
]

function rateChart(c: ThemeColors) {
    const left = 68
    const top = 34
    const width = 360
    const height = 260
    const padding = 34
    const rates = samples.map((sample) => sample.missed / sample.rows)
    const x = (value: number) => left + padding + (value / 4) * (width - padding * 2)
    const y = (value: number) => top + padding + ((0.5 - value) / 0.5) * (height - padding * 2)
    const label = (
        text: string,
        xPos: number,
        yPos: number,
        boxWidth: number,
        color = c.textSecondary,
        fontSize = 17,
    ) =>
        CanvasItem({
            x: xPos,
            y: yPos,
            width: boxWidth,
            height: 26,
            children: TextLabel({
                c,
                text,
                width: boxWidth,
                fontSize,
                color,
                mono: true,
                align: 'center',
            }),
        })

    return Board({
        c,
        width: 440,
        height: 340,
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
                    xMax: 4,
                    yMin: 0,
                    yMax: 0.5,
                    showAxes: false,
                    showGrid: false,
                    frameFill: c.bgSubtle,
                    frameStroke: c.borderSubtle,
                    paths: [
                        ...[0.25, 0.5].map((value) => ({
                            points: [
                                { x: 0, y: value },
                                { x: 4, y: value },
                            ],
                            color: c.borderSubtle,
                            strokeWidth: 1,
                        })),
                        ...samples.map((sample, index) => ({
                            points: [
                                { x: sample.x, y: 0 },
                                { x: sample.x, y: rates[index] },
                            ],
                            tone: sample.tone,
                            strokeWidth: 36,
                        })),
                    ],
                }),
            }),
            ...[0, 0.25, 0.5].map((value) =>
                label(`${Math.round(value * 100)}%`, 0, y(value) - 12, left - 12, c.textSecondary),
            ),
            ...samples.flatMap((sample) => [
                label(
                    `${sample.missed}/${sample.rows}`,
                    x(sample.x) - 38,
                    12,
                    76,
                    c.textPrimary,
                    18,
                ),
                label(sample.month, x(sample.x) - 48, 304, 96, c.textPrimary),
            ]),
        ],
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 12,
        align: 'center',
        contentWidth: 784,
        title: 'A Risk Shift Can Hide in One Sample',
        subtitle: 'The synthetic May split shifts risk before its outcomes are drawn.',
        children: Row({
            width: 784,
            gap: 16,
            align: 'center',
            justify: 'space-between',
            children: [
                Panel({
                    c,
                    width: 320,
                    padding: 16,
                    gap: 12,
                    tone: 'warm',
                    title: 'Per-row logit shift',
                    titleFontSize: 19,
                    children: Column({
                        gap: 10,
                        align: 'center',
                        children: [
                            Row({
                                gap: 8,
                                justify: 'center',
                                align: 'center',
                                children: [
                                    TextLabel({
                                        c,
                                        text: 'F',
                                        fontSize: 22,
                                        fontWeight: 750,
                                        mono: true,
                                        color: c.textSecondary,
                                    }),
                                    FlowArrow({ c, direction: 'right', length: 110, tone: 'warm' }),
                                    TextLabel({
                                        c,
                                        text: 'F + 0.18',
                                        fontSize: 22,
                                        fontWeight: 750,
                                        mono: true,
                                        color: c.warningDark,
                                    }),
                                ],
                            }),
                            TextLabel({
                                c,
                                text: 'σ(F + 0.18) > σ(F)',
                                width: 280,
                                fontSize: 18,
                                fontWeight: 700,
                                mono: true,
                                color: c.textPrimary,
                                align: 'center',
                            }),
                            TextLabel({
                                c,
                                text: 'Higher expected miss risk for identical input features.',
                                width: 280,
                                fontSize: 16,
                                color: c.textSecondary,
                                align: 'center',
                            }),
                            TextLabel({
                                c,
                                text: 'Delayed operational drift shifts the underlying distribution before outcomes are observed.',
                                width: 280,
                                fontSize: 15,
                                color: c.textSecondary,
                                align: 'center',
                            }),
                        ],
                    }),
                }),
                Column({
                    width: 448,
                    gap: 6,
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Seeded monthly sample outcomes',
                            width: 448,
                            fontSize: 19,
                            fontWeight: 700,
                            color: c.textPrimary,
                            align: 'center',
                        }),
                        TextLabel({
                            c,
                            text: 'Finite sample draws fluctuate around the true shifted risk.',
                            width: 448,
                            fontSize: 16,
                            color: c.textSecondary,
                            align: 'center',
                        }),
                        rateChart(c),
                    ],
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
