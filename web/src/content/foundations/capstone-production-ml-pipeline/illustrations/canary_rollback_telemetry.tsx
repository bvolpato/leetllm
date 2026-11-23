import React from 'react'
import { BarChart, Column, LineChart, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 640
export const height = 760
export const autoSize = false
export const alt =
    'Canary KS statistics climb above the 0.25 gate during queue shift and speed-unit corruption while mean predicted risk rises from 0.342 to 0.651 and triggers rollback.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)
    return (
        <Scene c={c} padding={12} gap={12} contentWidth={616}>
            <Column gap={12} width={616}>
                <LineChart
                    c={c}
                    width={616}
                    height={200}
                    title="Feature Drift KS Across Canary Windows"
                    labels={['Ref', 'W1 OK', 'W2 Shift', 'W3 Fault']}
                    min={0}
                    max={1.1}
                    format="decimal"
                    showGrid={false}
                    showPoints
                    directLabels
                    ariaLabel="Queue and speed KS statistics stay below 0.10 in W1 and cross 0.25 in W2 and W3"
                    series={[
                        {
                            name: 'Queue KS',
                            color: 'warning',
                            points: [0, 0.08, 0.266, 0.609],
                        },
                        {
                            name: 'Speed KS',
                            color: 'critical',
                            points: [0, 0.079, 0.075, 0.997],
                        },
                    ]}
                />
                <BarChart
                    c={c}
                    width={616}
                    height={190}
                    title="Mean Predicted Delay Risk Under Unit Shift"
                    min={0}
                    max={0.8}
                    format="decimal"
                    showValues
                    showGrid={false}
                    ariaLabel="Mean predicted delay risk rises from 0.342 in healthy W1 to 0.437 in W2 and 0.651 under W3 unit corruption"
                    data={[
                        { label: 'W1 OK', value: 0.342, color: 'positive' },
                        { label: 'W2 Shift', value: 0.437, color: 'warning' },
                        { label: 'W3 Fault', value: 0.651, color: 'critical' },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
