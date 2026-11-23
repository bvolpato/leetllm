import React from 'react'
import { Column, Flow, Matrix, Panel, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 740
export const alt =
    'Matrix showing deduplicated Team Draft interleaving of rankers A and B across five positions with click credit, plus a flow showing Arm A wins 2 clicks to 1.'

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
                    title="Deduplicated Team Draft Mix & Click Credit"
                    subtitle="Duplicate suggestions skip re-drafting; source team keeps credit"
                    tone="blue"
                    padding={8}
                >
                    <Matrix
                        c={c}
                        ariaLabel="Team Draft positions, drafting team, and user clicks"
                        rowLabels={[
                            '1: Rate limit',
                            '2: Retry',
                            '3: Idemp.',
                            '4: Timeout',
                            '5: Backoff',
                        ]}
                        colLabels={['Rank A', 'Rank B', 'Draft', 'Click']}
                        cellWidth={88}
                        cellHeight={38}
                        rowLabelWidth={168}
                        fontSize={23}
                        colorize
                        colorScale="strength"
                        colorDomain={[0, 1]}
                        data={[
                            [1, 1, 0, 0],
                            [1, 1, 1, 1],
                            [1, 0, 1, 1],
                            [0, 1, 0, 1],
                            [1, 1, 0, 0],
                        ]}
                        labels={[
                            ['#2', '#1', 'B', '0'],
                            ['#1', '#2', 'A', '1 (A)'],
                            ['#3', '-', 'A', '1 (A)'],
                            ['-', '#3', 'B', '1 (B)'],
                            ['#4', '#4', 'B', '0'],
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
                            title: 'Drafted',
                            subtitle: 'A: 2, B: 3',
                            tone: 'purple',
                            width: 210,
                            padding: 8,
                        },
                        {
                            title: 'Click Wins',
                            subtitle: 'A 2 vs B 1',
                            tone: 'blue',
                            width: 210,
                            padding: 8,
                        },
                        {
                            title: 'Short List',
                            subtitle: 'Credits tail B',
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
