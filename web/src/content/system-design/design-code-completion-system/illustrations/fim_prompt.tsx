import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 880
export const height = 380
export const alt =
    'Three-stage non-crossing Fill-In-the-Middle flow. Left: active file split into blue prefix def validate_token_scope(request): is_allowed =, dashed green cursor hole, and purple suffix return is_allowed. Center: Prefix-Suffix-Middle prompt places PRE prefix, SUF suffix, and MID sentinel so causal attention reads the suffix before generating graph.allows(request.scope) up to EOT. Right: only the generated middle is inserted into the cursor hole while prefix and suffix stay untouched.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')

    // Column geometry: 3 planar stages left -> center -> right (zero crossing lines!)
    const col1 = { x: 20, w: 256 }
    const col2 = { x: 318, w: 252 }
    const col3 = { x: 612, w: 248 }

    // Column headers
    fig.text(col1.x, 24, '1. Editor Buffer', { size: 15, weight: 700, color: c.textPrimary })
    fig.text(col2.x, 24, '2. PSM Prompt & Decode', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(col3.x, 24, '3. Inserted Result', { size: 15, weight: 700, color: green })

    // --- Column 1: Editor Buffer ---
    // Prefix (y: 50..136)
    fig.rect(col1.x, 50, col1.w, 86, {
        fill: tint(blue, c.bg, 0.1),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(col1.x + 12, 68, 'PREFIX', { size: 12, weight: 700, color: blue })
    fig.text(col1.x + 12, 92, 'def validate_token_scope(req):', {
        size: 12,
        color: c.textPrimary,
        mono: true,
    })
    fig.text(col1.x + 12, 114, '    is_allowed = ', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
        mono: true,
    })

    // Hole (y: 154..216)
    fig.rect(col1.x, 154, col1.w, 62, {
        fill: tint(green, c.bg, 0.08),
        stroke: green,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(col1.x + 12, 174, 'CURSOR HOLE', { size: 12, weight: 700, color: green })
    fig.text(col1.x + 12, 196, '|  <-- middle goes here', {
        size: 13,
        color: green,
        mono: true,
    })

    // Suffix (y: 234..304)
    fig.rect(col1.x, 234, col1.w, 70, {
        fill: tint(purple, c.bg, 0.1),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(col1.x + 12, 254, 'SUFFIX', { size: 12, weight: 700, color: purple })
    fig.text(col1.x + 12, 280, '    return is_allowed', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
        mono: true,
    })

    // --- Column 2: PSM Token Sequence ---
    // <PRE> + Prefix (y: 50..124)
    fig.rect(col2.x, 50, col2.w, 74, {
        fill: tint(blue, c.bg, 0.12),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(col2.x + 12, 70, '<PRE>  +  prefix', {
        size: 13,
        weight: 700,
        color: blue,
        mono: true,
    })
    fig.text(col2.x + 12, 98, 'def validate... is_allowed =', {
        size: 12,
        color: c.textSecondary,
        mono: true,
    })

    // <SUF> + Suffix (y: 140..212): sits ABOVE <MID> so causal model attends to suffix!
    fig.rect(col2.x, 140, col2.w, 72, {
        fill: tint(purple, c.bg, 0.12),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(col2.x + 12, 160, '<SUF>  +  suffix', {
        size: 13,
        weight: 700,
        color: purple,
        mono: true,
    })
    fig.text(col2.x + 12, 188, '    return is_allowed', {
        size: 12,
        color: c.textSecondary,
        mono: true,
    })

    // <MID> + Generated output (y: 228..318)
    fig.rect(col2.x, 228, col2.w, 90, {
        fill: tint(green, c.bg, 0.14),
        stroke: green,
        strokeWidth: 1.8,
        radius: 8,
    })
    fig.text(col2.x + 12, 248, '<MID>  decode -> <EOT>', {
        size: 13,
        weight: 700,
        color: green,
        mono: true,
    })
    fig.text(col2.x + 12, 276, 'graph.allows(req.scope)', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        mono: true,
    })
    fig.text(col2.x + 12, 300, 'Reads both prefix & suffix', {
        size: 12,
        color: green,
    })

    // Causal attention arrow inside Col 2 (from <PRE>/<SUF> down into <MID>)
    fig.arrow(col2.x + col2.w - 18, 124, col2.x + col2.w - 18, 138, {
        color: c.textMuted,
        width: 1.3,
        head: 5,
    })
    fig.arrow(col2.x + col2.w - 18, 212, col2.x + col2.w - 18, 226, {
        color: c.textMuted,
        width: 1.3,
        head: 5,
    })

    // --- Column 3: Reassembled File (unchanged boundaries + inserted middle) ---
    fig.rect(col3.x, 50, col3.w, 86, {
        fill: tint(blue, c.bg, 0.06),
        stroke: c.border,
        strokeWidth: 1.2,
        radius: 8,
    })
    fig.text(col3.x + 12, 68, 'PREFIX (untouched)', { size: 12, weight: 600, color: blue })
    fig.text(col3.x + 12, 92, 'def validate_token_scope(req):', {
        size: 12,
        color: c.textSecondary,
        mono: true,
    })
    fig.text(col3.x + 12, 114, '    is_allowed = ', {
        size: 13,
        color: c.textSecondary,
        mono: true,
    })

    fig.rect(col3.x, 154, col3.w, 62, {
        fill: tint(green, c.bg, 0.16),
        stroke: green,
        strokeWidth: 1.8,
        radius: 8,
    })
    fig.text(col3.x + 12, 174, 'INSERTED MIDDLE ONLY', { size: 12, weight: 700, color: green })
    fig.text(col3.x + 12, 197, 'graph.allows(req.scope)', {
        size: 13,
        weight: 700,
        color: green,
        mono: true,
    })

    fig.rect(col3.x, 234, col3.w, 70, {
        fill: tint(purple, c.bg, 0.06),
        stroke: c.border,
        strokeWidth: 1.2,
        radius: 8,
    })
    fig.text(col3.x + 12, 254, 'SUFFIX (preserved)', { size: 12, weight: 600, color: purple })
    fig.text(col3.x + 12, 280, '    return is_allowed', {
        size: 13,
        color: c.textSecondary,
        mono: true,
    })

    // --- NON-CROSSING CONNECTORS ---
    // Col 1 Prefix -> Col 2 <PRE> (straight horizontal)
    fig.arrow(col1.x + col1.w, 88, col2.x - 2, 88, { color: blue, width: 1.8, head: 6 })

    // Col 1 Suffix -> Col 2 <SUF> (clean upward curve, nothing else in gap!)
    fig.path(
        `M${col1.x + col1.w} 268 C${col1.x + col1.w + 26} 268, ${col2.x - 28} 176, ${col2.x - 6} 176`,
        { color: purple, width: 1.8 },
    )
    fig.arrow(col2.x - 10, 176, col2.x - 2, 176, { color: purple, width: 1.8, head: 6 })

    // Col 2 <MID> output -> Col 3 Inserted Middle (clean upward curve, nothing else in gap!)
    fig.path(
        `M${col2.x + col2.w} 274 C${col2.x + col2.w + 24} 274, ${col3.x - 26} 185, ${col3.x - 6} 185`,
        { color: green, width: 2 },
    )
    fig.arrow(col3.x - 10, 185, col3.x - 2, 185, { color: green, width: 2, head: 6 })

    // Subtle footer cue (single short line, zero box)
    fig.text(440, 354, 'Sentinels emitted by adapter; user code encoded strictly as text tokens', {
        size: 13,
        color: c.textMuted,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
