import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 390
export const alt =
    'Finite-state machine for streaming claim verification bound to (request-a, draft-2, rev 2). Claims start in PENDING (held in buffer). Stale events (draft-1, rev 1) or non-boolean verdicts ("false", 1) self-loop back to PENDING and are dropped. Strict accepted is True transitions to terminal CHECKED, emitting the claim once while ignoring duplicate event IDs. Strict accepted is False transitions to terminal BLOCKED, permanently suppressing publication even if a later accept arrives.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')

    const fill = (color: string, amt = 0.14) => tint(color, c.bg, amt)

    // Top composite binding key pill
    fig.rect(240, 14, 360, 32, {
        fill: fill(blue, 0.08),
        stroke: c.border,
        strokeWidth: 1,
        radius: 16,
    })
    fig.text(420, 30, 'Binding key: (request-a, draft-2, rev 2)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
        weight: 600,
        mono: true,
    })

    // Entry arrow into PENDING
    fig.text(24, 226, 'Draft held', { size: 12.5, color: c.textSecondary, weight: 600 })
    fig.arrow(90, 226, 122, 226, { color: blue, width: 1.75, head: 6 })

    // State 1: PENDING (initial state, held in buffer)
    fig.rect(126, 184, 192, 84, {
        fill: fill(blue, 0.14),
        stroke: blue,
        strokeWidth: 2,
        radius: 14,
    })
    fig.text(222, 212, 'PENDING', { size: 15, color: blue, align: 'center', weight: 700 })
    fig.text(222, 238, 'buffered · emitted = 0', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    // Self-loop on PENDING for stale / malformed events (top arch)
    fig.path('M184 184 C184 114, 260 114, 260 176', {
        color: warm,
        width: 1.6,
        dash: '5 4',
    })
    fig.arrow(260, 168, 260, 182, { color: warm, width: 1.6, head: 6 })
    fig.text(222, 84, 'Stale (draft-1, rev 1) or malformed ("false", 1)', {
        size: 12.5,
        color: warm,
        align: 'center',
        weight: 700,
    })
    fig.text(222, 103, 'drop event, keep pending', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Transition PENDING -> CHECKED (upper right)
    fig.path('M318 206 C380 206, 404 132, 488 132', { color: green, width: 2 })
    fig.arrow(478, 132, 494, 132, { color: green, width: 2, head: 6 })
    fig.text(398, 114, 'accepted is True', {
        size: 13,
        color: green,
        align: 'center',
        weight: 700,
        mono: true,
    })
    fig.text(398, 133, 'emit once', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // State 2: CHECKED (terminal accept, double-ring border)
    fig.rect(498, 88, 198, 88, {
        fill: fill(green, 0.14),
        stroke: green,
        strokeWidth: 2,
        radius: 14,
    })
    fig.rect(504, 94, 186, 76, {
        stroke: green,
        strokeWidth: 1,
        radius: 10,
        opacity: 0.65,
    })
    fig.text(597, 120, 'CHECKED', { size: 15, color: green, align: 'center', weight: 700 })
    fig.text(597, 145, 'SSE emitted = 1', {
        size: 12.5,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Right self-loop on CHECKED (duplicate event_id ignored)
    fig.path('M696 114 C758 114, 758 150, 704 150', {
        color: green,
        width: 1.5,
        dash: '4 3',
    })
    fig.arrow(712, 150, 698, 150, { color: green, width: 1.5, head: 6 })
    fig.text(750, 122, 'dup event_id', { size: 12, color: green, weight: 600 })
    fig.text(750, 140, 'ignore (0)', { size: 12, color: c.textSecondary })

    // Transition PENDING -> BLOCKED (lower right)
    fig.path('M318 246 C380 246, 404 294, 488 294', { color: red, width: 2 })
    fig.arrow(478, 294, 494, 294, { color: red, width: 2, head: 6 })
    fig.text(398, 326, 'accepted is False', {
        size: 13,
        color: red,
        align: 'center',
        weight: 700,
        mono: true,
    })
    fig.text(398, 345, 'suppress claim', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // State 3: BLOCKED (terminal reject, double-ring border)
    fig.rect(498, 250, 198, 88, {
        fill: fill(red, 0.14),
        stroke: red,
        strokeWidth: 2,
        radius: 14,
    })
    fig.rect(504, 256, 186, 76, {
        stroke: red,
        strokeWidth: 1,
        radius: 10,
        opacity: 0.65,
    })
    fig.text(597, 282, 'BLOCKED', { size: 15, color: red, align: 'center', weight: 700 })
    fig.text(597, 307, 'terminal · emitted = 0', {
        size: 12.5,
        color: c.textPrimary,
        align: 'center',
        mono: true,
    })

    // Right self-loop on BLOCKED (later accept ignored)
    fig.path('M696 276 C758 276, 758 312, 704 312', {
        color: red,
        width: 1.5,
        dash: '4 3',
    })
    fig.arrow(712, 312, 698, 312, { color: red, width: 1.5, head: 6 })
    fig.text(750, 284, 'later accept', { size: 12, color: red, weight: 600 })
    fig.text(750, 302, 'ignored', { size: 12, color: c.textSecondary })

    return fig.render()
}

export default create()
