import React from 'react'
import { BarChart, Column, GraphDiagram, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 740
export const preset = 'engineering'
export const alt =
    'Side-by-side recovery paths comparing canary abort against post-promotion production rollback, paired with a bar chart of post-recovery capacity versus returning request demand.'

const illustration = defineIllustration((c) => {
    const recoveryFlow = preparePrintTypography(
        prepareArticleFigure(
            GraphDiagram({
                c,
                width: 575,
                height: 295,
                direction: 'TB',
                routing: 'orthogonal',
                arrowSize: 8,
                labelFontSize: 19,
                detailFontSize: 19,
                nodeWidth: 215,
                nodeHeight: 48,
                nodeGap: 36,
                rankGap: 50,
                nodes: [
                    { id: 'abort', label: 'Canary Abort (Prod=v7)', tone: 'warm' },
                    { id: 'roll', label: 'Prod Rollback (Prod=v8)', tone: 'critical' },
                    { id: 'st', label: 'Canary -> Stable, 0% Exp', tone: 'blue' },
                    { id: 'pr', label: 'Repoint Prod + Verify RPS', tone: 'green' },
                ],
                edges: [
                    { from: 'abort', to: 'st', label: 'drop split', tone: 'blue' },
                    { from: 'roll', to: 'pr', label: 'restore + check', tone: 'green' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const capacityBars = preparePrintTypography(
        prepareArticleFigure(
            BarChart({
                c,
                width: 550,
                height: 280,
                title: 'Stable Recovery Capacity vs Returning Demand (Req / s)',
                min: 0,
                max: 220,
                showGrid: true,
                showValues: false,
                format: (v) => String(Math.round(v)),
                data: [
                    { label: 'Demand', value: 180, color: 'info' },
                    { label: 'WarmOK', value: 195, color: 'positive' },
                    { label: 'ScaledDn', value: 169, color: 'warning' },
                    { label: 'OldSchema', value: 20, color: 'critical' },
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
            title="Canary Abort vs Production Rollback Readiness"
            subtitle="Rollback only heals users if retained replicas can handle returning load and state schemas remain readable"
            padding={16}
            gap={14}
        >
            {recoveryFlow}
            <Column style={{ paddingLeft: 14 }}>{capacityBars}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
