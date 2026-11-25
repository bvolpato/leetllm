import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 430
export const alt =
    'Multi-tenant retrieval pre-filtering and prefix-cache key scoping for principal alice in Tenant A. Left: candidate documents ranked by similarity score pass through an ACL filter gate before top-1 selection; B-secret (0.99, tenant B) and A-private (0.95, reader carol) are rejected, allowing A-public (0.80, reader alice) into the prompt. Right: the 8-field composite prefix-cache key (tenant, principal, acl_rev, base, adapter, tokenizer, kv_layout, tokens) guarantees misses whenever ACL revision, adapter revision, or tenant changes.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const onGreen = getReadableTextColor(green, c, c.bg)
    const soft = (hex: string, la = 0.09, da = 0.15) => tint(hex, c.bg, theme === 'light' ? la : da)
    const rim = (hex: string) => tint(hex, c.bg, theme === 'light' ? 0.45 : 0.55)

    // Left Half: Pre-filtered retrieval (x = 24..396)
    fig.text(24, 24, '1. PRE-FILTERED RETRIEVAL (alice @ A)', {
        size: 12,
        color: blue,
        weight: 700,
        width: 340,
    })

    // Score bar scale: 0.0..1.0 mapped to width = 180px starting at x = 114
    const barX = 114
    const barW = 166
    const docs = [
        {
            id: 'B-secret',
            score: 0.99,
            meta: 'tenant B · bob',
            status: 'Blocked',
            allowed: false,
            y: 62,
        },
        {
            id: 'A-private',
            score: 0.95,
            meta: 'tenant A · carol',
            status: 'Blocked',
            allowed: false,
            y: 136,
        },
        {
            id: 'A-public',
            score: 0.8,
            meta: 'tenant A · alice',
            status: 'Top-1',
            allowed: true,
            y: 210,
        },
    ]

    // Vertical ACL gate line separating candidate scores from outcome
    const gateX = 294
    fig.line(gateX, 46, gateX, 276, { color: blue, width: 1.8, dash: '5 3' })
    fig.text(gateX - 6, 294, 'ACL gate: tenant=A & alice', {
        size: 12,
        color: blue,
        align: 'right',
        weight: 700,
        mono: true,
        width: 220,
    })

    for (const d of docs) {
        const col = d.allowed ? green : red
        const fillW = Math.round(d.score * barW)
        fig.text(104, d.y + 12, d.id, {
            size: 13,
            color: d.allowed ? c.textPrimary : c.textSecondary,
            align: 'right',
            weight: 700,
            mono: true,
            width: 84,
        })
        fig.text(104, d.y + 32, d.meta, {
            size: 11,
            color: c.textSecondary,
            align: 'right',
            width: 96,
        })

        // Background track + score bar
        fig.rect(barX, d.y + 6, barW, 28, {
            fill: soft(c.textMuted, 0.08, 0.12),
            radius: 5,
        })
        fig.rect(barX, d.y + 6, fillW, 28, {
            fill: d.allowed ? green : soft(red, 0.24, 0.34),
            stroke: d.allowed ? 'none' : red,
            strokeWidth: d.allowed ? 0 : 1.2,
            radius: 5,
        })
        fig.text(barX + fillW - 8, d.y + 20, d.score.toFixed(2), {
            size: 12,
            color: d.allowed ? onGreen : red,
            align: 'right',
            weight: 700,
            mono: true,
            width: 44,
        })

        // Outcome chip past ACL gate
        if (d.allowed) {
            fig.arrow(barX + barW + 4, d.y + 20, 314, d.y + 20, {
                color: green,
                width: 1.8,
                head: 6,
            })
            fig.rect(316, d.y + 5, 76, 30, { fill: green, radius: 6 })
            fig.text(354, d.y + 20, d.status, {
                size: 13,
                color: onGreen,
                align: 'center',
                weight: 700,
                width: 68,
            })
        } else {
            // Stop bar at gate
            fig.line(gateX - 6, d.y + 14, gateX + 6, d.y + 26, { color: red, width: 2 })
            fig.line(gateX - 6, d.y + 26, gateX + 6, d.y + 14, { color: red, width: 2 })
            fig.text(312, d.y + 20, d.status, {
                size: 13,
                color: red,
                weight: 700,
                width: 78,
            })
        }
    }

    // Selected prompt output box at bottom-left
    fig.arrow(354, 245, 354, 330, { color: green, width: 1.6, head: 6 })
    fig.rect(24, 332, 368, 66, {
        fill: soft(green, 0.1, 0.16),
        stroke: green,
        strokeWidth: 1.4,
        radius: 7,
    })
    fig.text(40, 353, 'Prompt Context: ["A-public"]', {
        size: 14,
        color: green,
        weight: 700,
        mono: true,
        width: 336,
    })
    fig.text(40, 377, 'Filtered before top-K · zero foreign scores leak', {
        size: 12,
        color: c.textSecondary,
        width: 336,
    })

    // Center vertical divider
    fig.line(412, 24, 412, 404, { color: c.borderSubtle, width: 1 })

    // Right Half: Composite Prefix-Cache Key Scope (x = 432..796)
    fig.text(432, 24, '2. PREFIX-CACHE NAMESPACE KEY', {
        size: 12,
        color: purple,
        weight: 700,
        width: 340,
    })

    const keyChips = [
        { k: 'tenant', v: 'A' },
        { k: 'principal', v: 'alice' },
        { k: 'acl_rev', v: 'acl-v1' },
        { k: 'base', v: 'base-v3' },
        { k: 'adapter', v: 'docs-v2' },
        { k: 'tokenizer', v: 'tok-v3' },
        { k: 'kv_layout', v: 'v1' },
        { k: 'tokens', v: '[1, 5, 9]' },
    ]
    const chipW = 176
    const chipH = 34
    const colGap = 12
    const rowGap = 10
    keyChips.forEach((chip, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const cx = 432 + col * (chipW + colGap)
        const cy = 54 + row * (chipH + rowGap)
        fig.rect(cx, cy, chipW, chipH, {
            fill: soft(purple, 0.09, 0.15),
            stroke: rim(purple),
            strokeWidth: 1.2,
            radius: 6,
        })
        fig.text(cx + 10, cy + 17, `${chip.k}:`, {
            size: 12,
            color: c.textSecondary,
            mono: true,
            width: 78,
        })
        fig.text(cx + chipW - 10, cy + 17, chip.v, {
            size: 13,
            color: purple,
            align: 'right',
            weight: 700,
            mono: true,
            width: 92,
        })
    })

    // Lookup verification outcomes below key grid (zero clipping!)
    fig.text(432, 246, 'CACHE LOOKUP OUTCOMES', {
        size: 12,
        color: c.textSecondary,
        weight: 700,
        width: 240,
    })
    const probes = [
        { desc: 'Exact 8-field tuple', hit: true, y: 266 },
        { desc: 'acl_rev -> acl-v2', hit: false, y: 300 },
        { desc: 'adapter -> docs-v3', hit: false, y: 334 },
        { desc: 'tenant B (bob)', hit: false, y: 368 },
    ]
    for (const p of probes) {
        const col = p.hit ? green : red
        fig.rect(432, p.y, 364, 28, {
            fill: soft(col, 0.08, 0.13),
            stroke: rim(col),
            strokeWidth: 1.1,
            radius: 5,
        })
        fig.text(446, p.y + 14, p.desc, {
            size: 13,
            color: c.textPrimary,
            mono: !p.hit,
            weight: p.hit ? 600 : 500,
            width: 248,
        })
        fig.text(784, p.y + 14, p.hit ? 'KV HIT' : 'MISS', {
            size: 12,
            color: col,
            align: 'right',
            weight: 700,
            mono: true,
            width: 70,
        })
    }

    return fig.render()
}
