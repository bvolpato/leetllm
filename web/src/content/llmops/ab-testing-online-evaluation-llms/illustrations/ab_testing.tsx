import React from 'react'
import { BarChart, Column, Flow, Panel, Row, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 650
export const alt =
    'Bar charts comparing Prompt A and Prompt B resolution lift against three guardrail budget limits, ending in a release hold.'

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, 'default', { density: 2.3 })

    return (
        <Scene c={c} padding={8} gap={12} contentWidth={740} background="transparent" density={2.3}>
            <Column gap={12} align="center">
                <Row gap={10} align="stretch">
                    <Panel
                        c={c}
                        title="Resolution"
                        subtitle="Arm B +3.2 pp"
                        tone="blue"
                        padding={8}
                    >
                        <BarChart
                            c={c}
                            ariaLabel="Primary resolution rate comparison"
                            width={295}
                            height={240}
                            min={45}
                            max={75}
                            showGrid
                            showValues
                            format={(v) => `${v.toFixed(0)}%`}
                            data={[
                                {
                                    label: 'Arm A',
                                    value: 60.0,
                                    valueLabel: '60.0%',
                                    color: c.neutralLight,
                                },
                                {
                                    label: 'Arm B',
                                    value: 63.2,
                                    valueLabel: '63.2%',
                                    color: c.primary,
                                },
                            ]}
                        />
                    </Panel>
                    <Panel
                        c={c}
                        title="Guardrail Budget Usage"
                        subtitle="100% marks release threshold"
                        tone="red"
                        padding={8}
                    >
                        <BarChart
                            c={c}
                            ariaLabel="Guardrail metrics as percentage of budget limit"
                            width={325}
                            height={240}
                            min={0}
                            max={300}
                            showGrid
                            showValues
                            format={(v) => `${Math.round(v)}%`}
                            data={[
                                {
                                    label: 'Safety',
                                    value: 200,
                                    valueLabel: '2.0x',
                                    color: c.critical,
                                },
                                {
                                    label: 'Lat p95',
                                    value: 137,
                                    valueLabel: '+410ms',
                                    color: c.critical,
                                },
                                {
                                    label: 'Cost',
                                    value: 180,
                                    valueLabel: '+$0.018',
                                    color: c.critical,
                                },
                            ]}
                        />
                    </Panel>
                </Row>
                <Flow
                    c={c}
                    direction="horizontal"
                    gap={8}
                    connectorLength={16}
                    stages={[
                        {
                            title: 'Primary Lift',
                            subtitle: '+3.2 pp pass',
                            tone: 'blue',
                            width: 210,
                            padding: 8,
                        },
                        {
                            title: 'Guardrails',
                            subtitle: '3 limits over',
                            tone: 'red',
                            width: 210,
                            padding: 8,
                        },
                        {
                            title: 'Decision',
                            subtitle: 'Hold Arm B',
                            tone: 'warm',
                            width: 210,
                            padding: 8,
                        },
                    ]}
                />
            </Column>
        </Scene>
    )
}

export default create('dark')
