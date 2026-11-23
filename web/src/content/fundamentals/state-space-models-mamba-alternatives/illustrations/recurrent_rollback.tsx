import React from 'react'
import { GraphDiagram, Panel, Scene, TextLabel, defineIllustration } from 'vizmatic'

export const width = 760
export const height = 470

export const alt =
    'Speculative decoding rollback trace: accepted token 99 advances state to saved checkpoint 50.1250 before draft token 77 overwrites state to 63.5625; restoring the checkpoint recovers h = 27.0625 on correction token 4, while continuing without rollback drifts to 33.7813.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={1.9} padding={8} gap={6} background="transparent">
        <Panel
            c={c}
            title="In-place state updates require rollback on rejection"
            padding={8}
            gap={4}
        >
            <TextLabel
                c={c}
                text="h[t] = 0.5 h[t-1] + 0.5 x[t] across accepted 99 and rejected 77"
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
                    {
                        id: 'pre',
                        label: 'Prefix [3,1]',
                        detail: 'h2 = 1.250',
                        tone: 'neutral',
                    },
                    {
                        id: 'acc',
                        label: 'Accept 99',
                        detail: 'Save 50.125',
                        tone: 'green',
                    },
                    {
                        id: 'rej',
                        label: 'Reject 77',
                        detail: 'Dirty 63.563',
                        tone: 'warm',
                    },
                    {
                        id: 'ok',
                        label: 'Rollback + 4',
                        detail: 'Valid 27.063',
                        tone: 'green',
                    },
                    {
                        id: 'bad',
                        label: 'Dirty + 4',
                        detail: 'Drift 33.781',
                        tone: 'critical',
                    },
                ]}
                edges={[
                    { from: 'pre', to: 'acc', tone: 'blue' },
                    { from: 'acc', to: 'rej', tone: 'warm' },
                    { from: 'acc', to: 'ok', tone: 'green', dashed: true },
                    { from: 'rej', to: 'bad', tone: 'critical' },
                ]}
            />
        </Panel>
    </Scene>
))

export const create = illustration.create
export default illustration.default
