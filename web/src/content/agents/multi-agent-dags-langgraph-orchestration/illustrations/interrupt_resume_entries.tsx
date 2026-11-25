import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 900
export const height = 395
export const alt =
    'Dual-pass execution trace of LangGraph interrupt() inside review_gate. Entry 1 enters from the top, calls interrupt(digest), and pauses at a saved checkpoint (no side effects allowed before interrupt). Entry 2 resumes via Command(resume=payload) from the first line of review_gate, where interrupt() returns payload synchronously before routing to open_pr_writer or cancel.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('red')

    // Center: The shared review_gate node code steps
    fig.text(450, 22, 'review_gate Node Body (Executed Twice Across Pause & Resume)', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    const codeX = 294
    const codeW = 312
    fig.rect(codeX, 46, codeW, 226, {
        fill: tint(c.borderSubtle, c.bg, theme === 'light' ? 0.2 : 0.18),
        stroke: c.border,
        strokeWidth: 1.4,
        radius: 10,
    })

    const lines = [
        { y: 74, text: '1. Pure prep (no side effects!)', tone: warm },
        { y: 128, text: '2. res = interrupt({digest})', tone: purple },
        { y: 184, text: '3. Verify res.ok & digest', tone: blue },
        { y: 240, text: '4. Route → apply or cancel', tone: green },
    ]
    for (const ln of lines) {
        fig.rect(codeX + 16, ln.y - 16, codeW - 32, 36, {
            fill: tint(ln.tone, c.bg, theme === 'light' ? 0.1 : 0.16),
            stroke: tint(ln.tone, c.bg, 0.55),
            strokeWidth: 1.3,
            radius: 6,
        })
        fig.text(codeX + codeW / 2, ln.y + 2, ln.text, {
            size: 13,
            mono: true,
            weight: 700,
            color: ln.tone,
            align: 'center',
        })
    }

    // Left track: Entry #1 (runs lines 1 -> 2 -> PAUSE)
    fig.text(136, 54, 'Entry #1 (Initial Run)', { size: 14.5, weight: 700, color: blue, align: 'center' })
    fig.path('M 190 74 H 292', { color: blue, width: 2 })
    fig.arrow(278, 74, 294, 74, { color: blue, width: 2, head: 6.5 })
    fig.path('M 190 74 V 130 H 292', { color: blue, width: 2 })
    fig.rect(24, 108, 170, 62, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.12 : 0.2),
        stroke: warm,
        strokeWidth: 1.7,
        radius: 8,
    })
    fig.text(109, 130, 'PAUSES & SAVES', { size: 13.5, weight: 700, color: warm, align: 'center' })
    fig.text(109, 152, 'checkpoint stored', { size: 12.5, color: c.textPrimary, align: 'center' })
    fig.text(136, 198, 'Lines 3–4 do NOT run yet', { size: 12.5, color: c.textSecondary, align: 'center' })

    // Right track: Entry #2 (restarts from TOP -> interrupt() returns payload -> lines 3 -> 4)
    fig.text(764, 54, 'Entry #2 (Command(resume))', { size: 14.5, weight: 700, color: purple, align: 'center' })
    fig.path('M 608 74 H 710', { color: purple, width: 2 })
    fig.arrow(622, 74, 606, 74, { color: purple, width: 2, head: 6.5 })
    fig.path('M 710 74 V 242 H 608', { color: purple, width: 2 })
    fig.arrow(622, 130, 606, 130, { color: purple, width: 2, head: 6.5 })
    fig.rect(714, 104, 170, 74, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.12 : 0.2),
        stroke: purple,
        strokeWidth: 1.7,
        radius: 8,
    })
    fig.text(799, 126, 'Replays from Line 1', { size: 13, weight: 700, color: purple, align: 'center' })
    fig.text(799, 148, 'interrupt() returns', { size: 12.5, color: c.textPrimary, align: 'center' })
    fig.text(799, 166, 'payload synchronously', { size: 12.5, color: c.textSecondary, align: 'center' })

    // Bottom Fork from Line 4
    fig.arrow(390, 274, 290, 314, { color: green, width: 2, head: 6.5 })
    fig.arrow(510, 274, 610, 314, { color: red, width: 2, head: 6.5 })

    fig.rect(86, 316, 336, 58, {
        fill: tint(green, c.bg, theme === 'light' ? 0.12 : 0.19),
        stroke: green,
        strokeWidth: 1.7,
        radius: 8,
    })
    fig.text(254, 336, 'ok = True & Digest Matches', { size: 13.5, weight: 700, color: green, align: 'center' })
    fig.text(254, 358, '→ Route to open_pr_writer', { size: 13, mono: true, color: c.textPrimary, align: 'center' })

    fig.rect(478, 316, 336, 58, {
        fill: tint(red, c.bg, theme === 'light' ? 0.12 : 0.19),
        stroke: red,
        strokeWidth: 1.7,
        radius: 8,
    })
    fig.text(646, 336, 'ok = False or Digest Mismatch', { size: 13.5, weight: 700, color: red, align: 'center' })
    fig.text(646, 358, '→ Cancel without write', { size: 13, mono: true, color: c.textPrimary, align: 'center' })

    return fig.render()
}

export default create('dark')
