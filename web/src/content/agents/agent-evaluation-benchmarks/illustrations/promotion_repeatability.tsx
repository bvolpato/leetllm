import React from 'react'
import { LineChart, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 660
export const height = 500
export const alt =
    'Line chart comparing pass at k (probability of at least one passing run across k trials) against pass power k (probability that all k runs succeed) for a single-trial success rate of 70 percent. Across k from 1 to 6, pass at k rises from 70 percent toward 100 percent while pass power k drops from 70 percent down to 12 percent.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)

    return (
        <Scene
            c={c}
            density={2.0}
            padding={14}
            gap={8}
            title="Discovery (pass@k) vs. Reliability (pass^k) at p = 0.70"
        >
            <LineChart
                c={c}
                width={630}
                height={460}
                labels={['k=1', 'k=2', 'k=3', 'k=4', 'k=5', 'k=6']}
                min={0}
                max={1.0}
                format="percent"
                showGrid
                showPoints
                directLabels
                yAxisLabel="Probability (%)"
                series={[
                    {
                        name: 'pass@k (any)',
                        points: [0.7, 0.91, 0.97, 0.99, 1.0, 1.0],
                        color: 'green',
                    },
                    {
                        name: 'pass^k (all)',
                        points: [0.7, 0.49, 0.34, 0.24, 0.17, 0.12],
                        color: 'critical',
                    },
                ]}
                ariaLabel="Line chart comparing pass at k discovery against pass power k multi-run reliability from k=1 to k=6"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
