import React from 'react'
import { QuadrantChart, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 620
export const height = 500
export const alt =
    'Four-quadrant action policy matrix plotting agent tool calls by blast radius on the horizontal axis and reversibility cost on the vertical axis. Low-scope reversible tools auto-execute, irreversible low-scope changes log and notify, reversible wide-scope shifts require single human approval, and wide irreversible mutations require dual approval plus precondition locks.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.9)
    const points = [
        { x: 15, y: 10, label: 'git_diff', color: 'positive' },
        { x: 35, y: 22, label: 'pytest', color: 'positive' },
        { x: 24, y: 66, label: 'rotate_cert', color: 'info' },
        { x: 63, y: 24, label: 'canary_25%', color: 'warning' },
        { x: 84, y: 14, label: 'flag_flip', color: 'warning' },
        { x: 64, y: 62, label: 'iam_admin', color: 'critical' },
        { x: 85, y: 76, label: 'drop_table', color: 'critical' },
    ]

    return (
        <Scene
            c={c}
            density={1.9}
            padding={12}
            gap={8}
            title="Policy Gate by Blast Radius and Undo Cost"
        >
            <QuadrantChart
                c={c}
                width={592}
                height={472}
                xMin={0}
                xMax={100}
                yMin={0}
                yMax={100}
                xThreshold={50}
                yThreshold={50}
                xAxisLabel="Blast Radius (%)"
                yAxisLabel="Undo Cost (%)"
                showGrid
                showTicks
                points={points}
                regions={{
                    bottomLeft: {
                        label: 'Auto-Execute',
                        color: 'positive',
                    },
                    topLeft: {
                        label: 'Log + Alert',
                        color: 'info',
                    },
                    bottomRight: {
                        label: 'Single Review',
                        color: 'warning',
                    },
                    topRight: {
                        label: 'Dual Sign-Off',
                        color: 'critical',
                        emphasis: true,
                    },
                }}
                ariaLabel="Quadrant chart classifying agent tool calls by blast radius and undo cost"
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
