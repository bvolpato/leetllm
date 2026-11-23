import React from 'react'
import { GraphDiagram, Panel, Scene, TextLabel, defineIllustration } from 'vizmatic'

export const width = 760
export const height = 470

export const alt =
    'Directed acyclic state diagram showing distinct two-token prefixes [3, 1] and [1, 2] reaching the identical scalar state h_2 = 1.2500 under h_t = 0.5 h_{t-1} + 0.5 x_t, so appending suffix [4, 2] produces identical states 2.6250 and 2.3125.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={1.9} padding={8} gap={6} background="transparent">
        <Panel c={c} title="State collision yields identical continuations" padding={8} gap={4}>
            <TextLabel
                c={c}
                text="Recurrence h[t] = 0.5 h[t-1] + 0.5 x[t] from h0 = 0"
                variant="small"
                fontSize={23}
            />
            <GraphDiagram
                c={c}
                direction="LR"
                routing="dagre"
                width={700}
                height={270}
                nodeWidth={142}
                nodeHeight={70}
                padding={4}
                nodeGap={16}
                rankGap={22}
                labelFontSize={23}
                detailFontSize={23}
                arrowSize={6}
                nodes={[
                    { id: 'a1', label: 'A: [3, 1]', detail: 'h2 = 1.25', tone: 'blue' },
                    { id: 'b1', label: 'B: [1, 2]', detail: 'h2 = 1.25', tone: 'warm' },
                    {
                        id: 'merge',
                        label: 'Collision',
                        detail: 'h2 = 1.250',
                        tone: 'purple',
                    },
                    { id: 's1', label: '+ x3=4', detail: 'h3 = 2.625', tone: 'green' },
                    { id: 's2', label: '+ x4=2', detail: 'h4 = 2.313', tone: 'green' },
                ]}
                edges={[
                    { from: 'a1', to: 'merge', tone: 'blue' },
                    { from: 'b1', to: 'merge', tone: 'warm' },
                    { from: 'merge', to: 's1', tone: 'green' },
                    { from: 's1', to: 's2', tone: 'green' },
                ]}
            />
        </Panel>
    </Scene>
))

export const create = illustration.create
export default illustration.default
