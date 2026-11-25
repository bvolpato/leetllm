import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 365
export const alt =
    'Single-writer PR commit guard: an approved read-only patch bundle pins patch_digest sha256:4a9c, expected_v=3, and idempotency_key pr-fix-104. The guarded PR writer checks key history, live branch HEAD, and CI pass, returning saved PR #104 on matching retry or aborting write if HEAD moved from v3 to v4.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('red')

    // Left: Approved Read-Only Bundle
    fig.rect(20, 106, 250, 152, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.09 : 0.15),
        stroke: blue,
        strokeWidth: 1.7,
        radius: 10,
    })
    fig.text(145, 132, 'Approved Patch Bundle', { size: 14.5, weight: 700, color: blue, align: 'center' })
    fig.text(145, 154, 'read-only artifact', { size: 12, color: c.textSecondary, align: 'center' })
    fig.line(38, 170, 252, 170, { color: tint(blue, c.bg, 0.4), width: 1 })
    fig.text(36, 192, 'digest: sha256:4a9c..', { size: 12.5, mono: true, color: c.textPrimary })
    fig.text(36, 216, 'expected_v: 3', { size: 12.5, mono: true, color: c.textPrimary })
    fig.text(36, 240, 'key: pr-fix-104', { size: 12.5, mono: true, weight: 700, color: blue })

    fig.arrow(272, 182, 326, 182, { color: purple, width: 2, head: 7 })

    // Center: Guarded PR Writer CAS Check
    fig.rect(330, 114, 224, 136, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.11 : 0.18),
        stroke: purple,
        strokeWidth: 2,
        radius: 10,
    })
    fig.text(442, 142, 'Guarded PR Writer', { size: 15, weight: 700, color: purple, align: 'center' })
    fig.text(442, 170, '1. Lookup key history', { size: 13, color: c.textPrimary, align: 'center' })
    fig.text(442, 196, '2. Compare live HEAD == v3', { size: 13, color: c.textPrimary, align: 'center' })
    fig.text(442, 222, '3. Confirm CI green', { size: 13, color: c.textPrimary, align: 'center' })

    // Right: Two Outcomes (Idempotent Replay vs Optimistic Concurrency Abort)
    fig.path('M 556 158 H 602 V 98 H 636', { color: green, width: 2 })
    fig.arrow(622, 98, 638, 98, { color: green, width: 2, head: 6.5 })

    fig.rect(642, 46, 238, 104, {
        fill: tint(green, c.bg, theme === 'light' ? 0.11 : 0.18),
        stroke: green,
        strokeWidth: 1.8,
        radius: 9,
    })
    fig.text(761, 74, 'Retry · Same Key', { size: 14.5, weight: 700, color: green, align: 'center' })
    fig.text(761, 100, 'pr-fix-104 already stored', { size: 12.5, mono: true, color: c.textSecondary, align: 'center' })
    fig.text(761, 126, '→ Return saved PR #104', { size: 13.5, weight: 700, color: green, align: 'center' })

    fig.path('M 556 206 H 602 V 266 H 636', { color: red, width: 2 })
    fig.arrow(622, 266, 638, 266, { color: red, width: 2, head: 6.5 })

    fig.rect(642, 214, 238, 104, {
        fill: tint(red, c.bg, theme === 'light' ? 0.11 : 0.18),
        stroke: red,
        strokeWidth: 1.8,
        radius: 9,
    })
    fig.text(761, 242, 'HEAD Moved (v3 → v4)', { size: 14.5, weight: 700, color: red, align: 'center' })
    fig.text(761, 268, 'CAS version check fails', { size: 12.5, mono: true, color: c.textSecondary, align: 'center' })
    fig.text(761, 294, '→ Abort write · re-run checks', { size: 13.5, weight: 700, color: red, align: 'center' })

    return fig.render()
}

export default create('dark')
