import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 880
export const height = 415
export const alt =
    'Tree-of-Thoughts search over Game of 24 from {4, 5, 6, 7}. Branch A reaches [24, 5, 7] with high score 0.95 but hits a dead end. Branch B reaches [12, 4, 6] at score 0.40: beam width 1 drops it, whereas width 2 expands 6 - 4 = 2 and solves 12 * 2 = 24. Branch C scores 0.35 and is pruned.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const red = fig.tone('red')
    const warm = fig.tone('warm')

    const node = (
        cx: number,
        cy: number,
        w: number,
        h: number,
        title: string,
        sub: string,
        tone: string,
        emphasis = false,
        dashed = false,
    ) => {
        fig.rect(cx - w / 2, cy - h / 2, w, h, {
            fill: tint(tone, c.bg, theme === 'light' ? (emphasis ? 0.14 : 0.08) : emphasis ? 0.22 : 0.13),
            stroke: tone,
            strokeWidth: emphasis ? 2.2 : 1.4,
            radius: 9,
        })
        if (dashed) {
            fig.path(`M${cx - w / 2 + 8} ${cy + h / 2}H${cx + w / 2 - 8}`, {
                color: tone,
                width: 2,
                dash: '4 3',
            })
        }
        fig.text(cx, cy - 10, title, {
            size: 14.5,
            mono: true,
            weight: 700,
            color: tone,
            align: 'center',
        })
        fig.text(cx, cy + 12, sub, {
            size: 12.5,
            mono: true,
            color: c.textPrimary,
            align: 'center',
        })
    }

    // Root at left-center so tree grows cleanly left-to-right (compact aspect!)
    node(108, 198, 176, 62, '{4, 5, 6, 7}', 'Target = 24', blue, true)

    // Depth 1: Branches A (dead end), B (winning), C (pruned)
    node(356, 72, 206, 62, 'A: 6 × 4 = 24', '[24, 5, 7] · score 0.95', red, false, true)
    node(356, 198, 206, 62, 'B: 5 + 7 = 12', '[12, 4, 6] · score 0.40', green, true)
    node(356, 324, 206, 62, 'C: 7 − 5 = 2', '[2, 4, 6] · score 0.35', warm)

    // Depth 2 & 3 along winning Branch B
    node(604, 198, 170, 62, '6 − 4 = 2', 'state [12, 2]', green, true)
    node(794, 198, 140, 62, '12 × 2 = 24', 'Solved ✓', green, true)

    // Dead-end & pruned badges
    fig.rect(516, 52, 176, 40, {
        fill: tint(red, c.bg, theme === 'light' ? 0.1 : 0.16),
        stroke: red,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(604, 72, 'Dead end (cannot hit 24)', {
        size: 12.5,
        weight: 700,
        color: red,
        align: 'center',
    })
    fig.arrow(460, 72, 514, 72, { color: red, width: 1.6, dash: '4 3', head: 6 })

    fig.text(508, 324, 'Pruned (rank #3 under w = 2)', {
        size: 13,
        color: c.textSecondary,
        align: 'left',
    })
    fig.line(460, 324, 498, 324, { color: warm, width: 1.4, dash: '3 3' })

    // Edges from Root -> A, B, C
    fig.arrow(197, 180, 252, 82, { color: red, width: 1.6, head: 6.5 })
    fig.arrow(197, 198, 252, 198, { color: green, width: 2.4, head: 7 })
    fig.arrow(197, 216, 252, 314, { color: warm, width: 1.5, dash: '4 3', head: 6 })

    // Edges along winning path B -> D2 -> Solved
    fig.arrow(460, 198, 518, 198, { color: green, width: 2.4, head: 7 })
    fig.arrow(690, 198, 723, 198, { color: green, width: 2.4, head: 7 })

    // Beam-width comparison annotations at bottom
    fig.line(24, 374, 856, 374, { color: c.borderSubtle, width: 1, dash: '4 4' })
    fig.text(240, 396, 'Beam w = 1: keeps only A (0.95) → fails at dead end', {
        size: 13.5,
        weight: 700,
        color: red,
        align: 'center',
    })
    fig.text(668, 396, 'Beam w = 2: keeps A & B → solves via B (24)', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
