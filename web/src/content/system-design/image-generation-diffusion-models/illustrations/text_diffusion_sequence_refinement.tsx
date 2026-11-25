import React from 'react'
import type { ThemeMode } from 'vizmatic'
export { createFilm } from './_parts/text-diffusion-film'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 395
export const alt =
    'Side-by-side comparison of left-to-right autoregressive decoding (4 sequential irreversible steps) versus bidirectional discrete text diffusion (3 parallel unmasking rounds, revising token 4 from later to first once context clarifies).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    fig.text(186, 22, 'Autoregressive (L → R)', { size: 16, weight: 700, color: blue, align: 'center' })
    fig.text(186, 44, 'causal · irreversible', { size: 15, color: c.textSecondary, align: 'center' })

    fig.line(380, 16, 380, 344, { color: c.borderSubtle, width: 1.25, dash: '4 4' })

    fig.text(574, 22, 'Discrete Text Diffusion', { size: 16, weight: 700, color: purple, align: 'center' })
    fig.text(574, 44, 'parallel unmask + revise', { size: 15, color: c.textSecondary, align: 'center' })

    const arRows = [
        { label: 'S1', tokens: ['write', '·', '·', '·'] },
        { label: 'S2', tokens: ['write', 'unit', '·', '·'] },
        { label: 'S3', tokens: ['write', 'unit', 'tests', '·'] },
        { label: 'S4', tokens: ['write', 'unit', 'tests', 'first'] },
    ]
    const diffRows = [
        { label: 'R0', tokens: ['[M]', '[M]', '[M]', '[M]'] },
        { label: 'R1', tokens: ['write', '[M]', '[M]', 'later'] },
        { label: 'R2', tokens: ['write', 'unit', '[M]', 'first'] },
        { label: 'R3', tokens: ['write', 'unit', 'tests', 'first'] },
    ]

    const tileW = 70
    const tileH = 38
    const tileGap = 7
    const rowStep = 66
    const startY = 76

    arRows.forEach((r, idx) => {
        const y = startY + idx * rowStep
        fig.text(28, y + tileH / 2, r.label, { size: 15, mono: true, weight: 700, color: c.textSecondary, align: 'center' })
        r.tokens.forEach((tok, pos) => {
            const tx = 58 + pos * (tileW + tileGap)
            const isEmpty = tok === '·'
            const isNew = !isEmpty && (idx === 0 || arRows[idx - 1]!.tokens[pos] === '·')
            const fill = isNew
                ? tint(green, c.bg, theme === 'light' ? 0.16 : 0.22)
                : isEmpty
                  ? tint(c.borderSubtle, c.bg, theme === 'light' ? 0.25 : 0.22)
                  : tint(blue, c.bg, theme === 'light' ? 0.09 : 0.14)
            const stroke = isNew ? green : isEmpty ? c.borderSubtle : tint(blue, c.bg, 0.55)
            const color = isNew ? green : isEmpty ? c.textMuted : c.textPrimary
            fig.rect(tx, y, tileW, tileH, { fill, stroke, strokeWidth: isNew ? 1.8 : 1.2, radius: 7 })
            fig.text(tx + tileW / 2, y + tileH / 2, tok, {
                size: 15,
                mono: true,
                weight: isEmpty ? 400 : 700,
                color,
                align: 'center',
            })
        })
        if (idx < arRows.length - 1) {
            fig.arrow(28, y + tileH + 4, 28, y + rowStep - 4, { color: blue, width: 1.5, head: 5.5 })
        }
    })

    diffRows.forEach((r, idx) => {
        const y = startY + idx * rowStep
        fig.text(412, y + tileH / 2, r.label, { size: 15, mono: true, weight: 700, color: c.textSecondary, align: 'center' })
        r.tokens.forEach((tok, pos) => {
            const tx = 442 + pos * (tileW + tileGap)
            const isMask = tok === '[M]'
            const isRevised = idx === 2 && pos === 3
            const isNew = !isMask && idx > 0 && diffRows[idx - 1]!.tokens[pos] === '[M]'
            const fill = isRevised
                ? tint(warm, c.bg, theme === 'light' ? 0.2 : 0.25)
                : isNew
                  ? tint(green, c.bg, theme === 'light' ? 0.16 : 0.22)
                  : isMask
                    ? tint(c.borderSubtle, c.bg, theme === 'light' ? 0.25 : 0.22)
                    : tint(purple, c.bg, theme === 'light' ? 0.09 : 0.14)
            const stroke = isRevised ? warm : isNew ? green : isMask ? c.borderSubtle : tint(purple, c.bg, 0.55)
            const color = isRevised ? warm : isNew ? green : isMask ? c.textMuted : c.textPrimary
            fig.rect(tx, y, tileW, tileH, { fill, stroke, strokeWidth: isRevised || isNew ? 1.8 : 1.2, radius: 7 })
            fig.text(tx + tileW / 2, y + tileH / 2, tok, {
                size: 15,
                mono: true,
                weight: isMask ? 400 : 700,
                color,
                align: 'center',
            })
        })
        if (idx < diffRows.length - 1) {
            fig.arrow(412, y + tileH + 4, 412, y + rowStep - 4, { color: purple, width: 1.5, head: 5.5 })
        }
    })

    const revX = 442 + 3 * (tileW + tileGap) + tileW / 2
    fig.arrow(revX, startY + rowStep + tileH + 2, revX, startY + 2 * rowStep - 2, {
        color: warm,
        width: 2,
        head: 6,
    })
    fig.text(revX - 10, startY + rowStep + tileH + 13, 'revised', {
        size: 15,
        weight: 700,
        color: warm,
        align: 'right',
    })

    const footY = 368
    fig.rect(72, footY - 8, 14, 14, { fill: tint(green, c.bg, 0.22), stroke: green, strokeWidth: 1.5, radius: 3 })
    fig.text(94, footY, 'emitted / unmasked', { size: 15, color: c.textSecondary })

    fig.rect(284, footY - 8, 14, 14, { fill: tint(warm, c.bg, 0.25), stroke: warm, strokeWidth: 1.5, radius: 3 })
    fig.text(306, footY, 'revised in place', { size: 15, color: warm, weight: 700 })

    fig.text(468, footY, 'L passes vs. K rounds', { size: 15, mono: true, weight: 700, color: purple })

    return fig.render()
}

export default create('dark')
