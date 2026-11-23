import React from 'react'
import {
    Column,
    GraphDiagram,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 960
export const height = 640
export const alt =
    'Graph of rank-0 warmup: Rank 0 compiles sm_90 and populates key K(sm_90) in the shared cache before an MPI barrier. Post-barrier, a rank querying K(sm_90) in the shared cache hits, Rank 1 requesting sm_100 builds key K(sm_100) and misses, and a worker using an empty private cache misses even for the identical sm_90 recipe.'

const illustration = defineIllustration((c) => {
    return (
        <Scene c={c} padding={16} gap={14} contentWidth={width - 32} align="center">
            <Column gap={14} width={width - 32} align="center">
                <Panel
                    c={c}
                    title="Shared-cache warmup across ranks"
                    titleFontSize={31}
                    tone="blue"
                    padding={10}
                    gap={6}
                    width={width - 32}
                >
                    <GraphDiagram
                        c={c}
                        width={width - 52}
                        height={420}
                        layout="auto"
                        direction="LR"
                        padding={8}
                        nodeGap={16}
                        rankGap={20}
                        edgeGap={10}
                        routingClearance={10}
                        labelFontSize={31}
                        detailFontSize={29}
                        arrowSize={5}
                        nodes={[
                            { id: 'r0', label: 'Rank 0', detail: 'sm_90 K90', tone: 'blue' },
                            {
                                id: 'shared',
                                label: 'Shared cache',
                                detail: 'holds K90',
                                tone: 'cyan',
                            },
                            {
                                id: 'barrier',
                                label: 'Barrier',
                                detail: 'sync ranks',
                                tone: 'neutral',
                            },
                            {
                                id: 'hit90',
                                label: 'Shared sm_90',
                                detail: 'K90: HIT',
                                tone: 'green',
                            },
                            {
                                id: 'miss100',
                                label: 'R1: sm_100',
                                detail: 'K100: MISS',
                                tone: 'warm',
                            },
                            {
                                id: 'missLocal',
                                label: 'Private dir',
                                detail: 'empty: MISS',
                                tone: 'red',
                            },
                        ]}
                        edges={[
                            { from: 'r0', to: 'shared', tone: 'blue' },
                            { from: 'shared', to: 'barrier', tone: 'cyan' },
                            { from: 'barrier', to: 'hit90', tone: 'green' },
                            { from: 'barrier', to: 'miss100', tone: 'warm' },
                            { from: 'barrier', to: 'missLocal', tone: 'red' },
                        ]}
                    />
                </Panel>

                <Row gap={14} width={width - 32}>
                    <Panel
                        c={c}
                        title="Hit: same key + shared dir"
                        titleFontSize={30}
                        tone="green"
                        padding={10}
                        gap={4}
                        width={457}
                    >
                        <TextLabel
                            text="Reuses Rank 0 sm_90 binary"
                            c={c}
                            fontSize={29}
                            color={getReadableToneColor('green', c)}
                        />
                    </Panel>
                    <Panel
                        c={c}
                        title="Miss: new arch or local dir"
                        titleFontSize={30}
                        tone="red"
                        padding={10}
                        gap={4}
                        width={457}
                    >
                        <TextLabel
                            text="Rebuilds K100 or empty cache"
                            c={c}
                            fontSize={29}
                            color={getReadableToneColor('red', c)}
                        />
                    </Panel>
                </Row>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
