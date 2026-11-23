import React from 'react'
import { Column, Flow, Heatmap, Panel, Row, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 680
export const alt =
    'Side-by-side 1-to-5 rubric heatmaps comparing Prompt A and Prompt B across queries Q1 to Q5, showing Prompt B advancing after a 4-win 1-tie screen.'

const queries = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']
const criteria = ['Clar', 'Acc', 'Cite']

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, 'default', { density: 2.2 })

    return (
        <Scene c={c} padding={8} gap={10} contentWidth={740} background="transparent" density={2.2}>
            <Column gap={10} align="center">
                <Row gap={10} align="stretch">
                    <Panel
                        c={c}
                        title="Prompt A (1-5)"
                        subtitle="Mean cite: 1.0"
                        tone="warm"
                        padding={8}
                    >
                        <Heatmap
                            c={c}
                            ariaLabel="Prompt A rubric scores for Q1 through Q5"
                            xLabels={criteria}
                            yLabels={queries}
                            cellWidth={62}
                            cellHeight={38}
                            rowLabelWidth={50}
                            fontSize={22}
                            colorScale="strength"
                            colorDomain={[1, 5]}
                            data={[
                                [3, 4, 1],
                                [4, 3, 1],
                                [3, 2, 1],
                                [4, 4, 1],
                                [3, 3, 1],
                            ]}
                        />
                    </Panel>
                    <Panel
                        c={c}
                        title="Prompt B (1-5)"
                        subtitle="Mean cite: 4.6"
                        tone="blue"
                        padding={8}
                    >
                        <Heatmap
                            c={c}
                            ariaLabel="Prompt B rubric scores for Q1 through Q5"
                            xLabels={criteria}
                            yLabels={queries}
                            cellWidth={62}
                            cellHeight={38}
                            rowLabelWidth={50}
                            fontSize={22}
                            colorScale="strength"
                            colorDomain={[1, 5]}
                            data={[
                                [4, 4, 5],
                                [4, 4, 4],
                                [4, 4, 5],
                                [5, 5, 5],
                                [4, 4, 4],
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
                            title: 'Rubric Mean',
                            subtitle: '2.5 -> 4.3 pts',
                            tone: 'blue',
                            width: 210,
                            padding: 8,
                        },
                        {
                            title: 'Pairwise',
                            subtitle: '4W / 1T (0.90)',
                            tone: 'cyan',
                            width: 210,
                            padding: 8,
                        },
                        {
                            title: 'Next Gate',
                            subtitle: 'Run online A/B',
                            tone: 'green',
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
