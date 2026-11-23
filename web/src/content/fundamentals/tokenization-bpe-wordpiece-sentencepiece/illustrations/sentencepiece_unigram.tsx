import React from 'react'
import {
    Column,
    FlowArrow,
    Grid,
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
    'SentencePiece Unigram lattice on ▁rain scores three complete paths: [▁rain] at 0.30 (cost 1.204), [▁, rain] at 0.015 (cost 4.200), and [▁, ra, in] at 0.00009 (cost 9.316). Common-scale negative log cost bars select [▁rain].'

export const width = 640
export const height = 700
export const autoSize = false

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c)

    return Scene({
        c,
        contentWidth: 592,
        padding: 24,
        gap: 14,
        children: Column({
            width: 592,
            gap: 14,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Unigram Viterbi scores complete paths on "▁rain"',
                    width: 592,
                    fontSize: 22,
                    fontWeight: 800,
                    align: 'center',
                    color: c.textPrimary,
                }),
                TextLabel({
                    c,
                    text: 'Multiplying piece probabilities equals adding negative log costs',
                    width: 592,
                    fontSize: 19,
                    align: 'center',
                    color: c.textSecondary,
                }),
                Grid({
                    c,
                    rows: [
                        ['Path', 'Prob product', '-ln P cost'],
                        [
                            { label: '[▁rain]', tone: 'green' },
                            '0.30',
                            { label: '1.204', tone: 'green' },
                        ],
                        ['[▁, rain]', '0.15 × 0.10 = 0.015', '4.200'],
                        ['[▁, ra, in]', '0.15 × 0.02 × 0.03', '9.316'],
                    ],
                    cellWidth: 192,
                    cellHeight: 46,
                    gap: 6,
                    fontSize: 19,
                    headerRows: 1,
                }),
                Panel({
                    c,
                    title: 'Negative log cost (0 to 10 scale, shortest bar wins)',
                    titleFontSize: 19,
                    width: 592,
                    padding: 16,
                    radius: 8,
                    tone: 'blue',
                    children: ProgressList({
                        c,
                        labelWidth: 145,
                        valueWidth: 95,
                        barHeight: 22,
                        fontSize: 19,
                        gap: 12,
                        rows: [
                            {
                                label: '▁rain',
                                value: 1.204 / 10,
                                valueLabel: '1.204',
                                tone: 'green',
                            },
                            {
                                label: '▁ + rain',
                                value: 4.2 / 10,
                                valueLabel: '4.200',
                                tone: 'blue',
                            },
                            {
                                label: '▁ + ra + in',
                                value: 9.316 / 10,
                                valueLabel: '9.316',
                                tone: 'red',
                            },
                        ],
                    }),
                }),
                Row({
                    width: 592,
                    gap: 10,
                    justify: 'center',
                    align: 'center',
                    children: [
                        FlowArrow({ c, direction: 'right', length: 28, tone: 'green' }),
                        TextLabel({
                            c,
                            text: 'Viterbi selects [▁rain] (cost 1.204, P = 0.30)',
                            fontSize: 19,
                            fontWeight: 750,
                            color: green,
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
