import { Column, GraphDiagram, Scene, TextLabel, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 820
export const height = 740
export const alt =
    'A four-turn ServeSpec optimization sequence shows a 40k-token GPU out-of-memory error, an initial disabled chunked prefill setting, a tool call that enables chunked prefill, and a candidate reply repeating that completed change. Judging the final text alone misses state completion, whereas including prior tool history marks the repeat redundant.'

function prepTheme(base: ThemeColors): ThemeColors {
    return {
        ...withDensity(base, 2.25),
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
                    text: 'Recorded session state before the candidate answers',
                    width: innerW,
                    fontSize: 25,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                GraphDiagram({
                    c,
                    width: innerW,
                    height: 225,
                    padding: 4,
                    direction: 'LR',
                    arrowSize: 6,
                    routing: 'dagre',
                    nodeWidth: 235,
                    nodeGap: 12,
                    rankGap: 26,
                    nodes: [
                        {
                            id: 't1',
                            label: 'T1-T2 · 40k OOM',
                            detail: 'prefill = false',
                            tone: 'blue',
                        },
                        {
                            id: 't3',
                            label: 'T3 · Patch tool',
                            detail: 'prefill = true',
                            tone: 'green',
                        },
                        {
                            id: 't4',
                            label: 'T4 · Candidate',
                            detail: 'Says: enable prefill',
                            tone: 'warm',
                        },
                    ],
                    edges: [
                        { from: 't1', to: 't3', tone: 'blue' },
                        { from: 't3', to: 't4', tone: 'green' },
                    ],
                }),
                TextLabel({
                    c,
                    text: 'Judge outcome changes when trusted state is included',
                    width: innerW,
                    fontSize: 25,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                GraphDiagram({
                    c,
                    width: innerW,
                    height: 260,
                    padding: 4,
                    direction: 'LR',
                    arrowSize: 6,
                    routing: 'dagre',
                    nodeWidth: 295,
                    nodeGap: 12,
                    rankGap: 36,
                    nodes: [
                        {
                            id: 'blind',
                            label: 'Only T4 prompt + reply',
                            detail: 'Completion status hidden',
                            tone: 'red',
                        },
                        {
                            id: 'blind_out',
                            label: 'Unassessable state',
                            detail: 'Looks helpful on paper',
                            tone: 'red',
                        },
                        {
                            id: 'full',
                            label: 'Full T1-T4 tool state',
                            detail: 'Patch already completed',
                            tone: 'green',
                        },
                        {
                            id: 'full_out',
                            label: 'Repeat flagged',
                            detail: 'Ask to verify batch tokens',
                            tone: 'green',
                        },
                    ],
                    edges: [
                        { from: 'blind', to: 'blind_out', tone: 'red' },
                        { from: 'full', to: 'full_out', tone: 'green' },
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
