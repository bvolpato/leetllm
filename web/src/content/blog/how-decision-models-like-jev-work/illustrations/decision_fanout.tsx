import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 700
export const height = 520
export const autoSize = false
export const alt =
    'A flow diagram shows one shared incident state feeding three independent decision evaluations: owner team returning registry_auth, customer impact returning not_reported, and triage urgency returning needs_review, which application routing code aggregates into an automated or human-review action.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return Scene({
        c,
        padding: 12,
        gap: 8,
        contentWidth: 676,
        children: GraphDiagram({
            c,
            width: 676,
            height: 490,
            layout: 'auto',
            direction: 'LR',
            routing: 'dagre',
            rankGap: 48,
            nodeGap: 20,
            nodeWidth: 192,
            nodeHeight: 92,
            labelFontSize: 24,
            detailFontSize: 21,
            padding: 8,
            nodes: [
                {
                    id: 'state',
                    label: 'Shared state',
                    detail: '401 registry log',
                    tone: 'blue',
                },
                {
                    id: 'owner',
                    label: 'Owner route',
                    detail: 'registry_auth (0.88)',
                    tone: 'green',
                },
                {
                    id: 'impact',
                    label: 'Impact',
                    detail: 'not_reported (0.91)',
                    tone: 'purple',
                },
                {
                    id: 'urgency',
                    label: 'Urgency',
                    detail: 'needs_review (0.64)',
                    tone: 'warm',
                },
                {
                    id: 'router',
                    label: 'App router',
                    detail: 'threshold + review',
                    tone: 'neutral',
                },
            ],
            edges: [
                { from: 'state', to: 'owner', tone: 'green' },
                { from: 'state', to: 'impact', tone: 'purple' },
                { from: 'state', to: 'urgency', tone: 'warm' },
                { from: 'owner', to: 'router', tone: 'green' },
                { from: 'impact', to: 'router', tone: 'purple' },
                { from: 'urgency', to: 'router', tone: 'warm' },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
