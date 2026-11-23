import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 760
export const height = 600
export const alt =
    'A directed graph maps four citation patterns for the claim that /v1/search was removed to their deduplicated outcomes: three ungrounded echoes yield needs_evidence; three duplicates of active doc:registry yield contradicted; mixed active and removed docs yield conflict; only removed doc:archive yields supported.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 1.9)
    return Scene({
        c,
        title: 'Citation Deduplication vs. Child Vote Counting',
        subtitle: 'Exact-field check for claim: /v1/search was removed',
        contentWidth: 720,
        gap: 12,
        padding: 16,
        children: [
            GraphDiagram({
                c,
                direction: 'LR',
                routing: 'orthogonal',
                rankGap: 30,
                nodeGap: 10,
                nodes: [
                    { id: 'c1', label: '3 echoes', tone: 'neutral' },
                    { id: 'c2', label: 'registry x3', tone: 'blue' },
                    { id: 'c3', label: 'both docs', tone: 'warm' },
                    { id: 'c4', label: 'archive only', tone: 'green' },
                    { id: 'v1', label: 'no evidence', tone: 'neutral' },
                    { id: 'v2', label: 'contradicted', tone: 'critical' },
                    { id: 'v3', label: 'conflict', tone: 'warm' },
                    { id: 'v4', label: 'supported', tone: 'green' },
                ],
                edges: [
                    { from: 'c1', to: 'v1', label: '0 IDs', tone: 'neutral' },
                    { from: 'c2', to: 'v2', label: '1 active', tone: 'critical' },
                    { from: 'c3', to: 'v3', label: '2 clash', tone: 'warm' },
                    { from: 'c4', to: 'v4', label: 'Removed', tone: 'green' },
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
