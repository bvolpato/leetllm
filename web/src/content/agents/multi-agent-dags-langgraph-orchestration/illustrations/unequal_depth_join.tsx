import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 400
export const alt =
    'Three-column timeline comparison of LangGraph fan-in modes across unequal-depth branches (lint 1 step, tests 2 steps, optional bench skipped): separate edges fire merge twice (step 2 and 3); list join waits for all named nodes and stalls if bench is skipped; defer=True drains active tasks and runs merge exactly once even when a branch is skipped.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const red = fig.tone('red')

    // Three frameless columns separated by hairline dividers
    const cols = [
        {
            x: 20,
            title: '1. Separate Edges',
            code: 'add_edge per branch',
            tone: warm,
            verdict: 'Runs TWICE (step 2 & 3)',
            verdictTone: warm,
            mode: 'separate' as const,
        },
        {
            x: 316,
            title: '2. List Join',
            code: 'add_edge([l, t, b], "m")',
            tone: green,
            verdict: 'Once at step 3 (stalls if skip)',
            verdictTone: red,
            mode: 'list' as const,
        },
        {
            x: 612,
            title: '3. Deferred Merge',
            code: 'add_node("m", defer=True)',
            tone: blue,
            verdict: 'Runs ONCE even if skipped',
            verdictTone: green,
            mode: 'defer' as const,
        },
    ]

    fig.line(302, 18, 302, 378, { color: c.borderSubtle, width: 1.1, dash: '4 4' })
    fig.line(598, 18, 598, 378, { color: c.borderSubtle, width: 1.1, dash: '4 4' })

    const colW = 268

    for (const col of cols) {
        const cx = col.x + colW / 2
        fig.text(cx, 24, col.title, { size: 15, weight: 700, color: col.tone, align: 'center' })
        fig.text(cx, 46, col.code, { size: 12.5, mono: true, color: c.textSecondary, align: 'center' })

        // Step axis header S1 | S2 | S3 with progression arrow
        const gx = col.x + 56
        const gw = colW - 64
        const sW = gw / 3
        fig.arrow(gx, 86, gx + gw + 4, 86, { color: c.textMuted, width: 1.2, head: 5 })
        for (let s = 0; s < 3; s++) {
            const sx = gx + s * sW
            fig.line(sx, 86, sx, 286, { color: c.borderSubtle, width: 0.9, dash: '2 3' })
            fig.text(sx + sW / 2, 72, `S${s + 1}`, {
                size: 12,
                mono: true,
                color: c.textSecondary,
                align: 'center',
            })
        }

        // Branch bars: lint (1 step: S1), tests -> tests_done (2 steps: S1..S2), optional bench skipped
        const rows = [
            { name: 'lint', y: 98, start: 0, span: 1, tone: blue, skipped: false },
            { name: 'tests', y: 146, start: 0, span: 2, tone: blue, skipped: false },
            {
                name: 'bench',
                y: 194,
                start: 0,
                span: 1,
                tone: c.textMuted,
                skipped: true,
            },
        ]
        for (const r of rows) {
            fig.text(col.x + 48, r.y + 15, r.name, {
                size: 12.5,
                mono: true,
                color: r.skipped ? c.textMuted : c.textPrimary,
                align: 'right',
            })
            if (r.skipped) {
                fig.rect(gx + 2, r.y, sW * 2 - 4, 30, {
                    fill: tint(c.borderSubtle, c.bg, 0.2),
                    stroke: c.borderSubtle,
                    strokeWidth: 1,
                    radius: 5,
                })
                fig.text(gx + sW, r.y + 15, 'skipped by router', {
                    size: 11.5,
                    color: c.textMuted,
                    align: 'center',
                })
            } else {
                fig.rect(gx + r.start * sW + 2, r.y, r.span * sW - 4, 30, {
                    fill: tint(r.tone, c.bg, theme === 'light' ? 0.16 : 0.24),
                    stroke: r.tone,
                    strokeWidth: 1.4,
                    radius: 5,
                })
                fig.text(gx + (r.start + r.span / 2) * sW, r.y + 15, r.span === 1 ? 'fast' : '2 steps', {
                    size: 12,
                    color: r.tone,
                    weight: 600,
                    align: 'center',
                })
            }
        }

        // Merge firing row
        const my = 248
        fig.text(col.x + 48, my + 15, 'merge', {
            size: 12.5,
            mono: true,
            weight: 700,
            color: col.tone,
            align: 'right',
        })
        if (col.mode === 'separate') {
            // Fires at S2 AND S3
            for (const s of [1, 2]) {
                fig.rect(gx + s * sW + 2, my, sW - 4, 30, {
                    fill: tint(warm, c.bg, theme === 'light' ? 0.2 : 0.3),
                    stroke: warm,
                    strokeWidth: 1.8,
                    radius: 5,
                })
                fig.text(gx + (s + 0.5) * sW, my + 15, s === 1 ? 'run #1' : 'run #2', {
                    size: 12,
                    weight: 700,
                    color: warm,
                    align: 'center',
                })
            }
        } else if (col.mode === 'list') {
            // Blocked waiting for skipped bench!
            fig.rect(gx + 2 * sW + 2, my, sW - 4, 30, {
                fill: tint(red, c.bg, theme === 'light' ? 0.16 : 0.24),
                stroke: red,
                strokeWidth: 1.6,
                radius: 5,
            })
            fig.text(gx + 2.5 * sW, my + 15, 'blocked', {
                size: 12,
                weight: 700,
                color: red,
                align: 'center',
            })
        } else {
            // Runs cleanly ONCE at S3 after active tasks drain
            fig.rect(gx + 2 * sW + 2, my, sW - 4, 30, {
                fill: tint(green, c.bg, theme === 'light' ? 0.2 : 0.3),
                stroke: green,
                strokeWidth: 1.9,
                radius: 5,
            })
            fig.text(gx + 2.5 * sW, my + 15, 'run 1×', {
                size: 12,
                weight: 700,
                color: green,
                align: 'center',
            })
        }

        // Bottom verdict strip
        fig.rect(col.x + 8, 316, colW - 16, 44, {
            fill: tint(col.verdictTone, c.bg, theme === 'light' ? 0.12 : 0.18),
            stroke: col.verdictTone,
            strokeWidth: 1.5,
            radius: 7,
        })
        fig.text(cx, 338, col.verdict, {
            size: 13,
            weight: 700,
            color: col.verdictTone,
            align: 'center',
        })
    }

    return fig.render()
}

export default create('dark')
