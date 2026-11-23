import React from 'react'
import { Column, GraphDiagram, LineChart, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 760
export const preset = 'engineering'
export const alt =
    'GitOps reconciliation and override alert diagram paired with a routing generation timeline explaining how stale generation tokens are rejected even on identical release digests.'

const illustration = defineIllustration((c) => {
    const flow = preparePrintTypography(
        prepareArticleFigure(
            GraphDiagram({
                c,
                width: 575,
                height: 245,
                direction: 'TB',
                routing: 'orthogonal',
                arrowSize: 8,
                labelFontSize: 19,
                detailFontSize: 19,
                nodeWidth: 215,
                nodeHeight: 46,
                nodeGap: 34,
                rankGap: 42,
                nodes: [
                    { id: 'git', label: 'Git Desired State', tone: 'blue' },
                    { id: 'sync', label: 'Controller Reconcile', tone: 'purple' },
                    { id: 'route', label: 'Active Router + Gen', tone: 'green' },
                    { id: 'drift', label: 'Re-Sync Alert', tone: 'critical' },
                ],
                edges: [
                    { from: 'git', to: 'sync', label: 'pull spec', tone: 'blue' },
                    { from: 'sync', to: 'route', label: 'CAS gen+1', tone: 'green' },
                    { from: 'sync', to: 'drift', label: 'override drift', tone: 'critical' },
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
                title: 'Monotonic Routing Generation Over Emergency Recovery',
                min: 0,
                max: 6,
                showGrid: true,
                showPoints: true,
                directLabels: false,
                format: (v) => `g${Math.round(v)}`,
                labels: ['Base', 'Cand', 'Restor', 'ReDep', 'Recover'],
                series: [
                    {
                        name: 'Generation Counter',
                        points: [0, 1, 2, 3, 4],
                        color: 'info',
                        area: true,
                    },
                    {
                        name: 'Stale Controller Gen',
                        points: [0, 1, 1, 1, 1],
                        color: 'critical',
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
            title="GitOps Reconciliation and Generation-Guarded Recovery"
            subtitle="Emergency pointer changes must repair Git state while monotonic tokens reject stale automation"
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
