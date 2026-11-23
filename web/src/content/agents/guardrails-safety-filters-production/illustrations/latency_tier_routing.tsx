import React from 'react'
import {
    Card,
    Column,
    FlowArrow,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 680
export const height = 690
export const alt =
    'Stacked bar and tier routing breakdown of a 3000 ms latency budget: 100 ms input screen, 2500 ms model generation, 300 ms output review, and 100 ms host overhead, separating fast regex checks from slower verifier models.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)
    const tier = (title: string, budget: string, detail: string, tone: 'green' | 'blue' | 'warm') =>
        Card({
            c,
            tone,
            width: 640,
            padding: 6,
            gap: 2,
            shadow: false,
            children: Column({
                gap: 2,
                children: [
                    Row({
                        width: 616,
                        justify: 'space-between',
                        children: [
                            TextLabel({
                                c,
                                text: title,
                                fontSize: 21,
                                fontWeight: 700,
                                color: c.textPrimary,
                            }),
                            TextLabel({
                                c,
                                text: budget,
                                fontSize: 21,
                                fontWeight: 700,
                                color: c.textPrimary,
                            }),
                        ],
                    }),
                    TextLabel({ c, text: detail, fontSize: 20, color: c.textSecondary }),
                ],
            }),
        })
    return Scene({
        c,
        padding: 10,
        gap: 6,
        children: Column({
            gap: 8,
            width: 640,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Latency Budget Allocation and Tier Routing',
                    fontSize: 23,
                    fontWeight: 700,
                    color: c.textPrimary,
                }),
                StackedBar({
                    c,
                    title: '3,000 ms Request Budget',
                    width: 640,
                    height: 82,
                    showLegend: true,
                    segments: [
                        { label: 'Input 100 ms', value: 100, color: c.primary },
                        { label: 'Model 2,500 ms', value: 2500, color: c.accent },
                        { label: 'Output 300 ms', value: 300, color: c.warning },
                        { label: 'Host 100 ms', value: 100, color: c.textSecondary },
                    ],
                }),
                FlowArrow({ c, direction: 'down', tone: 'blue', length: 14 }),
                tier(
                    'Tier 1: Deterministic and Grammar',
                    '< 5 ms',
                    'Regex PII, URL rules, JSON FSM block cheap failures upfront',
                    'green',
                ),
                tier(
                    'Tier 2: Compact Safety Classifiers',
                    '20 to 60 ms',
                    'Prompt-injection and toxicity models screen requests inline',
                    'blue',
                ),
                tier(
                    'Tier 3: Escalated NLI / Judge Model',
                    '150 to 600 ms',
                    'Verify flagged turns or high-impact replies only',
                    'warm',
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
