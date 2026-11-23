import React from 'react'
import {
    Column,
    LineChart,
    Panel,
    Scene,
    StackedBar,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 780
export const alt =
    'Posterior Beta probability density curves comparing Arm A Beta(89,64) mean 0.582 against sharper Arm B Beta(227,124) mean 0.647, paired with a stacked bar of 151 versus 349 Thompson sampling pulls.'

const logBeta = (a: number, b: number) => {
    const lgamma = (n: number) => {
        let s = 0
        for (let i = 2; i < n; i += 1) s += Math.log(i)
        return s
    }
    return lgamma(a) + lgamma(b) - lgamma(a + b)
}

const betaPdf = (x: number, a: number, b: number) =>
    Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta(a, b))

const grid = [0.46, 0.48, 0.5, 0.52, 0.54, 0.56, 0.58, 0.6, 0.62, 0.64, 0.66, 0.68, 0.7, 0.72]
const pointsA = grid.map((p) => Number(betaPdf(p, 89, 64).toFixed(2)))
const pointsB = grid.map((p) => Number(betaPdf(p, 227, 124).toFixed(2)))

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
                    title="Thompson Sampling Posteriors (500 Pulls)"
                    subtitle="B peaks at 0.647; A holds wider 0.582 spread"
                    tone="blue"
                    padding={8}
                >
                    <LineChart
                        c={c}
                        ariaLabel="Beta posterior densities for Arm A and Arm B"
                        width={650}
                        height={195}
                        min={0}
                        max={17}
                        showGrid
                        showPoints={false}
                        directLabels={false}
                        labels={grid.map((p, i) => (i % 2 === 0 ? p.toFixed(2) : ''))}
                        format={(v) => v.toFixed(0)}
                        series={[
                            {
                                name: 'Arm A Beta(89,64)',
                                points: pointsA,
                                color: c.neutralLight,
                                area: true,
                            },
                            {
                                name: 'Arm B Beta(227,124)',
                                points: pointsB,
                                color: c.primary,
                                area: true,
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Adaptive Traffic Allocation After 500 Pulls"
                    subtitle="Posterior sampling routes 69.8% to B, 30.2% to A"
                    tone="purple"
                    padding={8}
                >
                    <StackedBar
                        c={c}
                        ariaLabel="Thompson sampling pull allocation between Arm A and Arm B"
                        width={650}
                        height={42}
                        showLegend
                        segments={[
                            {
                                label: 'Arm B',
                                value: 349,
                                valueLabel: '349 (69.8%)',
                                color: c.primary,
                            },
                            {
                                label: 'Arm A',
                                value: 151,
                                valueLabel: '151 (30.2%)',
                                color: c.neutralLight,
                            },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
}

export default create('dark')
