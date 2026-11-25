import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 370
export const alt =
    'Four release thresholds evaluate a 7B distilled student: checked accuracy 0.92 clears the 0.90 floor (PASS), critical error rate 0.04 breaches the 0.02 ceiling (FAIL), latency 42 ms clears the 60 ms limit (PASS), and monthly serving cost 18,000 dollars clears the 20,000 dollar cap (PASS). Because every threshold must pass simultaneously, the critical error rate holds back deployment.'

const metrics = [
    {
        name: 'Checked accuracy',
        rule: 'floor ≥ 0.90',
        actualText: '0.92',
        min: 0.8,
        max: 1.0,
        minLbl: '0.80',
        maxLbl: '1.00',
        limit: 0.9,
        actual: 0.92,
        lowerBetter: false,
        pass: true,
    },
    {
        name: 'Critical error rate',
        rule: 'ceiling ≤ 0.02',
        actualText: '0.04',
        min: 0,
        max: 0.05,
        minLbl: '0.00',
        maxLbl: '0.05',
        limit: 0.02,
        actual: 0.04,
        lowerBetter: true,
        pass: false,
    },
    {
        name: 'p95 latency',
        rule: 'ceiling ≤ 60 ms',
        actualText: '42 ms',
        min: 0,
        max: 80,
        minLbl: '0 ms',
        maxLbl: '80 ms',
        limit: 60,
        actual: 42,
        lowerBetter: true,
        pass: true,
    },
    {
        name: 'Monthly serving cost',
        rule: 'ceiling ≤ $20k',
        actualText: '$18k',
        min: 0,
        max: 25000,
        minLbl: '$0',
        maxLbl: '$25k',
        limit: 20000,
        actual: 18000,
        lowerBetter: true,
        pass: true,
    },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const muted = c.textSecondary

    const trackX = 240
    const trackW = 310
    const valX = 636
    const pillX = 660

    // Column headers
    fig.text(24, 22, 'Metric & requirement', { size: 13, weight: 600, color: muted })
    fig.text(trackX + trackW / 2, 22, 'Shaded = passing region  ·  dot = 7B student', {
        size: 13,
        weight: 600,
        color: muted,
        align: 'center',
    })
    fig.text(valX, 22, 'Result', { size: 13, weight: 600, color: muted, align: 'right' })

    const rowYs = [74, 148, 222, 296]

    metrics.forEach((m, idx) => {
        const cy = rowYs[idx]!
        const color = m.pass ? green : red
        const mapX = (v: number) => trackX + ((v - m.min) / (m.max - m.min)) * trackW
        const limX = mapX(m.limit)
        const actX = mapX(m.actual)

        // Highlight failing row subtly
        if (!m.pass) {
            fig.rect(14, cy - 30, width - 28, 62, {
                fill: tint(red, c.bg, 0.08),
                stroke: tint(red, c.bg, 0.3),
                strokeWidth: 1,
                radius: 8,
            })
        }

        // Metric name & rule
        fig.text(24, cy - 9, m.name, {
            size: 15,
            weight: 700,
            color: m.pass ? c.textPrimary : red,
        })
        fig.text(24, cy + 12, m.rule, { size: 13, mono: true, color: muted })

        // Base track
        fig.rect(trackX, cy - 7, trackW, 14, {
            fill: tint(c.textMuted, c.bg, 0.1),
            radius: 4,
        })

        // Passing region shading
        if (m.lowerBetter) {
            fig.rect(trackX, cy - 7, limX - trackX, 14, {
                fill: tint(green, c.bg, 0.16),
                radius: 4,
            })
        } else {
            fig.rect(limX, cy - 7, trackX + trackW - limX, 14, {
                fill: tint(green, c.bg, 0.16),
                radius: 4,
            })
        }

        // Overshoot highlight on failing metric
        if (!m.pass) {
            fig.rect(limX, cy - 7, actX - limX, 14, {
                fill: tint(red, c.bg, 0.38),
                radius: 2,
            })
        }

        // Limit hairline
        fig.line(limX, cy - 15, limX, cy + 15, { color: c.textPrimary, width: 2 })

        // Student value bar & dot
        fig.line(trackX, cy, actX, cy, { color, width: 4 })
        fig.circle(actX, cy, 6, { fill: color, stroke: c.bg, width: 1.5 })

        // Min / Max ticks
        fig.text(trackX, cy + 20, m.minLbl, { size: 11, mono: true, color: muted })
        fig.text(trackX + trackW, cy + 20, m.maxLbl, {
            size: 11,
            mono: true,
            color: muted,
            align: 'right',
        })

        // Actual numeric value + PASS/FAIL pill
        fig.text(valX, cy, m.actualText, {
            size: 15,
            mono: true,
            weight: 700,
            color,
            align: 'right',
        })
        fig.rect(pillX, cy - 13, 74, 26, {
            fill: tint(color, c.bg, 0.16),
            stroke: color,
            strokeWidth: 1.4,
            radius: 13,
        })
        fig.text(pillX + 37, cy, m.pass ? 'PASS' : 'FAIL', {
            size: 13,
            weight: 700,
            color,
            align: 'center',
        })
    })

    fig.text(
        width / 2,
        352,
        'Deployment blocked: critical error rate (0.04) exceeds 0.02 ceiling despite speed and cost wins.',
        { size: 13, weight: 600, color: red, align: 'center' },
    )

    return fig.render()
}

export default create('dark')
