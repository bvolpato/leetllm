import React from 'react'
import { Column, Flow, Scene, StackedBar, defineIllustration, withDensity } from 'vizmatic'

export const width = 640
export const height = 740
export const alt =
    'Proportional state split and recovery sequence for a 50-item batch migration. Items 1 through 41 are verified committed, item 42 timed out in flight with unknown remote status, and items 43 through 50 are halted undispatched. Recovery polls item 42 using its operation key before deciding whether to repair or resume.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.95)
    return (
        <Scene
            c={c}
            density={1.95}
            padding={10}
            gap={10}
            title="Mid-Batch Timeout Across 50 Shards"
        >
            <Column gap={10} width={616}>
                <StackedBar
                    c={c}
                    width={616}
                    height={84}
                    showLegend
                    segments={[
                        {
                            label: '1-41 Committed',
                            value: 41,
                            color: 'positive',
                            valueLabel: '41',
                        },
                        {
                            label: '42 Unknown',
                            value: 1,
                            color: 'warning',
                            valueLabel: '1',
                        },
                        {
                            label: '43-50 Held',
                            value: 8,
                            color: 'neutral',
                            valueLabel: '8',
                        },
                    ]}
                    ariaLabel="Stacked bar of 41 committed shards, 1 timed out shard, and 8 held shards"
                />
                <Flow
                    c={c}
                    direction="vertical"
                    gap={4}
                    connectorLength={10}
                    stages={[
                        {
                            title: '1. Poll Shard #42 (op_key-42)',
                            tone: 'warm',
                            width: 580,
                            padding: 8,
                        },
                        {
                            title: '2. Hold Shards 43-50 Frontier',
                            tone: 'blue',
                            width: 580,
                            padding: 8,
                        },
                        {
                            title: '3. Explicit Repair or Resume',
                            tone: 'green',
                            width: 580,
                            padding: 8,
                        },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
