import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 385
export const alt =
    'Side-by-side comparison of next-token probabilities before and after grammar masking. Before masking, raw logits [1.4, 0.8, 0.2, -0.4] give Sure 49.6%, opening brace 27.2%, The 14.9%, and opening bracket 8.2%. Adding the grammar mask (0 for opening brace, negative infinity for invalid tokens) collapses 100% of renormalized probability mass onto opening brace.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('red')
    const blue = fig.tone('blue')

    fig.math(
        width / 2,
        22,
        "p'(v) = \\operatorname{softmax}(z + m)_v, \\qquad m(\\{) = 0,\\; m(v \\neq \\{) = -\\infty",
        { size: 16, color: c.textPrimary, align: 'center' },
    )

    const tokens = [
        { tok: 'Sure', logit: '1.4', raw: 49.6, masked: 0, valid: false },
        { tok: '{', logit: '0.8', raw: 27.2, masked: 100, valid: true },
        { tok: 'The', logit: '0.2', raw: 14.9, masked: 0, valid: false },
        { tok: '[', logit: '-0.4', raw: 8.2, masked: 0, valid: false },
    ]

    const drawChart = (areaX: number, title: string, titleColor: string, isMasked: boolean) => {
        const area = { x: areaX, y: 108, width: 266, height: 204 }
        fig.text(area.x + area.width / 2, 62, title, {
            size: 16,
            weight: 700,
            color: titleColor,
            align: 'center',
        })

        const plot = fig.plot(area, { x: [0, 4], y: [0, 105] })
        for (const tk of [0, 50, 100]) {
            const py = plot.py(tk)
            fig.line(area.x, py, area.x + area.width, py, {
                color: tk === 0 ? c.textMuted : c.borderSubtle,
                width: tk === 0 ? 1.25 : 1,
                dash: tk === 0 ? undefined : '3 4',
            })
            fig.text(area.x - 8, py, `${tk}%`, {
                size: 15,
                mono: true,
                color: c.textSecondary,
                align: 'right',
            })
        }

        const slotW = area.width / tokens.length
        const barW = 40
        tokens.forEach((item, idx) => {
            const cx = area.x + idx * slotW + slotW / 2
            const val = isMasked ? item.masked : item.raw
            const barH = Math.max(val > 0 ? 6 : 3, (val / 105) * area.height)
            const topY = plot.bottom - barH
            const fill = isMasked
                ? item.valid
                    ? green
                    : tint(red, c.bg, 0.35)
                : item.valid
                  ? green
                  : idx === 0
                    ? warm
                    : c.textMuted

            fig.rect(cx - barW / 2, topY, barW, barH, { fill, radius: 5 })
            fig.text(cx, topY - 14, isMasked ? (item.valid ? '100%' : '0%') : `${val.toFixed(1)}%`, {
                size: 15,
                mono: true,
                weight: 700,
                color: isMasked ? (item.valid ? green : red) : item.valid ? green : c.textPrimary,
                align: 'center',
            })
            if (isMasked && !item.valid) {
                fig.text(cx, topY - 34, '-∞', {
                    size: 15,
                    mono: true,
                    weight: 700,
                    color: red,
                    align: 'center',
                })
            }
            fig.text(cx, plot.bottom + 18, item.tok, {
                size: 15.5,
                mono: true,
                weight: 700,
                color: item.valid ? green : c.textPrimary,
                align: 'center',
            })
            fig.text(cx, plot.bottom + 40, isMasked ? (item.valid ? '+0' : 'cut') : item.logit, {
                size: 15,
                mono: true,
                color: isMasked ? (item.valid ? green : red) : c.textSecondary,
                align: 'center',
            })
        })
    }

    drawChart(58, 'Before Mask: P(v)', warm, false)

    fig.arrow(342, 210, 412, 210, { color: blue, width: 2.4, head: 7 })
    fig.text(377, 186, 'mask', { size: 15.5, weight: 700, color: blue, align: 'center' })
    fig.text(377, 234, 'renorm', { size: 15, color: c.textSecondary, align: 'center' })

    drawChart(476, "After Mask: P'(v)", green, true)

    return fig.render()
}

export default create('dark')
