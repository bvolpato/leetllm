import React from 'react'
import {
    Column,
    GraphDiagram,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const width = 800
export const height = 740

export const alt =
    'Streaming resume comparison after prefix [3, 1]: restoring both recurrent state h_2 = 2.150 and the 3-slot conv window [0, 3, 1] computes h_4 = 4.3875 on suffix [4, 2], while dropping the conv buffer yields wrong window [0, 0, 4] and drifts to h_4 = 3.7375.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.4} padding={10} gap={8} background="transparent">
        <Column gap={8} align="stretch">
            <Panel
                c={c}
                title="Resuming stream needs conv buffer + state"
                subtitle="Kernel [0.2, 0.3, 0.5] feeds h[t] = 0.5 h[t-1] + u[t]"
                padding={10}
                gap={4}
            >
                <GraphDiagram
                    c={c}
                    density={1}
                    direction="LR"
                    routing="dagre"
                    width={740}
                    height={250}
                    padding={6}
                    nodeGap={16}
                    rankGap={24}
                    labelFontSize={24}
                    detailFontSize={24}
                    arrowSize={6}
                    nodes={[
                        {
                            id: 'ckpt',
                            label: 'Prefix [3,1]',
                            detail: 'h2 = 2.15',
                            tone: 'blue',
                        },
                        {
                            id: 'ok1',
                            label: 'Restore +4',
                            detail: 'u=2.9, h=3.98',
                            tone: 'green',
                        },
                        {
                            id: 'ok2',
                            label: 'Match +2',
                            detail: 'u=2.4, h=4.388',
                            tone: 'green',
                        },
                        {
                            id: 'bad1',
                            label: 'Zero +4',
                            detail: 'u=2.0, h=3.08',
                            tone: 'critical',
                        },
                        {
                            id: 'bad2',
                            label: 'Drift +2',
                            detail: 'u=2.2, h=3.738',
                            tone: 'critical',
                        },
                    ]}
                    edges={[
                        { from: 'ckpt', to: 'ok1', tone: 'green' },
                        { from: 'ok1', to: 'ok2', tone: 'green' },
                        { from: 'ckpt', to: 'bad1', tone: 'critical', dashed: true },
                        { from: 'bad1', to: 'bad2', tone: 'critical', dashed: true },
                    ]}
                />
            </Panel>

            <Row gap={12} align="stretch">
                <Panel
                    c={c}
                    title="Saved conv window at x3=4"
                    tone="green"
                    width={384}
                    padding={10}
                    gap={6}
                >
                    <Grid
                        c={c}
                        rows={[
                            [
                                { label: '3*0.2', tone: 'green' },
                                { label: '1*0.3', tone: 'green' },
                                { label: '4*0.5', tone: 'green' },
                            ],
                        ]}
                        cellWidth={108}
                        cellHeight={48}
                        gap={6}
                        fontSize={24}
                    />
                    <TextLabel
                        c={c}
                        text="u3 = 0.6 + 0.3 + 2.0 = 2.90"
                        variant="small"
                        fontSize={24}
                    />
                </Panel>

                <Panel
                    c={c}
                    title="Cleared conv window at x3=4"
                    tone="critical"
                    width={384}
                    padding={10}
                    gap={6}
                >
                    <Grid
                        c={c}
                        rows={[
                            [
                                { label: '0*0.2', tone: 'critical' },
                                { label: '0*0.3', tone: 'critical' },
                                { label: '4*0.5', tone: 'warm' },
                            ],
                        ]}
                        cellWidth={108}
                        cellHeight={48}
                        gap={6}
                        fontSize={24}
                    />
                    <TextLabel
                        c={c}
                        text="u3 = 0.0 + 0.0 + 2.0 = 2.00"
                        variant="small"
                        fontSize={24}
                    />
                </Panel>
            </Row>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
