import React from 'react'
import { IntervalPlot, Scene, defineIllustration, getReadableToneColor } from 'vizmatic'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 860
export const height = 580

export const alt =
    'Unified comparison of Wald and Wilson 95% confidence intervals across three sample regimes: 16 of 100, 0 of 10, and 10 of 10 events. At both boundary cases (0/10 and 10/10), the Wald interval collapses to a degenerate single point, whereas the Wilson score interval maintains nonzero width.'

const cases = [
    { label: '16/100 (Wald)', low: 0.088, mid: 0.16, high: 0.232, tone: 'warm' as const },
    { label: '16/100 (Wilson)', low: 0.101, mid: 0.16, high: 0.244, tone: 'cyan' as const },
    { label: '0/10 (Wald)', low: 0.0, mid: 0.0, high: 0.0, tone: 'warm' as const },
    { label: '0/10 (Wilson)', low: 0.0, mid: 0.0, high: 0.278, tone: 'cyan' as const },
    { label: '10/10 (Wald)', low: 1.0, mid: 1.0, high: 1.0, tone: 'warm' as const },
    { label: '10/10 (Wilson)', low: 0.722, mid: 1.0, high: 1.0, tone: 'cyan' as const },
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
    const waldColor = getReadableToneColor('warm', c)
    const wilsonColor = getReadableToneColor('cyan', c)

    const plotData = cases.map((item) => ({
        label: item.label,
        low: item.low,
        mid: item.mid,
        high: item.high,
        color: item.tone === 'warm' ? waldColor : wilsonColor,
        lowLabel: '',
        midLabel: '',
        highLabel: '',
    }))

    const chart = preparePrintTypography(
        IntervalPlot({
            data: plotData,
            c,
            width: 620,
            height: 320,
            min: 0,
            max: 1,
            format: (value) => `${(value * 100).toFixed(0)}%`,
        }),
        18,
    )

    return (
        <Scene c={c} padding={24} contentWidth={812} gap={10} align="center">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                <Label size={26} color={c.textPrimary} weight={800}>
                    Confidence Intervals: Wald vs. Wilson Score Method
                </Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                            style={{
                                width: 18,
                                height: 6,
                                borderRadius: 4,
                                backgroundColor: waldColor,
                            }}
                        />
                        <Label size={18} color={waldColor} weight={700}>
                            Wald Interval
                        </Label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                            style={{
                                width: 18,
                                height: 6,
                                borderRadius: 4,
                                backgroundColor: wilsonColor,
                            }}
                        />
                        <Label size={18} color={wilsonColor} weight={700}>
                            Wilson Score Interval
                        </Label>
                    </div>
                </div>
                {chart}
                <Label size={17} color={c.textSecondary}>
                    At 0/10 and 10/10, Wald collapses to zero width (0.0% and 100.0%), falsely
                    claiming certainty. Wilson preserves realistic uncertainty bounds.
                </Label>
            </div>
        </Scene>
    )
})

export const create = illustration.create
