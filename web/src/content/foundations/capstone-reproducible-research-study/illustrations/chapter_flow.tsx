import React from 'react'
import { Comparison, GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 700
export const height = 680
export const alt =
    'Directed workflow showing each seed tape feeding sparse training (reward R), shaped training (reward R plus F), and a zero-potential control into frozen greedy evaluation and the paired decision rule.'

const illustration = defineIllustration((base) => {
    const dc = withDensity(base, 2.0)
    return (
        <Scene
            c={base}
            padding={16}
            gap={12}
            title="Paired corridor design isolates shaping"
            subtitle="Shared random draws per seed · greedy eval on original R"
        >
            <GraphDiagram
                c={base}
                width={660}
                height={380}
                padding={10}
                layout="auto"
                direction="TB"
                routing="dagre"
                nodeWidth={172}
                nodeHeight={72}
                labelFontSize={22}
                detailFontSize={21}
                nodes={[
                    {
                        id: 'tape',
                        label: 'Seed i tape',
                        detail: 'shared RNG',
                        tone: 'purple',
                    },
                    {
                        id: 'sparse',
                        label: 'Sparse arm',
                        detail: '80 ep on R',
                        tone: 'blue',
                    },
                    {
                        id: 'shaped',
                        label: 'Shaped arm',
                        detail: '80 ep R + F',
                        tone: 'cyan',
                    },
                    {
                        id: 'zero',
                        label: 'Zero-F check',
                        detail: 'exact match',
                        tone: 'warm',
                    },
                    {
                        id: 'eval',
                        label: 'Greedy eval',
                        detail: '200 ep R only',
                        tone: 'green',
                    },
                    {
                        id: 'gate',
                        label: 'Decision rule',
                        detail: 'early >= +10 pp',
                        tone: 'neutral',
                    },
                ]}
                edges={[
                    { from: 'tape', to: 'sparse' },
                    { from: 'tape', to: 'shaped' },
                    { from: 'tape', to: 'zero', dashed: true },
                    { from: 'sparse', to: 'eval' },
                    { from: 'shaped', to: 'eval' },
                    { from: 'eval', to: 'gate' },
                ]}
            />
            <Comparison
                c={dc}
                gap={10}
                sides={[
                    {
                        title: 'Early metric',
                        tone: 'blue',
                        lines: ['First 30 ep · paired'],
                    },
                    {
                        title: 'Final guardrail',
                        tone: 'green',
                        lines: ['200 ep (F = 0) · +/- 2 pp'],
                    },
                ]}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
