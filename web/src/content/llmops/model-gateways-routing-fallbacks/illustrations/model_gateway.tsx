import React from 'react'
import { Column, GraphDiagram, ParetoChart, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 780
export const preset = 'engineering'
export const alt =
    'Model gateway policy filter and EWMA ranker routing across VPC and public endpoints above a Pareto plot of tail latency versus evaluation pass rate.'

const illustration = defineIllustration((c) => {
    const flow = preparePrintTypography(
        prepareArticleFigure(
            GraphDiagram({
                c,
                width: 580,
                height: 340,
                direction: 'TB',
                routing: 'orthogonal',
                arrowSize: 8,
                labelFontSize: 19,
                detailFontSize: 19,
                nodeWidth: 174,
                nodeHeight: 58,
                nodeGap: 20,
                rankGap: 56,
                nodes: [
                    { id: 'req', label: 'Private JSON · 2s', tone: 'blue' },
                    { id: 'filter', label: 'Policy Filter', tone: 'purple' },
                    { id: 'p70b', label: 'Private-70B (95%)', tone: 'green' },
                    { id: 'v8b', label: 'VPC-8B (86%)', tone: 'cyan' },
                    { id: 'pub', label: 'Public (Dropped)', tone: 'red', muted: true },
                ],
                edges: [
                    { from: 'req', to: 'filter', label: 'EWMA score', tone: 'blue' },
                    { from: 'filter', to: 'p70b', label: 'primary', tone: 'green' },
                    { from: 'filter', to: 'v8b', label: 'backup', tone: 'cyan' },
                    { from: 'filter', to: 'pub', label: 'off-VPC', tone: 'red', muted: true },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const frontier = preparePrintTypography(
        prepareArticleFigure(
            ParetoChart({
                c,
                width: 550,
                height: 295,
                title: 'Eligible VPC Lanes: Latency (ms) vs Pass Rate (%)',
                xMin: 300,
                xMax: 2100,
                yMin: 76,
                yMax: 100,
                xObjective: 'minimize',
                yObjective: 'maximize',
                frontierColor: 'positive',
                showGrid: true,
                showGoal: false,
                formatX: (v) => String(Math.round(v)),
                formatY: (v) => String(Math.round(v)),
                points: [
                    { x: 490, y: 86, label: 'VPC-8B', color: 'info' },
                    { x: 920, y: 95, label: 'Private-70B', color: 'positive' },
                    { x: 1740, y: 96, label: 'Reasoner', color: 'violet' },
                    { x: 1380, y: 82, label: 'Legacy-34B', color: 'neutral' },
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
            title="Gateway Policy Filter and Latency-Quality Frontier"
            subtitle="Drop incompatible endpoints first, then choose along the Pareto curve"
            padding={16}
            gap={12}
        >
            {flow}
            <Column style={{ paddingLeft: 14 }}>{frontier}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
