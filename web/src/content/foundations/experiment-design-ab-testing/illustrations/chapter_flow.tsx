import React from 'react'
import {
    DataTable,
    Flow,
    Panel,
    Scene,
    StackedBar,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 600
export const height = 760
export const alt =
    'Four support requests belong to three query units. Both requests for qry-014 hash to bucket 58 and stay in control using the raw query; qry-001 and qry-021 hash to buckets 27 and 21 and enter treatment using the rewritten query while keeping index and generator versions identical. Logged outcomes keep one row per query unit after its ten-minute maturity window.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={12} gap={10} contentWidth={576}>
            <Panel
                c={c}
                title="1. Sticky assignment -> shared RAG -> unit log"
                tone="blue"
                width={576}
                padding={10}
                gap={8}
            >
                <Flow
                    c={c}
                    direction="horizontal"
                    gap={6}
                    connectorLength={16}
                    connectorTone="blue"
                    stages={[
                        {
                            eyebrow: 'UNIT HASH',
                            title: 'Sticky',
                            lines: ['Same query ID,', 'same bucket'],
                            tone: 'blue',
                            width: 162,
                            padding: 10,
                        },
                        {
                            eyebrow: 'ISOLATED',
                            title: 'Rewrite',
                            lines: ['Raw vs rewritten,', 'same generator'],
                            tone: 'purple',
                            width: 162,
                            padding: 10,
                        },
                        {
                            eyebrow: 'MATURE 10M',
                            title: '1 row / ID',
                            lines: ['3 logged units,', 'no double count'],
                            tone: 'green',
                            width: 162,
                            padding: 10,
                        },
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. Request stream to unit-level outcome table"
                tone="purple"
                width={576}
                padding={10}
                gap={8}
            >
                <DataTable
                    c={c}
                    width={552}
                    headerRows={1}
                    rows={[
                        ['Request', 'Bucket', 'Arm', 'Logged unit'],
                        ['qry-014 (first)', '58', 'Control (raw)', 'qry-014'],
                        ['qry-014 (retry)', '58', 'Control (raw)', '(merged)'],
                        ['qry-001 (first)', '27', 'Treatment', 'qry-001'],
                        ['qry-021 (first)', '21', 'Treatment', 'qry-021'],
                    ]}
                />
                <StackedBar
                    c={c}
                    width={552}
                    height={24}
                    showLegend
                    segments={[
                        { label: 'Control (1 unit)', value: 33, color: 'primary' },
                        { label: 'Treatment (2 units)', value: 67, color: 'violet' },
                    ]}
                />
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
