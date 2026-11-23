import { createElement } from 'react'
import { Column, Matrix, Row, Scene, TextLabel, getThemeColors } from 'vizmatic'
import type { ThemeMode as Theme } from 'vizmatic'

export const width = 660
export const height = 740
export const alt =
    'Three attention weight matrices: encoder bidirectional self-attention lets all four tokens read one another, decoder causal self-attention zeroes future columns above the diagonal, and cross-attention compares decoder queries q0 and q1 against four encoder keys k0 through k3.'

const tokens = ['t0', 't1', 't2', 't3']

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')

    const encoderWeights = [
        [0.4, 0.25, 0.2, 0.15],
        [0.2, 0.45, 0.2, 0.15],
        [0.15, 0.25, 0.4, 0.2],
        [0.1, 0.2, 0.3, 0.4],
    ]

    const causalWeights = [
        [1.0, 0, 0, 0],
        [0.35, 0.65, 0, 0],
        [0.2, 0.3, 0.5, 0],
        [0.12, 0.18, 0.3, 0.4],
    ]

    const crossWeights = [
        [0.55, 0.25, 0.12, 0.08],
        [0.1, 0.2, 0.48, 0.22],
    ]

    const maskLabels = causalWeights.map((row, r) =>
        row.map((val, col) =>
            col > r
                ? createElement('span', { style: { color: c.textMuted } }, '-∞')
                : val.toFixed(2),
        ),
    )

    return Scene({
        c,
        title: 'Masking and source stream define the three attention patterns',
        contentWidth: 640,
        padding: 12,
        gap: 18,
        children: [
            Row({
                gap: 20,
                align: 'start',
                justify: 'center',
                children: [
                    Column({
                        gap: 8,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Bidirectional (encoder)',
                                fontSize: 21,
                                fontWeight: 700,
                                align: 'center',
                            }),
                            Matrix({
                                c,
                                data: encoderWeights,
                                rowLabels: tokens,
                                colLabels: tokens,
                                cellWidth: 58,
                                cellHeight: 42,
                                rowLabelWidth: 40,
                                colorize: true,
                                colorScale: 'strength',
                                colorDomain: [0, 1],
                                fontSize: 21,
                                ariaLabel: 'Dense 4 by 4 bidirectional self-attention matrix',
                            }),
                            TextLabel({
                                c,
                                text: 'All keys visible to every query',
                                fontSize: 20,
                                color: c.textMuted,
                                align: 'center',
                            }),
                        ],
                    }),
                    Column({
                        gap: 8,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text: 'Causal (decoder)',
                                fontSize: 21,
                                fontWeight: 700,
                                align: 'center',
                            }),
                            Matrix({
                                c,
                                data: causalWeights,
                                labels: maskLabels,
                                rowLabels: tokens,
                                colLabels: tokens,
                                cellWidth: 58,
                                cellHeight: 42,
                                rowLabelWidth: 40,
                                colorize: true,
                                colorScale: 'strength',
                                colorDomain: [0, 1],
                                fontSize: 21,
                                ariaLabel: 'Lower-triangular causal self-attention matrix',
                            }),
                            TextLabel({
                                c,
                                text: 'Future keys masked before softmax',
                                fontSize: 20,
                                color: c.textMuted,
                                align: 'center',
                            }),
                        ],
                    }),
                ],
            }),
            Column({
                gap: 8,
                align: 'center',
                children: [
                    TextLabel({
                        c,
                        text: 'Cross-attention (decoder queries × encoder keys)',
                        fontSize: 21,
                        fontWeight: 700,
                        align: 'center',
                    }),
                    Matrix({
                        c,
                        data: crossWeights,
                        rowLabels: ['q0', 'q1'],
                        colLabels: ['k0', 'k1', 'k2', 'k3'],
                        cellWidth: 72,
                        cellHeight: 44,
                        rowLabelWidth: 48,
                        colorize: true,
                        colorScale: 'strength',
                        colorDomain: [0, 1],
                        fontSize: 21,
                        ariaLabel:
                            '2 by 4 cross-attention matrix between decoder queries and encoder keys',
                    }),
                    TextLabel({
                        c,
                        text: 'Rectangular N_q × N_k routing; no causal constraint across streams',
                        fontSize: 20,
                        color: c.textMuted,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
