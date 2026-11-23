import React from 'react'
import {
    Column,
    FlowArrow,
    Panel,
    ProgressList,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const alt =
    'Top: untied FP16 table memory at hidden dimension 4096 grows linearly across 8k (125 MiB), 32k (500 MiB), and 128k (2,000 MiB) vocabulary rows. Bottom: increasing English compression from 3.17 to 3.94 characters per token lowers token and KV positions to 80.5% and dense N-squared score cells to 64.7%.'

export const width = 640
export const height = 700
export const autoSize = false

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cyan = getReadableToneColor('cyan', c)

    return Scene({
        c,
        contentWidth: 592,
        padding: 24,
        gap: 12,
        children: Column({
            width: 592,
            gap: 12,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Vocabulary size trades table memory for sequence length',
                    width: 592,
                    fontSize: 22,
                    fontWeight: 800,
                    align: 'center',
                    color: c.textPrimary,
                }),
                Panel({
                    c,
                    title: '1. Untied FP16 table memory (2 × V × 4,096 × 2 B)',
                    titleFontSize: 19,
                    width: 592,
                    padding: 16,
                    radius: 8,
                    tone: 'blue',
                    children: Column({
                        width: 560,
                        gap: 12,
                        align: 'stretch',
                        children: [
                            ProgressList({
                                c,
                                labelWidth: 135,
                                valueWidth: 135,
                                barHeight: 22,
                                fontSize: 19,
                                gap: 12,
                                rows: [
                                    {
                                        label: 'V = 8,000',
                                        value: 125 / 2000,
                                        valueLabel: '125 MiB',
                                        tone: 'blue',
                                    },
                                    {
                                        label: 'V = 32,000',
                                        value: 500 / 2000,
                                        valueLabel: '500 MiB',
                                        tone: 'purple',
                                    },
                                    {
                                        label: 'V = 128,000',
                                        value: 1.0,
                                        valueLabel: '2,000 MiB',
                                        tone: 'red',
                                    },
                                ],
                            }),
                            TextLabel({
                                c,
                                text: 'Each budget splits 50% input embedding + 50% output head.',
                                fontSize: 19,
                                color: c.textSecondary,
                            }),
                        ],
                    }),
                }),
                Row({
                    width: 592,
                    gap: 10,
                    justify: 'center',
                    align: 'center',
                    children: [
                        FlowArrow({ c, direction: 'down', length: 20, tone: 'cyan' }),
                        TextLabel({
                            c,
                            text: 'Llama 2 -> 3 English text: 3.17 -> 3.94 chars/token',
                            fontSize: 19,
                            fontWeight: 700,
                            color: cyan,
                        }),
                    ],
                }),
                Panel({
                    c,
                    title: '2. Relative sequence cost at fixed character count',
                    titleFontSize: 19,
                    width: 592,
                    padding: 16,
                    radius: 8,
                    tone: 'cyan',
                    children: ProgressList({
                        c,
                        labelWidth: 185,
                        valueWidth: 110,
                        barHeight: 22,
                        fontSize: 19,
                        gap: 12,
                        rows: [
                            {
                                label: '3.17 chars/token',
                                value: 1.0,
                                valueLabel: '100.0%',
                                tone: 'neutral',
                            },
                            {
                                label: 'Token & KV pos',
                                value: 0.805,
                                valueLabel: '80.5%',
                                tone: 'blue',
                            },
                            {
                                label: 'Dense N² cells',
                                value: 0.647,
                                valueLabel: '64.7%',
                                tone: 'green',
                            },
                        ],
                    }),
                }),
            ],
        }),
    })
}

export default create('dark')
