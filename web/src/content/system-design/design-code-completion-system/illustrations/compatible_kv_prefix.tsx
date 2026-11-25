import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 880
export const height = 400
export const alt =
    'Planar KV prefix compatibility diagram with zero crossing lines. Left: cached KV entry keyed by six exact fields (scope acme/repo-a/acl-7, model w3, tokenizer t3, adapter none, layout fp16-v1, prefix IDs [10,20,30]). Center: five incoming requests test exact match (HIT, skipping prefill) versus four single-field mismatches (other tenant contoso, changed token ID 31, adapter lora-2, revoked acl-8) that all route to Full Prefill. Right: both KV HIT and Full Prefill converge on the shared Decode step.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const purple = fig.tone('purple')

    // --- LEFT: Cached KV Key Tuple (6 exact fields from content.md) ---
    fig.text(20, 22, 'Cached KV Key Tuple', { size: 15, weight: 700, color: blue })

    const keyFields = [
        { k: 'scope', v: 'acme/repo-a/acl-7' },
        { k: 'model', v: 'w3' },
        { k: 'tokenizer', v: 't3' },
        { k: 'adapter', v: 'none' },
        { k: 'layout', v: 'fp16-v1' },
        { k: 'prefix IDs', v: '[10, 20, 30]' },
    ]

    fig.rect(20, 44, 248, 294, {
        fill: tint(blue, c.bg, 0.08),
        stroke: blue,
        strokeWidth: 1.4,
        radius: 9,
    })

    keyFields.forEach((f, i) => {
        const y = 66 + i * 44
        if (i > 0) fig.line(32, y - 22, 256, y - 22, { color: c.borderSubtle, width: 1 })
        fig.text(34, y, f.k, { size: 12, weight: 700, color: blue, mono: true })
        fig.text(254, y, f.v, {
            size: 12,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
            mono: true,
        })
    })

    fig.text(20, 360, 'Gateway-derived scope (cache_salt)', {
        size: 12,
        color: c.textSecondary,
    })
    fig.text(20, 378, 'Temperature changes keep KV valid', {
        size: 12,
        color: c.textMuted,
    })

    // --- CENTER: 5 Incoming Probes (1 HIT top, 4 MISS rows below -> ZERO CROSSINGS!) ---
    fig.text(308, 22, 'Incoming Request Probes', { size: 15, weight: 700, color: c.textPrimary })

    // Exact match (HIT)
    fig.rect(308, 48, 292, 54, {
        fill: tint(green, c.bg, 0.16),
        stroke: green,
        strokeWidth: 1.7,
        radius: 8,
    })
    fig.text(322, 67, 'Exact 6/6 match', { size: 14, weight: 700, color: green })
    fig.text(322, 87, 'All fields & token IDs equal', { size: 12, color: c.textSecondary })
    fig.text(588, 75, 'HIT', {
        size: 14,
        weight: 700,
        color: green,
        align: 'right',
        mono: true,
    })

    // 4 Single-field mismatches (MISS)
    const misses = [
        { label: 'Other tenant', diff: 'contoso/repo-a/acl-7' },
        { label: 'Changed ID', diff: '[10, 20, 31]' },
        { label: 'Other adapter', diff: 'lora-2' },
        { label: 'Revoked ACL', diff: 'acme/repo-a/acl-8' },
    ]

    misses.forEach((m, i) => {
        const y = 128 + i * 54
        fig.rect(308, y, 292, 44, {
            fill: tint(red, c.bg, 0.1),
            stroke: red,
            strokeWidth: 1.25,
            radius: 7,
        })
        fig.text(322, y + 14, m.label, { size: 12, weight: 700, color: red })
        fig.text(322, y + 31, m.diff, { size: 12, color: c.textPrimary, mono: true })
        fig.text(588, y + 22, 'MISS', {
            size: 13,
            weight: 700,
            color: red,
            align: 'right',
            mono: true,
        })
        // Connect right edge of each miss row cleanly into a vertical collector at x=622
        fig.line(600, y + 22, 622, y + 22, { color: red, width: 1.3 })
    })

    // Connector from Cached Key Tuple -> Probes (clean spine at x=286, no crossing)
    fig.line(268, 190, 286, 190, { color: c.border, width: 1.5 })
    fig.line(286, 75, 286, 312, { color: c.border, width: 1.5 })
    fig.arrow(286, 75, 306, 75, { color: green, width: 1.6, head: 6 })
    for (let i = 0; i < 4; i++) {
        fig.arrow(286, 150 + i * 54, 306, 150 + i * 54, { color: red, width: 1.3, head: 5 })
    }

    // --- RIGHT: Execution Paths converging on Shared Decode (ZERO CROSSINGS!) ---
    fig.text(650, 22, 'Execution Path', { size: 15, weight: 700, color: c.textPrimary })

    // Top: Reuse KV (from HIT row)
    fig.arrow(600, 75, 648, 75, { color: green, width: 1.8, head: 6 })
    fig.rect(650, 48, 210, 54, {
        fill: tint(green, c.bg, 0.15),
        stroke: green,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(755, 67, 'Reuse Cached KV', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(755, 86, 'Prefill delta only', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Middle-Bottom: Miss collector -> Full Prefill
    fig.line(622, 150, 622, 312, { color: red, width: 1.4 })
    fig.arrow(622, 231, 648, 231, { color: red, width: 1.7, head: 6 })
    fig.rect(650, 204, 210, 54, {
        fill: tint(red, c.bg, 0.12),
        stroke: red,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(755, 223, 'Full Prefill', {
        size: 14,
        weight: 700,
        color: red,
        align: 'center',
    })
    fig.text(755, 242, 'Compute all prefix KV', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Bottom: Shared Decode (both Reuse KV via clean right bypass and Full Prefill drop straight in!)
    // Actually: Reuse KV (y=48..102) -> Shared Decode (y=124..180) <- Full Prefill (y=204..258)!
    // WAIT! Put Shared Decode IN THE MIDDLE between Reuse KV (top) and Full Prefill (bottom) -> 100% planar, short straight vertical arrows!
    // Let's place Full Prefill at y=284..338 and Shared Decode at y=162..222! Wait: let's check miss collector midpoint:
    // Misses span y=128..334 (center 231). If Full Prefill is at y=250..304 (connected at y=277) and Shared Decode is at y=330..384?
    // No, if Reuse KV goes down the right edge (x=868) to Shared Decode at bottom (y=330), it doesn't cross anything either!
    // Wait: placing Shared Decode at y=126..182 (between Reuse KV y=48..102 and Full Prefill y=206..260) has ZERO long bypass wires!
    // Let's check: Miss collector runs x=622 from y=150..312 -> arrow at y=233 goes right into Full Prefill (y=206..260).
    // Then Full Prefill arrow goes UP from (755, 206) to Shared Decode (755, 182), and Reuse KV arrow goes DOWN from (755, 102) to Shared Decode (755, 126)!
    // YES!! Zero crossings, super compact, symmetrical convergence!
    fig.rect(650, 126, 210, 54, {
        fill: tint(purple, c.bg, 0.16),
        stroke: purple,
        strokeWidth: 1.7,
        radius: 8,
    })
    fig.text(755, 145, 'Shared Decode', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(755, 164, 'Stream tokens to editor', {
        size: 12,
        color: c.textSecondary,
        align: 'center',
    })

    // Clean vertical converging arrows into Shared Decode
    fig.arrow(755, 102, 755, 124, { color: green, width: 1.7, head: 6 })
    fig.arrow(755, 204, 755, 182, { color: red, width: 1.7, head: 6 })

    // Re-state freshness separation quietly below Full Prefill
    fig.text(755, 294, 'Response cache & editor', {
        size: 12,
        color: c.textMuted,
        align: 'center',
    })
    fig.text(755, 312, 'freshness stay separate', {
        size: 12,
        color: c.textMuted,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
