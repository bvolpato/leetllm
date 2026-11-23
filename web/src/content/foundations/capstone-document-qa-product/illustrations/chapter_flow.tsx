import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 800
export const autoSize = false
export const alt =
    'Document QA pipeline: pre-index trust gating drops archived and untrusted files while indexing verified 34-word chunks into sparse TF-IDF and dense SVD rankers, merging them via Reciprocal Rank Fusion, and gating answers by evidence threshold and atomic claim entailment.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)
    return Scene({
        c,
        padding: 8,
        gap: 4,
        contentWidth: 660,
        children: GraphDiagram({
            c,
            width: 660,
            height: 740,
            direction: 'TB',
            routing: 'dagre',
            nodeWidth: 215,
            nodeHeight: 64,
            rankGap: 20,
            nodeGap: 20,
            labelFontSize: 22,
            detailFontSize: 20,
            nodes: [
                {
                    id: 'ingest',
                    label: 'Trust + Chunker',
                    detail: 'Active -> 34w',
                    tone: 'warm',
                },
                {
                    id: 'quarantine',
                    label: 'Quarantined',
                    detail: 'Blocked pre-index',
                    tone: 'red',
                },
                {
                    id: 'retrievers',
                    label: 'Sparse + SVD',
                    detail: 'TF-IDF + LSA k=7',
                    tone: 'blue',
                },
                {
                    id: 'rrf',
                    label: 'Hybrid RRF',
                    detail: 'k=60 + token cov',
                    tone: 'cyan',
                },
                {
                    id: 'cite',
                    label: 'Cited Reply',
                    detail: 'Edge pack + check',
                    tone: 'green',
                },
                {
                    id: 'abstain',
                    label: 'Abstain Gate',
                    detail: 's_ev < 0.160 refuse',
                    tone: 'red',
                },
            ],
            edges: [
                {
                    from: 'ingest',
                    to: 'quarantine',
                    label: 'block',
                    kind: 'event',
                    tone: 'red',
                },
                {
                    from: 'ingest',
                    to: 'retrievers',
                    label: 'index',
                    kind: 'sync',
                    tone: 'green',
                },
                {
                    from: 'retrievers',
                    to: 'rrf',
                    label: 'fuse',
                    kind: 'sync',
                    tone: 'blue',
                },
                {
                    from: 'rrf',
                    to: 'cite',
                    label: '>= tau',
                    kind: 'sync',
                    tone: 'green',
                },
                {
                    from: 'rrf',
                    to: 'abstain',
                    label: '< tau',
                    kind: 'event',
                    tone: 'red',
                },
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
