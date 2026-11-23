import React from 'react'
import {
    BarChart,
    Column,
    DataTable,
    MetricCard,
    Panel,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 680
export const height = 770
export const autoSize = false
export const alt =
    'A ranked five-document list has grades 0, 2, 3, 0, 2. Two swaps with equal score gaps and sigma 1 are compared: swapping api-guide (pos 3, grade 3) with blog-post (pos 1, grade 0) changes NDCG by 0.337 and gives lambda -0.1684; swapping sdk-example (pos 5, grade 2) with legacy-changelog (pos 4, grade 0) changes NDCG by 0.013 and gives lambda -0.0063, a 26.6x magnitude ratio.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)

    return (
        <Scene c={c} padding={12} gap={12} contentWidth={656}>
            <Column gap={12} width={656}>
                <Panel
                    c={c}
                    title="Ranked Order (equal gaps · σ = 1)"
                    tone="neutral"
                    width={656}
                    padding={10}
                    gap={6}
                >
                    <DataTable
                        c={c}
                        rows={[
                            ['Pos', '1', '2', '3', '4', '5'],
                            ['Doc', 'blog', 'runbook', 'guide', 'log', 'sdk'],
                            ['Grade', '0', '2', '3', '0', '2'],
                        ]}
                        firstColWidth={92}
                        cellWidth={102}
                        cellHeight={32}
                        gap={4}
                        headerRows={1}
                        headerCols={1}
                        fontSize={20}
                    />
                </Panel>
                <Row gap={14} align="stretch">
                    <MetricCard
                        c={c}
                        label="Guide ↔ Blog (Pos 3 ↔ 1)"
                        value="0.337 Δ"
                        detail="λ = −0.1684 · top impact"
                        tone="purple"
                        width={321}
                    />
                    <MetricCard
                        c={c}
                        label="SDK ↔ Log (Pos 5 ↔ 4)"
                        value="0.013 Δ"
                        detail="λ = −0.0063 · 26.6× smaller"
                        tone="blue"
                        width={321}
                    />
                </Row>
                <BarChart
                    c={c}
                    width={656}
                    height={200}
                    title="Swap |ΔNDCG| and Preferred Derivative |λ| (Shared Scale)"
                    min={0}
                    max={0.4}
                    format={(v) => v.toFixed(2)}
                    showValues
                    showGrid={false}
                    ariaLabel="Guide vs blog swap gives 0.337 delta NDCG and 0.1684 lambda magnitude versus 0.013 and 0.0063 for SDK vs changelog"
                    data={[
                        {
                            label: 'Top |ΔNDCG|',
                            value: 0.337,
                            valueLabel: '0.337',
                            color: 'positive',
                        },
                        { label: 'Top |λ|', value: 0.1684, valueLabel: '0.1684', color: 'primary' },
                        {
                            label: 'Low |ΔNDCG|',
                            value: 0.013,
                            valueLabel: '0.013',
                            color: 'warning',
                        },
                        {
                            label: 'Low |λ|',
                            value: 0.0063,
                            valueLabel: '0.0063',
                            color: 'critical',
                        },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
