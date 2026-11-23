import React from 'react'
import { IntervalPlot, Scene, StackedBar, defineIllustration, getReadableToneColor } from 'vizmatic'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 880
export const height = 620

export const alt =
    'Left chart shows 95% Wilson intervals around a 16% observed rate narrowing as sample size grows from 100 to 10,000 (widths: 14.3 pp, 4.5 pp, 1.4 pp). Right chart illustrates sampling bias: evaluating only the domestic cohort (12% rate) underestimates the overall flagged-queue abuse rate (17.6% across domestic, international, and high-value tiers) by 5.6 percentage points.'

const intervalRows = [
    { n: '100', width: '14.3 pp', low: 0.101, high: 0.244 },
    { n: '1,000', width: '4.5 pp', low: 0.139, high: 0.184 },
    { n: '10,000', width: '1.4 pp', low: 0.153, high: 0.167 },
]

const slices = [
    { label: 'Routine domestic', share: 70, count: 84, tone: 'blue' as const },
    { label: 'International', share: 20, count: 50, tone: 'warm' as const },
    { label: 'High-value tier', share: 10, count: 42, tone: 'critical' as const },
]

function Label({
    children,
    size,
    color,
    weight = 500,
}: {
    children: React.ReactNode
    size: number
    color: string
    weight?: number
}) {
    return (
        <div
            style={{
                color,
                fontFamily: 'Inter',
                fontSize: size,
                fontWeight: weight,
                lineHeight: 1.2,
            }}
        >
            {children}
        </div>
    )
}

const illustration = defineIllustration((c) => {
    const domesticColor = getReadableToneColor('warm', c)
    const queueColor = getReadableToneColor('cyan', c)
    const intervalColor = getReadableToneColor('green', c)
    const sliceColors = [
        getReadableToneColor('blue', c),
        getReadableToneColor('warm', c),
        getReadableToneColor('critical', c),
    ]

    const intervalChart = preparePrintTypography(
        IntervalPlot({
            data: intervalRows.map((row) => ({
                label: `n=${row.n}`,
                low: row.low,
                mid: 0.16,
                high: row.high,
                color: intervalColor,
                lowLabel: `${(row.low * 100).toFixed(1)}%`,
                midLabel: '16%',
                highLabel: `${(row.high * 100).toFixed(1)}%`,
            })),
            c,
            width: 390,
            height: 250,
            min: 0.08,
            max: 0.28,
            format: (value) => `${(value * 100).toFixed(0)}%`,
        }),
        18,
    )

    const populationBar = preparePrintTypography(
        StackedBar({
            width: 390,
            height: 28,
            showLegend: false,
            c,
            segments: slices.map((item, index) => ({
                label: item.label,
                value: item.share,
                color: sliceColors[index],
                valueLabel: `${item.share}%`,
            })),
        }),
        18,
    )

    const biasPlot = preparePrintTypography(
        IntervalPlot({
            data: [
                {
                    label: 'Domestic only',
                    low: 0.12,
                    mid: 0.12,
                    high: 0.12,
                    color: domesticColor,
                    lowLabel: '12.0%',
                    midLabel: '',
                    highLabel: '',
                },
                {
                    label: 'Full population',
                    low: 0.176,
                    mid: 0.176,
                    high: 0.176,
                    color: queueColor,
                    lowLabel: '17.6%',
                    midLabel: '',
                    highLabel: '',
                },
            ],
            c,
            width: 390,
            height: 180,
            min: 0,
            max: 0.3,
            format: (value) => `${(value * 100).toFixed(0)}%`,
        }),
        18,
    )

    return (
        <Scene c={c} padding={20} contentWidth={840} gap={10} align="center">
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    width: '100%',
                }}
            >
                <Label size={26} color={c.textPrimary} weight={800}>
                    Sample Size Precision vs. Sampling Bias
                </Label>
                <div
                    style={{
                        display: 'flex',
                        gap: 30,
                        width: '100%',
                        alignItems: 'flex-start',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            width: 405,
                        }}
                    >
                        <Label size={20} color={c.textPrimary} weight={700}>
                            Variance: Intervals Narrow with Sample Size
                        </Label>
                        <Label size={16} color={c.textSecondary}>
                            95% Wilson score intervals around observed 16% rate.
                        </Label>
                        {intervalChart}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {intervalRows.map((r) => (
                                <Label key={r.n} size={15} color={c.textSecondary}>
                                    n = {r.n}: interval width = {r.width}
                                </Label>
                            ))}
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            width: 405,
                        }}
                    >
                        <Label size={20} color={c.textPrimary} weight={700}>
                            Bias: Subgroup Skew Distorts Estimates
                        </Label>
                        <Label size={16} color={c.textSecondary}>
                            Population distribution across cohorts (1,000 requests):
                        </Label>
                        {populationBar}
                        {biasPlot}
                        <Label size={16} color={domesticColor} weight={700}>
                            Evaluating only domestic cohort yields -5.6 pp systematic bias.
                        </Label>
                    </div>
                </div>
            </div>
        </Scene>
    )
})

export const create = illustration.create
