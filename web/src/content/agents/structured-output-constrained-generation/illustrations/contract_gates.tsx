import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 400
export const alt =
    'Deterministic finite-state parser states S0 through S3 mapped directly to rows of the precomputed valid-token bitmask M[S_t, v] over six vocabulary tokens ({, key:, pass"}, fa, Sure, <eos>), showing 1 for grammar-legal continuations and 0 for masked tokens.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')

    // Top row: 4-state DFA (left to right, frameless)
    fig.text(450, 20, 'Compiled DFA States → Precomputed Valid-Token Bitmask M[Sₜ, v]', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    const states = [
        { id: 'S0', desc: 'expect {', tone: blue, x: 76 },
        { id: 'S1', desc: 'expect key', tone: purple, x: 288 },
        { id: 'S2', desc: 'enum value', tone: purple, x: 500 },
        { id: 'S3', desc: 'allow <eos>', tone: green, x: 712 },
    ]
    const sw = 148
    const sh = 54
    const sy = 44

    states.forEach((st, i) => {
        fig.rect(st.x, sy, sw, sh, {
            fill: tint(st.tone, c.bg, theme === 'light' ? 0.1 : 0.16),
            stroke: st.tone,
            strokeWidth: 1.7,
            radius: 8,
        })
        fig.text(st.x + sw / 2, sy + 18, st.id, {
            size: 15,
            mono: true,
            weight: 700,
            color: st.tone,
            align: 'center',
        })
        fig.text(st.x + sw / 2, sy + 39, st.desc, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
        })
        if (i < states.length - 1) {
            fig.arrow(st.x + sw + 4, sy + sh / 2, states[i + 1]!.x - 4, sy + sh / 2, {
                color: st.tone,
                width: 1.8,
                head: 6.5,
            })
        }
    })

    // Subtle pointer arrow down to bitmask lookup
    fig.arrow(450, 102, 450, 134, { color: c.textMuted, width: 1.6, dash: '3 3', head: 6 })
    fig.text(464, 118, 'O(1) row lookup per decode step', {
        size: 12.5,
        color: c.textSecondary,
        align: 'left',
    })

    // Bottom: Crisp transparent bitmask matrix using custom clean cells (1 = green, 0 = quiet muted)
    const rowLabels = ['S0 (start)', 'S1 (key)', 'S2 (enum)', 'S3 (done)']
    const colLabels = ['{', 'key:', 'pass"}', 'fa', 'Sure', '<eos>']
    const data = [
        [1, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 1],
    ]

    const gridX = 192
    const gridY = 172
    const cellW = 104
    const cellH = 44
    const gap = 6

    colLabels.forEach((col, j) => {
        const cx = gridX + j * (cellW + gap) + cellW / 2
        fig.text(cx, gridY - 16, col, {
            size: 14,
            mono: true,
            weight: 700,
            color: col === 'Sure' ? c.textMuted : c.textPrimary,
            align: 'center',
        })
    })

    data.forEach((row, i) => {
        const ry = gridY + i * (cellH + gap)
        fig.text(gridX - 16, ry + cellH / 2, rowLabels[i]!, {
            size: 13.5,
            mono: true,
            weight: 700,
            color: states[i]!.tone,
            align: 'right',
        })
        row.forEach((val, j) => {
            const rx = gridX + j * (cellW + gap)
            const legal = val === 1
            fig.rect(rx, ry, cellW, cellH, {
                fill: legal
                    ? tint(green, c.bg, theme === 'light' ? 0.24 : 0.34)
                    : tint(c.borderSubtle, c.bg, theme === 'light' ? 0.32 : 0.24),
                stroke: legal ? green : c.borderSubtle,
                strokeWidth: legal ? 1.8 : 0.9,
                radius: 6,
            })
            fig.text(rx + cellW / 2, ry + cellH / 2, legal ? '1 (legal)' : '0', {
                size: 13.5,
                mono: true,
                weight: legal ? 700 : 400,
                color: legal ? green : c.textMuted,
                align: 'center',
            })
        })
    })

    // Highlight brace over "Sure" column showing permanently masked chat filler
    const sureX = gridX + 4 * (cellW + gap) + cellW / 2
    fig.text(sureX, 382, 'always 0 (chat filler)', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
