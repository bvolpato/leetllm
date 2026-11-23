import React from 'react'
import {
    BarChart,
    Column,
    DataTable,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'

export const width = 680
export const height = 770
export const autoSize = false
export const alt =
    'Comparison of candidate budgets k=3 and k=5 evaluated at NDCG@3. At k=3, only api-guide (grade 3) plus zero-grade blog-post and legacy-changelog reach ranking; retry-runbook and sdk-example stay outside the cutoff, giving candidate recall 0.333, local reranker NDCG@3 1.000, and system NDCG@3 0.674. At k=5, all five reach ranking and recall, local NDCG@3, and system NDCG@3 all reach 1.000.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)
    const critical = getReadableToneColor('critical', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)

    return (
        <Scene c={c} padding={12} gap={12} contentWidth={656}>
            <Column gap={12} width={656}>
                <Row gap={14} align="stretch">
                    <Panel
                        c={c}
                        title="Cutoff k = 3 (1/3 recall)"
                        tone="warm"
                        width={321}
                        padding={10}
                        gap={8}
                    >
                        <DataTable
                            c={c}
                            rows={[
                                ['Ranked Doc', 'Grade'],
                                ['#1 api-guide', '3'],
                                ['#2 blog-post', '0'],
                                ['#3 changelog', '0'],
                            ]}
                            firstColWidth={222}
                            cellWidth={66}
                            cellHeight={34}
                            gap={3}
                            headerRows={1}
                            headerCols={1}
                            fontSize={20}
                        />
                        <TextLabel
                            c={c}
                            text="Missed: runbook (2), sdk (2)"
                            fontSize={20}
                            fontWeight={700}
                            color={critical}
                        />
                    </Panel>
                    <Panel
                        c={c}
                        title="Cutoff k = 5 (3/3 recall)"
                        tone="green"
                        width={321}
                        padding={10}
                        gap={8}
                    >
                        <DataTable
                            c={c}
                            rows={[
                                ['Ranked Doc', 'Grade'],
                                ['#1 api-guide', '3'],
                                ['#2 retry-runbook', '2'],
                                ['#3 sdk-example', '2'],
                            ]}
                            firstColWidth={222}
                            cellWidth={66}
                            cellHeight={34}
                            gap={3}
                            headerRows={1}
                            headerCols={1}
                            fontSize={20}
                        />
                        <TextLabel
                            c={c}
                            text="All 3 useful pages ranked"
                            fontSize={20}
                            fontWeight={700}
                            color={green}
                        />
                    </Panel>
                </Row>
                <BarChart
                    c={c}
                    width={656}
                    height={255}
                    title="Local Reranker Metric vs. Whole-System NDCG@3"
                    subtitle="Local NDCG@3 = 1.000 at k=3 hides two omitted grade-2 guides"
                    min={0}
                    max={1.18}
                    format={(v) => v.toFixed(2)}
                    showValues
                    showGrid={false}
                    ariaLabel="At k=3 candidate recall is 0.333, reranker NDCG@3 is 1.000, system NDCG@3 is 0.674, and at k=5 system NDCG@3 is 1.000"
                    data={[
                        {
                            label: 'Recall k=3',
                            value: 0.333,
                            valueLabel: '0.333',
                            color: 'critical',
                        },
                        { label: 'Local k=3', value: 1.0, valueLabel: '1.000', color: 'warning' },
                        {
                            label: 'System k=3',
                            value: 0.674,
                            valueLabel: '0.674',
                            color: 'primary',
                        },
                        { label: 'System k=5', value: 1.0, valueLabel: '1.000', color: 'positive' },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
