import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 516
export const alt =
    'Top: dynamic community selection scores Level-0 roots against a 0.5 relevance threshold. Serving scores 0.9 and opens its children Cache (0.8) and Queue (0.7), both passing. Eval scores 0.1 and prunes its branch, leaving Judges and Metrics unrated. Bottom: in a counterfactual where Serving scores 0.2 (below 0.5), its branch is pruned and Cache (0.8) stays hidden and unrated.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const purple = fig.tone('purple')

    // ── Header ───────────────────────────────────────────────────────────────
    fig.text(20, 20, 'Dynamic Community Selection', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(width - 20, 20, 'Admit root when relevance ≥ 0.5', {
        size: 14,
        mono: true,
        weight: 700,
        color: green,
        align: 'right',
    })

    // ── Level 0 Root Nodes ───────────────────────────────────────────────────
    const rY = 54
    const rW = 286
    const rH = 68

    // Root 1: Serving (0.9 · open)
    const r1X = 36
    const r1Cx = r1X + rW / 2
    fig.rect(r1X, rY, rW, rH, {
        fill: withColorAlpha(green, 0.13),
        stroke: green,
        strokeWidth: 2,
        radius: 9,
    })
    fig.text(r1Cx, rY + 23, 'Serving · Level 0', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(r1Cx, rY + 48, 'score 0.9 ≥ 0.5  ·  open children', {
        size: 13,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })

    // Root 2: Eval (0.1 · prune)
    const r2X = 398
    const r2Cx = r2X + rW / 2
    fig.rect(r2X, rY, rW, rH, {
        fill: withColorAlpha(red, 0.1),
        stroke: red,
        strokeWidth: 2,
        radius: 9,
    })
    fig.text(r2Cx, rY + 23, 'Eval · Level 0', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(r2Cx, rY + 48, 'score 0.1 < 0.5  ·  prune branch', {
        size: 13,
        mono: true,
        weight: 700,
        color: red,
        align: 'center',
    })

    // ── Level 1 Child Nodes ──────────────────────────────────────────────────
    const cY = 224
    const cW = 136
    const cH = 70

    const children = [
        { x: 28, title: 'Cache', sub: '0.8 · pass', active: true },
        { x: 194, title: 'Queue', sub: '0.7 · pass', active: true },
        { x: 390, title: 'Judges', sub: 'unrated', active: false },
        { x: 556, title: 'Metrics', sub: 'unrated', active: false },
    ] as const

    for (const ch of children) {
        const cx = ch.x + cW / 2
        fig.rect(ch.x, cY, cW, cH, {
            fill: ch.active ? withColorAlpha(green, 0.13) : tint(c.border, c.bg, 0.2),
            stroke: ch.active ? green : c.borderSubtle,
            strokeWidth: ch.active ? 1.8 : 1.3,
            radius: 8,
        })
        fig.text(cx, cY + 24, ch.title, {
            size: 15,
            weight: 700,
            color: ch.active ? c.textPrimary : c.textMuted,
            align: 'center',
        })
        fig.text(cx, cY + 49, ch.sub, {
            size: 13,
            mono: ch.active,
            weight: ch.active ? 700 : 500,
            color: ch.active ? green : c.textMuted,
            align: 'center',
        })
    }

    // Open branch edges (Serving -> Cache, Serving -> Queue)
    fig.arrow(r1Cx, rY + rH + 2, 28 + cW / 2, cY - 4, { color: green, width: 2.2, head: 8 })
    fig.arrow(r1Cx, rY + rH + 2, 194 + cW / 2, cY - 4, { color: green, width: 2.2, head: 8 })

    // Pruned branch edges (Eval -> Judges, Eval -> Metrics) with bold red prune cut
    const cutY = 172
    fig.line(r2Cx, rY + rH + 2, 390 + cW / 2, cY - 4, {
        color: c.textMuted,
        width: 1.6,
        dash: '5 5',
        opacity: 0.65,
    })
    fig.line(r2Cx, rY + rH + 2, 556 + cW / 2, cY - 4, {
        color: c.textMuted,
        width: 1.6,
        dash: '5 5',
        opacity: 0.65,
    })
    fig.line(440, cutY, 642, cutY, { color: red, width: 3.5 })
    fig.text(r2Cx, cutY - 14, 'pruned', {
        size: 12,
        weight: 700,
        color: red,
        align: 'center',
    })

    // ── Bottom: Counterfactual False-Negative Strip ──────────────────────────
    fig.line(20, 326, width - 20, 326, { color: c.border, width: 1 })
    fig.text(20, 352, 'Counterfactual · Root False Negative', {
        size: 15,
        weight: 700,
        color: purple,
    })
    fig.text(width - 20, 352, 'Children are never evaluated when parent fails cutoff', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
    })

    const cfY = 384
    const cfH = 82
    const cfW = 244

    // Counterfactual Root: Serving (0.2 < 0.5)
    fig.rect(36, cfY, cfW, cfH, {
        fill: withColorAlpha(purple, 0.1),
        stroke: purple,
        strokeWidth: 1.8,
        radius: 9,
    })
    fig.text(36 + cfW / 2, cfY + 28, 'Serving · Level 0', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.text(36 + cfW / 2, cfY + 55, '0.2 < 0.5  ·  pruned', {
        size: 14,
        mono: true,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Cut connector between Serving and Cache
    const midY = cfY + cfH / 2
    fig.line(36 + cfW + 6, midY, 440 - 6, midY, {
        color: c.textMuted,
        width: 1.8,
        dash: '5 5',
    })
    fig.line(360, midY - 20, 360, midY + 20, { color: red, width: 3.5 })
    fig.text(360, midY - 32, 'blocked', {
        size: 12,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Counterfactual Child: Cache (0.8 hidden!)
    fig.rect(440, cfY, cfW, cfH, {
        fill: tint(c.border, c.bg, 0.22),
        stroke: c.border,
        strokeWidth: 1.5,
        radius: 9,
    })
    fig.text(440 + cfW / 2, cfY + 28, 'Cache · Level 1', {
        size: 15,
        weight: 700,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(440 + cfW / 2, cfY + 55, '0.8 if scored (hidden)', {
        size: 14,
        mono: true,
        weight: 700,
        color: purple,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
