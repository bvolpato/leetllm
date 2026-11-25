import React from 'react'
import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 920
export const height = 415
export const alt =
    'Three multi-agent topologies side by side: Deterministic DAG (Intake fans out to Diff, Test, Scan and joins at Merge), Hub-and-Spoke Supervisor (central LLM invokes Diff, Test, Scan bidirectionally), and Peer Handoff Swarm (Triage transfers turn and ACL scope across Code and DB Spec to Done). Footer distinguishes MCP (host to tool servers) from A2A (cross-runtime remote agent tasks).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const c = fig.c
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    // Frameless 3-column layout separated by subtle vertical hairlines
    fig.line(306, 18, 306, 354, { color: c.borderSubtle, width: 1, dash: '4 4' })
    fig.line(614, 18, 614, 354, { color: c.borderSubtle, width: 1, dash: '4 4' })

    const node = (cx: number, cy: number, w: number, h: number, label: string, tone: string) => {
        fig.rect(cx - w / 2, cy - h / 2, w, h, {
            fill: tint(tone, c.bg, theme === 'light' ? 0.13 : 0.2),
            stroke: tone,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(cx, cy, label, { size: 13.5, weight: 700, color: tone, align: 'center' })
    }

    // Column 1: Deterministic DAG (cx = 154)
    fig.text(154, 22, '1. Deterministic DAG', { size: 15, weight: 700, color: blue, align: 'center' })
    fig.text(154, 42, 'Fixed fan-out / fan-in', { size: 12.5, color: c.textSecondary, align: 'center' })
    node(154, 92, 92, 36, 'Intake', blue)
    node(62, 188, 74, 36, 'Diff', cyan)
    node(154, 188, 74, 36, 'Test', cyan)
    node(246, 188, 74, 36, 'Scan', cyan)
    node(154, 282, 92, 36, 'Merge', green)
    for (const tx of [62, 154, 246]) {
        fig.arrow(154, 112, tx, 168, { color: blue, width: 1.6, head: 5.5 })
        fig.arrow(tx, 208, 154, 262, { color: green, width: 1.6, head: 5.5 })
    }
    fig.text(154, 332, 'Control: graph edges', { size: 13, weight: 600, color: blue, align: 'center' })

    // Column 2: Hub-and-Spoke Supervisor (cx = 460)
    fig.text(460, 22, '2. Hub-and-Spoke Supervisor', { size: 15, weight: 700, color: purple, align: 'center' })
    fig.text(460, 42, 'Manager invokes specialists', { size: 12.5, color: c.textSecondary, align: 'center' })
    node(460, 110, 126, 40, 'Supervisor', purple)
    node(364, 258, 78, 36, 'Diff', blue)
    node(460, 276, 78, 36, 'Test', blue)
    node(556, 258, 78, 36, 'Scan', blue)
    for (const [tx, ty] of [
        [364, 238],
        [460, 256],
        [556, 238],
    ] as const) {
        fig.arrow(460, 132, tx, ty, { color: purple, width: 1.6, head: 5.5 })
        fig.arrow(tx, ty, 460, 132, { color: purple, width: 1.6, head: 5.5 })
    }
    fig.text(460, 332, 'Control: central LLM loop', { size: 13, weight: 600, color: purple, align: 'center' })

    // Column 3: Peer Handoff Swarm (cx = 768)
    fig.text(768, 22, '3. Peer Handoff Swarm', { size: 15, weight: 700, color: cyan, align: 'center' })
    fig.text(768, 42, 'Transfers turn + ACL scope', { size: 12.5, color: c.textSecondary, align: 'center' })
    node(768, 92, 92, 36, 'Triage', cyan)
    node(678, 192, 86, 36, 'Code', blue)
    node(856, 192, 96, 36, 'DB Spec', warm)
    node(768, 284, 92, 36, 'Done', green)
    fig.arrow(750, 112, 686, 172, { color: cyan, width: 1.8, head: 6 })
    fig.arrow(786, 112, 846, 172, { color: c.textMuted, width: 1.3, dash: '4 4', head: 5 })
    fig.arrow(722, 192, 806, 192, { color: warm, width: 2, head: 6.5 })
    // Clean non-colliding "handoff" label ABOVE the horizontal arrow!
    fig.text(764, 174, 'handoff', { size: 12.5, weight: 700, color: warm, align: 'center' })
    fig.arrow(848, 212, 786, 264, { color: green, width: 1.8, head: 6 })
    fig.arrow(686, 212, 750, 264, { color: c.textMuted, width: 1.3, dash: '4 4', head: 5 })
    fig.text(768, 332, 'Control: active peer', { size: 13, weight: 600, color: cyan, align: 'center' })

    // Bottom Protocol Legend (MCP vs A2A)
    fig.line(24, 368, 896, 368, { color: c.borderSubtle, width: 1 })
    fig.text(290, 392, 'MCP · Host to tool servers', { size: 13.5, weight: 700, color: blue, align: 'center' })
    fig.text(640, 392, 'A2A · Cross-runtime remote agent tasks', {
        size: 13.5,
        weight: 700,
        color: green,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
