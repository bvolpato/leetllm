import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 880
export const height = 400
export const alt =
    'Planar client-to-gateway routing tree. First, dot or open-paren triggers with known semantic types route to LOCAL_SEMANTIC (60 ms p95). Otherwise, a strict literal remote_permitted is True gate sends False, string False, None, or 1 to LOCAL_FALLBACK (60 ms p95, on device). Literal True crosses an independent Gateway auth and upload policy boundary into REMOTE_MULTILINE (500 ms after signature) or REMOTE_INLINE (200 ms mid-line). All lanes pass the Editor Freshness Gate before paint and Tab.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')

    // Subtle zone headers
    fig.text(24, 22, 'Client Extension (IDE)', { size: 14, weight: 700, color: blue })
    fig.text(520, 22, 'Gateway & Remote Pool', { size: 14, weight: 700, color: green })

    // Dashed vertical trust boundary between Client and Gateway
    fig.line(494, 40, 494, 384, { color: purple, width: 1.8, dash: '6 4' })
    fig.rect(424, 352, 140, 26, {
        fill: tint(purple, c.bg, 0.14),
        stroke: purple,
        strokeWidth: 1.2,
        radius: 6,
    })
    fig.text(494, 365, 'Gateway Auth Gate', {
        size: 12,
        weight: 700,
        color: purple,
        align: 'center',
    })

    // Node 1: Trigger check (left top-mid)
    fig.rect(24, 80, 174, 64, {
        fill: tint(blue, c.bg, 0.11),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(111, 102, "'.' or '(' trigger", {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })
    fig.text(111, 124, '& types known?', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
    })

    // YES branch -> LOCAL_SEMANTIC (top lane)
    fig.arrow(198, 98, 270, 74, { color: blue, width: 1.7, head: 6 })
    fig.text(226, 72, 'Yes', { size: 12, weight: 700, color: blue })

    fig.rect(272, 48, 198, 54, {
        fill: tint(blue, c.bg, 0.14),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(371, 67, 'LOCAL_SEMANTIC', {
        size: 13,
        weight: 700,
        color: blue,
        align: 'center',
        mono: true,
    })
    fig.text(371, 86, 'LSP · 60 ms p95 · offline', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // NO branch -> Strict literal boolean gate (lower-left)
    fig.arrow(111, 144, 111, 200, { color: purple, width: 1.7, head: 6 })
    fig.text(122, 172, 'No', { size: 12, weight: 700, color: purple })

    fig.rect(24, 202, 212, 74, {
        fill: tint(purple, c.bg, 0.12),
        stroke: purple,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(130, 224, 'remote_permitted is True', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'center',
        mono: true,
    })
    fig.text(130, 246, 'Literal Python bool only', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(130, 263, 'Rejects "False", None, 1', {
        size: 11,
        color: red,
        align: 'center',
        mono: true,
    })

    // FALSE branch -> LOCAL_FALLBACK (bottom-left)
    fig.arrow(130, 276, 130, 314, { color: red, width: 1.7, head: 6 })
    fig.text(142, 294, 'Else', { size: 12, weight: 700, color: red })

    fig.rect(24, 316, 212, 54, {
        fill: tint(red, c.bg, 0.11),
        stroke: red,
        strokeWidth: 1.4,
        radius: 8,
    })
    fig.text(130, 335, 'LOCAL_FALLBACK', {
        size: 13,
        weight: 700,
        color: red,
        align: 'center',
        mono: true,
    })
    fig.text(130, 354, 'Local n-gram · 60 ms p95', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // TRUE branch -> crosses Gateway Auth boundary into Remote lanes
    fig.arrow(236, 232, 514, 232, { color: green, width: 1.9, head: 6 })
    fig.text(358, 218, 'Literal True (client hint)', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Gateway verifier node
    fig.rect(516, 198, 128, 68, {
        fill: tint(purple, c.bg, 0.14),
        stroke: purple,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(580, 219, 'Gateway', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(580, 238, 'Verify auth', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(580, 254, '& upload ACL', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Gateway splits into REMOTE_MULTILINE (upper) and REMOTE_INLINE (lower)
    fig.path('M644 218 L664 218 L664 152 L680 152', { color: warm, width: 1.7 })
    fig.arrow(668, 152, 682, 152, { color: warm, width: 1.7, head: 6 })

    fig.rect(684, 122, 174, 60, {
        fill: tint(warm, c.bg, 0.12),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(771, 141, 'REMOTE_MULTILINE', {
        size: 13,
        weight: 700,
        color: warm,
        align: 'center',
        mono: true,
    })
    fig.text(771, 162, 'After def/class · 500 ms', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    fig.path('M644 246 L664 246 L664 276 L680 276', { color: green, width: 1.7 })
    fig.arrow(668, 276, 682, 276, { color: green, width: 1.7, head: 6 })

    fig.rect(684, 246, 174, 60, {
        fill: tint(green, c.bg, 0.14),
        stroke: green,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(771, 265, 'REMOTE_INLINE', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
    })
    fig.text(771, 286, 'Mid-line · 200 ms p95', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Bottom right freshness note (no crossing wires)
    fig.text(712, 356, 'All lanes rejoin Editor Freshness Gate', {
        size: 12,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(712, 374, 'before ghost paint and Tab insertion', {
        size: 12,
        color: c.textMuted,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
