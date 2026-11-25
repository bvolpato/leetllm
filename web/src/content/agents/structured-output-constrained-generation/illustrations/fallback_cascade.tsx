import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'

export const width = 660
export const height = 540
export const alt =
    'Recovery cascade branching on API completion status. Completed responses go to strict JSON parsing, local Pydantic validation, and caller access and evidence checks. Truncated max_output_tokens responses check budget and deadline for one same-schema retry at 400 tokens and fail on a second stop. Refusal or content filter stops immediately, and invalid schema triggers code repair.'

const illustration = defineIllustration((c) => {
    return Scene({
        c,
        padding: 10,
        gap: 8,
        contentWidth: 640,
        children: [
            GraphDiagram({
                c,
                width: 640,
                height: 500,
                direction: 'LR',
                routing: 'orthogonal',
                nodeWidth: 184,
                nodeHeight: 72,
                nodeGap: 14,
                rankGap: 28,
                edgeGap: 8,
                labelFontSize: 18,
                detailFontSize: 16,
                arrowSize: 6,
                padding: 8,
                nodes: [
                    {
                        id: 'call',
                        label: 'API call',
                        detail: '120-token cap',
                        tone: 'blue',
                    },
                    {
                        id: 'parse',
                        label: 'completed',
                        detail: 'strict parse + schema',
                        tone: 'blue',
                    },
                    {
                        id: 'guard',
                        label: 'max_tokens',
                        detail: 'check budget + SLA',
                        tone: 'warm',
                    },
                    {
                        id: 'stop',
                        label: (
                            <div style={{ whiteSpace: 'nowrap' }}>refusal / filter</div>
                        ),
                        detail: 'halt retries safely',
                        tone: 'critical',
                    },
                    {
                        id: 'fix',
                        label: 'bad schema',
                        detail: 'fix adapter in code',
                        tone: 'warm',
                    },
                    {
                        id: 'accept',
                        label: 'Host checks pass',
                        detail: 'scope + source ok',
                        tone: 'green',
                    },
                    {
                        id: 'retry',
                        label: 'Retry once (400)',
                        detail: '2nd stop returns err',
                        tone: 'warm',
                    },
                ],
                edges: [
                    { from: 'call', to: 'parse', tone: 'green' },
                    { from: 'call', to: 'guard', tone: 'warm' },
                    { from: 'call', to: 'stop', tone: 'critical', style: 'dashed' },
                    { from: 'call', to: 'fix', tone: 'warm', style: 'dashed' },
                    { from: 'parse', to: 'accept', tone: 'green' },
                    { from: 'guard', to: 'retry', tone: 'warm' },
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
