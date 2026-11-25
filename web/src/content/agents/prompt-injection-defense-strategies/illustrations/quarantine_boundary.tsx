import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 405
export const alt =
    'Dual-LLM quarantine architecture with an explicit dashed privilege boundary separating the trusted planner lane (Trusted goal -> Privileged LLM emitting symbolic $var plan) from the toolless quarantined reader lane (External doc -> Quarantined LLM emitting tainted JSON). Both converge at a deterministic Host Monitor that checks taint and scope before allowing Scoped Sink tool calls.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const red = fig.tone('red')
    const warm = fig.tone('warm')
    const green = fig.tone('green')

    // Top Privileged Zone
    fig.rect(14, 18, 412, 154, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.05 : 0.08),
        stroke: tint(blue, c.bg, 0.45),
        strokeWidth: 1.4,
        radius: 10,
    })
    fig.text(28, 38, 'Privileged Zone (No Raw Untrusted Text)', { size: 15, weight: 700, color: blue })

    // Bottom Quarantined Zone
    fig.rect(14, 224, 412, 154, {
        fill: tint(red, c.bg, theme === 'light' ? 0.05 : 0.08),
        stroke: tint(red, c.bg, 0.45),
        strokeWidth: 1.4,
        radius: 10,
    })
    fig.text(28, 244, 'Quarantined Zone (0 Tools · Tainted)', { size: 15, weight: 700, color: red })

    // Clean dashed boundary with solid ground pill behind text so dash never strikes through text!
    fig.line(14, 198, 426, 198, { color: warm, width: 1.8, dash: '6 5' })
    fig.rect(72, 184, 296, 28, { fill: c.bg, stroke: tint(warm, c.bg, 0.5), strokeWidth: 1, radius: 12 })
    fig.text(220, 198, 'privilege boundary ($var handles)', { size: 15, weight: 700, color: warm, align: 'center' })

    const box = (x: number, y: number, w: number, h: number, title: string, sub: string, tone: string) => {
        fig.rect(x, y, w, h, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.12 : 0.18),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(x + w / 2, y + 24, title, { size: 15.5, weight: 700, color: tone, align: 'center' })
        fig.text(x + w / 2, y + 50, sub, { size: 15, color: c.textPrimary, align: 'center' })
    }

    box(26, 70, 158, 72, 'Trusted Goal', 'user rules', blue)
    fig.arrow(186, 106, 226, 106, { color: blue, width: 1.8, head: 6 })
    box(230, 70, 182, 72, 'Privileged LLM', 'plans via $var', blue)

    box(26, 276, 158, 72, 'External Doc', 'email / web', red)
    fig.arrow(186, 312, 226, 312, { color: red, width: 1.8, head: 6 })
    box(230, 276, 182, 72, 'Quarantined', '0 tools · JSON', warm)

    // Converging arrows cleanly routed with labels offset away from vertical segments
    fig.path('M 412 106 H 460 V 176 H 484', { color: blue, width: 2 })
    fig.arrow(472, 176, 486, 176, { color: blue, width: 2, head: 6 })
    fig.text(468, 92, 'plan ($var)', { size: 15, mono: true, weight: 700, color: blue, align: 'left' })

    fig.path('M 412 312 H 460 V 218 H 484', { color: warm, width: 2, dash: '5 4' })
    fig.arrow(472, 218, 486, 218, { color: warm, width: 2, head: 6 })
    fig.text(468, 326, 'taint + json', { size: 15, mono: true, weight: 700, color: warm, align: 'left' })

    // Host Monitor
    fig.rect(488, 146, 128, 104, {
        fill: tint(green, c.bg, theme === 'light' ? 0.14 : 0.22),
        stroke: green,
        strokeWidth: 2,
        radius: 9,
    })
    fig.text(552, 178, 'Host', { size: 15.5, weight: 700, color: green, align: 'center' })
    fig.text(552, 200, 'Monitor', { size: 15.5, weight: 700, color: green, align: 'center' })
    fig.text(552, 228, 'taint+scope', { size: 15, color: c.textPrimary, align: 'center' })

    fig.arrow(618, 198, 650, 198, { color: green, width: 2.1, head: 6.5 })

    box(654, 162, 94, 72, 'Sink', 'scoped', green)

    return fig.render()
}

export default create('dark')
