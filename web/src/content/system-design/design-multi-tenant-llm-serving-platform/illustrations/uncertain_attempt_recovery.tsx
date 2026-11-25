import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 415
export const alt =
    'Durable request state machine and quota reconciliation for an uncertain mid-stream attempt. A request transitions from RESERVED (700-token hold) to RUNNING, then into USAGE_UNCERTAIN on a timeout at token 420. While uncertain, blind refunds and new request IDs are blocked until the worker halts execution and frees KV and adapter references. On reaching TERMINAL, 420 tokens are settled, 280 unused tokens are released, and duplicate replays with the same idempotency key return the terminal record at zero extra charge.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const onBlue = getReadableTextColor(blue, c, c.bg)
    const onGreen = getReadableTextColor(green, c, c.bg)
    const soft = (hex: string, la = 0.09, da = 0.15) => tint(hex, c.bg, theme === 'light' ? la : da)
    const rim = (hex: string) => tint(hex, c.bg, theme === 'light' ? 0.48 : 0.58)

    // Top annotation: pre-first-token safe retry arc
    fig.path('M298 86Q200 32,102 86', { color: blue, width: 1.4, dash: '4 3' })
    fig.arrow(106, 84, 100, 88, { color: blue, width: 1.4, head: 5 })
    fig.text(200, 42, 'Fault before token 1 -> safe retry (same key)', {
        size: 12,
        color: blue,
        align: 'center',
        weight: 600,
        width: 280,
    })

    // 4 Durable State Nodes
    const states = [
        { x: 24, w: 150, name: 'RESERVED', detail: '700 tok held', color: blue },
        { x: 226, w: 152, name: 'RUNNING', detail: 'Streaming tokens', color: purple },
        { x: 426, w: 174, name: 'USAGE_UNCERTAIN', detail: 'Timeout @ 420', color: warm },
        { x: 646, w: 150, name: 'TERMINAL', detail: '420 settled', color: green },
    ]
    const nodeY = 88
    const nodeH = 70

    for (const s of states) {
        fig.rect(s.x, nodeY, s.w, nodeH, {
            fill: soft(s.color),
            stroke: rim(s.color),
            strokeWidth: 1.6,
            radius: 8,
        })
        fig.text(s.x + s.w / 2, nodeY + 25, s.name, {
            size: 13,
            color: s.color,
            align: 'center',
            weight: 700,
            mono: true,
            width: s.w - 10,
        })
        fig.text(s.x + s.w / 2, nodeY + 48, s.detail, {
            size: 13,
            color: c.textPrimary,
            align: 'center',
            width: s.w - 10,
        })
    }

    // Forward transition arrows between states
    fig.arrow(174, nodeY + 35, 224, nodeY + 35, { color: c.textMuted, width: 1.8, head: 6 })
    fig.text(199, nodeY + 18, 'Dispatch', {
        size: 11,
        color: c.textSecondary,
        align: 'center',
        width: 56,
    })

    fig.arrow(378, nodeY + 35, 424, nodeY + 35, { color: warm, width: 1.8, head: 6 })
    fig.text(401, nodeY + 18, 'Drop', {
        size: 11,
        color: warm,
        align: 'center',
        weight: 600,
        width: 44,
    })

    fig.arrow(600, nodeY + 35, 644, nodeY + 35, { color: green, width: 1.8, head: 6 })
    fig.text(622, nodeY + 18, 'Halt', {
        size: 11,
        color: green,
        align: 'center',
        weight: 600,
        width: 44,
    })

    // Guardrail callouts beneath USAGE_UNCERTAIN and TERMINAL
    // Under USAGE_UNCERTAIN: Blocked actions
    fig.arrow(514, nodeY + nodeH, 514, 194, { color: red, width: 1.5, dash: '3 3', head: 5 })
    fig.rect(368, 196, 250, 56, {
        fill: soft(red, 0.08, 0.14),
        stroke: red,
        strokeWidth: 1.3,
        radius: 7,
    })
    fig.text(493, 215, 'Blind refund / new ID: BLOCKED', {
        size: 13,
        color: red,
        align: 'center',
        weight: 700,
        width: 236,
    })
    fig.text(493, 236, 'Hold stays locked until worker halts', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        width: 236,
    })

    // Under TERMINAL: Same-key replay
    fig.arrow(718, nodeY + nodeH, 718, 194, { color: green, width: 1.5, head: 5 })
    fig.rect(632, 196, 164, 56, {
        fill: soft(green, 0.08, 0.14),
        stroke: green,
        strokeWidth: 1.3,
        radius: 7,
    })
    fig.text(714, 215, 'Same-key replay', {
        size: 13,
        color: green,
        align: 'center',
        weight: 700,
        width: 152,
    })
    fig.text(714, 236, 'Cached · 0 extra charge', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        width: 152,
    })

    // Left note under RESERVED/RUNNING: Post-first-token rule
    fig.rect(24, 196, 326, 56, {
        fill: soft(purple, 0.07, 0.12),
        stroke: rim(purple),
        strokeWidth: 1.2,
        radius: 7,
    })
    fig.text(187, 215, 'After tokens stream: never auto-restart', {
        size: 13,
        color: purple,
        align: 'center',
        weight: 700,
        width: 310,
    })
    fig.text(187, 236, 'Resume by sequence ID or return partial error', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
        width: 310,
    })

    // Bottom: Synchronized 700-token Hold Reconciliation Bar
    fig.line(24, 276, 796, 276, { color: c.borderSubtle, width: 1, dash: '5 4' })
    fig.text(24, 298, 'QUOTA HOLD RECONCILIATION AT TERMINAL (700 TOKENS HELD)', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 480,
    })

    const barPlot = fig.plot({ x: 24, y: 318, width: 772, height: 42 }, { x: [0, 700], y: [0, 1] })
    const splitPx = barPlot.px(420)
    const endPx = barPlot.px(700)

    // 420 settled (blue)
    fig.rect(24, 322, splitPx - 24 - 2, 36, { fill: blue, radius: 6 })
    fig.text((24 + splitPx) / 2, 340, '420 tokens settled (actual worker output)', {
        size: 13,
        color: onBlue,
        align: 'center',
        weight: 700,
        width: splitPx - 36,
    })

    // 280 released (green)
    fig.rect(splitPx + 2, 322, endPx - splitPx - 2, 36, { fill: green, radius: 6 })
    fig.text((splitPx + endPx) / 2, 340, '280 released after halt', {
        size: 13,
        color: onGreen,
        align: 'center',
        weight: 700,
        width: endPx - splitPx - 14,
    })

    // Scale ticks beneath reconciliation bar
    for (const tok of [0, 420, 700]) {
        const x = barPlot.px(tok)
        fig.line(x, 362, x, 368, { color: c.textMuted, width: 1.2 })
        fig.text(x, 384, `${tok} tok`, {
            size: 13,
            color: tok === 420 ? blue : c.textSecondary,
            align: tok === 0 ? 'left' : tok === 700 ? 'right' : 'center',
            weight: tok === 420 ? 700 : 500,
            mono: true,
            width: 80,
        })
    }

    return fig.render()
}
