import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 560
export const autoSize = false
export const alt =
    'A two-zone context architecture diagram separates the stable cacheable prefix (system instructions and tool schemas) from per-turn working context (ACL-scoped retrieval chunks, compacted session state, and the user query) before allocating output headroom and running the model call.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return Scene({
        c,
        padding: 12,
        gap: 8,
        contentWidth: 656,
        children: GraphDiagram({
            c,
            width: 656,
            height: 520,
            layout: 'auto',
            direction: 'LR',
            routing: 'dagre',
            rankGap: 36,
            nodeGap: 20,
            nodeWidth: 192,
            nodeHeight: 94,
            labelFontSize: 23,
            detailFontSize: 21,
            padding: 8,
            nodes: [
                {
                    id: 'prefix',
                    label: 'Stable Prefix',
                    detail: 'Rules + tool schemas',
                    tone: 'blue',
                },
                {
                    id: 'retrieval',
                    label: 'Scoped Retrieval',
                    detail: 'Hybrid search + rerank',
                    tone: 'green',
                },
                {
                    id: 'memory',
                    label: 'Session State',
                    detail: 'Compacted paths + checks',
                    tone: 'purple',
                },
                {
                    id: 'packet',
                    label: 'Context Packet',
                    detail: 'Ordered + slack budget',
                    tone: 'warm',
                },
                {
                    id: 'answer',
                    label: 'Model Output',
                    detail: 'Cited + isolated tools',
                    tone: 'neutral',
                },
            ],
            edges: [
                { from: 'prefix', to: 'packet', tone: 'blue' },
                { from: 'retrieval', to: 'packet', tone: 'green' },
                { from: 'memory', to: 'packet', tone: 'purple' },
                { from: 'packet', to: 'answer', tone: 'warm' },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
