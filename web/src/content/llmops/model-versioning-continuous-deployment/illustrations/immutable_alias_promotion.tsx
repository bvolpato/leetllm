import React from 'react'
import { Column, GraphDiagram, LineChart, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 780
export const preset = 'engineering'
export const alt =
    'Compare-and-swap alias transition diagram paired with a traffic share chart showing zero-downtime canary promotion followed by instant pointer rollback to stable.'

const illustration = defineIllustration((c) => {
    const flow = preparePrintTypography(
        prepareArticleFigure(
            GraphDiagram({
                c,
                width: 575,
                height: 275,
                direction: 'TB',
                routing: 'orthogonal',
                arrowSize: 8,
                labelFontSize: 19,
                detailFontSize: 19,
                nodeWidth: 215,
                nodeHeight: 46,
                nodeGap: 36,
                rankGap: 44,
                nodes: [
                    { id: 'rev7', label: 'Prod Alias -> Stable (v7)', tone: 'blue' },
                    { id: 'rev8', label: 'Canary -> Candidate (v8)', tone: 'purple' },
                    { id: 'prom', label: 'CAS Promotion (v9)', tone: 'green' },
                    { id: 'back', label: 'CAS Rollback (v10)', tone: 'critical' },
                ],
                edges: [
                    { from: 'rev7', to: 'rev8', label: '10% split', tone: 'purple' },
                    { from: 'rev8', to: 'prom', label: 'gates pass', tone: 'green' },
                    { from: 'prom', to: 'back', label: 'drift alert', tone: 'critical' },
                    {
                        from: 'back',
                        to: 'rev7',
                        label: 'restore bytes',
                        fromSide: 'left',
                        toSide: 'left',
                        tone: 'blue',
                    },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const chart = preparePrintTypography(
        prepareArticleFigure(
            LineChart({
                c,
                width: 550,
                height: 280,
                title: 'Traffic Share (%) Across Canary, Promotion, and Rollback',
                min: 0,
                max: 110,
                showGrid: true,
                showPoints: true,
                directLabels: false,
                format: (v) => `${Math.round(v)}%`,
                labels: ['Base', '10% Can', '50% Can', 'Promote', 'Alert', 'Rollback'],
                series: [
                    {
                        name: 'Retained Stable',
                        points: [100, 90, 50, 0, 0, 100],
                        color: 'info',
                    },
                    {
                        name: 'Candidate Bundle',
                        points: [0, 10, 50, 100, 100, 0],
                        color: 'violet',
                        area: true,
                    },
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
            title="Immutable Releases, Compare-And-Swap Aliases"
            subtitle="Artifact bytes stay pinned in storage while mutable environment pointers advance or revert atomically"
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
