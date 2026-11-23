import React from 'react'
import {
    BadgePill,
    BarChart,
    FlowArrow,
    Panel,
    Row,
    Scene,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'

export const width = 620
export const height = 805
export const alt =
    'Comparison of next-token probabilities before and after grammar masking. Before masking, softmax over raw logits assigns Sure 49.6%, opening brace 27.2%, The 14.9%, and opening bracket 8.2%. Setting illegal tokens to negative infinity collapses all probability mass onto the only grammar-valid token, opening brace at 100%.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 1.85)
    const warm = getReadableToneColor('warm', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const red = getReadableToneColor('critical', c, c.bg)
    const rawProbs = [
        { label: 'Sure', value: 49.6, color: warm, valueLabel: '49.6%' },
        { label: '{', value: 27.2, color: green, valueLabel: '27.2%' },
        { label: 'The', value: 14.9, color: c.textMuted, valueLabel: '14.9%' },
        { label: '[', value: 8.2, color: c.textMuted, valueLabel: '8.2%' },
    ]
    const maskedProbs = [
        { label: 'Sure', value: 0, color: red, valueLabel: '0%' },
        { label: '{', value: 100, color: green, valueLabel: '100%' },
        { label: 'The', value: 0, color: red, valueLabel: '0%' },
        { label: '[', value: 0, color: red, valueLabel: '0%' },
    ]

    return Scene({
        c,
        padding: 12,
        gap: 12,
        contentWidth: 596,
        children: [
            Panel({
                c,
                title: 'Mask rule before softmax',
                tone: 'blue',
                width: 592,
                padding: 10,
                children: Row({
                    gap: 6,
                    align: 'center',
                    justify: 'center',
                    children: [
                        BadgePill({
                            c,
                            text: 'z=[1.4,0.8,0.2,-0.4]',
                            tone: 'neutral',
                            fontSize: 19,
                        }),
                        FlowArrow({ c, direction: 'right', length: 12, tone: 'blue' }),
                        BadgePill({
                            c,
                            text: 'm({)=0, else -inf',
                            tone: 'blue',
                            fontSize: 19,
                        }),
                        FlowArrow({ c, direction: 'right', length: 12, tone: 'green' }),
                        BadgePill({ c, text: 'softmax(z+m)', tone: 'green', fontSize: 19 }),
                    ],
                }),
            }),
            Panel({
                c,
                title: 'Before Mask: Unmasked Softmax P(v) (%)',
                subtitle: 'Chat token Sure leads at 49.6%',
                tone: 'warm',
                width: 592,
                padding: 10,
                children: BarChart({
                    c,
                    width: 564,
                    height: 195,
                    min: 0,
                    max: 100,
                    showGrid: true,
                    showValues: true,
                    data: rawProbs,
                }),
            }),
            Panel({
                c,
                title: "After Mask: Grammar-Masked P'(v) (%)",
                subtitle: 'Renormalized probability puts 100% on {',
                tone: 'green',
                width: 592,
                padding: 10,
                children: BarChart({
                    c,
                    width: 564,
                    height: 195,
                    min: 0,
                    max: 100,
                    showGrid: true,
                    showValues: true,
                    data: maskedProbs,
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
