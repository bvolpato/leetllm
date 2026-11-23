import React from 'react'
import {
    FlowArrow,
    GraphDiagram,
    Matrix,
    Panel,
    Row,
    Scene,
    StepCard,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 620
export const height = 720
export const alt =
    'Pipeline from JSON Schema and regex or context-free rules to deterministic finite-state or stack-based automaton states, mapped into a precomputed valid-token bitmask over model vocabulary tokens. A bitmask matrix maps four parser states against six sample tokens showing ones where brace, key, enum continuations, and end-of-sequence are legal and zeros where illegal tokens are masked.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 1.9)
    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 596,
        children: [
            Row({
                gap: 6,
                align: 'center',
                justify: 'space-between',
                children: [
                    StepCard({
                        c,
                        eyebrow: 'Step 1',
                        title: 'Schema / CFG',
                        subtitle: 'Regex + { }',
                        tone: 'blue',
                        width: 172,
                        padding: 8,
                    }),
                    FlowArrow({ c, direction: 'right', length: 16, tone: 'blue' }),
                    StepCard({
                        c,
                        eyebrow: 'Step 2',
                        title: 'DFA / Stack',
                        subtitle: 'State S_t',
                        tone: 'purple',
                        width: 172,
                        padding: 8,
                    }),
                    FlowArrow({ c, direction: 'right', length: 16, tone: 'green' }),
                    StepCard({
                        c,
                        eyebrow: 'Step 3',
                        title: 'Bitmask Index',
                        subtitle: 'M[S_t] in {0,1}',
                        tone: 'green',
                        width: 172,
                        padding: 8,
                    }),
                ],
            }),
            GraphDiagram({
                c,
                width: 596,
                height: 150,
                direction: 'LR',
                routing: 'orthogonal',
                nodeWidth: 92,
                nodeHeight: 68,
                nodeGap: 14,
                rankGap: 52,
                edgeGap: 6,
                labelFontSize: 20,
                detailFontSize: 19,
                arrowSize: 6,
                padding: 6,
                nodes: [
                    { id: 's0', label: 'S0', detail: 'expect {', tone: 'blue' },
                    { id: 's1', label: 'S1', detail: 'expect key', tone: 'purple' },
                    { id: 's2', label: 'S2', detail: 'enum val', tone: 'purple' },
                    { id: 's3', label: 'S3', detail: 'allow eos', tone: 'green' },
                ],
                edges: [
                    { from: 's0', to: 's1', tone: 'blue' },
                    { from: 's1', to: 's2', tone: 'purple' },
                    { from: 's2', to: 's3', tone: 'green' },
                ],
            }),
            Panel({
                c,
                title: 'Valid-Token Bitmask M[S_t, v] (1 = legal)',
                tone: 'neutral',
                width: 596,
                padding: 8,
                children: Matrix({
                    c,
                    rowLabelWidth: 112,
                    cellWidth: 68,
                    cellHeight: 36,
                    fontSize: 19,
                    format: 'integer',
                    colorize: true,
                    colorScale: 'strength',
                    rowLabels: ['S0 (start)', 'S1 (key)', 'S2 (enum)', 'S3 (done)'],
                    colLabels: ['{', 'key:', 'pass"}', 'fa', 'Sure', '<eos>'],
                    data: [
                        [1, 0, 0, 0, 0, 0],
                        [0, 1, 0, 0, 0, 0],
                        [0, 0, 1, 1, 0, 0],
                        [0, 0, 0, 0, 0, 1],
                    ],
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
