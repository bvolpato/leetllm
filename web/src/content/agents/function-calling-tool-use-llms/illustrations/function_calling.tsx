import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 435
export const alt =
    'A six-step release-status sequence across Operator, Model, Host, and API. Turn 1: Operator asks why reranker-v16 failed; Model emits get_release_status(reranker-v16) with call_id status-1. Host verifies ID shape and session project, calls API (rollout_failed, error 0.081 vs cap 0.02), and returns untrusted function_call_output linked by status-1. Turn 2: Model compares 0.081 > 0.02 and answers.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    const lanes = [
        { name: 'Operator', x: 84, tone: c.textPrimary },
        { name: 'Model', x: 294, tone: blue },
        { name: 'Host', x: 514, tone: purple },
        { name: 'API', x: 696, tone: green },
    ]

    fig.rect(14, 62, 732, 234, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.04 : 0.06),
        stroke: tint(blue, c.bg, 0.25),
        strokeWidth: 1,
        radius: 10,
    })
    fig.text(26, 78, 'Turn 1: Proposal & Host Execution', { size: 15, weight: 700, color: blue })

    fig.rect(14, 306, 732, 118, {
        fill: tint(warm, c.bg, theme === 'light' ? 0.04 : 0.06),
        stroke: tint(warm, c.bg, 0.28),
        strokeWidth: 1,
        radius: 10,
    })
    fig.text(26, 322, 'Turn 2: Linked Observation & Answer', { size: 15, weight: 700, color: warm })

    for (const lane of lanes) {
        const w = 112
        fig.rect(lane.x - w / 2, 14, w, 36, {
            fill: tint(lane.tone, c.bg, theme === 'light' ? 0.1 : 0.16),
            stroke: tint(lane.tone, c.bg, 0.55),
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(lane.x, 32, lane.name, { size: 15.5, weight: 700, color: lane.tone, align: 'center' })
        fig.line(lane.x, 50, lane.x, 418, { color: c.borderSubtle, width: 1.5, dash: '4 4' })
    }

    const msg = (fromX: number, toX: number, y: number, label: string, color: string, sub?: string) => {
        fig.arrow(fromX, y, toX, y, { color, width: 2, head: 6.5 })
        const mx = (fromX + toX) / 2
        fig.text(mx, y - 14, label, { size: 15, weight: 700, mono: sub !== undefined, color, align: 'center' })
        if (sub) {
            fig.text(mx, y + 14, sub, { size: 14.5, color: c.textSecondary, align: 'center' })
        }
    }

    msg(84, 294, 112, '1. Why did v16 fail?', blue)
    msg(294, 514, 160, '2. get_release_status(v16)', purple, 'call_id = status-1')

    fig.rect(404, 192, 220, 34, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.14 : 0.22),
        stroke: purple,
        strokeWidth: 1.4,
        radius: 6,
    })
    fig.text(514, 209, '3. Check ID + project', { size: 15, weight: 700, color: purple, align: 'center' })

    msg(514, 696, 250, '4. GET /v16', green)
    msg(696, 514, 282, 'err 0.081 (cap 0.02)', green)
    msg(514, 294, 354, '5. call_output [status-1]', warm, 'untrusted data')
    msg(294, 84, 404, '6. 0.081 > 0.02 (over cap)', green)

    return fig.render()
}

export default create('dark')
