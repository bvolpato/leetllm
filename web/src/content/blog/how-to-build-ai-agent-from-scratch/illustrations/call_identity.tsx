import React from 'react'
import {
    Column,
    GraphDiagram,
    Panel,
    ProgressList,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 660
export const height = 740
export const alt =
    'Tool-call trace graph and request budget state: call_0 reads /etc/passwd and receives invalid_request, spending one request without adding a dedupe key; call_1 searches billing-v1.example and receives backends.toml line 2, spending a second request and adding a dedupe key. Both call_id values stay attached to their matching results.'

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 2.0)

    return (
        <Scene c={c} padding={10} gap={10}>
            <Column gap={10} align="stretch">
                <Panel c={c} title="Paired Call ID Trace" width={640} padding={8} tone="blue">
                    <GraphDiagram
                        c={c}
                        width={616}
                        height={350}
                        layout="manual"
                        routing="straight"
                        padding={8}
                        nodeWidth={230}
                        nodeHeight={72}
                        labelFontSize={21}
                        detailFontSize={20}
                        arrowSize={5}
                        nodes={[
                            {
                                id: 'c0_req',
                                label: 'call_0: read_snapshot',
                                detail: '/etc/passwd',
                                x: 0.2,
                                y: 0.25,
                                tone: 'warm',
                            },
                            {
                                id: 'c0_res',
                                label: 'call_0 output',
                                detail: 'invalid_request',
                                x: 0.8,
                                y: 0.25,
                                tone: 'critical',
                            },
                            {
                                id: 'c1_req',
                                label: 'call_1: search',
                                detail: 'billing-v1.example',
                                x: 0.2,
                                y: 0.75,
                                tone: 'blue',
                            },
                            {
                                id: 'c1_res',
                                label: 'call_1 output',
                                detail: 'backends.toml:2',
                                x: 0.8,
                                y: 0.75,
                                tone: 'green',
                            },
                        ]}
                        edges={[
                            {
                                from: 'c0_req',
                                to: 'c0_res',
                                fromSide: 'right',
                                toSide: 'left',
                                label: 'deny',
                                tone: 'critical',
                            },
                            {
                                from: 'c1_req',
                                to: 'c1_res',
                                fromSide: 'right',
                                toSide: 'left',
                                label: 'allow',
                                tone: 'green',
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Runtime Accounting After Two Calls"
                    width={640}
                    padding={10}
                    tone="purple"
                >
                    <ProgressList
                        c={c}
                        gap={12}
                        labelWidth={195}
                        valueWidth={150}
                        barHeight={18}
                        fontSize={22}
                        rows={[
                            {
                                label: 'Budget spent',
                                value: 2 / 6,
                                valueLabel: '2 / 6 reqs',
                                tone: 'warm',
                            },
                            {
                                label: 'Completed keys',
                                value: 0.5,
                                valueLabel: '1 cached',
                                tone: 'green',
                            },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
