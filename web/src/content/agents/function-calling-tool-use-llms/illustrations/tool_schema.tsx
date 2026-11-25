import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 415
export const alt =
    'Strict ReleaseStatusCall schema anatomy mapped to five input validation cases. Required fields release_id (string 1..128) and include_gates (bool or null) with additionalProperties false accept true and null, while rejecting integer 1 (wrong type), promote_now (extra key), and empty string release_id (minLength 1). Passing schema still triggers runtime permission checks.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('red')
    const warm = fig.tone('warm')

    fig.text(122, 20, 'Strict JSON Schema', { size: 15.5, weight: 700, color: blue, align: 'center' })
    fig.rect(14, 42, 218, 272, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.07 : 0.12),
        stroke: blue,
        strokeWidth: 1.6,
        radius: 10,
    })
    fig.text(28, 68, 'ReleaseStatusCall', { size: 15.5, weight: 700, mono: true, color: blue })
    fig.line(26, 86, 220, 86, { color: tint(blue, c.bg, 0.4), width: 1 })

    const rules = [
        { k: 'release_id', v: 'str (1..128)', y: 112 },
        { k: 'include_gates', v: 'bool | null', y: 170 },
        { k: 'additionalProps', v: 'false', y: 228 },
        { k: 'required', v: 'both fields', y: 282 },
    ]
    for (const r of rules) {
        fig.text(28, r.y, r.k, { size: 15, mono: true, weight: 700, color: c.textPrimary })
        fig.text(28, r.y + 20, r.v, { size: 15, mono: true, color: c.textSecondary })
    }

    fig.text(508, 20, 'Five Validation Inputs & Outcomes', { size: 15.5, weight: 700, color: c.textPrimary, align: 'center' })

    const cases = [
        { input: 'include_gates = true', ok: true, rule: 'bool' },
        { input: 'include_gates = null', ok: true, rule: 'nullable' },
        { input: 'include_gates = 1', ok: false, rule: 'bad type' },
        { input: 'promote_now = true', ok: false, rule: 'extra key' },
        { input: 'release_id = ""', ok: false, rule: 'minLen 1' },
    ]

    cases.forEach((item, idx) => {
        const y = 46 + idx * 56
        const cy = y + 22
        const tone = item.ok ? green : red

        fig.arrow(234, Math.min(290, Math.max(70, cy)), 272, cy, { color: tone, width: 1.6, head: 6 })

        fig.rect(276, y, 220, 44, {
            fill: tint(c.borderSubtle, c.bg, theme === 'light' ? 0.3 : 0.28),
            stroke: c.borderSubtle,
            strokeWidth: 1.1,
            radius: 6,
        })
        fig.text(288, cy, item.input, { size: 15, mono: true, weight: 600, color: c.textPrimary })

        fig.arrow(498, cy, 528, cy, { color: tone, width: 1.6, head: 6 })

        fig.rect(532, y, 86, 44, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.14 : 0.22),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.text(575, cy, item.ok ? 'Accept' : 'Reject', { size: 15, weight: 700, color: tone, align: 'center' })
        fig.text(628, cy, item.rule, { size: 15, color: c.textSecondary })
    })

    fig.line(14, 340, 746, 340, { color: c.borderSubtle, width: 1.1, dash: '4 4' })
    fig.rect(112, 358, 178, 38, {
        fill: tint(green, c.bg, theme === 'light' ? 0.12 : 0.18),
        stroke: green,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(201, 377, '1. Schema valid', { size: 15.5, weight: 700, color: green, align: 'center' })
    fig.arrow(292, 377, 352, 377, { color: warm, width: 1.8, head: 6.5 })
    fig.rect(356, 358, 294, 38, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.12 : 0.18),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(503, 377, '2. Host still checks role', { size: 15.5, weight: 700, color: warm, align: 'center' })

    return fig.render()
}

export default create('dark')
