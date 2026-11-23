import React from 'react'
import { BarChart, Column, LineChart, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 640
export const height = 760
export const autoSize = false
export const alt =
    'Temperature scaling at T*=1.62 cuts test NLL by 27.7% while raising the confidence gate from 0.50 to 0.65 improves test accuracy from 86.2% to 90.6%.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)
    return (
        <Scene c={c} padding={12} gap={12} contentWidth={616}>
            <Column gap={12} width={616}>
                <BarChart
                    c={c}
                    width={616}
                    height={190}
                    title="Test NLL Drops at T* = 1.62 (0.694 to 0.502)"
                    min={0}
                    max={0.85}
                    format="decimal"
                    showValues
                    showGrid={false}
                    ariaLabel="Validation and Month 4 test NLL before and after temperature scaling with T=1.62"
                    data={[
                        { label: 'Val Raw', value: 0.255, color: 'neutral' },
                        { label: 'Val T*', value: 0.22, color: 'primary' },
                        { label: 'Test Raw', value: 0.694, color: 'critical' },
                        { label: 'Test T*', value: 0.502, color: 'positive' },
                    ]}
                />
                <LineChart
                    c={c}
                    width={616}
                    height={210}
                    title="Abstention Gate Sweep (max p >= tau)"
                    labels={['0.50', '0.65', '0.75', '0.85']}
                    min={0.75}
                    max={1.03}
                    format="percent"
                    showGrid={false}
                    showPoints
                    directLabels
                    ariaLabel="Tradeoff between coverage and automated accuracy across confidence thresholds"
                    series={[
                        {
                            name: 'Auto Acc',
                            color: 'positive',
                            points: [0.862, 0.906, 0.904, 0.893],
                        },
                        {
                            name: 'Coverage',
                            color: 'warning',
                            points: [0.979, 0.885, 0.865, 0.781],
                        },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
