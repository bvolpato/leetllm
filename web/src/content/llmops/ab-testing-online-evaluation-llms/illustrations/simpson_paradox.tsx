import React from 'react'
import { Column, LineChart, Matrix, Panel, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 760
export const height = 780
export const alt =
    'Line chart and rate matrix showing Prompt A beating Prompt B on Mobile (85% vs 80%), Desktop (70% vs 65%), and 50/50 standardized (77.5% vs 72.5%), even while uneven mix reverses the aggregate to 73% vs 77%.'

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
                    title="Simpson's Reversal: Slice vs Aggregate"
                    subtitle="A leads both slices (+5 pp) yet loses raw mix (-4 pp)"
                    tone="blue"
                    padding={8}
                >
                    <LineChart
                        c={c}
                        ariaLabel="Resolution rates across segments, raw aggregate, and standardized aggregate"
                        width={650}
                        height={165}
                        min={60}
                        max={90}
                        showGrid
                        showPoints
                        directLabels={false}
                        labels={['Mobile', 'Desktop', 'Raw Agg', 'Std 50/50']}
                        format={(v) => `${v.toFixed(0)}%`}
                        series={[
                            { name: 'Prompt A', points: [85, 70, 73, 77.5], color: c.primary },
                            { name: 'Prompt B', points: [80, 65, 77, 72.5], color: c.critical },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Resolution Rate & Segment Difference (A - B)"
                    subtitle="Check slice rates and traffic weights before pooling"
                    tone="warm"
                    padding={8}
                >
                    <Matrix
                        c={c}
                        ariaLabel="Resolution rates and A minus B differences per slice"
                        rowLabels={['Prompt A', 'Prompt B', 'A - B Lift']}
                        colLabels={['Mobile', 'Desktop', 'Raw Agg', 'Std 50/50']}
                        cellWidth={92}
                        cellHeight={36}
                        rowLabelWidth={122}
                        fontSize={23}
                        colorize
                        colorScale="strength"
                        colorDomain={[-5, 90]}
                        data={[
                            [85, 70, 73, 77.5],
                            [80, 65, 77, 72.5],
                            [5, 5, -4, 5],
                        ]}
                        labels={[
                            ['85%', '70%', '73%', '77.5%'],
                            ['80%', '65%', '77%', '72.5%'],
                            ['+5 pp', '+5 pp', '-4 pp', '+5 pp'],
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
}

export default create('dark')
