import React from 'react'
import {
    Column,
    FlowArrow,
    GraphDiagram,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const width = 960
export const height = 700
export const alt =
    'Top graph shows Writer A and Writer B each writing and closing a complete temporary file before executing atomic replace on key K. A reader opening K before the swap sees the complete old file; opening after sees the complete new file. Bottom pipeline shows an optional lock protocol: acquire lock, recheck exact key K, compile on miss, and publish before unlocking.'

const step = (
    c: Parameters<Parameters<typeof defineIllustration>[0]>[0],
    title: string,
    sub: string,
    tone: 'blue' | 'purple' | 'green' | 'warm' | 'cyan' | 'neutral',
    w: number,
) => (
    <Panel c={c} title={title} titleFontSize={30} tone={tone} padding={8} gap={2} width={w}>
        <TextLabel text={sub} c={c} fontSize={29} color={c.textMuted} />
    </Panel>
)

const illustration = defineIllustration((c) => {
    return (
        <Scene c={c} padding={16} gap={14} contentWidth={width - 32} align="center">
            <Column gap={14} width={width - 32}>
                <Panel
                    c={c}
                    title="Atomic temp-file publication prevents partial reads"
                    titleFontSize={31}
                    tone="blue"
                    padding={10}
                    gap={6}
                    width={width - 32}
                >
                    <GraphDiagram
                        c={c}
                        width={width - 52}
                        height={320}
                        layout="auto"
                        direction="LR"
                        padding={8}
                        nodeGap={16}
                        rankGap={36}
                        edgeGap={10}
                        routingClearance={10}
                        labelFontSize={31}
                        detailFontSize={29}
                        arrowSize={5}
                        nodes={[
                            { id: 'wA', label: 'Writer A', detail: 'close temp A', tone: 'blue' },
                            { id: 'wB', label: 'Writer B', detail: 'close temp B', tone: 'cyan' },
                            {
                                id: 'swap',
                                label: 'replace(K)',
                                detail: 'atomic swap',
                                tone: 'warm',
                            },
                            {
                                id: 'oldR',
                                label: 'Before swap',
                                detail: 'old full file',
                                tone: 'neutral',
                            },
                            {
                                id: 'newR',
                                label: 'After swap',
                                detail: 'new full file',
                                tone: 'green',
                            },
                        ]}
                        edges={[
                            { from: 'wA', to: 'swap', tone: 'blue' },
                            { from: 'wB', to: 'swap', tone: 'cyan' },
                            { from: 'swap', to: 'oldR', dashed: true, tone: 'neutral' },
                            { from: 'swap', to: 'newR', tone: 'green' },
                        ]}
                    />
                </Panel>

                <Panel
                    c={c}
                    title="Cooperating lock reduces duplicate compiles"
                    titleFontSize={31}
                    tone="purple"
                    padding={10}
                    gap={8}
                    width={width - 32}
                >
                    <Row gap={4} align="center">
                        {step(c, '1. Lock K', 'mutex held', 'purple', 184)}
                        <FlowArrow direction="right" length={10} c={c} tone="purple" />
                        {step(c, '2. Recheck', 'hit skips build', 'cyan', 216)}
                        <FlowArrow direction="right" length={10} c={c} tone="warm" />
                        {step(c, '3. Compile', 'write temp', 'warm', 206)}
                        <FlowArrow direction="right" length={10} c={c} tone="green" />
                        {step(c, '4. Publish', 'swap + unlock', 'green', 216)}
                    </Row>
                </Panel>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
