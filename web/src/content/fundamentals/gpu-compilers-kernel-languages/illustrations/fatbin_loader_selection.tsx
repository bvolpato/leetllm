import React from 'react'
import { Column, GraphDiagram, Panel, Row, Scene, TextLabel, defineIllustration } from 'vizmatic'

export const width = 1000
export const height = 760
export const alt =
    'Loader flow for a fatbin containing sm_90 cubin and compute_90 PTX. A compatible cubin jumps straight to native GPU load, which stays lazy by default. A cubin miss checks embedded PTX against the driver max ISA, running driver JIT and compute cache write before native load, or failing load if neither matches. Right panels list CUDA_FORCE_PTX_JIT=1 CUDA_CACHE_DISABLE=1 and CUDA_DISABLE_PTX_JIT=1.'

const illustration = defineIllustration((c) => {
    return (
        <Scene c={c} padding={16} gap={14} contentWidth={width - 32} align="center">
            <Row gap={14} width={width - 32} align="start">
                <Panel
                    c={c}
                    title="Fatbin image selection at load"
                    titleFontSize={31}
                    tone="blue"
                    padding={10}
                    gap={6}
                    width={488}
                >
                    <GraphDiagram
                        c={c}
                        width={466}
                        height={650}
                        layout="auto"
                        direction="TB"
                        padding={6}
                        nodeGap={12}
                        rankGap={16}
                        edgeGap={8}
                        routingClearance={8}
                        labelFontSize={31}
                        detailFontSize={30}
                        arrowSize={5}
                        nodes={[
                            {
                                id: 'fatbin',
                                label: 'Host fatbin',
                                detail: 'sm_90 + PTX',
                                tone: 'blue',
                            },
                            {
                                id: 'cubin',
                                label: 'Cubin match?',
                                detail: 'same major',
                                tone: 'warm',
                            },
                            { id: 'ptx', label: 'PTX OK?', detail: 'ISA <= driver', tone: 'warm' },
                            {
                                id: 'jit',
                                label: 'PTX JIT',
                                detail: 'build + cache',
                                tone: 'purple',
                            },
                            {
                                id: 'load',
                                label: 'Native load',
                                detail: 'lazy default',
                                tone: 'green',
                            },
                            { id: 'fail', label: 'Load fails', detail: 'no image', tone: 'red' },
                        ]}
                        edges={[
                            { from: 'fatbin', to: 'cubin', tone: 'blue' },
                            { from: 'cubin', to: 'load', tone: 'green' },
                            { from: 'cubin', to: 'ptx', tone: 'warm' },
                            { from: 'ptx', to: 'jit', tone: 'purple' },
                            { from: 'jit', to: 'load', tone: 'green' },
                            { from: 'ptx', to: 'fail', tone: 'red' },
                        ]}
                    />
                </Panel>

                <Column gap={14} width={466}>
                    <Panel
                        c={c}
                        title="Force uncached PTX path"
                        titleFontSize={31}
                        tone="purple"
                        padding={10}
                        gap={6}
                        width={466}
                    >
                        <TextLabel text="CUDA_FORCE_PTX_JIT=1" c={c} mono fontSize={30} />
                        <TextLabel text="CUDA_CACHE_DISABLE=1" c={c} mono fontSize={30} />
                        <TextLabel
                            text="Forces uncached PTX JIT"
                            c={c}
                            fontSize={30}
                            color={c.textMuted}
                        />
                    </Panel>

                    <Panel
                        c={c}
                        title="Require compatible cubin"
                        titleFontSize={31}
                        tone="red"
                        padding={10}
                        gap={6}
                        width={466}
                    >
                        <TextLabel text="CUDA_DISABLE_PTX_JIT=1" c={c} mono fontSize={30} />
                        <TextLabel
                            text="Skips PTX fallback on miss"
                            c={c}
                            fontSize={30}
                            color={c.textMuted}
                        />
                    </Panel>

                    <Panel
                        c={c}
                        title="Lazy module loading"
                        titleFontSize={31}
                        tone="neutral"
                        padding={10}
                        gap={6}
                        width={466}
                    >
                        <TextLabel
                            text="First call pays load cost"
                            c={c}
                            fontSize={30}
                            color={c.textMuted}
                        />
                    </Panel>
                </Column>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
