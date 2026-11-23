import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Causal Inference and Counterfactuals. Stratified query outcomes plotted on one zero-to-one-hundred-percent pass scale. Short context: RAG policy 9 of 10, 90 percent; Base policy 72 of 90, 80 percent; difference plus ten percentage points. Long context: RAG policy 45 of 90, 50 percent; Base policy 4 of 10, 40 percent; plus ten points. Unequal context mixes reverse the aggregate: RAG policy 54 of 100 versus Base policy 76 of 100, minus twenty-two percentage points. Covariate imbalance flips raw comparisons.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const purple = theme === 'dark' ? '#c4b5fd' : '#7c3aed'
    const green = theme === 'dark' ? '#6ee7b7' : '#047857'
    const red = theme === 'dark' ? '#fda4af' : '#be123c'
    const x = (rate: number) => 326 + rate * 5.7
    const rows = [
        {
            name: 'Short context',
            counts: '9/10 vs 72/90',
            a: 90,
            b: 80,
            y: 228,
            difference: '+10 pp',
        },
        {
            name: 'Long context',
            counts: '45/90 vs 4/10',
            a: 50,
            b: 40,
            y: 317,
            difference: '+10 pp',
        },
        {
            name: 'Raw aggregate',
            counts: '54/100 vs 76/100',
            a: 54,
            b: 76,
            y: 406,
            difference: '−22 pp',
        },
    ]
    const label = (
        text: string,
        left: number,
        top: number,
        boxWidth: number,
        size: number,
        color = c.textPrimary,
        weight = 600,
        center = false,
    ) =>
        React.createElement(
            'div',
            {
                key: `${text}-${left}-${top}`,
                style: {
                    position: 'absolute',
                    left,
                    top,
                    width: boxWidth,
                    display: 'flex',
                    justifyContent: center ? 'center' : 'flex-start',
                    fontFamily: 'Inter',
                    fontSize: size,
                    fontWeight: weight,
                    lineHeight: 1.15,
                    color,
                },
            },
            text,
        )
    return Scene({
        c,
        background: c.bg,
        padding: 54,
        gap: 0,
        contentWidth: 1092,
        children: React.createElement(
            'div',
            { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Causal Inference and Counterfactuals', 0, 0, 1092, 46, c.textPrimary, 750),
            label(
                'Unequal query mixes can reverse the aggregate comparison.',
                0,
                79,
                1092,
                28,
                c.textSecondary,
            ),
            label('RAG model', 26, 134, 180, 25, cyan, 700),
            label('Base model', 246, 134, 180, 25, purple, 700),
            label('Difference', 944, 170, 148, 22, c.textSecondary, 650, true),
            React.createElement(
                'svg',
                {
                    width: 1092,
                    height: 431,
                    viewBox: '0 0 1092 431',
                    style: { position: 'absolute', left: 0, top: 0 },
                },
                React.createElement('circle', { cx: 8, cy: 148, r: 7, fill: cyan }),
                React.createElement('circle', { cx: 228, cy: 148, r: 7, fill: purple }),
                ...[0, 20, 40, 60, 80, 100].map((rate) =>
                    React.createElement('line', {
                        key: `grid-${rate}`,
                        x1: x(rate),
                        x2: x(rate),
                        y1: 195,
                        y2: 429,
                        stroke: c.border,
                        strokeWidth: 1,
                    }),
                ),
                ...rows.flatMap((row) => [
                    React.createElement('line', {
                        key: `line-${row.name}`,
                        x1: x(row.a),
                        x2: x(row.b),
                        y1: row.y,
                        y2: row.y,
                        stroke: row.a > row.b ? green : red,
                        strokeWidth: 4,
                    }),
                    React.createElement('circle', {
                        key: `control-${row.name}`,
                        cx: x(row.b),
                        cy: row.y,
                        r: 8,
                        fill: purple,
                    }),
                    React.createElement('circle', {
                        key: `treatment-${row.name}`,
                        cx: x(row.a),
                        cy: row.y,
                        r: 8,
                        fill: cyan,
                    }),
                ]),
            ),
            ...rows.flatMap((row) => [
                label(row.name, 0, row.y - 24, 310, 27, c.textPrimary, 700),
                label(row.counts, 0, row.y + 12, 310, 23, c.textSecondary),
                label(
                    `${row.a}%`,
                    x(row.a) - 35 + (row.a > row.b ? 6 : 0),
                    row.y - 37,
                    70,
                    23,
                    cyan,
                    700,
                    true,
                ),
                label(
                    `${row.b}%`,
                    x(row.b) - 35 - (row.a > row.b ? 6 : 0),
                    row.y - 37,
                    70,
                    23,
                    purple,
                    700,
                    true,
                ),
                label(
                    row.difference,
                    944,
                    row.y - 16,
                    148,
                    29,
                    row.a > row.b ? green : red,
                    750,
                    true,
                ),
            ]),
            ...[0, 20, 40, 60, 80, 100].map((rate) =>
                label(`${rate}%`, x(rate) - 34, 435, 68, 21, c.textSecondary, 500, true),
            ),
            label(
                'pp = percentage points · Stratified query outcomes',
                0,
                487,
                916,
                25,
                c.textSecondary,
            ),
            label(
                'Identification requires exchangeability, positivity, and consistency.',
                0,
                522,
                916,
                23,
                c.textSecondary,
            ),
            label('LeetLLM', 932, 490, 160, 30, c.textPrimary, 750),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    }
    return result
}

export default create('dark')
