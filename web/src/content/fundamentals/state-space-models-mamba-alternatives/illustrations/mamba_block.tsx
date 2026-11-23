import React from 'react'
import { GraphDiagram, Panel, Scene, defineIllustration } from 'vizmatic'

export const width = 800
export const height = 610

export const alt =
    'Landscape dataflow diagram of a Mamba block: input x passes through linear projection into a causal 1D convolution and SiLU main branch generating input-dependent Delta_t, B_t, and C_t parameters for the selective scan with D skip connection, multiplied elementwise by the SiLU-gated z branch before output projection.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.4} padding={10} gap={8} background="transparent">
        <Panel
            c={c}
            title="Mamba selective SSM block"
            subtitle="Causal conv feeds selective scan; parallel z branch gates output"
            padding={10}
            gap={6}
        >
            <GraphDiagram
                c={c}
                density={1}
                layout="manual"
                routing="straight"
                sizing="fixed"
                width={756}
                height={410}
                padding={8}
                labelFontSize={24}
                detailFontSize={24}
                arrowSize={6}
                nodes={[
                    {
                        id: 'x',
                        label: 'x[t]',
                        detail: 'In D',
                        x: 0.07,
                        y: 0.56,
                        tone: 'neutral',
                    },
                    {
                        id: 'inproj',
                        label: 'Proj',
                        detail: '2E',
                        x: 0.23,
                        y: 0.56,
                        tone: 'blue',
                    },
                    {
                        id: 'conv',
                        label: 'Conv',
                        detail: 'k=4 SiLU',
                        x: 0.42,
                        y: 0.29,
                        tone: 'blue',
                    },
                    {
                        id: 'params',
                        label: 'Select',
                        detail: 'D, B, C',
                        x: 0.64,
                        y: 0.13,
                        tone: 'warm',
                    },
                    {
                        id: 'ssm',
                        label: 'SSM',
                        detail: 'Scan + D',
                        x: 0.64,
                        y: 0.49,
                        tone: 'green',
                    },
                    {
                        id: 'gate',
                        label: 'SiLU(z)',
                        detail: 'Gate',
                        x: 0.42,
                        y: 0.84,
                        tone: 'purple',
                    },
                    {
                        id: 'mul',
                        label: 'Mul',
                        detail: 'y * gate',
                        x: 0.86,
                        y: 0.6,
                        tone: 'green',
                    },
                    {
                        id: 'out',
                        label: 'Out',
                        detail: 'y[t] (D)',
                        x: 0.86,
                        y: 0.9,
                        tone: 'neutral',
                    },
                ]}
                edges={[
                    { from: 'x', to: 'inproj', tone: 'blue' },
                    { from: 'inproj', to: 'conv', tone: 'blue' },
                    { from: 'inproj', to: 'gate', tone: 'purple' },
                    { from: 'conv', to: 'params', tone: 'warm' },
                    { from: 'conv', to: 'ssm', tone: 'green' },
                    { from: 'params', to: 'ssm', tone: 'warm' },
                    { from: 'ssm', to: 'mul', tone: 'green' },
                    { from: 'gate', to: 'mul', tone: 'purple' },
                    { from: 'mul', to: 'out', tone: 'green' },
                ]}
            />
        </Panel>
    </Scene>
))

export const create = illustration.create
export default illustration.default
