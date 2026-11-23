import React from 'react'
import { Column, Flow, Matrix, Panel, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 740
export const alt =
    'Matrix tracking guardrail breach streaks across Windows 1 to 3 for latency, error rate, and cost, plus a state flow showing immediate pause on missing telemetry.'

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
                    title="Guardrail Breach Windows (Limit = 2 Consecutive)"
                    subtitle="Healthy windows reset streak; missing data pauses at once"
                    tone="red"
                    padding={8}
                >
                    <Matrix
                        c={c}
                        ariaLabel="Guardrail states across windows 1, 2, and 3"
                        rowLabels={['Latency (3s)', 'Error (.001)', 'Cost ($0.08)']}
                        colLabels={['W1', 'W2', 'W3', 'Final']}
                        cellWidth={122}
                        cellHeight={42}
                        rowLabelWidth={138}
                        fontSize={23}
                        colorize
                        colorScale="heat"
                        colorDomain={[0, 2]}
                        data={[
                            [1, 2, 0, 0],
                            [1, 2, 0, 0],
                            [1, 2, 2, 2],
                        ]}
                        labels={[
                            ['Breach', 'Pause', '2.5s', 'Streak 0'],
                            ['Breach', 'Rollbk', '.0005', 'Streak 0'],
                            ['Breach', 'Review', 'Miss', 'Pause!'],
                        ]}
                    />
                </Panel>
                <Flow
                    c={c}
                    direction="horizontal"
                    gap={8}
                    connectorLength={16}
                    stages={[
                        {
                            title: 'Window 1',
                            subtitle: 'Streak 1 -> alert',
                            tone: 'warm',
                            width: 210,
                            padding: 8,
                        },
                        {
                            title: 'Window 2',
                            subtitle: 'Streak 2 -> act',
                            tone: 'red',
                            width: 210,
                            padding: 8,
                        },
                        {
                            title: 'Window 3',
                            subtitle: 'Missing -> pause',
                            tone: 'purple',
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
