import {
    AxisPlot,
    Column,
    MiniBarChart,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const alt =
    'Four sequential token probabilities (0.40, 0.75, 0.80, 0.90) shrink prefix joint probability to 0.216, while log sum equals -1.532 nats. Across 200 tokens at p = 0.01, base-10 log mass drops to -400 below float64 floor -324, underflowing products to 0.0 while log sum stays -921 nats.'

export const width = 640
export const height = 620
export const preset = 'engineering'

const STEPS = [
    { token: 'The', joint: 0.4 },
    { token: 'model', joint: 0.3 },
    { token: 'writes', joint: 0.24 },
    { token: 'code', joint: 0.216 },
]

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const critical = getReadableToneColor('critical', c)
    const purple = getReadableToneColor('purple', c)

    return Scene({
        c,
        padding: 16,
        gap: 10,
        contentWidth: 608,
        align: 'center',
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Products Underflow While Log Sums Stay Finite',
                    fontSize: 23,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                preparePrintTypography(
                    Panel({
                        c,
                        title: 'Chain rule prefix P(t₁…tₖ) over 4 tokens',
                        tone: 'blue',
                        padding: 12,
                        width: 590,
                        children: Column({
                            gap: 6,
                            align: 'center',
                            children: [
                                MiniBarChart({
                                    c,
                                    height: 138,
                                    max: 0.45,
                                    barWidth: 78,
                                    gap: 28,
                                    fontSize: 20,
                                    showValues: true,
                                    ariaLabel: 'Prefix joint probabilities along four tokens',
                                    data: STEPS.map((s) => ({
                                        label: s.token,
                                        value: s.joint,
                                        color: blue,
                                    })),
                                }),
                                Row({
                                    gap: 16,
                                    align: 'center',
                                    children: [
                                        TextLabel({
                                            c,
                                            text: 'p₁·p₂·p₃·p₄ = 0.216',
                                            fontSize: 20,
                                            color: c.textSecondary,
                                        }),
                                        TextLabel({
                                            c,
                                            text: 'NLL = 1.532 nats (0.383/tok)',
                                            fontSize: 20,
                                            color: purple,
                                            fontWeight: 650,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    }),
                    20,
                ),
                preparePrintTypography(
                    Panel({
                        c,
                        title: '200 tokens at p = 0.01: log₁₀ P vs. float64 floor',
                        padding: 12,
                        width: 590,
                        children: Column({
                            gap: 4,
                            align: 'center',
                            children: [
                                Row({
                                    gap: 8,
                                    align: 'center',
                                    children: [
                                        Column({
                                            gap: 38,
                                            align: 'end',
                                            children: [
                                                TextLabel({
                                                    c,
                                                    text: '0',
                                                    fontSize: 20,
                                                    width: 58,
                                                    align: 'right',
                                                    color: c.textSecondary,
                                                }),
                                                TextLabel({
                                                    c,
                                                    text: '−324',
                                                    fontSize: 20,
                                                    width: 58,
                                                    align: 'right',
                                                    color: critical,
                                                }),
                                                TextLabel({
                                                    c,
                                                    text: '−400',
                                                    fontSize: 20,
                                                    width: 58,
                                                    align: 'right',
                                                    color: c.textSecondary,
                                                }),
                                            ],
                                        }),
                                        AxisPlot({
                                            c,
                                            width: 486,
                                            height: 168,
                                            xMin: 0,
                                            xMax: 210,
                                            yMin: -420,
                                            yMax: 20,
                                            padding: 14,
                                            showGrid: true,
                                            gridCount: 5,
                                            ariaLabel:
                                                'Base-10 exponent crossing float64 minimum -324',
                                            paths: [
                                                {
                                                    points: [
                                                        { x: 0, y: -324 },
                                                        { x: 210, y: -324 },
                                                    ],
                                                    tone: 'critical',
                                                    strokeWidth: 2,
                                                    dashed: true,
                                                },
                                                {
                                                    points: [
                                                        { x: 0, y: 0 },
                                                        { x: 200, y: -400 },
                                                    ],
                                                    tone: 'blue',
                                                    strokeWidth: 4,
                                                },
                                            ],
                                            points: [
                                                { x: 162, y: -324, tone: 'critical', r: 6 },
                                                { x: 200, y: -400, tone: 'blue', r: 6 },
                                            ],
                                        }),
                                    ],
                                }),
                                TextLabel({
                                    c,
                                    text: 'At n = 200: 0.01²⁰⁰ → 0.0 in float64, log sum = −921.0 nats',
                                    fontSize: 20,
                                    color: critical,
                                }),
                            ],
                        }),
                    }),
                    20,
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
