import React from 'react'
import { BarChart, Column, Panel, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 740
export const alt =
    'Stacked bar charts comparing normal 5,040 versus 4,960 traffic split against skewed 5,250 versus 4,750 split, showing chi-square jumping to 25.00 past the 10.83 threshold.'

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
                    title="Observed Arm Counts (Expected 5,000 / 5,000)"
                    subtitle="Normal noise stays balanced; skew splits 5,250 vs 4,750"
                    tone="blue"
                    padding={8}
                >
                    <BarChart
                        c={c}
                        ariaLabel="Observed counts across normal and skewed splits"
                        width={650}
                        height={170}
                        min={4400}
                        max={5500}
                        showGrid
                        showValues
                        format={(v) => `${(v / 1000).toFixed(1)}k`}
                        data={[
                            { label: 'Ok A', value: 5040, valueLabel: '5,040', color: c.positive },
                            { label: 'Ok B', value: 4960, valueLabel: '4,960', color: c.info },
                            { label: 'SRM A', value: 5250, valueLabel: '5,250', color: c.critical },
                            { label: 'SRM B', value: 4750, valueLabel: '4,750', color: c.warning },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Chi-Square Gate (alpha = 0.001, Cutoff = 10.83)"
                    subtitle="Skewed split reaches 25.00 (p = 5.7e-7) and halts readout"
                    tone="red"
                    padding={8}
                >
                    <BarChart
                        c={c}
                        ariaLabel="Chi-square statistics compared against 10.83 threshold"
                        width={650}
                        height={165}
                        min={0}
                        max={30}
                        showGrid
                        showValues
                        format={(v) => v.toFixed(0)}
                        data={[
                            {
                                label: 'Normal Drift',
                                value: 0.64,
                                valueLabel: '0.64',
                                color: c.positive,
                            },
                            {
                                label: '0.001 Gate',
                                value: 10.83,
                                valueLabel: '10.83',
                                color: c.warning,
                            },
                            {
                                label: 'Skewed SRM',
                                value: 25.0,
                                valueLabel: '25.00',
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
