import { createElement } from 'react'
import { Column, FlowArrow, Heatmap, Row, Scene, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'
export { createFilm } from './_parts/attention-film'

export const width = 660
export const height = 560
export const alt =
    'Side-by-side attention matrices for the tokens Birds and sing: scaled QK compatibility scores [[0.636, 0.530], [0.424, 0.742]] pass through row-wise softmax to produce routing weights [[0.527, 0.473], [0.421, 0.579]], which mix value vectors [2, 1] and [1, 2] into sing output [1.421, 1.579].'

const tokens = ['Birds', 'sing']

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    const scores = [
        [0.636, 0.53],
        [0.424, 0.742],
    ]
    const weights = [
        [0.527, 0.473],
        [0.421, 0.579],
    ]

    const scoreLabels = scores.map((row) =>
        row.map((value) => createElement('span', { style: { fontWeight: 700 } }, value.toFixed(3))),
    )
    const weightLabels = weights.map((row) =>
        row.map((value) => createElement('span', { style: { fontWeight: 700 } }, value.toFixed(3))),
    )

    return Scene({
        c,
        title: 'From scaled QK scores to row weights and value mixing',
        subtitle: 'Each query row normalizes across keys before combining value vectors',
        contentWidth: 640,
        padding: 12,
        gap: 16,
        children: [
            Row({
                gap: 14,
                align: 'center',
                justify: 'center',
                children: [
                    Column({
                        gap: 8,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: '1. Scaled Q·Kᵀ / √d_k',
                                fontSize: 21,
                                fontWeight: 700,
                                align: 'center',
                            }),
                            Heatmap({
                                c,
                                data: scores,
                                labels: scoreLabels,
                                xLabels: tokens,
                                yLabels: tokens,
                                cellWidth: 88,
                                cellHeight: 56,
                                rowLabelWidth: 64,
                                colorScale: 'strength',
                                fontSize: 21,
                                colorDomain: [0.35, 0.8],
                                ariaLabel: 'Scaled query-key compatibility scores before softmax',
                            }),
                        ],
                    }),
                    FlowArrow({ direction: 'right', c, tone: 'purple', length: 24 }),
                    Column({
                        gap: 8,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: '2. Row softmax weights',
                                fontSize: 21,
                                fontWeight: 700,
                                align: 'center',
                            }),
                            Heatmap({
                                c,
                                data: weights,
                                labels: weightLabels,
                                xLabels: tokens,
                                yLabels: tokens,
                                cellWidth: 88,
                                cellHeight: 56,
                                rowLabelWidth: 64,
                                colorScale: 'strength',
                                fontSize: 21,
                                colorDomain: [0.35, 0.65],
                                ariaLabel: 'Normalized row-wise attention probabilities',
                            }),
                        ],
                    }),
                ],
            }),
            FlowArrow({ direction: 'down', c, tone: 'green', length: 18 }),
            Column({
                gap: 6,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: '3. Mix values V(Birds) = [2.0, 1.0] and V(sing) = [1.0, 2.0]',
                        fontSize: 21,
                        color: c.textMuted,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'sing output = 0.421·[2, 1] + 0.579·[1, 2] = [1.421, 1.579]',
                        fontSize: 21,
                        mono: true,
                        fontWeight: 700,
                        color: c.textPrimary,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
