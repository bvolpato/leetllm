import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 880
export const height = 420
export const alt =
    'Epoch timeline across five editor events. Typing r (epoch 1) and o (epoch 2) arm 150 ms debounces that are canceled before dispatch. Typing dot (epoch 3) fires immediately at 0 ms; reply comp-3 arrives at epoch 3 and paints ghost text, while late stale-2 drops. Moving the caret to (0,0) advances to epoch 4, clears ghost text, and rejects late epoch 3 replies. Changing policy ACL 7 to 8 advances to epoch 5, clears ghost text, and guards Tab insertion.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')

    // Horizontal swimlane timeline: 5 epochs across x = 148..850
    const epochs = [
        {
            e: 1,
            x: 162,
            event: "Type 'r'",
            snap: 'v1 · (1,1) · acl 7',
            action: '150 ms debounce',
            outcome: 'Canceled',
            tone: red,
        },
        {
            e: 2,
            x: 306,
            event: "Type 'o'",
            snap: 'v2 · (2,2) · acl 7',
            action: '150 ms debounce',
            outcome: 'Canceled',
            tone: red,
        },
        {
            e: 3,
            x: 450,
            event: "Type '.'",
            snap: 'v3 · (3,3) · acl 7',
            action: '0 ms trigger',
            outcome: 'SENT req e=3',
            tone: green,
        },
        {
            e: 4,
            x: 616,
            event: 'Caret move',
            snap: 'v3 · (0,0) · acl 7',
            action: 'Clear ghost',
            outcome: 'No send',
            tone: warm,
        },
        {
            e: 5,
            x: 774,
            event: 'ACL 7 -> 8',
            snap: 'v3 · (0,0) · acl 8',
            action: 'Clear ghost',
            outcome: 'No send',
            tone: purple,
        },
    ]

    // Swimlane row labels on left
    fig.text(20, 62, 'Editor', { size: 14, weight: 700, color: c.textPrimary })
    fig.text(20, 82, 'events', { size: 12, color: c.textSecondary })

    fig.text(20, 152, 'Debounce', { size: 14, weight: 700, color: c.textPrimary })
    fig.text(20, 172, '& dispatch', { size: 12, color: c.textSecondary })

    fig.text(20, 248, 'Replies &', { size: 14, weight: 700, color: c.textPrimary })
    fig.text(20, 268, 'paint gate', { size: 12, color: c.textSecondary })

    // Horizontal guide lines for swimlanes
    fig.line(120, 118, 858, 118, { color: c.borderSubtle, width: 1 })
    fig.line(120, 206, 858, 206, { color: c.borderSubtle, width: 1 })
    fig.line(120, 316, 858, 316, { color: c.borderSubtle, width: 1 })

    // Main time axis arrow along top
    fig.arrow(120, 30, 856, 30, { color: c.textMuted, width: 1.4, head: 6 })
    fig.text(856, 16, 'time', { size: 12, color: c.textMuted, align: 'right' })

    // Vertical epoch columns & nodes
    for (const ep of epochs) {
        // Epoch vertical tick line
        fig.line(ep.x, 30, ep.x, 314, { color: c.borderSubtle, width: 1, dash: '3 3' })
        // Epoch badge on time axis
        fig.rect(ep.x - 24, 18, 48, 24, {
            fill: tint(ep.tone, c.bg, 0.18),
            stroke: ep.tone,
            strokeWidth: 1.4,
            radius: 12,
        })
        fig.text(ep.x, 30, `e=${ep.e}`, {
            size: 13,
            weight: 700,
            color: ep.tone,
            align: 'center',
            mono: true,
        })

        // Row 1: Event + snapshot
        fig.text(ep.x, 62, ep.event, {
            size: 14,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(ep.x, 86, ep.snap, {
            size: 11,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })

        // Row 2: Debounce / dispatch status pill
        const pw = ep.e === 3 ? 124 : 112
        fig.rect(ep.x - pw / 2, 134, pw, 52, {
            fill: tint(ep.tone, c.bg, 0.11),
            stroke: ep.tone,
            strokeWidth: ep.e === 3 ? 1.6 : 1.2,
            radius: 7,
        })
        fig.text(ep.x, 151, ep.action, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        })
        fig.text(ep.x, 171, ep.outcome, {
            size: 12,
            weight: 700,
            color: ep.tone,
            align: 'center',
            mono: ep.e === 3,
        })
    }

    // Cancel arrows between e=1 -> e=2 and e=2 -> e=3
    fig.arrow(218, 160, 248, 160, { color: red, width: 1.4, head: 5, dash: '3 2' })
    fig.arrow(362, 160, 386, 160, { color: red, width: 1.4, head: 5, dash: '3 2' })

    // Row 3: Replies arriving at Paint Gate
    // Reply 1: comp-3 arrives during e=3 -> PAINT (green)
    fig.arrow(450, 186, 450, 222, { color: green, width: 1.8, head: 6 })
    fig.rect(376, 224, 148, 44, {
        fill: tint(green, c.bg, 0.16),
        stroke: green,
        strokeWidth: 1.6,
        radius: 7,
    })
    fig.text(450, 239, 'comp-3 (e=3 == 3)', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })
    fig.text(450, 257, 'PAINT ghost text', {
        size: 12,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    // Reply 2: late stale-2 arrives during e=3 -> DROP (red)
    fig.rect(144, 238, 182, 44, {
        fill: tint(red, c.bg, 0.12),
        stroke: red,
        strokeWidth: 1.3,
        radius: 7,
    })
    fig.text(235, 253, 'late e=2 arrives at e=3', {
        size: 12,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })
    fig.text(235, 271, 'DROP (2 != 3)', {
        size: 12,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Reply 3: late e=3 arrives after caret move (e=4) -> DROP (red)
    fig.rect(544, 224, 152, 44, {
        fill: tint(red, c.bg, 0.12),
        stroke: red,
        strokeWidth: 1.3,
        radius: 7,
    })
    fig.text(620, 239, 'late e=3 at e=4', {
        size: 12,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })
    fig.text(620, 257, 'DROP (3 != 4)', {
        size: 12,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Reply 4: fresh at e=4 then invalidated by ACL change e=5 -> Tab blocked
    fig.rect(712, 224, 142, 44, {
        fill: tint(purple, c.bg, 0.13),
        stroke: purple,
        strokeWidth: 1.3,
        radius: 7,
    })
    fig.text(783, 239, 'e=4 ghost vs e=5', {
        size: 12,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
    })
    fig.text(783, 257, 'Tab returns None', {
        size: 12,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    // Bottom Dual-Gate invariant bar (frameless clean two-column strip)
    fig.rect(120, 336, 356, 62, {
        fill: tint(blue, c.bg, 0.08),
        stroke: blue,
        strokeWidth: 1.3,
        radius: 8,
    })
    fig.text(136, 356, 'Paint Gate', { size: 14, weight: 700, color: blue })
    fig.text(136, 378, 'reply.epoch == epoch && reply.S == current S', {
        size: 12,
        color: c.textPrimary,
        mono: true,
    })

    fig.rect(496, 336, 362, 62, {
        fill: tint(green, c.bg, 0.08),
        stroke: green,
        strokeWidth: 1.3,
        radius: 8,
    })
    fig.text(512, 356, 'Tab Gate (Atomic Insert)', { size: 14, weight: 700, color: green })
    fig.text(512, 378, 'Re-check version & caret before buffer edit', {
        size: 12,
        color: c.textPrimary,
    })

    return fig.render()
}

export default create('dark')
