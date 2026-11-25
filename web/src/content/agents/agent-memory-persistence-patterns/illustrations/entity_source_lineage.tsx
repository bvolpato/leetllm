import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 375
export const alt =
    'Entity extraction provenance filter across three turns: turn t2 proposes invented bug_id KERN-104 (held for review), turn t3 proposes allowlisted and grounded test_cmd pytest -q tests/attn.py (saved), and turn t4 proposes disallowed bypass_ci contradicting source text (rejected).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('red')

    // Column headers (frameless)
    fig.text(168, 22, 'Source Turn Utterance', { size: 14, weight: 700, color: c.textSecondary, align: 'center' })
    fig.text(476, 22, 'Candidate Extracted Field', { size: 14, weight: 700, color: c.textSecondary, align: 'center' })
    fig.text(772, 22, 'Schema + Grounding Verdict', { size: 14, weight: 700, color: c.textSecondary, align: 'center' })

    const rows = [
        {
            turn: 't2 · Inferred ID',
            src: '"Softmax produced NaN in flash kernel"',
            cand: '{bug_id: "KERN-104"}',
            verdict: 'HOLD',
            reason: 'KERN-104 not in source',
            tone: warm,
        },
        {
            turn: 't3 · Supported Pref',
            src: '"Run pytest -q tests/attn.py"',
            cand: '{test_cmd: "pytest -q ..."}',
            verdict: 'SAVED',
            reason: 'allowlisted & entailed',
            tone: green,
        },
        {
            turn: 't4 · Dropped Cond',
            src: '"Deploy after CI passes"',
            cand: '{bypass_ci: true}',
            verdict: 'REJECTED',
            reason: 'disallowed & contradicts t4',
            tone: red,
        },
    ]

    rows.forEach((r, idx) => {
        const y = 52 + idx * 106
        const cy = y + 38

        // Source utterance block
        fig.rect(20, y, 296, 76, {
            fill: tint(c.borderSubtle, c.bg, theme === 'light' ? 0.25 : 0.22),
            stroke: c.borderSubtle,
            strokeWidth: 1.2,
            radius: 8,
        })
        fig.text(34, y + 22, r.turn, { size: 13, weight: 700, color: r.tone })
        fig.text(34, y + 48, r.src, { size: 12.5, color: c.textPrimary })

        fig.arrow(318, cy, 354, cy, { color: r.tone, width: 1.8, head: 6.5 })

        // Candidate JSON chip
        fig.rect(358, y + 8, 236, 60, {
            fill: tint(r.tone, c.bg, theme === 'light' ? 0.08 : 0.13),
            stroke: tint(r.tone, c.bg, 0.55),
            strokeWidth: 1.4,
            radius: 8,
        })
        fig.text(476, cy, r.cand, {
            size: 13,
            mono: true,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })

        fig.arrow(596, cy, 640, cy, { color: r.tone, width: 1.8, head: 6.5 })

        // Verdict pill
        fig.rect(644, y + 4, 236, 68, {
            fill: tint(r.tone, c.bg, theme === 'light' ? 0.14 : 0.22),
            stroke: r.tone,
            strokeWidth: 1.8,
            radius: 8,
        })
        fig.text(762, y + 26, r.verdict, {
            size: 14.5,
            weight: 700,
            color: r.tone,
            align: 'center',
        })
        fig.text(762, y + 50, r.reason, {
            size: 12.5,
            color: c.textPrimary,
            align: 'center',
        })
    })

    return fig.render()
}

export default create('dark')
