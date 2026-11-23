import React from 'react'
import {
    Card,
    Column,
    FlowArrow,
    Matrix,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 660
export const height = 690
export const alt =
    'Diagram showing taint propagation from private and untrusted inputs blocking outbound egress, followed by a guarantee matrix comparing delimiters, spotlighting, classifiers, taint gates, and Dual-LLM separation.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)
    const step = (title: string, detail: string, tone: 'purple' | 'critical' | 'warm' | 'green') =>
        Card({
            c,
            tone,
            width: 124,
            height: 112,
            padding: 8,
            gap: 4,
            justify: 'center',
            shadow: false,
            children: Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: title,
                        fontSize: 21,
                        fontWeight: 700,
                        color: c.textPrimary,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: detail,
                        fontSize: 20,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
        })
    return Scene({
        c,
        padding: 16,
        gap: 18,
        children: Column({
            gap: 20,
            width: 628,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Taint Propagation Severs Exfiltration',
                    fontSize: 24,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                Row({
                    width: 628,
                    gap: 6,
                    align: 'center',
                    justify: 'center',
                    children: [
                        step('Secret Read', 'private', 'purple'),
                        FlowArrow({ c, direction: 'right', tone: 'purple', length: 24 }),
                        step('Web Chunk', 'tainted', 'critical'),
                        FlowArrow({ c, direction: 'right', tone: 'critical', length: 24 }),
                        step('Taint Join', 'combined', 'warm'),
                        FlowArrow({ c, direction: 'right', tone: 'green', length: 24 }),
                        step('Host Gate', 'DENY', 'green'),
                    ],
                }),
                Matrix({
                    c,
                    title: 'Guarantees Across Failure Modes',
                    rowLabelWidth: 180,
                    cellWidth: 112,
                    cellHeight: 50,
                    fontSize: 20,
                    colorScale: 'strength',
                    colorDomain: [0, 2],
                    rowLabels: [
                        'Static Delimiters',
                        'Spotlighting',
                        'Input Classifier',
                        'Taint + Policy',
                        'Dual-LLM Split',
                    ],
                    colLabels: ['Breakout', 'Encoded', 'Exfil', 'Adaptive'],
                    data: [
                        [0, 0, 0, 0],
                        [1, 1, 0, 1],
                        [1, 0, 0, 0],
                        [2, 2, 2, 2],
                        [2, 2, 2, 2],
                    ],
                    labels: [
                        ['Fail', 'Fail', 'Fail', 'Fail'],
                        ['Strong', 'Partial', 'Open', 'Partial'],
                        ['Partial', 'Fail', 'Open', 'Fail'],
                        ['Host', 'Blocked', 'Blocked', 'Blocked'],
                        ['Isolated', 'Isolated', 'Blocked', 'Blocked'],
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
