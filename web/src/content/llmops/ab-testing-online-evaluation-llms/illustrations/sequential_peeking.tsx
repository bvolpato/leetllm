import React from 'react'
import { BarChart, Column, LineChart, Panel, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 740
export const alt =
    'Line chart of p-values across four sequential looks compared against the naive 0.05 cutoff and the planned 0.0125 sequential bound, paired with look-by-look p-value bars.'

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
                    title="Sequential Looks vs Stop Thresholds"
                    subtitle="Naive 0.05 stops at L2; planned 0.0125 waits for L3"
                    tone="blue"
                    padding={8}
                >
                    <LineChart
                        c={c}
                        ariaLabel="Sequential p-values across four looks against 0.05 and 0.0125 limits"
                        width={650}
                        height={175}
                        min={0}
                        max={0.25}
                        showGrid
                        showPoints
                        directLabels={false}
                        labels={['Look 1', 'Look 2', 'Look 3', 'Look 4']}
                        format={(v) => v.toFixed(2)}
                        series={[
                            {
                                name: 'Observed p',
                                points: [0.23, 0.036, 0.008, 0.02],
                                color: c.primary,
                            },
                            {
                                name: 'Naive 0.05',
                                points: [0.05, 0.05, 0.05, 0.05],
                                color: c.critical,
                            },
                            {
                                name: 'Bound 0.0125',
                                points: [0.0125, 0.0125, 0.0125, 0.0125],
                                color: c.positive,
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Observed Look p-Values (alpha <= 0.05)"
                    subtitle="Only Look 3 (0.008) crosses the planned 0.0125 cutoff"
                    tone="green"
                    padding={8}
                >
                    <BarChart
                        c={c}
                        ariaLabel="Bar chart of p-values at looks 1 through 4"
                        width={650}
                        height={165}
                        min={0}
                        max={0.28}
                        showGrid
                        showValues
                        format={(v) => v.toFixed(2)}
                        data={[
                            {
                                label: 'Look 1',
                                value: 0.23,
                                valueLabel: '.230',
                                color: c.neutralLight,
                            },
                            { label: 'Look 2', value: 0.036, valueLabel: '.036', color: c.warning },
                            {
                                label: 'Look 3',
                                value: 0.008,
                                valueLabel: '.008',
                                color: c.positive,
                            },
                            { label: 'Look 4', value: 0.02, valueLabel: '.020', color: c.primary },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
}

export default create('dark')
