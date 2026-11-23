import React from 'react'
import {
    BarChart,
    Column,
    IntervalPlot,
    Panel,
    Scene,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 810
export const alt =
    'Interval plot comparing valid user-clustered 95% confidence interval [0.63, 6.63] pp with artificially narrowed tripled-row interval [1.90, 5.36] pp, paired with standard error bars.'

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, 'default', { density: 2.25 })

    return (
        <Scene
            c={c}
            padding={8}
            gap={10}
            contentWidth={740}
            background="transparent"
            density={2.25}
        >
            <Column gap={10} align="center">
                <Panel
                    c={c}
                    title="95% Confidence Intervals (+3.63 pp Lift)"
                    subtitle="3 rows per user shrinks interval to 0.577x"
                    tone="blue"
                    padding={8}
                >
                    <IntervalPlot
                        c={c}
                        ariaLabel="Comparison of valid user-clustered versus tripled-row 95% intervals"
                        width={650}
                        height={215}
                        min={0}
                        max={8}
                        format={(v) => v.toFixed(1)}
                        axisLabel="Resolution Lift (pp)"
                        data={[
                            {
                                label: 'User',
                                low: 0.63,
                                mid: 3.63,
                                high: 6.63,
                                lowLabel: '+0.63',
                                midLabel: '+3.63',
                                highLabel: '+6.63',
                                color: c.primary,
                            },
                            {
                                label: 'Naive',
                                low: 1.9,
                                mid: 3.63,
                                high: 5.36,
                                lowLabel: '+1.90',
                                midLabel: '+3.63',
                                highLabel: '+5.36',
                                color: c.critical,
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Standard Error Shrinkage (1 / sqrt(3) = 0.577)"
                    subtitle="Values in percentage points (pp); narrow CI is spurious"
                    tone="red"
                    padding={8}
                >
                    <BarChart
                        c={c}
                        ariaLabel="Standard error and interval width comparison"
                        width={650}
                        height={180}
                        min={0}
                        max={8}
                        showGrid
                        showValues
                        format={(v) => v.toFixed(0)}
                        data={[
                            {
                                label: 'User SE',
                                value: 1.53,
                                valueLabel: '1.53 pp',
                                color: c.primary,
                            },
                            {
                                label: 'Naive SE',
                                value: 0.88,
                                valueLabel: '0.88 pp',
                                color: c.critical,
                            },
                            {
                                label: 'User Span',
                                value: 6.0,
                                valueLabel: '6.00 pp',
                                color: c.info,
                            },
                            {
                                label: 'Naive Span',
                                value: 3.46,
                                valueLabel: '3.46 pp',
                                color: c.warning,
                            },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
}

export default create('dark')
