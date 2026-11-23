import React from 'react'
import { BarChart, Column, GraphDiagram, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 755
export const preset = 'engineering'
export const alt =
    'Feature-transform parity gate comparing offline L2 normalization with unnormalized online scoring, paired with a bar chart showing dot-product ranking inversion between vectors A and B.'

const illustration = defineIllustration((c) => {
    const flow = preparePrintTypography(
        prepareArticleFigure(
            GraphDiagram({
                c,
                width: 585,
                height: 310,
                direction: 'TB',
                routing: 'orthogonal',
                arrowSize: 8,
                labelFontSize: 19,
                detailFontSize: 19,
                nodeWidth: 215,
                nodeHeight: 56,
                nodeGap: 90,
                rankGap: 50,
                nodes: [
                    { id: 'off', label: 'Offline: L2 Norm', detail: 'sha ce667443', tone: 'blue' },
                    { id: 'on', label: 'Online: Raw Vec', detail: 'sha 660645c4', tone: 'warm' },
                    { id: 'gate', label: 'Transform Parity Gate', tone: 'purple' },
                    { id: 'fail', label: 'Block Skewed Release', tone: 'critical' },
                ],
                edges: [
                    { from: 'off', to: 'gate', label: 'L2', tone: 'blue' },
                    { from: 'on', to: 'gate', label: 'raw', tone: 'warm' },
                    { from: 'gate', to: 'fail', label: 'hash mismatch', tone: 'critical' },
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
                height: 280,
                title: 'Query q=[1,0] Dot Score Flip (A=[3,4] vs B=[2,0])',
                min: 0,
                max: 3.6,
                showGrid: true,
                showValues: false,
                format: (v) => v.toFixed(1),
                data: [
                    { label: 'Raw-A', value: 3.0, color: 'warning' },
                    { label: 'Raw-B', value: 2.0, color: 'neutral' },
                    { label: 'Unit-A', value: 0.6, color: 'critical' },
                    { label: 'Unit-B', value: 1.0, color: 'positive' },
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
            title="Feature Transform Parity and Ranking Inversion"
            subtitle="Mismatching L2 normalization between training and serving flips top-1 retrieval results"
            padding={16}
            gap={14}
        >
            {flow}
            <Column style={{ paddingLeft: 14 }}>{chart}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
