import React from 'react'
import {
    AxisPlot,
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
export const height = 785
export const autoSize = false
export const alt =
    'Comparison of sparse BM25 and dense cosine search on four documentation passages. An inverted index leaves rotate empty and maps api and key to d1 and d4, scoring d1 1.61 and d4 1.39 while relevant paraphrase d2 scores 0.00. Dense vectors place d2 closest to query q with cosine similarity 0.994 ahead of d1 at 0.957, d4 at 0.625, and d3 at 0.123.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity(baseC, 2.0)
    const green = getReadableToneColor('green', c, c.bg)
    const cyan = getReadableToneColor('cyan', c, c.bg)

    return (
        <Scene c={c} padding={12} gap={12} contentWidth={656}>
            <Column gap={10} width={656}>
                <Row gap={14} align="stretch">
                    <Panel
                        c={c}
                        title="Sparse: Inverted Index"
                        tone="blue"
                        width={320}
                        padding={10}
                        gap={6}
                    >
                        <TextLabel
                            c={c}
                            text="Query: rotate · api · key"
                            fontSize={20}
                            fontWeight={700}
                            color={c.textSecondary}
                        />
                        <DataTable
                            c={c}
                            rows={[
                                ['Term', 'Postings'],
                                ['rotate', '∅'],
                                ['api', 'd1, d4'],
                                ['key', 'd1, d4'],
                            ]}
                            firstColWidth={102}
                            cellWidth={172}
                            cellHeight={31}
                            gap={3}
                            headerRows={1}
                            headerCols={1}
                            fontSize={20}
                        />
                    </Panel>
                    <Panel
                        c={c}
                        title="Dense: Cosine Space"
                        tone="purple"
                        width={322}
                        padding={10}
                        gap={6}
                    >
                        <AxisPlot
                            c={c}
                            width={298}
                            height={98}
                            padding={10}
                            xMin={0}
                            xMax={1.15}
                            yMin={0}
                            yMax={1.08}
                            showAxes
                            showGrid={false}
                            showFrame={false}
                            ariaLabel="2D vector slice showing q, d2, and d1 directions"
                            vectors={[
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 1.0,
                                    y2: 0.8,
                                    color: c.textPrimary,
                                    strokeWidth: 5,
                                    arrow: true,
                                    arrowSize: 6,
                                    showStartDot: false,
                                    showEndDot: false,
                                },
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 0.9,
                                    y2: 0.9,
                                    color: green,
                                    strokeWidth: 5,
                                    arrow: true,
                                    arrowSize: 6,
                                    showStartDot: false,
                                    showEndDot: false,
                                },
                                {
                                    x1: 0,
                                    y1: 0,
                                    x2: 1.0,
                                    y2: 0.4,
                                    color: cyan,
                                    strokeWidth: 5,
                                    arrow: true,
                                    arrowSize: 6,
                                    showStartDot: false,
                                    showEndDot: false,
                                },
                            ]}
                        />
                        <Row gap={12} justify="center">
                            <TextLabel
                                c={c}
                                text="q"
                                fontSize={20}
                                fontWeight={800}
                                color={c.textPrimary}
                            />
                            <TextLabel
                                c={c}
                                text="d2 (paraphrase)"
                                fontSize={20}
                                fontWeight={800}
                                color={green}
                            />
                            <TextLabel
                                c={c}
                                text="d1"
                                fontSize={20}
                                fontWeight={800}
                                color={cyan}
                            />
                        </Row>
                    </Panel>
                </Row>
                <BarChart
                    c={c}
                    title="BM25 Lexical Score"
                    width={656}
                    height={145}
                    min={0}
                    max={1.8}
                    format={(v) => v.toFixed(1)}
                    showValues
                    showGrid={false}
                    ariaLabel="BM25 scores d1 1.61, d4 1.39, d2 0.00, d3 0.00"
                    data={[
                        { label: 'd1', value: 1.609, valueLabel: '1.61', color: 'primary' },
                        { label: 'd4', value: 1.386, valueLabel: '1.39', color: 'warning' },
                        { label: 'd2', value: 0.0, valueLabel: '0.00', color: 'neutral' },
                        { label: 'd3', value: 0.0, valueLabel: '0.00', color: 'neutral' },
                    ]}
                />
                <BarChart
                    c={c}
                    title="Dense Cosine Similarity"
                    width={656}
                    height={145}
                    min={0}
                    max={1.2}
                    format={(v) => v.toFixed(1)}
                    showValues
                    showGrid={false}
                    ariaLabel="Cosine scores d2 0.994, d1 0.957, d4 0.625, d3 0.123"
                    data={[
                        { label: 'd2', value: 0.994, valueLabel: '0.994', color: 'positive' },
                        { label: 'd1', value: 0.957, valueLabel: '0.957', color: 'primary' },
                        { label: 'd4', value: 0.625, valueLabel: '0.625', color: 'critical' },
                        { label: 'd3', value: 0.123, valueLabel: '0.123', color: 'neutral' },
                    ]}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
