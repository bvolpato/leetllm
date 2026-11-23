import React from 'react'
import { GraphDiagram, Scene, defineIllustration } from 'vizmatic'

export const width = 560
export const height = 560
export const alt =
    'Whole-token parser branches for passed and failed records. From the shared prefix opening brace status colon quote, the passed branch consumes passed then closing quote brace and enables end-of-sequence. The failed branch consumes fa, keeps end-of-sequence blocked, accepts iled closing quote brace to complete, and rejects iled closing quote brace exclamation as an overshooting whole token.'

const illustration = defineIllustration((c) => {
    return Scene({
        c,
        padding: 10,
        gap: 8,
        contentWidth: 540,
        children: [
            GraphDiagram({
                c,
                width: 540,
                height: 520,
                direction: 'TB',
                routing: 'orthogonal',
                nodeWidth: 158,
                nodeHeight: 74,
                nodeGap: 14,
                rankGap: 36,
                edgeGap: 8,
                labelFontSize: 19,
                detailFontSize: 18,
                arrowSize: 6,
                padding: 8,
                nodes: [
                    {
                        id: 'start',
                        label: '{"status":"',
                        detail: '<eos> blocked',
                        tone: 'blue',
                    },
                    {
                        id: 'pass-mid',
                        label: 'passed',
                        detail: '<eos> blocked',
                        tone: 'purple',
                    },
                    {
                        id: 'fail-mid',
                        label: 'fa',
                        detail: 'valid prefix',
                        tone: 'purple',
                    },
                    {
                        id: 'pass-end',
                        label: '"} -> <eos>',
                        detail: 'accepts pass',
                        tone: 'green',
                    },
                    {
                        id: 'fail-end',
                        label: 'iled"} -> <eos>',
                        detail: 'accepts fail',
                        tone: 'green',
                    },
                    {
                        id: 'overshoot',
                        label: 'iled"}! masked',
                        detail: 'overshoots at !',
                        tone: 'critical',
                    },
                ],
                edges: [
                    { from: 'start', to: 'pass-mid', tone: 'purple' },
                    { from: 'start', to: 'fail-mid', tone: 'purple' },
                    { from: 'pass-mid', to: 'pass-end', tone: 'green' },
                    { from: 'fail-mid', to: 'fail-end', tone: 'green' },
                    {
                        from: 'fail-mid',
                        to: 'overshoot',
                        tone: 'critical',
                        style: 'dashed',
                    },
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
