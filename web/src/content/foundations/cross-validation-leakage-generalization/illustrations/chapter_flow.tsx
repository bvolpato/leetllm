import React from 'react'
import { DataTable, Flow, Panel, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 600
export const height = 740
export const alt =
    'A time-ordered record for prompt trace #10234 on July 1 at 09:00 UTC. Token length, prior 90-day flags, and ambiguity arrive before 09:00 and enter the inference snapshot. Fallback routing at 10:22, human edit latency at 11:05, and the July 15 audit override arrive after prediction and stay excluded from inference features.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.85)
    return (
        <Scene c={c} density={1.85} padding={12} gap={10} contentWidth={576}>
            <Panel
                c={c}
                title="1. Visible before 09:00 UTC (#10234)"
                tone="green"
                width={576}
                padding={10}
                gap={6}
            >
                <DataTable
                    c={c}
                    width={552}
                    headerRows={1}
                    headerCols={1}
                    align={['left', 'center', 'center']}
                    rows={[
                        ['Feature', 'Readable at', 'Status'],
                        ['prompt_tokens', '08:55 UTC', 'Allow'],
                        ['prior_flags_90d', '08:59 UTC', 'Allow'],
                        ['ambiguity_score', '08:59 UTC', 'Allow'],
                    ]}
                />
            </Panel>
            <Panel
                c={c}
                title="2. Arrives after 09:00 UTC (never an input)"
                tone="critical"
                width={576}
                padding={10}
                gap={6}
            >
                <DataTable
                    c={c}
                    width={552}
                    headerRows={1}
                    headerCols={1}
                    align={['left', 'center', 'center']}
                    rows={[
                        ['Field', 'Logged at', 'Status'],
                        ['fallback_triggered', '10:22 UTC', 'Block'],
                        ['human_edit_sec', '11:05 UTC', 'Block'],
                        ['audit_override', 'July 15', 'Block'],
                    ]}
                />
            </Panel>
            <Flow
                c={c}
                direction="horizontal"
                gap={6}
                connectorLength={18}
                connectorTone="blue"
                stages={[
                    {
                        eyebrow: '08:55-08:59',
                        title: '3 Inputs',
                        lines: ['Score 0.78'],
                        tone: 'green',
                        width: 174,
                        padding: 10,
                    },
                    {
                        eyebrow: '09:00 UTC',
                        title: 'Escalate',
                        lines: ['Thresh 0.50'],
                        tone: 'blue',
                        width: 174,
                        padding: 10,
                    },
                    {
                        eyebrow: '10:22-JUL 15',
                        title: 'Blocked',
                        lines: ['<= fit date'],
                        tone: 'critical',
                        width: 174,
                        padding: 10,
                    },
                ]}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
