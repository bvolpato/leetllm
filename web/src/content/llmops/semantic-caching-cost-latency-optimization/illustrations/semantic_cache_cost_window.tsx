import React from 'react'
import { BarChart, Column, GraphDiagram, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 760
export const preset = 'engineering'
export const alt =
    'Ordered cache eligibility pipeline enforcing tenant scope, route type, version tags, and TTL expiration before similarity matching, above a 10,000-query outcome breakdown.'

const illustration = defineIllustration((c) => {
    const gates = preparePrintTypography(
        prepareArticleFigure(
            GraphDiagram({
                c,
                width: 575,
                height: 300,
                direction: 'TB',
                routing: 'orthogonal',
                arrowSize: 8,
                labelFontSize: 19,
                detailFontSize: 19,
                nodeWidth: 210,
                nodeHeight: 50,
                nodeGap: 48,
                rankGap: 58,
                nodes: [
                    { id: 'perm', label: 'Tenant & Role Check', tone: 'blue' },
                    { id: 'scope', label: 'Scope, Version & TTL', tone: 'purple' },
                    { id: 'hit', label: 'Serve If Cos >= Tau', tone: 'green' },
                    { id: 'deny', label: 'Deny or Fresh Path', tone: 'critical' },
                ],
                edges: [
                    { from: 'perm', to: 'scope', label: 'eligible', tone: 'blue' },
                    {
                        from: 'perm',
                        to: 'deny',
                        label: 'denied/live',
                        fromSide: 'right',
                        toSide: 'top',
                        tone: 'critical',
                    },
                    { from: 'scope', to: 'hit', label: 'valid', tone: 'green' },
                    { from: 'scope', to: 'deny', label: 'stale', tone: 'critical' },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const breakdown = preparePrintTypography(
        prepareArticleFigure(
            BarChart({
                c,
                width: 550,
                height: 295,
                title: '10,000-Query Outcome Split (Safe Hits vs Bypass and Misses)',
                min: 0,
                max: 4500,
                showGrid: true,
                showValues: false,
                format: (v) => String(Math.round(v)),
                data: [
                    { label: 'L2Hit', value: 3914, color: 'positive' },
                    { label: 'L1Exact', value: 1800, color: 'info' },
                    { label: 'ScopeMiss', value: 1686, color: 'violet' },
                    { label: 'Bypass', value: 1400, color: 'warning' },
                    { label: 'CutoffMiss', value: 1200, color: 'critical' },
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
            title="Ordered Cache Gates and Workload Breakdown"
            subtitle="Scope locks, version keys, and route eligibility filter out unsafe reuses before distance checks run"
            padding={16}
            gap={14}
        >
            {gates}
            <Column style={{ paddingLeft: 14 }}>{breakdown}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
