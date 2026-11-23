import React from 'react'
import { LineChart, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 660
export const height = 500
export const alt =
    'Line chart plotting human review load and unreviewed high-risk mutations across risk threshold settings from 0.2 to 0.9. Raising the threshold drops reviewer load from 74 percent to 5 percent while increasing unreviewed risk from 2 percent to 39 percent, favoring calibrated operating gates plus reversible canary limits.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)
    return (
        <Scene
            c={c}
            density={2.0}
            padding={14}
            gap={8}
            title="Deferral Threshold: Review Load vs. Risk"
        >
            <LineChart
                c={c}
                width={630}
                height={470}
                labels={['0.2', '0.35', '0.5', '0.65', '0.8', '0.9']}
                min={0}
                max={0.9}
                format="percent"
                showGrid
                showPoints
                directLabels
                yAxisLabel="Share (%)"
                series={[
                    {
                        name: 'Review Queue',
                        points: [0.74, 0.48, 0.28, 0.16, 0.09, 0.05],
                        color: 'primary',
                    },
                    {
                        name: 'Missed High-Risk',
                        points: [0.02, 0.03, 0.06, 0.12, 0.24, 0.39],
                        color: 'critical',
                    },
                ]}
                ariaLabel="Line chart comparing human review load and missed high-risk operations across deferral thresholds"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
