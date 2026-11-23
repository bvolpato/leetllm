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
    'Bayesian posterior P(abuse given flag) rises from 16.1 percent at 1 percent base rate to 67.9 percent at 10 percent and 95.0 percent at 50 percent, even when detector recall remains 95 percent and false-positive rate remains 5 percent.'

export const width = 640
export const height = 620
export const preset = 'engineering'

function posteriorPct(priorPct: number): number {
    const p = priorPct / 100
    const tp = 0.95 * p
    const fp = 0.05 * (1 - p)
    return Number(((tp / (tp + fp)) * 100).toFixed(1))
}

const CURVE = Array.from({ length: 51 }, (_, k) => ({ x: k, y: k === 0 ? 0 : posteriorPct(k) }))
const BARS = [1, 5, 10, 50]

const illustration = defineIllustration((c) => {
    const purple = getReadableToneColor('purple', c)
    const critical = getReadableToneColor('critical', c)

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
                    text: 'Same Detector, Different Base Rate',
                    fontSize: 24,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Fixed TPR = 95%, FPR = 5%: posterior tracks prior',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                preparePrintTypography(
                    Panel({
                        c,
                        title: 'Posterior P(abuse | flag) across 0–50% priors',
                        tone: 'purple',
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
                                            gap: 50,
                                            align: 'end',
                                            children: [
                                                TextLabel({
                                                    c,
                                                    text: '100%',
                                                    fontSize: 20,
                                                    width: 58,
                                                    align: 'right',
                                                    color: c.textSecondary,
                                                }),
                                                TextLabel({
                                                    c,
                                                    text: '50%',
                                                    fontSize: 20,
                                                    width: 58,
                                                    align: 'right',
                                                    color: c.textSecondary,
                                                }),
                                                TextLabel({
                                                    c,
                                                    text: '0%',
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
                                            height: 190,
                                            xMin: 0,
                                            xMax: 52,
                                            yMin: -4,
                                            yMax: 105,
                                            padding: 16,
                                            showGrid: true,
                                            gridCount: 5,
                                            ariaLabel: 'Posterior curve rising steeply with prior',
                                            paths: [
                                                {
                                                    points: [
                                                        { x: 0, y: 95 },
                                                        { x: 52, y: 95 },
                                                    ],
                                                    tone: 'critical',
                                                    strokeWidth: 2,
                                                    dashed: true,
                                                },
                                                { points: CURVE, tone: 'purple', strokeWidth: 4 },
                                            ],
                                            points: [1, 10, 50].map((k) => ({
                                                x: k,
                                                y: posteriorPct(k),
                                                tone: 'purple',
                                                r: 6,
                                            })),
                                        }),
                                    ],
                                }),
                                Row({
                                    gap: 18,
                                    align: 'center',
                                    children: [
                                        TextLabel({
                                            c,
                                            text: 'Solid: posterior curve',
                                            fontSize: 20,
                                            color: purple,
                                        }),
                                        TextLabel({
                                            c,
                                            text: 'Dashed: TPR = 95% recall',
                                            fontSize: 20,
                                            color: critical,
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
                        title: 'Posterior P(abuse | flag) at key base rates (%)',
                        padding: 12,
                        width: 590,
                        children: Column({
                            gap: 4,
                            align: 'center',
                            children: [
                                MiniBarChart({
                                    c,
                                    height: 146,
                                    max: 105,
                                    barWidth: 74,
                                    gap: 32,
                                    fontSize: 20,
                                    showValues: true,
                                    ariaLabel:
                                        'Posterior percentage at 1, 5, 10, and 50 percent priors',
                                    data: BARS.map((p) => ({
                                        label: `${p}% prior`,
                                        value: posteriorPct(p),
                                        color: purple,
                                    })),
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
