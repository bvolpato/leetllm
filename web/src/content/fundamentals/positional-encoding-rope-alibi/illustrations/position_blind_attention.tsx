import React from 'react'
import {
    getThemeColors,
    BadgePill,
    Column,
    FlowArrow,
    Matrix,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

function createWithChildren<C extends React.ElementType>(
    component: C,
    props: Omit<React.ComponentProps<C>, 'children'>,
    ...children: React.ReactNode[]
): React.ReactElement {
    return React.createElement(component, props, ...children)
}

export const width = 560
export const height = 700
export const alt =
    'Content-only attention processes the word vectors for model [1,0], loaded [0,1], and checkpoint [1,1]. Permutation P=[2,0,1] reorders the tokens, both axes of the attention matrix, and outputs together: Attn(PX)=P Attn(X). The first output coordinate moves from [0.802,0.599,0.752] to [0.752,0.802,0.599].'

const tokenNames = ['model', 'loaded', 'checkpoint']
const vectors = [
    [1, 0],
    [0, 1],
    [1, 1],
]
const permutation = [2, 0, 1]

const attention = vectors.map((query) => {
    const scores = vectors.map((key) => (query[0] * key[0] + query[1] * key[1]) / Math.sqrt(2))
    const maximum = Math.max(...scores)
    const exponentials = scores.map((score) => Math.exp(score - maximum))
    const total = exponentials.reduce((sum, value) => sum + value, 0)
    return exponentials.map((value) => value / total)
})
const permutedAttention = permutation.map((row) =>
    permutation.map((column) => attention[row][column]),
)
const outputVectors = attention.map((row) =>
    [0, 1].map((coordinate) =>
        row.reduce((sum, weight, index) => sum + weight * vectors[index][coordinate], 0),
    ),
)
const permutedOutput = permutation.map((row) => outputVectors[row])

function tokenVectorStrip(
    c: ThemeColors,
    order: number[],
    badgeColors: ThemeColors,
): React.ReactElement {
    return createWithChildren(
        Row,
        { width: '100%', gap: 8, justify: 'center', align: 'center' },
        ...order.map((tokenIndex, index) =>
            React.createElement(
                React.Fragment,
                { key: `input-${tokenNames[tokenIndex]}-${index}` },
                createWithChildren(
                    Column,
                    { width: 166, gap: 2, align: 'center' },
                    React.createElement(TextLabel, {
                        c,
                        text: tokenNames[tokenIndex],
                        fontSize: 20,
                        fontWeight: 800,
                        color: c.textPrimary,
                        width: '100%',
                        align: 'center',
                    }),
                    React.createElement(BadgePill, {
                        c: badgeColors,
                        text: `[${vectors[tokenIndex].join(',')}]`,
                        tone: tokenIndex === 0 ? 'blue' : tokenIndex === 1 ? 'green' : 'warm',
                        width: 100,
                        height: 34,
                        fontSize: 20,
                        mono: true,
                    }),
                ),
            ),
        ),
    )
}

function outputStrip(c: ThemeColors, values: number[][], order: number[]): React.ReactElement {
    return createWithChildren(
        Column,
        { width: 222, gap: 3, align: 'center' },
        React.createElement(TextLabel, {
            c,
            text: 'Output Y · coord 0',
            fontSize: 20,
            fontWeight: 800,
            color: c.textPrimary,
            width: '100%',
            align: 'center',
        }),
        createWithChildren(
            Row,
            { width: '100%', gap: 2, align: 'center', justify: 'center' },
            ...order.map((tokenIndex, index) =>
                React.createElement(
                    React.Fragment,
                    { key: `${tokenNames[tokenIndex]}-${index}` },
                    createWithChildren(
                        Column,
                        { width: 72, gap: 1, align: 'center' },
                        React.createElement(TextLabel, {
                            c,
                            text: tokenNames[tokenIndex][0].toUpperCase(),
                            fontSize: 20,
                            fontWeight: 800,
                            color: c.textPrimary,
                            width: '100%',
                            align: 'center',
                        }),
                        React.createElement(TextLabel, {
                            c,
                            text: values[index][0].toFixed(3).replace(/^0\./, '.'),
                            fontSize: 20,
                            mono: true,
                            color: c.textPrimary,
                            width: '100%',
                            align: 'center',
                        }),
                    ),
                ),
            ),
        ),
    )
}

function attentionStage(
    c: ThemeColors,
    title: string,
    order: number[],
    matrix: number[][],
    output: number[][],
    tone: 'blue' | 'warm',
    badgeColors: ThemeColors,
    includeVectors: boolean,
): React.ReactElement {
    const labels = order.map((index) => tokenNames[index][0].toUpperCase())
    return createWithChildren(
        Column,
        {
            gap: 4,
            align: 'center',
            width: '100%',
            style: { padding: '5px 0', borderBottom: `1.5px solid ${c.borderSubtle}` },
        },
        React.createElement(TextLabel, {
            c,
            text: title,
            fontSize: 22,
            fontWeight: 900,
            color: c.textPrimary,
            width: '100%',
            align: 'left',
        }),
        includeVectors
            ? tokenVectorStrip(c, order, badgeColors)
            : createWithChildren(
                  Row,
                  { width: '100%', gap: 6, justify: 'center', align: 'center' },
                  ...order.map((tokenIndex) =>
                      React.createElement(BadgePill, {
                          key: `token-${tokenNames[tokenIndex]}`,
                          c: badgeColors,
                          text: tokenNames[tokenIndex],
                          tone: tokenIndex === 0 ? 'blue' : tokenIndex === 1 ? 'green' : 'warm',
                          width: 150,
                          height: 36,
                          fontSize: 20,
                          mono: true,
                      }),
                  ),
              ),
        createWithChildren(
            Row,
            { width: '100%', gap: 10, align: 'center', justify: 'center' },
            createWithChildren(
                Column,
                { gap: 3, align: 'center' },
                React.createElement(TextLabel, {
                    c,
                    text: 'A · query rows, key columns',
                    fontSize: 20,
                    fontWeight: 800,
                    color: c.textPrimary,
                    width: '100%',
                    align: 'center',
                }),
                React.createElement(Matrix, {
                    c,
                    data: matrix,
                    rowLabels: labels,
                    colLabels: labels,
                    cellWidth: 42,
                    cellHeight: 30,
                    rowLabelWidth: 28,
                    fontSize: 20,
                    format: 'percent',
                    colorize: true,
                    colorScale: 'strength',
                }),
            ),
            React.createElement(FlowArrow, { c, direction: 'right', tone, length: 20 }),
            outputStrip(c, output, order),
        ),
    )
}

const illustration = defineIllustration((theme) => {
    const light = theme.bg === getThemeColors('light').bg
    const c: ThemeColors = {
        ...theme,
        preset: 'engineering',
        shadow: 'transparent',
        primaryLight: light ? theme.primaryDark : theme.primaryLight,
        positiveLight: light ? theme.positiveDark : theme.positiveLight,
        warningLight: light ? theme.warningDark : theme.warningLight,
        textSecondary: theme.textPrimary,
    }
    const badgeColors: ThemeColors = { ...c, textPrimary: light ? c.textPrimary : c.bg }
    return createWithChildren(
        Scene,
        { c, background: c.bgSubtle, padding: 16, gap: 6, contentWidth: 528, align: 'center' },
        React.createElement(TextLabel, {
            c,
            text: 'Without a slot signal, outputs follow the rows',
            fontSize: 24,
            fontWeight: 900,
            color: c.textPrimary,
            width: '100%',
            align: 'center',
        }),
        React.createElement(TextLabel, {
            c,
            text: 'Content-only attention omits token position.',
            fontSize: 20,
            color: c.textSecondary,
            width: '100%',
            align: 'center',
        }),
        attentionStage(
            c,
            'Original order',
            [0, 1, 2],
            attention,
            outputVectors,
            'blue',
            badgeColors,
            true,
        ),
        React.createElement(TextLabel, {
            c,
            text: 'P=[2,0,1] reorders tokens and both axes of A.',
            fontSize: 20,
            fontWeight: 800,
            color: c.warningLight,
            width: '100%',
            align: 'center',
        }),
        attentionStage(
            c,
            'After P · A′ = PAPᵀ',
            permutation,
            permutedAttention,
            permutedOutput,
            'warm',
            badgeColors,
            false,
        ),
        React.createElement(TextLabel, {
            c,
            text: 'Attn(PX) = P Attn(X)',
            fontSize: 24,
            fontWeight: 900,
            mono: true,
            color: c.primaryLight,
            width: '100%',
            align: 'center',
        }),
    )
})

export const create = illustration.create
export default illustration.default
