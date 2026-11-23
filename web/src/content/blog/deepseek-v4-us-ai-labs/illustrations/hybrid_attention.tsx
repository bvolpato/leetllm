import React from 'react'
import {
    BarChart,
    Column,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'

export const width = 860
export const height = 550
export const alt =
    'DeepSeek report estimates at one million tokens, relative to V3.2 at 100 percent: single-token equivalent FP8 FLOPs are 27 percent for V4 Pro and 10 percent for V4 Flash; accumulated KV cache is 10 percent for Pro and 7 percent for Flash.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 'compact')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)
    const contentWidth = width - 64
    const panelWidth = Math.floor((contentWidth - 28) / 2)

    return Scene({
        c,
        padding: 32,
        gap: 18,
        contentWidth,
        children: [
            Column({
                gap: 4,
                align: 'center',
                width: contentWidth,
                children: [
                    TextLabel({
                        c,
                        text: 'Reported efficiency gains at one million tokens',
                        width: contentWidth,
                        fontSize: 22,
                        fontWeight: 700,
                        color: c.textPrimary,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Vendor estimates relative to V3.2 baseline (100%, lower means less)',
                        width: contentWidth,
                        fontSize: 14,
                        fontWeight: 500,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
            Row({
                gap: 28,
                align: 'stretch',
                children: [
                    BarChart({
                        c,
                        width: panelWidth,
                        height: 295,
                        title: 'Single-token inference FLOPs',
                        subtitle: 'Equivalent FP8 operations',
                        min: 0,
                        max: 100,
                        format: (value) => `${value}%`,
                        showGrid: true,
                        showValues: true,
                        ariaLabel: 'Single-token inference FLOPs compared to V3.2 baseline',
                        data: [
                            { label: 'V3.2', value: 100, color: blue, valueLabel: '100%' },
                            { label: 'V4 Pro', value: 27, color: purple, valueLabel: '27%' },
                            { label: 'V4 Flash', value: 10, color: cyan, valueLabel: '10%' },
                        ],
                    }),
                    BarChart({
                        c,
                        width: panelWidth,
                        height: 295,
                        title: 'Accumulated KV cache',
                        subtitle: 'Relative cache size at 1M context',
                        min: 0,
                        max: 100,
                        format: (value) => `${value}%`,
                        showGrid: true,
                        showValues: true,
                        ariaLabel: 'Accumulated KV cache compared to V3.2 baseline',
                        data: [
                            { label: 'V3.2', value: 100, color: blue, valueLabel: '100%' },
                            { label: 'V4 Pro', value: 10, color: purple, valueLabel: '10%' },
                            { label: 'V4 Flash', value: 7, color: cyan, valueLabel: '7%' },
                        ],
                    }),
                ],
            }),
            TextLabel({
                c,
                text: 'Cache percentage covers KV storage only and excludes model weights and runtime workspace.',
                width: contentWidth,
                fontSize: 13,
                fontWeight: 500,
                color: c.textMuted,
                align: 'center',
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
