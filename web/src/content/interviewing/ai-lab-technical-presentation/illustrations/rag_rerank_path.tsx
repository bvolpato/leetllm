import React from 'react'
import { GraphDiagram, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 660
export const height = 760
export const alt =
    'Permission-aware two-stage RAG request path. An authenticated query first passes an ACL and tombstone filter before touching the hybrid BM25 and dense vector index. Only authorized candidates reach the cross-encoder reranker and cited answer generator, while the audit log records filters, latency, and retrieved IDs.'

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 2.0)
    return (
        <Scene c={c} padding={14} gap={0}>
            <GraphDiagram
                c={c}
                width={632}
                height={732}
                layout="manual"
                padding={18}
                nodeWidth={196}
                nodeHeight={76}
                labelFontSize={22}
                detailFontSize={20}
                arrowSize={5}
                nodes={[
                    {
                        id: 'query',
                        label: 'Caller Query',
                        detail: 'Token + user groups',
                        x: 0.22,
                        y: 0.14,
                        tone: 'blue',
                    },
                    {
                        id: 'acl',
                        label: 'ACL Filter',
                        detail: 'Tenant + tombstones',
                        x: 0.78,
                        y: 0.14,
                        tone: 'warm',
                    },
                    {
                        id: 'rerank',
                        label: 'Cross-Encoder',
                        detail: 'Top-50 -> top-5',
                        x: 0.22,
                        y: 0.5,
                        tone: 'purple',
                    },
                    {
                        id: 'index',
                        label: 'Hybrid Index',
                        detail: 'BM25 + dense top-50',
                        x: 0.78,
                        y: 0.5,
                        tone: 'cyan',
                    },
                    {
                        id: 'answer',
                        label: 'Cited Answer',
                        detail: 'Grounded chunks',
                        x: 0.22,
                        y: 0.86,
                        tone: 'green',
                    },
                    {
                        id: 'trace',
                        label: 'Audit Trace',
                        detail: 'IDs + p95 latency',
                        x: 0.78,
                        y: 0.86,
                        tone: 'blue',
                    },
                ]}
                edges={[
                    {
                        from: 'query',
                        to: 'acl',
                        fromSide: 'right',
                        toSide: 'left',
                        label: 'authz',
                        tone: 'blue',
                    },
                    {
                        from: 'acl',
                        to: 'index',
                        fromSide: 'bottom',
                        toSide: 'top',
                        label: 'allowed',
                        tone: 'warm',
                    },
                    {
                        from: 'index',
                        to: 'rerank',
                        fromSide: 'left',
                        toSide: 'right',
                        label: 'top-50',
                        tone: 'cyan',
                    },
                    {
                        from: 'rerank',
                        to: 'answer',
                        fromSide: 'bottom',
                        toSide: 'top',
                        label: 'top-5',
                        tone: 'purple',
                    },
                    {
                        from: 'answer',
                        to: 'trace',
                        fromSide: 'right',
                        toSide: 'left',
                        label: 'record',
                        tone: 'green',
                    },
                ]}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
