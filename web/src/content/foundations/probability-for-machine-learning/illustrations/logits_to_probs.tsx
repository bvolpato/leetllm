import {
    AxisPlot,
    Column,
    FlowArrow,
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
    'Raw logits for result (2.0), value (1.2), None (0.1), and banana (-2.0) map through softmax to positive probabilities 0.618, 0.278, 0.092, and 0.011 summing to 1.000.'

export const width = 640
export const height = 500
export const preset = 'engineering'

const TOKENS = [
    { label: 'result', logit: 2.0, prob: 0.618, y: 4 },
    { label: 'value', logit: 1.2, prob: 0.278, y: 3 },
    { label: 'None', logit: 0.1, prob: 0.092, y: 2 },
    { label: 'banana', logit: -2.0, prob: 0.011, y: 1 },
]

const illustration = defineIllustration((c) => {
    const purple = getReadableToneColor('purple', c)
    const critical = getReadableToneColor('critical', c)

    return Scene({
        c,
        padding: 16,
        gap: 12,
        contentWidth: 608,
        align: 'center',
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Softmax Turns Raw Logits Into Probabilities',
                    fontSize: 23,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                Row({
                    gap: 8,
                    align: 'center',
                    justify: 'center',
                    children: [
                        preparePrintTypography(
                            Panel({
                                c,
                                title: 'Raw logits z ∈ (−∞, ∞)',
                                tone: 'blue',
                                padding: 12,
                                width: 264,
                                children: Column({
                                    gap: 6,
                                    align: 'center',
                                    children: [
                                        Row({
                                            gap: 6,
                                            align: 'center',
                                            children: [
                                                Column({
                                                    gap: 14,
                                                    align: 'end',
                                                    children: TOKENS.map((t) =>
                                                        TextLabel({
                                                            c,
                                                            text: `${t.label} ${t.logit > 0 ? `+${t.logit.toFixed(1)}` : t.logit.toFixed(1)}`,
                                                            fontSize: 20,
                                                            width: 128,
                                                            align: 'right',
                                                            color:
                                                                t.logit >= 0
                                                                    ? c.textSecondary
                                                                    : critical,
                                                        }),
                                                    ),
                                                }),
                                                AxisPlot({
                                                    c,
                                                    width: 106,
                                                    height: 176,
                                                    xMin: -2.4,
                                                    xMax: 2.4,
                                                    yMin: 0.4,
                                                    yMax: 4.6,
                                                    padding: 12,
                                                    showGrid: true,
                                                    gridCount: 5,
                                                    ariaLabel: 'Signed raw logits around zero',
                                                    paths: [
                                                        {
                                                            points: [
                                                                { x: 0, y: 0.4 },
                                                                { x: 0, y: 4.6 },
                                                            ],
                                                            color: c.textSecondary,
                                                            strokeWidth: 2,
                                                        },
                                                        ...TOKENS.map((t) => ({
                                                            points: [
                                                                { x: 0, y: t.y },
                                                                { x: t.logit, y: t.y },
                                                            ],
                                                            tone: (t.logit >= 0
                                                                ? 'blue'
                                                                : 'critical') as
                                                                'blue' | 'critical',
                                                            strokeWidth: 14,
                                                        })),
                                                    ],
                                                    points: TOKENS.map((t) => ({
                                                        x: t.logit,
                                                        y: t.y,
                                                        tone: (t.logit >= 0
                                                            ? 'blue'
                                                            : 'critical') as 'blue' | 'critical',
                                                        r: 4,
                                                    })),
                                                }),
                                            ],
                                        }),
                                        TextLabel({
                                            c,
                                            text: 'Order matches · no sum rule',
                                            fontSize: 20,
                                            color: c.textMuted,
                                        }),
                                    ],
                                }),
                            }),
                            20,
                        ),
                        preparePrintTypography(
                            FlowArrow({
                                c,
                                direction: 'right',
                                length: 40,
                                label: 'exp',
                                tone: 'purple',
                            }),
                            20,
                        ),
                        preparePrintTypography(
                            Panel({
                                c,
                                title: 'Softmax P(token)',
                                tone: 'purple',
                                padding: 12,
                                width: 274,
                                children: Column({
                                    gap: 6,
                                    align: 'center',
                                    children: [
                                        MiniBarChart({
                                            c,
                                            height: 186,
                                            max: 0.72,
                                            barWidth: 42,
                                            gap: 14,
                                            fontSize: 20,
                                            showValues: true,
                                            ariaLabel: 'Normalized softmax token probabilities',
                                            data: TOKENS.map((t) => ({
                                                label: t.label,
                                                value: t.prob,
                                                color: purple,
                                            })),
                                        }),
                                        TextLabel({
                                            c,
                                            text: 'sum = 1.000 · Δz=0.8 → 2.23×',
                                            fontSize: 20,
                                            color: purple,
                                        }),
                                    ],
                                }),
                            }),
                            20,
                        ),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
