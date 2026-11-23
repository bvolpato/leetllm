import { Column, GraphDiagram, Scene, TextLabel, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 780
export const height = 780
export const alt =
    'A candidate response enters host-owned access and schema checks before semantic evaluation. Failed checks block the run immediately. Valid responses proceed to the rubric judge, which records resolved preferences or ties and routes unclear cases to human review.'

function prepTheme(base: ThemeColors): ThemeColors {
    return {
        ...withDensity(base, 2.3),
        shadow: 'transparent',
    }
}

const illustration = defineIllustration((base) => {
    const c = prepTheme(base)
    const innerW = width - 40
    return Scene({
        c,
        padding: 6,
        gap: 6,
        contentWidth: innerW,
        children: Column({
            width: innerW,
            gap: 8,
            children: [
                TextLabel({
                    c,
                    text: 'Stage 1: Host checks run before rubric scoring',
                    width: innerW,
                    fontSize: 24,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                GraphDiagram({
                    c,
                    width: innerW,
                    height: 170,
                    padding: 4,
                    direction: 'LR',
                    arrowSize: 6,
                    routing: 'dagre',
                    nodeWidth: 215,
                    nodeGap: 10,
                    rankGap: 26,
                    nodes: [
                        {
                            id: 'cand',
                            label: 'Candidate reply',
                            detail: 'Untrusted text',
                            tone: 'neutral',
                        },
                        {
                            id: 'gate',
                            label: 'Host checks',
                            detail: 'Access & JSON schema',
                            tone: 'green',
                        },
                        {
                            id: 'block',
                            label: 'Block failed rule',
                            detail: 'Stop immediately',
                            tone: 'red',
                        },
                    ],
                    edges: [
                        { from: 'cand', to: 'gate', tone: 'neutral' },
                        { from: 'gate', to: 'block', tone: 'red' },
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Stage 2: Validated outputs reach the rubric judge',
                    width: innerW,
                    fontSize: 24,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                GraphDiagram({
                    c,
                    width: innerW,
                    height: 290,
                    padding: 4,
                    direction: 'LR',
                    arrowSize: 6,
                    routing: 'dagre',
                    nodeWidth: 215,
                    nodeGap: 12,
                    rankGap: 26,
                    nodes: [
                        {
                            id: 'pass',
                            label: 'Passes host gate',
                            detail: 'Valid inputs',
                            tone: 'green',
                        },
                        {
                            id: 'judge',
                            label: 'Rubric judge',
                            detail: 'Clarity & order',
                            tone: 'blue',
                        },
                        {
                            id: 'record',
                            label: 'Win or tie',
                            detail: 'Log resolved verdict',
                            tone: 'blue',
                        },
                        {
                            id: 'review',
                            label: 'Human review',
                            detail: 'Unclear or flagged',
                            tone: 'warm',
                        },
                    ],
                    edges: [
                        { from: 'pass', to: 'judge', tone: 'green' },
                        { from: 'judge', to: 'record', tone: 'blue' },
                        { from: 'judge', to: 'review', tone: 'warm' },
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
