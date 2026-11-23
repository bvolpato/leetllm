import React from 'react'
import { BarChart, Column, Matrix, Panel, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 740
export const alt =
    'Bar chart showing Assigned B intention-to-treat resolution at 33.3% versus biased Served-only B at 100%, paired with an attribution matrix keeping fallback and timeout trials in Arm B.'

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
                    title="Intention-to-Treat vs Served-Only Resolution"
                    subtitle="Dropping B's fallback and timeout creates fake 100% win rate"
                    tone="blue"
                    padding={8}
                >
                    <BarChart
                        c={c}
                        ariaLabel="Resolution rates across assigned A, assigned B, and filtered served B"
                        width={650}
                        height={175}
                        min={0}
                        max={115}
                        showGrid
                        showValues
                        format={(v) => `${v.toFixed(0)}%`}
                        data={[
                            {
                                label: 'Assigned A (2/3)',
                                value: 66.7,
                                valueLabel: '66.7%',
                                color: c.primary,
                            },
                            {
                                label: 'Assigned B ITT (1/3)',
                                value: 33.3,
                                valueLabel: '33.3%',
                                color: c.positive,
                            },
                            {
                                label: 'Served B Filter (1/1)',
                                value: 100.0,
                                valueLabel: '100.0%',
                                color: c.critical,
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Arm B Trial Accounting (1 = Included in Denominator)"
                    subtitle="Fallback and timeout must stay attached to assigned Arm B"
                    tone="red"
                    padding={8}
                >
                    <Matrix
                        c={c}
                        ariaLabel="Trial outcome accounting for Arm B"
                        rowLabels={['Trial t1', 'Trial t2 (fb)', 'Trial t3 (err)']}
                        colLabels={['Assigned', 'Served', 'In ITT', 'Outcome']}
                        cellWidth={86}
                        cellHeight={38}
                        rowLabelWidth={138}
                        fontSize={23}
                        colorize
                        colorScale="strength"
                        colorDomain={[0, 1]}
                        data={[
                            [1, 1, 1, 1],
                            [1, 0, 1, 0],
                            [1, 0, 1, 0],
                        ]}
                        labels={[
                            ['B', 'B', 'Yes', 'Win'],
                            ['B', 'A (fb)', 'Yes', 'Fail'],
                            ['B', 'None', 'Yes', 'Fail'],
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
}

export default create('dark')
