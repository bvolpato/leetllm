import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 385
export const alt =
    'A two-zone context architecture diagram separates the stable cacheable prefix (system instructions and tool schemas) from per-turn working context (ACL-scoped retrieval chunks, compacted session state, and the user query) before allocating output headroom and running the model call.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const soft = theme === 'light' ? 0.13 : 0.17

    // Top input source badges feeding into the ordered context window
    const sources = [
        { x: 24, w: 228, title: 'Stable Prefix', detail: 'Rules + tool schemas', color: blue },
        { x: 274, w: 162, title: 'Session State', detail: 'Compacted history', color: purple },
        { x: 454, w: 170, title: 'Scoped Retrieval', detail: 'ACL + rerank', color: green },
        { x: 642, w: 134, title: 'Active Query', detail: 'Current turn', color: warm },
    ]

    const srcY = 20
    const srcH = 54
    for (const s of sources) {
        fig.rect(s.x, srcY, s.w, srcH, {
            fill: tint(s.color, c.bg, soft),
            stroke: s.color,
            strokeWidth: 1.4,
            radius: 9,
        })
        fig.text(s.x + s.w / 2, srcY + 19, s.title, {
            size: 13.5,
            weight: 700,
            color: s.color,
            align: 'center',
        })
        fig.text(s.x + s.w / 2, srcY + 39, s.detail, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        })
    }

    // Main horizontal context window strip (proportional token budget)
    const winY = 136
    const winH = 70
    const segments = [
        { x: 24, w: 236, label: 'Immutable Prefix', sub: 'Byte 0 · KV cached', color: blue, dashed: false },
        { x: 266, w: 158, label: 'Session State', sub: 'Per-turn', color: purple, dashed: false },
        { x: 430, w: 168, label: 'Retrieved Docs', sub: 'Filtered chunks', color: green, dashed: false },
        { x: 604, w: 94, label: 'Query', sub: 'Task', color: warm, dashed: false },
        { x: 704, w: 72, label: 'Slack', sub: 'Output', color: c.textMuted, dashed: true },
    ]

    // Subtle outer guide showing the single token window
    fig.text(24, winY - 14, 'Ordered context window (byte 0 to budget limit)', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
    })

    // Arrows from top sources into their exact window slots
    const arrowTargets = [
        { from: 24 + 228 / 2, to: 24 + 236 / 2, color: blue },
        { from: 274 + 162 / 2, to: 266 + 158 / 2, color: purple },
        { from: 454 + 170 / 2, to: 430 + 168 / 2, color: green },
        { from: 642 + 134 / 2, to: 604 + 94 / 2, color: warm },
    ]
    for (const a of arrowTargets) {
        fig.arrow(a.from, srcY + srcH + 4, a.to, winY - 26, {
            color: a.color,
            width: 1.6,
            head: 6,
        })
    }

    for (const seg of segments) {
        fig.rect(seg.x, winY, seg.w, winH, {
            fill: seg.dashed ? tint(c.textMuted, c.bg, 0.06) : tint(seg.color, c.bg, theme === 'light' ? 0.17 : 0.22),
            stroke: seg.color,
            strokeWidth: seg.dashed ? 1.25 : 1.75,
            radius: 7,
        })
        if (seg.dashed) {
            // Subtle dashed inner border for unallocated output headroom
            fig.path(
                `M${seg.x + 4} ${winY + 4}H${seg.x + seg.w - 4}V${winY + winH - 4}H${seg.x + 4}Z`,
                { color: c.textMuted, width: 1, dash: '4 3', opacity: 0.7 },
            )
        }
        fig.text(seg.x + seg.w / 2, winY + 25, seg.label, {
            size: 13.5,
            weight: 700,
            color: seg.dashed ? c.textSecondary : seg.color,
            align: 'center',
        })
        fig.text(seg.x + seg.w / 2, winY + 48, seg.sub, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
        })
    }

    // Curly braces underneath separating cacheable prefix vs dynamic suffix
    fig.brace(24, winY + winH + 10, 260, winY + winH + 10, 'KV prefix cache hit across turns', {
        side: 1,
        depth: 9,
        color: blue,
        labelColor: blue,
        labelSize: 12.5,
        labelGap: 14,
        weight: 600,
    })
    fig.brace(266, winY + winH + 10, 698, winY + winH + 10, 'Rebuilt per turn (working memory)', {
        side: 1,
        depth: 9,
        color: warm,
        labelColor: c.textPrimary,
        labelSize: 12.5,
        labelGap: 14,
        weight: 600,
    })

    // Bottom execution handoff to model output
    const outX = 240
    const outY = 304
    const outW = 320
    const outH = 54
    fig.arrow(400, winY + winH + 48, 400, outY - 4, {
        color: c.textMuted,
        width: 1.75,
        head: 7,
    })
    fig.rect(outX, outY, outW, outH, {
        fill: tint(c.textPrimary, c.bg, 0.06),
        stroke: c.border,
        strokeWidth: 1.5,
        radius: 10,
    })
    fig.text(outX + outW / 2, outY + 19, 'Model Call & Output', {
        size: 14.5,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(outX + outW / 2, outY + 39, 'Cited answer + isolated tool calls', {
        size: 12.5,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
