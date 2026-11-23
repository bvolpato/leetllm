import React from 'react'
import {
    BarChart,
    Column,
    LineChart,
    Panel,
    Row,
    Scene,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 580
export const alt =
    'Line chart and bar chart showing total required users rising steeply as minimum detectable effect shrinks from 5 pp to 2 pp.'

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, 'default', { density: 2.2 })

    return (
        <Scene c={c} padding={8} gap={10} contentWidth={740} background="transparent" density={2.2}>
            <Column gap={10} align="center">
                <Row gap={10} align="stretch">
                    <Panel
                        c={c}
                        title="N vs MDE (pp)"
                        subtitle="p0=60%, alpha=0.05, 80%"
                        tone="blue"
                        padding={8}
                    >
                        <LineChart
                            c={c}
                            ariaLabel="Required total users curve from 5 pp down to 2 pp MDE"
                            width={290}
                            height={265}
                            min={0}
                            max={20}
                            showGrid
                            showPoints
                            directLabels={false}
                            labels={['5', '4', '3', '2.5', '2']}
                            format={(v) => `${v.toFixed(0)}k`}
                            series={[
                                {
                                    name: 'Total Users',
                                    points: [2.94, 4.62, 8.26, 11.9, 18.67],
                                    color: c.primary,
                                    area: true,
                                },
                            ]}
                        />
                    </Panel>
                    <Panel
                        c={c}
                        title="Two-Arm Budgets"
                        subtitle="Halving MDE needs 6.3x"
                        tone="purple"
                        padding={8}
                    >
                        <BarChart
                            c={c}
                            ariaLabel="Total sample sizes for 5 pp, 3 pp, and 2 pp MDE"
                            width={325}
                            height={265}
                            min={0}
                            max={24000}
                            showGrid
                            showValues
                            format={(v) => (v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`)}
                            data={[
                                { label: '+5 pp', value: 2942, valueLabel: '2.9k', color: c.info },
                                {
                                    label: '+3 pp',
                                    value: 8258,
                                    valueLabel: '8.3k',
                                    color: c.primary,
                                },
                                {
                                    label: '+2 pp',
                                    value: 18672,
                                    valueLabel: '18.7k',
                                    color: c.violet,
                                },
                            ]}
                        />
                    </Panel>
                </Row>
            </Column>
        </Scene>
    )
}

export default create('dark')
