import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 395
export const alt =
    'Cryptographic manifest digest binding: canonical Manifest M (base image, code, tests) hashes via SHA-256 to H(M) linked to a stored pass verdict. An unchanged manifest matches H(M) and is accepted; modifying base image, parser.py, or test suite changes the hash and is rejected.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('red')

    // Top row: Manifest M -> SHA-256 H(M) -> Stored Verdict
    const topStep = (x: number, w: number, title: string, sub: string, tone: string) => {
        fig.rect(x, 22, w, 58, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.1 : 0.16),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(x + w / 2, 42, title, { size: 14.5, weight: 700, color: tone, align: 'center' })
        fig.text(x + w / 2, 63, sub, { size: 12.5, mono: true, color: c.textPrimary, align: 'center' })
    }

    topStep(32, 240, 'Manifest M', 'base + code + tests', blue)
    fig.arrow(274, 51, 326, 51, { color: blue, width: 1.9, head: 6.5 })
    topStep(330, 240, 'SHA-256 Digest H(M)', 'canonical JSON → 9a4f…c2', purple)
    fig.arrow(572, 51, 624, 51, { color: green, width: 1.9, head: 6.5 })
    topStep(628, 240, 'Supervisor Verdict', 'pass bound to 9a4f…c2', green)

    fig.line(32, 102, 868, 102, { color: c.borderSubtle, width: 1.1, dash: '4 4' })

    // Bottom: Avalanche Hash Comparison across 4 candidates
    fig.text(160, 126, 'Candidate Input', { size: 13.5, weight: 700, color: c.textSecondary, align: 'center' })
    fig.text(448, 126, 'Recomputed SHA-256', { size: 13.5, weight: 700, color: c.textSecondary, align: 'center' })
    fig.text(742, 126, 'Promotion Check', { size: 13.5, weight: 700, color: c.textSecondary, align: 'center' })

    const rows = [
        { name: '1. Unchanged M', diff: 'none', hash: '9a4f…c2  (= H(M))', ok: true },
        { name: '2. New base-v2', diff: 'base image changed', hash: '7e11…8b  (≠ H(M))', ok: false },
        { name: '3. Edited parser.py', diff: 'return [] injected', hash: '3c80…f4  (≠ H(M))', ok: false },
        { name: '4. New tests-v2', diff: 'test suite swapped', hash: 'd52a…19  (≠ H(M))', ok: false },
    ]

    rows.forEach((r, idx) => {
        const y = 148 + idx * 58
        const cy = y + 22
        const tone = r.ok ? green : red

        fig.rect(32, y, 256, 44, {
            fill: tint(r.ok ? blue : red, c.bg, theme === 'light' ? 0.07 : 0.12),
            stroke: r.ok ? tint(blue, c.bg, 0.5) : tint(red, c.bg, 0.45),
            strokeWidth: 1.3,
            radius: 7,
        })
        fig.text(44, y + 16, r.name, { size: 13.5, weight: 700, color: c.textPrimary })
        fig.text(44, y + 34, r.diff, { size: 12, color: r.ok ? green : red })

        fig.arrow(290, cy, 336, cy, { color: tone, width: 1.7, head: 6 })

        fig.rect(340, y, 220, 44, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.1 : 0.16),
            stroke: tone,
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(450, cy, r.hash, { size: 13, mono: true, weight: 700, color: tone, align: 'center' })

        fig.arrow(562, cy, 616, cy, { color: tone, width: 1.7, head: 6 })

        fig.rect(620, y, 248, 44, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.14 : 0.22),
            stroke: tone,
            strokeWidth: 1.7,
            radius: 7,
        })
        fig.text(744, cy, r.ok ? 'ACCEPT · Digest matches' : 'REJECT · Digest mismatch', {
            size: 13.5,
            weight: 700,
            color: tone,
            align: 'center',
        })
    })

    return fig.render()
}

export default create('dark')
