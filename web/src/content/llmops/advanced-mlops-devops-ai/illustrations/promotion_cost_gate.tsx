import React from 'react'
import { BarChart, Column, GraphDiagram, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 740
export const preset = 'engineering'
export const alt =
    'Read-only shadow evaluation pipeline feeding an AND gate paired with normalized candidate metrics showing quality and latency passing while token spend exceeds its 15% cap.'

const illustration = defineIllustration((c) => {
    const flow = preparePrintTypography(
        prepareArticleFigure(
            GraphDiagram({
                c,
                width: 575,
                height: 290,
                direction: 'TB',
                routing: 'orthogonal',
                arrowSize: 8,
                labelFontSize: 19,
                detailFontSize: 19,
                nodeWidth: 215,
                nodeHeight: 48,
                nodeGap: 34,
                rankGap: 48,
                nodes: [
                    { id: 'gw', label: 'Gateway Request Fork', tone: 'blue' },
                    { id: 'ctrl', label: 'Live Control -> User', tone: 'green' },
                    { id: 'shad', label: 'Shadow Candidate (RO)', tone: 'purple' },
                    { id: 'gate', label: '3-Metric AND Gate Hold', tone: 'critical' },
                ],
                edges: [
                    { from: 'gw', to: 'ctrl', label: '100% replies', tone: 'green' },
                    { from: 'gw', to: 'shad', label: 'sampled', tone: 'purple' },
                    { from: 'shad', to: 'gate', label: '+27% tokens', tone: 'critical' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const bars = preparePrintTypography(
        prepareArticleFigure(
            BarChart({
                c,
                width: 550,
                height: 280,
                title: 'Candidate Ratios Relative to Gate Limit (100% = Cutoff)',
                min: 0,
                max: 120,
                showGrid: true,
                showValues: false,
                format: (v) => `${Math.round(v)}%`,
                data: [
                    { label: 'Quality', value: 104, color: 'positive' },
                    { label: 'LatP95', value: 97, color: 'info' },
                    { label: 'CapLine', value: 100, color: 'warning' },
                    { label: 'Tokens', value: 111, color: 'critical' },
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
            title="Read-Only Shadow Runs and Multi-Metric Promotion Gates"
            subtitle="All AND conditions must clear together; higher judge quality still holds when token spend breaches budget"
            padding={16}
            gap={14}
        >
            {flow}
            <Column style={{ paddingLeft: 14 }}>{bars}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
