import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 520
export const autoSize = false
export const alt =
    'Left-to-right retrieval filtering diagram showing Docs v2.4 (archived) and Docs v2.5 (active) entering Version Filter (version = v2.5), passing through Caller ACL Check (repo permissions), and entering Model Context Window cleanly.'

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
            height: 490,
            layout: 'auto',
            direction: 'LR',
            routing: 'dagre',
            rankGap: 32,
            nodeGap: 24,
            nodeWidth: 186,
            nodeHeight: 92,
            labelFontSize: 23,
            detailFontSize: 21,
            padding: 8,
            nodes: [
                {
                    id: 'v24',
                    label: 'Docs v2.4',
                    detail: 'Archived fp16 note',
                    tone: 'neutral',
                },
                {
                    id: 'v25',
                    label: 'Docs v2.5',
                    detail: 'Active fp8 default',
                    tone: 'green',
                },
                {
                    id: 'ver',
                    label: 'Version Filter',
                    detail: 'Keep active v2.5',
                    tone: 'warm',
                },
                {
                    id: 'acl',
                    label: 'Caller ACL',
                    detail: 'Verify repo access',
                    tone: 'blue',
                },
            ],
            edges: [
                { from: 'v24', to: 'ver', tone: 'neutral', dashed: true },
                { from: 'v25', to: 'ver', tone: 'green' },
                { from: 'ver', to: 'acl', tone: 'warm' },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
