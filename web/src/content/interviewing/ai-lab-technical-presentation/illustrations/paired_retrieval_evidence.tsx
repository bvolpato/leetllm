import React from 'react'
import { BarChart, Column, Matrix, Panel, Scene, defineIllustration, withDensity } from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 660
export const height = 760
export const alt =
    'Paired retrieval evaluation for 200 queries across BM25 baseline and cross-encoder candidate. The 2x2 contingency matrix records 140 common hits, 8 baseline-only regressions, 22 candidate-only improvements, and 30 common misses. The bottom bar chart contrasts 74% baseline hit@5 against 81% reranked hit@5 (+7 percentage points, 11% gained vs 4% regressed).'

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 1.95)

    return (
        <Scene c={c} padding={12} gap={12}>
            <Column gap={12} align="stretch">
                <Panel
                    c={c}
                    title="McNemar Paired Counts (N = 200)"
                    width={636}
                    padding={12}
                    tone="blue"
                >
                    <Matrix
                        c={c}
                        title="22 gains vs 8 regressions -> p = 0.0161"
                        data={[
                            [140, 8],
                            [22, 30],
                        ]}
                        rowLabels={['BM25 Hit', 'BM25 Miss']}
                        colLabels={['Rerank Hit', 'Rerank Miss']}
                        rowLabelWidth={165}
                        cellWidth={150}
                        cellHeight={72}
                        format="integer"
                        fontSize={22}
                        colorize
                        colorScale="strength"
                        highlightCell={{ row: 1, col: 0 }}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Hit@5 vs Asymmetric Query Churn (%)"
                    width={636}
                    padding={12}
                    tone="green"
                >
                    <BarChart
                        c={c}
                        width={608}
                        height={190}
                        subtitle="Aggregate +7 pp gain combines 11% newly solved queries and 4% regressions"
                        min={0}
                        max={100}
                        yAxisLabel="Queries (%)"
                        format="integer"
                        showValues
                        data={[
                            { label: 'BM25 Hit@5', value: 74, color: 'blue' },
                            { label: 'Rerank Hit@5', value: 81, color: 'green' },
                            { label: 'Improved', value: 11, color: 'cyan' },
                            { label: 'Regressed', value: 4, color: 'critical' },
                        ]}
                    />
                </Panel>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
