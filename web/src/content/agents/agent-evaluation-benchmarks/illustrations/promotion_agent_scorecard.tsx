import React from 'react'
import { BarChart, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 660
export const height = 500
export const alt =
    'Bar chart summarizing evaluation outcomes across an agent promotion suite: 68 percent pass cleanly, 14 percent stall in retry loops, 11 percent emit invalid tool arguments, and 7 percent commit policy violations that trigger an automatic release block despite aggregate pass rate.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)

    return (
        <Scene
            c={c}
            density={2.0}
            padding={14}
            gap={8}
            title="Hard Policy Gate Override (68% Pass, Release Blocked)"
        >
            <BarChart
                c={c}
                width={630}
                height={430}
                min={0}
                max={0.8}
                format="percent"
                showGrid
                showValues
                yAxisLabel="Suite Share (%)"
                data={[
                    { label: 'Clean Pass', value: 0.68, color: 'positive' },
                    { label: 'Retry Loop', value: 0.14, color: 'warning' },
                    { label: 'Arg Error', value: 0.11, color: 'primary' },
                    { label: 'Policy Block', value: 0.07, color: 'critical' },
                ]}
                ariaLabel="Bar chart of agent suite outcome buckets showing critical policy blocks gating release"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
