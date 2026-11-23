import React from 'react'
import {
    BarChart,
    Column,
    Matrix,
    Panel,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 600
export const height = 740
export const alt =
    'Top: Switch balance terms fᵢ·pᵢ for four experts are 0.330, 0.044, 0.0225, and 0.004, summing to 0.4005 so N·sum = 1.602 versus uniform 1.00. Bottom: two-token, three-expert counterexample routing probabilities [[0.51, 0.09, 0.40], [0.09, 0.51, 0.40]] yield fractions [0.5, 0.5, 0.0] and score 0.90 < 1.0 even though E2 receives zero tokens.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cd = withDensity(c, 1.85)
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)
    const neutral = getReadableToneColor('neutral', c)
    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 576,
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                Panel({
                    c: cd,
                    title: 'Skewed batch score: 4 × Σ fᵢpᵢ = 1.602 (uniform = 1.00)',
                    titleFontSize: 20,
                    width: 572,
                    padding: 12,
                    gap: 6,
                    children: [
                        BarChart({
                            c: cd,
                            width: 540,
                            height: 196,
                            min: 0,
                            max: 0.38,
                            format: 'decimal',
                            showGrid: true,
                            showValues: true,
                            data: [
                                {
                                    label: 'E1 (.60×.55)',
                                    value: 0.33,
                                    color: warm,
                                    valueLabel: '0.330',
                                },
                                {
                                    label: 'E2 (.20×.22)',
                                    value: 0.044,
                                    color: blue,
                                    valueLabel: '0.044',
                                },
                                {
                                    label: 'E3 (.15×.15)',
                                    value: 0.0225,
                                    color: blue,
                                    valueLabel: '0.0225',
                                },
                                {
                                    label: 'E4 (.05×.08)',
                                    value: 0.004,
                                    color: neutral,
                                    valueLabel: '0.004',
                                },
                            ],
                        }),
                        TextLabel({
                            c,
                            text: 'Sum Σ fᵢpᵢ = 0.4005 -> N·Σ = 1.602. Gradients pass through mean probs pᵢ.',
                            fontSize: 18,
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Panel({
                    c: cd,
                    title: 'Counterexample: score 0.90 < 1.0 yet E2 gets 0 tokens',
                    titleFontSize: 20,
                    width: 572,
                    padding: 12,
                    gap: 8,
                    children: [
                        Matrix({
                            c: cd,
                            rowLabels: ['Tok 0 (win E0)', 'Tok 1 (win E1)'],
                            colLabels: ['E0 (f=.5)', 'E1 (f=.5)', 'E2 (f=0!)'],
                            data: [
                                [0.51, 0.09, 0.4],
                                [0.09, 0.51, 0.4],
                            ],
                            cellWidth: 94,
                            cellHeight: 38,
                            rowLabelWidth: 162,
                            format: 'decimal',
                            colorize: true,
                            colorScale: 'strength',
                            highlightCol: 2,
                            fontSize: 18,
                        }),
                        TextLabel({
                            c,
                            text: 'p = [0.30, 0.30, 0.40], f = [0.5, 0.5, 0.0] -> 3 × 0.30 = 0.90 < 1.0.',
                            fontSize: 18,
                            color: c.textSecondary,
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
