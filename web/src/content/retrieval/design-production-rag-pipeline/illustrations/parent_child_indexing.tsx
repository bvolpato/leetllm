import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 438
export const alt =
    'A scaled 0 to 512 token document span compares four 128-token child chunks against their full 512-token parent section batch-api-sec4-v2. Query similarity matches Child 2 (tokens 128 to 256, 20,000 req/file ceiling, cos=0.89), while the dependent 100 MB payload cap sits in Child 3 (tokens 256 to 384). Following parent_id after rechecking revision and ACL expands the hit to the complete 512-token parent section packed as source E1.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const purple = fig.tone('purple')

    const trackX = 20
    const trackW = 720 // 512 tokens => 180px per 128-token child
    const childW = 180
    const gap = 8

    // ── Header & Token Scale Ruler (0..512 tokens) ───────────────────────────
    fig.text(trackX, 18, 'Child Index (4 × 128 tok)', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(trackX + trackW, 18, '0..512 tokens', {
        size: 14,
        mono: true,
        weight: 700,
        color: blue,
        align: 'right',
    })

    const rulerY = 58
    fig.line(trackX, rulerY, trackX + trackW, rulerY, { color: c.border, width: 1.75 })

    const ticks = [0, 128, 256, 384, 512] as const
    ticks.forEach((tok, i) => {
        const tx = trackX + i * childW
        fig.line(tx, rulerY - 6, tx, rulerY + 6, { color: c.border, width: 1.75 })
        fig.line(tx, rulerY + 8, tx, 198, {
            color: c.borderSubtle,
            width: 1,
            dash: '3 4',
        })
        fig.text(tx, rulerY - 16, String(tok), {
            size: 13,
            mono: true,
            color: c.textSecondary,
            align: i === 0 ? 'left' : i === ticks.length - 1 ? 'right' : 'center',
        })
    })

    // ── Query Match Arrow into Child 2 ───────────────────────────────────────
    const childY = 114
    const childH = 74
    const c2Left = trackX + childW + gap / 2
    const c2Right = trackX + 2 * childW - gap / 2
    const c2Center = trackX + 1.5 * childW

    fig.arrow(c2Center, rulerY + 8, c2Center, childY - 4, {
        color: cyan,
        width: 2.5,
        head: 8,
    })
    fig.text(c2Center + 12, rulerY + 26, 'Query HIT · cos = 0.89', {
        size: 14,
        weight: 700,
        color: cyan,
    })

    // ── 4 Child Chunks (128 tok each) ────────────────────────────────────────
    const children = [
        { tag: 'C1 · 128 tok', sub: 'Overview & auth', color: c.textMuted, active: false, split: false },
        { tag: 'C2 · MATCH', sub: '20,000 req/file', color: cyan, active: true, split: false },
        { tag: 'C3 · SPLIT', sub: '< 100 MB cap', color: warm, active: false, split: true },
        { tag: 'C4 · 128 tok', sub: 'Errors & retry', color: c.textMuted, active: false, split: false },
    ] as const

    children.forEach((ch, idx) => {
        const x = trackX + idx * childW + gap / 2
        const w = childW - gap
        fig.rect(x, childY, w, childH, {
            fill: ch.active
                ? withColorAlpha(cyan, 0.2)
                : ch.split
                  ? withColorAlpha(warm, 0.13)
                  : tint(c.border, c.bg, 0.22),
            stroke: ch.active ? cyan : ch.split ? warm : c.borderSubtle,
            strokeWidth: ch.active ? 2.2 : 1.5,
            radius: 8,
        })
        fig.text(x + w / 2, childY + 24, ch.tag, {
            size: 14,
            mono: true,
            weight: 700,
            color: ch.active ? cyan : ch.split ? warm : c.textMuted,
            align: 'center',
        })
        fig.text(x + w / 2, childY + 50, ch.sub, {
            size: 14,
            weight: ch.active || ch.split ? 700 : 500,
            color: ch.active ? c.textPrimary : ch.split ? warm : c.textSecondary,
            align: 'center',
        })
    })

    // ── Expansion Trapezoid from Child 2 -> Full 512-Token Parent ────────────
    const parentY = 266
    const parentH = 98

    fig.path(
        `M${c2Left} ${childY + childH + 4}L${c2Right} ${childY + childH + 4}L${trackX + trackW} ${parentY - 4}L${trackX} ${parentY - 4}Z`,
        { fill: green, fillOpacity: 0.1 },
    )
    fig.line(c2Left, childY + childH + 4, trackX, parentY - 4, {
        color: green,
        width: 1.75,
        dash: '5 4',
    })
    fig.line(c2Right, childY + childH + 4, trackX + trackW, parentY - 4, {
        color: green,
        width: 1.75,
        dash: '5 4',
    })
    fig.arrow(c2Center, childY + childH + 6, c2Center, parentY - 4, {
        color: green,
        width: 2.4,
        head: 8,
    })
    const expMidY = (childY + childH + parentY) / 2
    fig.rect(c2Center + 14, expMidY - 14, 266, 28, {
        fill: tint(green, c.bg, 0.12),
        stroke: withColorAlpha(green, 0.5),
        strokeWidth: 1.2,
        radius: 14,
    })
    fig.text(c2Center + 147, expMidY, 'Resolve parent_id + rev & ACL', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
    })

    // ── Full 512-Token Parent Section [E1] ───────────────────────────────────
    fig.rect(trackX, parentY, trackW, parentH, {
        fill: withColorAlpha(green, 0.1),
        stroke: green,
        strokeWidth: 2,
        radius: 9,
    })
    fig.text(trackX + 14, parentY + 20, 'Parent [E1] · batch-api-sec4-v2 · 512 tokens packed for LLM', {
        size: 15,
        weight: 700,
        color: green,
    })

    const innerY = parentY + 40
    const innerH = 46
    const parentParts = [
        { text: 'Intro context', fill: tint(c.border, c.bg, 0.35), stroke: 'none', color: c.textSecondary, bold: false },
        { text: '20,000 req/file', fill: withColorAlpha(cyan, 0.2), stroke: cyan, color: cyan, bold: true },
        { text: '+ < 100 MB cap', fill: withColorAlpha(warm, 0.2), stroke: warm, color: warm, bold: true },
        { text: 'Errors & retry', fill: tint(c.border, c.bg, 0.35), stroke: 'none', color: c.textSecondary, bold: false },
    ] as const

    parentParts.forEach((p, idx) => {
        const px = trackX + idx * childW + 6
        const pw = childW - 12
        fig.rect(px, innerY, pw, innerH, {
            fill: p.fill,
            stroke: p.stroke,
            strokeWidth: p.stroke === 'none' ? 0 : 1.4,
            radius: 6,
        })
        fig.text(px + pw / 2, innerY + innerH / 2, p.text, {
            size: 14,
            weight: p.bold ? 700 : 500,
            color: p.color,
            align: 'center',
        })
    })

    // ── Compact Provenance Pills (tightened, frameless bottom row) ───────────
    const pillY = 384
    const pillH = 32
    const pills = [
        { x: 20, w: 118, text: 'Source [E1]', color: green, fill: true },
        { x: 148, w: 174, text: 'rev: 2026-05-01', color: blue, fill: false },
        { x: 332, w: 208, text: 'Batch API v2 · Sec 4.1', color: c.textSecondary, fill: false },
        { x: 550, w: 190, text: 'ACL: ml-platform', color: purple, fill: false },
    ] as const

    for (const pill of pills) {
        fig.rect(pill.x, pillY, pill.w, pillH, {
            fill: pill.fill
                ? withColorAlpha(pill.color, 0.22)
                : withColorAlpha(pill.color, 0.08),
            stroke: withColorAlpha(pill.color, 0.65),
            strokeWidth: 1.3,
            radius: 16,
        })
        fig.text(pill.x + pill.w / 2, pillY + pillH / 2, pill.text, {
            size: 13,
            mono: pill.text.includes(':'),
            weight: 700,
            color: pill.color,
            align: 'center',
        })
    }

    return fig.render()
}

export default create('dark')
