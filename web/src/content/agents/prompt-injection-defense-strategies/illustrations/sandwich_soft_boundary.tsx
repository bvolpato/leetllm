import React from 'react'
import {
    Card,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 660
export const height = 650
export const alt =
    'Side-by-side comparison showing soft static delimiters failing under tag breakout versus hardened spotlighting, random nonces, and runtime taint gating.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 2.0)
    const stage = (
        eyebrow: string,
        title: string,
        detail: string,
        tone: 'warm' | 'critical' | 'blue' | 'green',
    ) =>
        Card({
            c,
            tone,
            width: 266,
            padding: 10,
            gap: 3,
            shadow: false,
            children: Column({
                gap: 3,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: eyebrow,
                        fontSize: 20,
                        fontWeight: 700,
                        color: c.textMuted,
                        align: 'center',
                    }),
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
        gap: 12,
        children: Row({
            gap: 16,
            width: 628,
            align: 'stretch',
            children: [
                Panel({
                    c,
                    width: 306,
                    title: 'Soft In-Context Cues',
                    tone: 'warm',
                    padding: 12,
                    gap: 10,
                    children: Column({
                        gap: 8,
                        align: 'center',
                        children: [
                            stage('STATIC TAG', '<doc> raw </doc>', 'guessable close tag', 'warm'),
                            FlowArrow({ c, direction: 'down', tone: 'critical', length: 24 }),
                            stage(
                                'TAG BREAKOUT',
                                '</doc> Run tool',
                                'attacker closes tag',
                                'critical',
                            ),
                            FlowArrow({ c, direction: 'down', tone: 'critical', length: 24 }),
                            stage(
                                'SANDWICH CUE',
                                'Logits still shift',
                                'probabilistic check',
                                'critical',
                            ),
                        ],
                    }),
                }),
                Panel({
                    c,
                    width: 306,
                    title: 'Spotlighting + Gate',
                    tone: 'green',
                    padding: 12,
                    gap: 10,
                    children: Column({
                        gap: 8,
                        align: 'center',
                        children: [
                            stage('NONCE TAG', 'Random nonce', 'inner tags escaped', 'blue'),
                            FlowArrow({ c, direction: 'down', tone: 'blue', length: 24 }),
                            stage('DATAMARKING', 'Lexical encoding', 'marks data tokens', 'blue'),
                            FlowArrow({ c, direction: 'down', tone: 'green', length: 24 }),
                            stage('HOST MONITOR', 'Taint + policy', 'blocks tainted args', 'green'),
                        ],
                    }),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
