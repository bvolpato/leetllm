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
    'Interval plot of safety rate difference [-0.12, +0.02] pp crossing the -0.05 pp non-inferiority margin, paired with a latency bar chart showing both arms exceeding the 3.0 s limit at 3.5 s.'

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
                    title="Non-Inferiority Margin (Safety Delta)"
                    subtitle="CI includes 0 yet crosses -0.05 pp harm limit"
                    tone="warm"
                    padding={8}
                >
                    <IntervalPlot
                        c={c}
                        ariaLabel="Safety rate difference confidence interval versus -0.05 pp margin"
                        width={650}
                        height={215}
                        min={-0.16}
                        max={0.08}
                        format={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`}
                        axisLabel="Safety Delta (pp)"
                        data={[
                            {
                                label: 'Arm B CI',
                                low: -0.12,
                                mid: -0.05,
                                high: 0.02,
                                lowLabel: '-0.12',
                                midLabel: '-0.05',
                                highLabel: '+0.02',
                                color: c.critical,
                            },
                            {
                                label: 'Safe Zone',
                                low: -0.05,
                                mid: 0.015,
                                high: 0.08,
                                lowLabel: '-0.05',
                                midLabel: '+0.015',
                                highLabel: '+0.08',
                                color: c.positive,
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Absolute SLA Guardrail (p95 Latency, sec)"
                    subtitle="Zero relative delta still breaks 3.0s ceiling"
                    tone="red"
                    padding={8}
                >
                    <BarChart
                        c={c}
                        ariaLabel="Prompt A and Prompt B p95 latency compared to 3.0 second limit"
                        width={650}
                        height={180}
                        min={0}
                        max={4.5}
                        showGrid
                        showValues
                        format={(v) => v.toFixed(1)}
                        data={[
                            {
                                label: '3.0s Limit',
                                value: 3.0,
                                valueLabel: '3.0s',
                                color: c.warning,
                            },
                            {
                                label: 'Prompt A',
                                value: 3.5,
                                valueLabel: '3.5s Fail',
                                color: c.critical,
                            },
                            {
                                label: 'Prompt B',
                                value: 3.5,
                                valueLabel: '3.5s Fail',
                                color: c.critical,
                            },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
}

export default create('dark')
