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

export const width = 680
export const height = 680
export const alt =
    'Matrix tracking three requests through input screening, model generation, text review, and tool execution: unit-test help passes, deploy pauses without approval, and key exfiltration blocks at input before generation.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)
    const reqCard = (
        tag: string,
        summary: string,
        outcome: string,
        tone: 'green' | 'warm' | 'critical',
    ) =>
        Card({
            c,
            tone,
            width: 194,
            height: 140,
            padding: 10,
            gap: 4,
            justify: 'center',
            shadow: false,
            children: Column({
                gap: 4,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: tag,
                        fontSize: 21,
                        fontWeight: 700,
                        color: c.textPrimary,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: summary,
                        fontSize: 20,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: outcome,
                        fontSize: 20,
                        fontWeight: 700,
                        color: c.textPrimary,
                        align: 'center',
                    }),
                ],
            }),
        })
    return Scene({
        c,
        padding: 16,
        gap: 16,
        children: Column({
            gap: 16,
            width: 648,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Checkpoint Decisions Across Three Requests',
                    fontSize: 24,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                Row({
                    width: 648,
                    gap: 12,
                    align: 'center',
                    justify: 'center',
                    children: [
                        reqCard('Req A', 'Unit-test command', 'Send answer', 'green'),
                        reqCard('Req B', 'Deploy prod now', 'Hold pending OK', 'warm'),
                        reqCard('Req C', 'Ignore + leak keys', 'Block at input', 'critical'),
                    ],
                }),
                Row({
                    width: 648,
                    gap: 8,
                    align: 'center',
                    justify: 'center',
                    children: [FlowArrow({ c, direction: 'down', tone: 'blue', length: 24 })],
                }),
                Matrix({
                    c,
                    title: 'Stage Outcomes',
                    rowLabelWidth: 96,
                    cellWidth: 132,
                    cellHeight: 54,
                    fontSize: 20,
                    colorScale: 'strength',
                    colorDomain: [0, 2],
                    rowLabels: ['Req A', 'Req B', 'Req C'],
                    colLabels: ['Input', 'Draft', 'Text', 'Tool'],
                    data: [
                        [2, 2, 2, 1],
                        [2, 2, 1, 0],
                        [0, 0, 0, 0],
                    ],
                    labels: [
                        ['Pass', 'Answer', 'Release', 'None'],
                        ['Pass', 'Propose', 'Hold', 'Hold'],
                        ['Block 0.91', 'Skip', 'Skip', 'Deny'],
                    ],
                }),
                Card({
                    c,
                    tone: 'blue',
                    width: 648,
                    padding: 10,
                    shadow: false,
                    children: TextLabel({
                        c,
                        text: 'Paraphrases evading C input checks still fail host vault policy.',
                        fontSize: 20,
                        color: c.textPrimary,
                        align: 'center',
                    }),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
