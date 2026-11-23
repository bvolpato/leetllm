import React from 'react'
import { LineChart, MetricCard, Row, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 640
export const alt =
    'Line chart of linear potential Phi(s) = -(6-s)/6 across corridor states s0 through s6, paired with transition shaping rewards for moving toward the goal (+0.208), slipping back (-0.117), and a clamped self-loop (+0.050).'

const states = ['s0', 's1', 's2', 's3', 's4', 's5', 's6']
const phiValues = states.map((_, idx) => -((6 - idx) / 6))

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.05)
    return (
        <Scene
            c={c}
            density={2.05}
            padding={16}
            gap={12}
            title="Linear distance potential and transition rewards"
            subtitle="Phi(s) = -(6 - s)/6 · F = gamma * Phi(s') - Phi(s)"
        >
            <LineChart
                c={c}
                width={640}
                height={320}
                labels={states}
                series={[
                    {
                        name: 'Potential Phi(s)',
                        points: phiValues,
                        color: 'primary',
                        area: true,
                    },
                ]}
                min={-1.05}
                max={0.1}
                format={(v: number) => v.toFixed(2)}
                showGrid={true}
                showPoints={true}
                yAxisLabel="Phi(s)"
            />
            <Row gap={10}>
                <MetricCard
                    c={c}
                    width={202}
                    tone="green"
                    label="Move 0 -> 1"
                    value="+0.208"
                    detail="R = 0 · F > 0"
                />
                <MetricCard
                    c={c}
                    width={202}
                    tone="red"
                    label="Slip 1 -> 0"
                    value="-0.117"
                    detail="R = 0 · F < 0"
                />
                <MetricCard
                    c={c}
                    width={202}
                    tone="warm"
                    label="Loop 0 -> 0"
                    value="+0.050"
                    detail="R = 0 · F > 0"
                />
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
