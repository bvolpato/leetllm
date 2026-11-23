import React from 'react'
import { BarChart, Column, Flow, Scene, defineIllustration, withDensity } from 'vizmatic'

export const width = 680
export const height = 750
export const autoSize = false
export const alt =
    'Reciprocal rank fusion pipeline and score comparison across two constants. BM25 returns [d1, d4] and dense cosine returns [d2, d1, d4], feeding 1 / (k + rank). At k=60, consensus keeps d4 (0.0320) ahead of single-lane d2 (0.0164), so a top-2 cutoff drops d2. At k=0, d2 (1.000) overtakes d4 (0.833).'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return (
        <Scene c={c} padding={12} gap={12} contentWidth={656}>
            <Column gap={12} width={656}>
                <Flow
                    c={c}
                    direction="horizontal"
                    gap={8}
                    connectorLength={24}
                    stages={[
                        { title: 'BM25 Lane', subtitle: '[d1, d4]', tone: 'blue', width: 175 },
                        {
                            title: 'Dense Lane',
                            subtitle: '[d2, d1, d4]',
                            tone: 'purple',
                            width: 185,
                        },
                        { title: 'RRF Sum', subtitle: '1 / (k + rank)', tone: 'cyan', width: 195 },
                    ]}
                />
                <BarChart
                    c={c}
                    width={656}
                    height={180}
                    title="RRF (k = 60): Consensus Beats Dense #1"
                    min={0}
                    max={0.04}
                    format={(v) => v.toFixed(3)}
                    showValues
                    showGrid={false}
                    ariaLabel="At k=60, d1 scores 0.0325, d4 scores 0.0320, and d2 scores 0.0164"
                    data={[
                        { label: 'd1', value: 0.032522, valueLabel: '0.0325', color: 'positive' },
                        { label: 'd4', value: 0.032002, valueLabel: '0.0320', color: 'critical' },
                        { label: 'd2', value: 0.016393, valueLabel: '0.0164', color: 'warning' },
                    ]}
                />
                <BarChart
                    c={c}
                    width={656}
                    height={180}
                    title="RRF (k = 0): Top Rank Lifts d2"
                    min={0}
                    max={1.85}
                    format={(v) => v.toFixed(2)}
                    showValues
                    showGrid={false}
                    ariaLabel="At k=0, d1 scores 1.500, d2 scores 1.000, and d4 scores 0.833"
                    data={[
                        { label: 'd1', value: 1.5, valueLabel: '1.500', color: 'positive' },
                        { label: 'd2', value: 1.0, valueLabel: '1.000', color: 'positive' },
                        { label: 'd4', value: 0.833333, valueLabel: '0.833', color: 'critical' },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
