import React from 'react'
import { BarChart, Column, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 640
export const height = 780
export const autoSize = false
export const alt =
    'Retrieval benchmark across 15 engineering queries comparing Mean Reciprocal Rank at 5 and normalized Discounted Cumulative Gain at 5 for sparse TF-IDF (0.783, 0.822), dense SVD rank-7 (0.822, 0.868), pure RRF (0.900, 0.926), and hybrid RRF with coverage reranking (0.933, 0.951).'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 1.9)
    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 616,
        children: Column({
            gap: 10,
            children: [
                BarChart({
                    c,
                    width: 616,
                    height: 170,
                    title: 'Mean Reciprocal Rank (MRR@5) Across 15 Queries',
                    subtitle: 'RRF + coverage reranker reaches 0.933 vs 0.783 sparse / 0.822 dense',
                    max: 1.15,
                    showGrid: false,
                    showValues: true,
                    data: [
                        {
                            label: 'Sparse TF-IDF',
                            value: 0.783,
                            valueLabel: '0.783',
                            color: 'warning',
                        },
                        {
                            label: 'Dense SVD k=7',
                            value: 0.822,
                            valueLabel: '0.822',
                            color: 'info',
                        },
                        {
                            label: 'Pure RRF k=60',
                            value: 0.9,
                            valueLabel: '0.900',
                            color: 'secondary',
                        },
                        {
                            label: 'Hybrid + Rerank',
                            value: 0.933,
                            valueLabel: '0.933',
                            color: 'positive',
                        },
                    ],
                }),
                BarChart({
                    c,
                    width: 616,
                    height: 170,
                    title: 'Ranking Quality (nDCG@5) Across Same Queries',
                    subtitle:
                        'Sparse drops on paraphrases (Recall@3 0.867); hybrid hits 1.000 Recall@3',
                    max: 1.15,
                    showGrid: false,
                    showValues: true,
                    data: [
                        {
                            label: 'Sparse TF-IDF',
                            value: 0.822,
                            valueLabel: '0.822',
                            color: 'warning',
                        },
                        {
                            label: 'Dense SVD k=7',
                            value: 0.868,
                            valueLabel: '0.868',
                            color: 'info',
                        },
                        {
                            label: 'Pure RRF k=60',
                            value: 0.926,
                            valueLabel: '0.926',
                            color: 'secondary',
                        },
                        {
                            label: 'Hybrid + Rerank',
                            value: 0.951,
                            valueLabel: '0.951',
                            color: 'positive',
                        },
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
