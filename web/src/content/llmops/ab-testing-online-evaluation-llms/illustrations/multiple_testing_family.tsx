import React from 'react'
import {
    Column,
    LineChart,
    Matrix,
    Panel,
    Row,
    Scene,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 620
export const alt =
    'Line chart of raw, Bonferroni, and Benjamini-Hochberg adjusted p-values alongside a decision matrix showing Resolution passes BH at 0.040 but fails Bonferroni at 0.080.'

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, 'default', { density: 2.2 })

    return (
        <Scene c={c} padding={8} gap={10} contentWidth={740} background="transparent" density={2.2}>
            <Column gap={10} align="center">
                <Row gap={10} align="stretch">
                    <Panel
                        c={c}
                        title="Adjusted p (m = 4)"
                        subtitle="alpha = 0.05 threshold"
                        tone="blue"
                        padding={8}
                    >
                        <LineChart
                            c={c}
                            ariaLabel="Adjusted p-values across four ranked metrics"
                            width={325}
                            height={265}
                            min={0}
                            max={0.55}
                            showGrid
                            showPoints
                            directLabels={false}
                            labels={['Cite', 'Res', 'Lat', 'Cost']}
                            format={(v) => v.toFixed(2)}
                            series={[
                                {
                                    name: 'Bonf',
                                    points: [0.004, 0.08, 0.48, 0.54],
                                    color: c.warning,
                                },
                                { name: 'BH', points: [0.004, 0.04, 0.16, 0.42], color: c.primary },
                                {
                                    name: 'Cut',
                                    points: [0.05, 0.05, 0.05, 0.05],
                                    color: c.critical,
                                },
                            ]}
                        />
                    </Panel>
                    <Panel
                        c={c}
                        title="Gate Decisions"
                        subtitle="1 = pass (p <= 0.05)"
                        tone="cyan"
                        padding={8}
                    >
                        <Matrix
                            c={c}
                            ariaLabel="Pass or fail outcomes per metric and correction rule"
                            rowLabels={['Cite', 'Res', 'Lat', 'Cost']}
                            colLabels={['Raw', 'BH', 'Bonf']}
                            cellWidth={56}
                            cellHeight={42}
                            rowLabelWidth={50}
                            fontSize={21}
                            colorize
                            colorScale="strength"
                            colorDomain={[0, 1]}
                            data={[
                                [1, 1, 1],
                                [1, 1, 0],
                                [0, 0, 0],
                                [0, 0, 0],
                            ]}
                            labels={[
                                ['.001', '.004', '.004'],
                                ['.020', '.040', '.080'],
                                ['.120', '.160', '.480'],
                                ['.420', '.420', '1.00'],
                            ]}
                        />
                    </Panel>
                </Row>
            </Column>
        </Scene>
    )
}

export default create('dark')
