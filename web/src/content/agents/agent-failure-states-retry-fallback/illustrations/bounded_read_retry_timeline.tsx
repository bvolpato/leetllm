import React from 'react'
import { LineChart, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 660
export const height = 500
export const alt =
    'Line chart comparing remaining caller deadline budget in seconds against the next jittered backoff wait across retry attempts. Across early attempts the wait fits within remaining time, but by Attempt 5 the required 6.4-second wait exceeds the remaining 5.1-second budget, causing bounded retry logic to stop cleanly instead of overshooting the deadline.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)

    return (
        <Scene
            c={c}
            density={2.0}
            padding={14}
            gap={8}
            title="Jittered Wait vs. Remaining 10s Deadline"
        >
            <LineChart
                c={c}
                width={630}
                height={470}
                labels={['Try 1', 'Try 2', 'Try 3', 'Try 4', 'Try 5']}
                min={0}
                max={10}
                format="decimal"
                showGrid
                showPoints
                directLabels
                yAxisLabel="Seconds"
                series={[
                    {
                        name: 'Budget Left',
                        points: [10.0, 9.69, 9.38, 8.2, 5.1],
                        color: 'green',
                    },
                    {
                        name: 'Next Wait',
                        points: [0.31, 0.31, 1.18, 3.1, 6.4],
                        color: 'critical',
                    },
                ]}
                ariaLabel="Line chart comparing remaining deadline budget against next jittered backoff wait across attempts"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
