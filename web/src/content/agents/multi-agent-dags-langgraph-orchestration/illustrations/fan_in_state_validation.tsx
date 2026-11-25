import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 385
export const alt =
    'Parallel diff, test, and security scan agents each emit typed records pinned to sha 8f1a3b into an Annotated[list[CheckResult], add] append reducer. The fan-in merge node validates one unique entry per worker and matching HEAD sha while rejecting missing-reducer scalar overwrites.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const red = fig.tone('red')

    // Left: 3 parallel worker outputs
    const workers = [
        { name: 'Diff Agent', sha: 'sha: 8f1a3b', detail: '3 AST hunks', tone: blue, y: 38 },
        { name: 'Test Agent', sha: 'sha: 8f1a3b', detail: '14/14 green', tone: purple, y: 146 },
        { name: 'Scan Agent', sha: 'sha: 8f1a3b', detail: '0 issues', tone: cyan, y: 254 },
    ]

    for (const w of workers) {
        fig.rect(20, w.y, 198, 76, {
            fill: tint(w.tone, c.bg, theme === 'light' ? 0.1 : 0.16),
            stroke: w.tone,
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(119, w.y + 20, w.name, { size: 14, weight: 700, color: w.tone, align: 'center' })
        fig.text(119, w.y + 42, w.sha, { size: 12.5, mono: true, color: c.textPrimary, align: 'center' })
        fig.text(119, w.y + 60, w.detail, { size: 12, color: c.textSecondary, align: 'center' })

        // Curved fan-in arrows to append reducer
        const wy = w.y + 38
        fig.path(`M 220 ${wy} C 266 ${wy}, 266 142, 304 142`, { color: w.tone, width: 1.8 })
    }
    fig.arrow(292, 142, 308, 142, { color: blue, width: 1.8, head: 6.5 })

    // Center Top: Safe Append Reducer
    fig.rect(310, 62, 260, 154, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.08 : 0.14),
        stroke: blue,
        strokeWidth: 1.8,
        radius: 10,
    })
    fig.text(440, 86, 'Append Reducer', { size: 14.5, weight: 700, color: blue, align: 'center' })
    fig.text(440, 108, 'Annotated[list[CheckResult], add]', {
        size: 12,
        mono: true,
        color: c.textPrimary,
        align: 'center',
    })
    // Visual 3-slot list inside reducer
    const slots = [
        { label: 'diff', tone: blue, x: 326 },
        { label: 'test', tone: purple, x: 406 },
        { label: 'scan', tone: cyan, x: 486 },
    ]
    for (const sl of slots) {
        fig.rect(sl.x, 134, 68, 38, {
            fill: tint(sl.tone, c.bg, theme === 'light' ? 0.18 : 0.28),
            stroke: sl.tone,
            strokeWidth: 1.4,
            radius: 6,
        })
        fig.text(sl.x + 34, 153, sl.label, { size: 13, mono: true, weight: 700, color: sl.tone, align: 'center' })
    }
    fig.text(440, 194, 'all 3 results preserved in list', { size: 12, color: green, weight: 600, align: 'center' })

    // Center Bottom: Contrast - Missing reducer scalar overwrite (rejected)
    fig.rect(310, 248, 260, 86, {
        fill: tint(red, c.bg, theme === 'light' ? 0.08 : 0.13),
        stroke: red,
        strokeWidth: 1.5,
        radius: 9,
    })
    fig.text(440, 272, 'Without Reducer (Scalar)', { size: 13.5, weight: 700, color: red, align: 'center' })
    fig.text(440, 296, 'concurrent write overwrites state', { size: 12.5, color: c.textPrimary, align: 'center' })
    fig.text(440, 317, 'REJECTED: InvalidUpdateError', { size: 12, mono: true, weight: 700, color: red, align: 'center' })

    // Right: Merge Node Validator
    fig.arrow(572, 142, 622, 142, { color: green, width: 2, head: 7 })
    fig.rect(626, 62, 254, 154, {
        fill: tint(green, c.bg, theme === 'light' ? 0.1 : 0.17),
        stroke: green,
        strokeWidth: 2,
        radius: 10,
    })
    fig.text(753, 88, 'Merge Node Checks', { size: 15, weight: 700, color: green, align: 'center' })
    fig.line(646, 108, 860, 108, { color: tint(green, c.bg, 0.45), width: 1 })
    fig.text(644, 132, '1. Unique keys: {diff, test, scan}', { size: 12.5, weight: 600, color: c.textPrimary })
    fig.text(644, 160, '2. All digests == HEAD 8f1a3b', { size: 12.5, weight: 600, color: c.textPrimary })
    fig.text(644, 190, '→ Emit single patch bundle', { size: 13, weight: 700, color: green })

    return fig.render()
}

export default create('dark')
