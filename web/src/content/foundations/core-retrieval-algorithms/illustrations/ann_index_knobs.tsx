import React from 'react'
import {
    BarChart,
    Column,
    LineChart,
    MetricCard,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 680
export const height = 770
export const autoSize = false
export const alt =
    'Clustered IVF benchmark on 1,000 16-dimensional vectors across 20 Voronoi cells and 100 queries. Probing 1 cell checks 70.7 distances (7.1% of flat search) with 0.584 Recall@10 and 0.640 1-Recall@10. Increasing nprobe to 6 and 8 lifts Recall@10 to 0.939 and 0.974 at 317.2 and 417.4 checks. Probing all 20 cells achieves 1.000 recall at 1,020 checks, exceeding the 1,000-vector flat scan by the 20 centroid checks.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return (
        <Scene c={c} padding={12} gap={12} contentWidth={656}>
            <Column gap={12} width={656}>
                <Row gap={12} align="stretch">
                    <MetricCard
                        c={c}
                        label="Corpus Scale"
                        value="1,000"
                        detail="D=16 · nlist=20 · Q=100"
                        tone="blue"
                        width={210}
                    />
                    <MetricCard
                        c={c}
                        label="nprobe = 1"
                        value="0.584"
                        detail="Recall@10 · 7.1% checks"
                        tone="red"
                        width={211}
                    />
                    <MetricCard
                        c={c}
                        label="nprobe = 8"
                        value="0.974"
                        detail="Recall@10 · 41.7% checks"
                        tone="green"
                        width={211}
                    />
                </Row>
                <LineChart
                    c={c}
                    width={656}
                    height={185}
                    title="IVF Recall vs. Probed Cells (nlist = 20)"
                    labels={['np=1', 'np=2', 'np=4', 'np=6', 'np=8', 'np=20']}
                    min={0.5}
                    max={1.08}
                    format={(v) => v.toFixed(2)}
                    showPoints
                    directLabels
                    showGrid={false}
                    ariaLabel="Recall@10 rises from 0.584 at nprobe=1 to 0.974 at nprobe=8 and 1.000 at nprobe=20"
                    series={[
                        {
                            name: 'Recall@10',
                            color: 'positive',
                            points: [0.584, 0.753, 0.887, 0.939, 0.974, 1.0],
                        },
                        {
                            name: '1-Recall@10',
                            color: 'primary',
                            points: [0.64, 0.84, 0.93, 0.94, 0.99, 1.0],
                        },
                    ]}
                />
                <BarChart
                    c={c}
                    width={656}
                    height={185}
                    title="Mean Checks vs. Flat Scan (1,000)"
                    min={0}
                    max={1200}
                    format="integer"
                    showValues
                    showGrid={false}
                    ariaLabel="Distance checks grow from 70.7 at nprobe=1 to 1020 at nprobe=20 versus 1000 flat"
                    data={[
                        { label: 'np=1', value: 70.7, valueLabel: '71', color: 'positive' },
                        { label: 'np=2', value: 121.9, valueLabel: '122', color: 'positive' },
                        { label: 'np=4', value: 219.6, valueLabel: '220', color: 'primary' },
                        { label: 'np=6', value: 317.2, valueLabel: '317', color: 'primary' },
                        { label: 'np=8', value: 417.4, valueLabel: '417', color: 'warning' },
                        { label: 'np=20', value: 1020, valueLabel: '1020', color: 'critical' },
                        { label: 'Flat', value: 1000, valueLabel: '1000', color: 'neutral' },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
