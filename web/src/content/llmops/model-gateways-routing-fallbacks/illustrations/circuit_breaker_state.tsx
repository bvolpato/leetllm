import React from 'react'
import { Column, GraphDiagram, LineChart, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 780
export const preset = 'engineering'
export const alt =
    'Three-state circuit breaker transition diagram paired with an EWMA provider error rate curve across outage and recovery.'

const illustration = defineIllustration((c) => {
    const stateGraph = preparePrintTypography(
        prepareArticleFigure(
            GraphDiagram({
                c,
                width: 580,
                height: 360,
                direction: 'TB',
                routing: 'orthogonal',
                arrowSize: 8,
                labelFontSize: 19,
                detailFontSize: 19,
                nodeWidth: 250,
                nodeHeight: 50,
                nodeGap: 48,
                rankGap: 72,
                nodes: [
                    { id: 'closed', label: 'CLOSED · Route + EWMA', tone: 'green' },
                    { id: 'open', label: 'OPEN · 30s Cooldown', tone: 'red' },
                    { id: 'half', label: 'HALF_OPEN · 1 Probe', tone: 'warm' },
                ],
                edges: [
                    {
                        from: 'closed',
                        to: 'open',
                        label: 'err ≥ 30%',
                        tone: 'red',
                        fromSide: 'bottom',
                        toSide: 'top',
                    },
                    {
                        from: 'open',
                        to: 'half',
                        label: 'cooldown',
                        tone: 'warm',
                        fromSide: 'bottom',
                        toSide: 'top',
                    },
                    {
                        from: 'half',
                        to: 'closed',
                        label: 'probe OK',
                        tone: 'green',
                        fromSide: 'left',
                        toSide: 'left',
                    },
                    {
                        from: 'half',
                        to: 'open',
                        label: 'fail',
                        tone: 'red',
                        dashed: true,
                        fromSide: 'right',
                        toSide: 'right',
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
                title: 'EWMA Error Rate (%) Across Outage & Recovery',
                min: 0,
                max: 100,
                showGrid: true,
                showPoints: true,
                directLabels: false,
                format: (v) => String(Math.round(v)),
                labels: ['0s', '15s', '30s', '50s', '60s', '75s'],
                series: [
                    {
                        name: 'EWMA Error %',
                        points: [4, 38, 62, 62, 31, 9],
                        color: 'critical',
                        area: true,
                    },
                    {
                        name: 'Trip Limit (30%)',
                        points: [30, 30, 30, 30, 30, 30],
                        color: 'warning',
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
            title="EWMA Circuit Breaker and Recovery Probes"
            subtitle="Transport faults trip the breaker; schema checks never isolate a route"
            padding={16}
            gap={10}
        >
            {stateGraph}
            <Column style={{ paddingLeft: 14 }}>{chart}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
