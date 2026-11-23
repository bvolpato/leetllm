import React from 'react'
import { BarChart, Column, GraphDiagram, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 760
export const preset = 'engineering'
export const alt =
    'Request billing paths split between stored-answer hits ($0 token cost) and four token-billed generation components, paired with token tariff rates per million tokens.'

const illustration = defineIllustration((c) => {
    const flow = preparePrintTypography(
        prepareArticleFigure(
            GraphDiagram({
                c,
                width: 580,
                height: 310,
                direction: 'TB',
                routing: 'orthogonal',
                arrowSize: 8,
                labelFontSize: 19,
                detailFontSize: 19,
                nodeWidth: 235,
                nodeHeight: 54,
                nodeGap: 28,
                rankGap: 52,
                nodes: [
                    { id: 'req', label: 'Request & Cache Check', tone: 'blue' },
                    { id: 'hit', label: 'Stored Hit · $0 Tokens', tone: 'green' },
                    { id: 'miss', label: 'Model Call · 4 Token Lines', tone: 'purple' },
                    { id: 'lines', label: 'Fresh + Read + Write + Out', tone: 'warm' },
                ],
                edges: [
                    { from: 'req', to: 'hit', label: 'hit', tone: 'green' },
                    { from: 'req', to: 'miss', label: 'miss', tone: 'purple' },
                    { from: 'miss', to: 'lines', label: 'plus embed/infra', tone: 'warm' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const chart = preparePrintTypography(
        prepareArticleFigure(
            BarChart({
                c,
                width: 550,
                height: 290,
                title: 'Tariff ($ / 1M Tokens): Read $0.2, Input $2, Write $2.5, Batch $6, Out $12',
                min: 0,
                max: 14,
                showGrid: true,
                showValues: false,
                format: (v) => String(Math.round(v)),
                data: [
                    { label: 'Read', value: 0.2, color: 'positive' },
                    { label: 'Input', value: 2.0, color: 'info' },
                    { label: 'Write', value: 2.5, color: 'violet' },
                    { label: 'Batch', value: 6.0, color: 'warning' },
                    { label: 'Output', value: 12.0, color: 'critical' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    return (
        <Scene
            c={c}
            title="Generation Billing Paths and Token Tariffs"
            subtitle="Output tokens dominate unit rates while cached reads drop input cost by 90%"
            padding={16}
            gap={12}
        >
            {flow}
            <Column style={{ paddingLeft: 14 }}>{chart}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
