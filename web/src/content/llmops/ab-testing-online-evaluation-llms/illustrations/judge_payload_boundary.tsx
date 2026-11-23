import React from 'react'
import { Column, Flow, Matrix, Panel, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 810
export const alt =
    'Pipeline diagram separating trusted evaluator instructions from serialized candidate payload entering a tool-free judge, paired with an isolation control matrix.'

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, 'default', { density: 2.25 })

    return (
        <Scene c={c} padding={4} gap={8} contentWidth={740} background="transparent" density={2.25}>
            <Column gap={8} align="center">
                <Panel
                    c={c}
                    title="Separated Judge Inputs & Tool-Free Runtime"
                    subtitle="Query, context, and replies pass as serialized data"
                    tone="blue"
                    padding={6}
                >
                    <Column gap={6} align="center">
                        <Flow
                            c={c}
                            direction="horizontal"
                            gap={6}
                            connectorLength={14}
                            stages={[
                                {
                                    title: 'System Rules',
                                    subtitle: 'Pinned rubric',
                                    tone: 'blue',
                                    width: 192,
                                    padding: 5,
                                },
                                {
                                    title: 'No-Tool Judge',
                                    subtitle: 'Isolated model',
                                    tone: 'purple',
                                    width: 192,
                                    padding: 5,
                                },
                                {
                                    title: 'Score Schema',
                                    subtitle: 'Checked JSON',
                                    tone: 'green',
                                    width: 192,
                                    padding: 5,
                                },
                            ]}
                        />
                        <Flow
                            c={c}
                            direction="horizontal"
                            gap={6}
                            connectorLength={14}
                            stages={[
                                {
                                    title: 'Payload JSON',
                                    subtitle: 'Query, ctx, A/B',
                                    tone: 'warm',
                                    width: 192,
                                    padding: 5,
                                },
                                {
                                    title: 'Data Escaped',
                                    subtitle: 'No instructions',
                                    tone: 'neutral',
                                    width: 192,
                                    padding: 5,
                                },
                                {
                                    title: 'No Tool Exec',
                                    subtitle: 'Side-effect off',
                                    tone: 'red',
                                    width: 192,
                                    padding: 5,
                                },
                            ]}
                        />
                    </Column>
                </Panel>
                <Panel
                    c={c}
                    title="Judge Payload Isolation Controls"
                    subtitle="Candidate text never invokes tools or overrides rules"
                    tone="purple"
                    padding={6}
                >
                    <Matrix
                        c={c}
                        ariaLabel="Isolation controls across rubric, query context, and responses"
                        rowLabels={['Sys Rubric', 'Query & Ctx', 'Resp A & B']}
                        colLabels={['Channel', 'Escaped', 'Tools']}
                        cellWidth={116}
                        cellHeight={38}
                        rowLabelWidth={148}
                        fontSize={23}
                        colorize
                        colorScale="strength"
                        colorDomain={[0, 1]}
                        data={[
                            [1, 0, 0],
                            [0, 1, 0],
                            [0, 1, 0],
                        ]}
                        labels={[
                            ['System', 'Pinned', 'None'],
                            ['JSON', 'Inert', 'None'],
                            ['JSON', 'Inert', 'None'],
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
}

export default create('dark')
