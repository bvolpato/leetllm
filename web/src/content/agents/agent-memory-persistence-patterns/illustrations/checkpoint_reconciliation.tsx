import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 370
export const alt =
    'Crash recovery flow contrasting a recalled memory note (context only, stale risk) with a durable workflow checkpoint (node open_pr pending, key merge-run-42). Recovery reconciles against live CI and upstream state, either skipping duplicates if the key exists or retrying once if checks pass.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')

    const box = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        line1: string,
        line2: string,
        tone: string,
        dashed = false,
    ) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.09 : 0.15),
            stroke: tone,
            strokeWidth: dashed ? 1.4 : 1.8,
            radius: 9,
        })
        fig.text(x + w / 2, y + 22, title, { size: 14, weight: 700, color: tone, align: 'center' })
        fig.text(x + w / 2, y + 46, line1, {
            size: 13,
            mono: line1.includes(':') || line1.includes('merge-run'),
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(x + w / 2, y + 68, line2, {
            size: 12.5,
            mono: line2.includes('key:'),
            color: c.textSecondary,
            align: 'center',
        })
    }

    // Left: Two inputs (Advisory Note vs Authoritative Checkpoint)
    box(24, 42, 248, 92, 'Recalled Memory Note', '"Merge approved earlier"', 'advisory context · stale risk', warm, true)
    box(24, 212, 248, 96, 'Workflow Checkpoint', 'node: open_pr (pending)', 'key: merge-run-42', blue)

    // Dotted advisory arrow (not trusted for execution) + solid authoritative arrow
    fig.path('M 272 88 H 338 V 172 H 362', { color: warm, width: 1.5, dash: '4 4' })
    fig.text(320, 68, 'context only', { size: 12, color: warm, align: 'center' })

    fig.path('M 272 260 H 338 V 202 H 362', { color: blue, width: 2.2 })
    fig.arrow(348, 202, 364, 202, { color: blue, width: 2.2, head: 7 })
    fig.text(300, 322, 'authoritative state', { size: 12.5, weight: 700, color: blue, align: 'center' })

    // Center: Reconcile against live systems
    fig.rect(366, 136, 208, 108, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.12 : 0.19),
        stroke: purple,
        strokeWidth: 2,
        radius: 10,
    })
    fig.text(470, 162, 'Reconcile Live State', { size: 14.5, weight: 700, color: purple, align: 'center' })
    fig.text(470, 188, 'Query CI + branch HEAD', { size: 13, color: c.textPrimary, align: 'center' })
    fig.text(470, 212, 'Lookup key: merge-run-42', { size: 12.5, mono: true, color: c.textSecondary, align: 'center' })

    // Right: Two safe outcomes
    fig.path('M 574 172 H 614 V 104 H 646', { color: green, width: 2 })
    fig.arrow(632, 104, 648, 104, { color: green, width: 2, head: 6.5 })
    fig.text(612, 84, 'key found', { size: 12.5, weight: 700, color: green, align: 'center' })

    fig.path('M 574 208 H 614 V 268 H 646', { color: blue, width: 2 })
    fig.arrow(632, 268, 648, 268, { color: blue, width: 2, head: 6.5 })
    fig.text(612, 290, 'no effect', { size: 12.5, weight: 700, color: blue, align: 'center' })

    box(650, 56, 226, 94, 'Upstream Key Found', 'Skip duplicate call', 'mark checkpoint committed', green)
    box(650, 222, 226, 94, 'No Upstream Effect', 'Retry once safely', 'only if live CI checks pass', blue)

    return fig.render()
}

export default create('dark')
