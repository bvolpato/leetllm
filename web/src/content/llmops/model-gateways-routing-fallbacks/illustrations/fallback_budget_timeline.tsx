import React from 'react'
import { Column, GraphDiagram, IntervalPlot, Scene, defineIllustration } from 'vizmatic'
import { prepareArticleFigure } from '../../../../../tools/illustrations/lib/presentation'
import { preparePrintTypography } from '../../../../../tools/illustrations/lib/print-typography'

export const width = 620
export const height = 780
export const preset = 'engineering'
export const alt =
    'Pre-output timeout fallback re-filtering flow paired with a request timeline interval plot inside a shared 2,000 ms deadline.'

const illustration = defineIllustration((c) => {
    const flow = preparePrintTypography(
        prepareArticleFigure(
            GraphDiagram({
                c,
                width: 580,
                height: 330,
                direction: 'TB',
                routing: 'orthogonal',
                arrowSize: 8,
                labelFontSize: 19,
                detailFontSize: 19,
                nodeWidth: 238,
                nodeHeight: 54,
                nodeGap: 32,
                rankGap: 60,
                nodes: [
                    { id: 'primary', label: 'Primary Timeout (900ms)', tone: 'red' },
                    { id: 'gate', label: 'Re-Filter: 1.1s & $0.01 left', tone: 'blue' },
                    { id: 'fallback', label: 'VPC-8B (490ms) · OK', tone: 'green' },
                    { id: 'escalate', label: 'Over Budget · Escalate', tone: 'warm' },
                ],
                edges: [
                    { from: 'primary', to: 'gate', label: 'pre-output', tone: 'blue' },
                    {
                        from: 'gate',
                        to: 'fallback',
                        label: 'fits cap',
                        tone: 'green',
                        fromSide: 'bottom',
                        toSide: 'top',
                    },
                    {
                        from: 'gate',
                        to: 'escalate',
                        label: 'exceeds',
                        tone: 'warm',
                        dashed: true,
                        fromSide: 'bottom',
                        toSide: 'top',
                    },
                ],
            }),
            false,
            false,
        ),
        19,
    )

    const timeline = preparePrintTypography(
        prepareArticleFigure(
            IntervalPlot({
                c,
                width: 550,
                height: 295,
                title: 'Attempt Windows Along 2,000 ms Shared Deadline',
                min: 0,
                max: 2500,
                format: (v) => String(Math.round(v)),
                data: [
                    {
                        label: 'Primary Timeout',
                        low: 0,
                        mid: 450,
                        high: 900,
                        color: 'critical',
                        lowLabel: '0',
                        midLabel: '',
                        highLabel: '900',
                    },
                    {
                        label: 'VPC-8B Retry',
                        low: 900,
                        mid: 1145,
                        high: 1390,
                        color: 'positive',
                        lowLabel: '900',
                        midLabel: '',
                        highLabel: '1390',
                    },
                    {
                        label: 'Slow Backup',
                        low: 900,
                        mid: 1650,
                        high: 2400,
                        color: 'warning',
                        lowLabel: '900',
                        midLabel: '',
                        highLabel: '2400',
                    },
                    {
                        label: '2s Cap',
                        low: 0,
                        mid: 2000,
                        high: 2000,
                        color: 'neutral',
                        lowLabel: '',
                        midLabel: '',
                        highLabel: '',
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
            title="Fallback Retry Within Deadline and Spend Ceiling"
            subtitle="Pre-output failures re-enter the policy filter with remaining clock and budget"
            padding={16}
            gap={12}
        >
            {flow}
            <Column style={{ paddingLeft: 14 }}>{timeline}</Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
