import React from 'react'
import { BarChart, Column, GraphDiagram, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 740
export const preset = 'engineering'
export const alt =
    'Deterministic sticky conversation router using SHA-256 thread bucketing and abort overrides, paired with a bar chart comparing 10% thread assignment share against 50% observed request load.'

const illustration = defineIllustration((c) => {
    const flow = preparePrintTypography(
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
                nodeWidth: 210,
                nodeHeight: 48,
                nodeGap: 52,
                rankGap: 58,
                nodes: [
                    { id: 'in', label: 'Thread ID + Exposure %', tone: 'blue' },
                    { id: 'pin', label: 'Keep Existing Pin', tone: 'purple' },
                    { id: 'hash', label: 'SHA-256 Bucket < 10%', tone: 'green' },
                    { id: 'abort', label: 'Abort Override -> Stable', tone: 'critical' },
                ],
                edges: [
                    { from: 'in', to: 'pin', label: 'active session', tone: 'purple' },
                    { from: 'in', to: 'hash', label: 'new thread', tone: 'green' },
                    {
                        from: 'pin',
                        to: 'abort',
                        label: 'blocked',
                        fromSide: 'bottom',
                        toSide: 'right',
                        tone: 'critical',
                    },
                    {
                        from: 'hash',
                        to: 'abort',
                        label: 'zeroed',
                        fromSide: 'bottom',
                        toSide: 'left',
                        tone: 'critical',
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
            BarChart({
                c,
                width: 550,
                height: 280,
                title: 'Thread Exposure (%) vs Actual Candidate Request Volume (%)',
                min: 0,
                max: 100,
                showGrid: true,
                showValues: false,
                format: (v) => `${Math.round(v)}%`,
                data: [
                    { label: 'CanThreads', value: 10, color: 'info' },
                    { label: 'CanReqs', value: 50, color: 'critical' },
                    { label: 'StbThreads', value: 90, color: 'positive' },
                    { label: 'StbReqs', value: 50, color: 'violet' },
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
            title="Sticky Conversation Routing and Denominator Skew"
            subtitle="Deterministic thread hashing stabilizes multi-turn context while long sessions shift request share"
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
