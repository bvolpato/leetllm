import React from 'react'
import {
    DataTable,
    Panel,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 640
export const height = 790
export const alt =
    'At noon, six live requests undergo independent snapshot-age and backlog checks. Four (s-100, s-101, s-102, s-105) score cleanly; s-103 lacks queue_backlog and s-104 has a stale 180-minute snapshot. On the slower outcome clock, five archived predictions (p-001 through p-005) are mature while p-006 stays pending until 13:00; delaying p-005 arrival until 13:00 drops noon mature label coverage from 5 of 5 to 4 of 5.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={10} gap={8} contentWidth={576}>
            <Panel
                c={c}
                title="1. Fast request clock at 12:00 UTC (limit <= 60m)"
                tone="blue"
                width={576}
                padding={8}
                gap={4}
            >
                <DataTable
                    c={c}
                    width={552}
                    headerRows={1}
                    headerCols={1}
                    align={['left', 'center', 'center', 'center']}
                    rows={[
                        ['Request', 'Age', 'Backlog', 'Action'],
                        ['s-100..102, 105', '5-25m', '18-40', 'Score'],
                        ['s-103', '15m', 'None', 'Block'],
                        ['s-104', '180m', '22', 'Block'],
                    ]}
                />
                <StackedBar
                    c={c}
                    width={552}
                    height={20}
                    showLegend
                    segments={[
                        { label: '4 Scored', value: 4, color: 'positive' },
                        { label: '2 Blocked', value: 2, color: 'critical' },
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. Slow outcome clock (maturity vs arrival)"
                tone="green"
                width={576}
                padding={8}
                gap={4}
            >
                <TextLabel
                    c={c}
                    text="On-time cohort: p-001..p-005 mature, p-006 open (+1h)"
                    variant="small"
                    color={c.textSecondary}
                />
                <StackedBar
                    c={c}
                    width={552}
                    height={20}
                    showLegend
                    segments={[
                        { label: '5 Joined', value: 5, color: 'positive' },
                        { label: '1 Pending p-006', value: 1, color: 'neutral' },
                    ]}
                />
                <TextLabel
                    c={c}
                    text="Late arrival: p-005 matures 11:00, ingested 13:00 (4/5 = 80%)"
                    variant="small"
                    color={c.textSecondary}
                />
                <StackedBar
                    c={c}
                    width={552}
                    height={20}
                    showLegend
                    segments={[
                        { label: '4 Joined', value: 4, color: 'primary' },
                        { label: '1 Late p-005', value: 1, color: 'critical' },
                        { label: '1 Pending', value: 1, color: 'neutral' },
                    ]}
                />
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
