import React from 'react'
import { Column, Flow, Matrix, Panel, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 650
export const alt =
    'Four-stage progressive rollout flow from offline screening through shadow mirroring and canary guardrails to pinned A/B, paired with an operational safety matrix.'

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, 'default', { density: 2.2 })

    return (
        <Scene c={c} padding={8} gap={12} contentWidth={740} background="transparent" density={2.2}>
            <Column gap={12} align="center">
                <Panel
                    c={c}
                    title="Progressive Exposure Pipeline"
                    subtitle="Shadow isolates side effects and budget before live traffic"
                    tone="blue"
                    padding={8}
                >
                    <Flow
                        c={c}
                        direction="horizontal"
                        gap={4}
                        connectorLength={10}
                        stages={[
                            {
                                title: 'Offline',
                                subtitle: 'Rubric check',
                                tone: 'neutral',
                                width: 152,
                                padding: 6,
                            },
                            {
                                title: 'Shadow B',
                                subtitle: 'User sees A',
                                tone: 'purple',
                                width: 152,
                                padding: 6,
                            },
                            {
                                title: 'Canary',
                                subtitle: 'Small % live',
                                tone: 'warm',
                                width: 152,
                                padding: 6,
                            },
                            {
                                title: 'Pinned A/B',
                                subtitle: 'Full power',
                                tone: 'green',
                                width: 152,
                                padding: 6,
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Stage Isolation Controls"
                    subtitle="Controls active or isolated at each rollout stage"
                    tone="purple"
                    padding={8}
                >
                    <Matrix
                        c={c}
                        ariaLabel="Operational controls enabled at each rollout stage"
                        rowLabels={['User Sees B', 'Write Tools', 'Own Budget', 'Guardrails']}
                        colLabels={['Offline', 'Shadow', 'Canary', 'A/B']}
                        cellWidth={82}
                        cellHeight={36}
                        rowLabelWidth={135}
                        fontSize={22}
                        colorize
                        colorScale="strength"
                        colorDomain={[0, 1]}
                        data={[
                            [0, 0, 1, 1],
                            [0, 0, 1, 1],
                            [1, 1, 1, 1],
                            [0, 1, 1, 1],
                        ]}
                        labels={[
                            ['No', 'No (A)', 'Yes', 'Yes'],
                            ['Off', 'Off', 'On', 'On'],
                            ['Fixed', 'Cap', 'Cap', 'Plan'],
                            ['Eval', 'Watch', 'Hold', 'Hold'],
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
}

export default create('dark')
