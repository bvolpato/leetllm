import React from 'react'
import { BarChart, Column, Flow, Panel, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 820
export const alt =
    'Dual pipeline diagram contrasting buffered inline safety checks with sampled asynchronous judge scoring, paired with a calibration chart showing 75% human agreement falling short of the 80% threshold.'

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, 'default', { density: 2.25 })

    return (
        <Scene c={c} padding={4} gap={6} contentWidth={740} background="transparent" density={2.25}>
            <Column gap={6} align="center">
                <Panel
                    c={c}
                    title="Inline Safety Path vs Async Judge Audit"
                    subtitle="Fast guardrails run inline; deep rubrics run offline"
                    tone="blue"
                    padding={6}
                >
                    <Column gap={6} align="center">
                        <Flow
                            c={c}
                            direction="horizontal"
                            gap={6}
                            connectorLength={12}
                            stages={[
                                {
                                    title: 'Draft Reply',
                                    subtitle: 'Buffered text',
                                    tone: 'neutral',
                                    width: 196,
                                    padding: 5,
                                },
                                {
                                    title: 'Inline Guard',
                                    subtitle: 'Fast safety gate',
                                    tone: 'red',
                                    width: 196,
                                    padding: 5,
                                },
                                {
                                    title: 'User Release',
                                    subtitle: 'Low latency',
                                    tone: 'green',
                                    width: 196,
                                    padding: 5,
                                },
                            ]}
                        />
                        <Flow
                            c={c}
                            direction="horizontal"
                            gap={6}
                            connectorLength={12}
                            stages={[
                                {
                                    title: 'Trace Sample',
                                    subtitle: 'Async log copy',
                                    tone: 'purple',
                                    width: 196,
                                    padding: 5,
                                },
                                {
                                    title: 'Pinned Judge',
                                    subtitle: 'Rubric score',
                                    tone: 'blue',
                                    width: 196,
                                    padding: 5,
                                },
                                {
                                    title: 'Human Audit',
                                    subtitle: 'Tracks drift',
                                    tone: 'warm',
                                    width: 196,
                                    padding: 5,
                                },
                            ]}
                        />
                    </Column>
                </Panel>
                <Panel
                    c={c}
                    title="Human Calibration Check (6 / 8 = 75%)"
                    subtitle="Agreement drops below 80% gate and triggers recalibration"
                    tone="warm"
                    padding={6}
                >
                    <BarChart
                        c={c}
                        ariaLabel="Observed 75% judge-human agreement versus 80% minimum threshold"
                        width={650}
                        height={175}
                        min={0}
                        max={100}
                        showGrid
                        showValues
                        format={(v) => `${v.toFixed(0)}%`}
                        data={[
                            {
                                label: 'Observed (6/8)',
                                value: 75,
                                valueLabel: '75%',
                                color: c.critical,
                            },
                            {
                                label: 'Minimum Gate',
                                value: 80,
                                valueLabel: '80%',
                                color: c.positive,
                            },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
}

export default create('dark')
