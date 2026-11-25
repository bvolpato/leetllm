import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 425
export const alt =
    'Parser-pin search tree: nightly is pruned at depth 1 on the runtime floor, parser-v2 expands and drops its removed-API child, leaving parser-v2 plus a shim and parser-v1 plus a sanitizer patch as valid finalists.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const critical = fig.tone('critical')
    const muted = c.textSecondary

    // Depth column labels
    fig.text(94, 20, 'Depth 0 · Root', {
        size: 13,
        weight: 700,
        color: muted,
        align: 'center',
        width: 140,
    })
    fig.text(318, 20, 'Depth 1 · Pin Strategy', {
        size: 13,
        weight: 700,
        color: muted,
        align: 'center',
        width: 190,
    })
    fig.text(650, 20, 'Depth 2 · Candidate Plans', {
        size: 13,
        weight: 700,
        color: muted,
        align: 'center',
        width: 240,
    })

    const connect = (
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        color: string,
        dashed = false,
    ) => {
        const mx = (x1 + x2) / 2
        fig.path(`M${x1} ${y1}C${mx} ${y1},${mx} ${y2},${x2 - 6} ${y2}`, {
            color,
            width: dashed ? 1.5 : 2,
            dash: dashed ? '5 4' : undefined,
        })
        fig.arrow(x2 - 12, y2, x2 - 2, y2, { color, width: dashed ? 1.5 : 2, head: 5 })
    }

    // --- Depth 0: Root ---
    const rootX = 24
    const rootY = 186
    const rootW = 140
    const rootH = 74
    fig.rect(rootX, rootY, rootW, rootH, {
        fill: tint(cyan, c.bg, 0.14),
        stroke: cyan,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(rootX + rootW / 2, rootY + 26, 'Canary Flag', {
        size: 15,
        weight: 700,
        color: cyan,
        align: 'center',
        width: rootW - 12,
    })
    fig.text(rootX + rootW / 2, rootY + 52, 'parser-v2 active', {
        size: 12,
        color: muted,
        align: 'center',
        mono: true,
        width: rootW - 12,
    })

    // --- Depth 1 Nodes ---
    const d1X = 224
    const d1W = 188
    const d1H = 74

    // D1-A: parser-v2
    const d1AY = 76
    connect(rootX + rootW, rootY + rootH / 2, d1X, d1AY + d1H / 2, blue)
    fig.rect(d1X, d1AY, d1W, d1H, {
        fill: tint(blue, c.bg, 0.12),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(d1X + 14, d1AY + 22, 'Pin parser-v2', { size: 14, weight: 700, color: blue })
    fig.text(d1X + 14, d1AY + 46, 'Score: 0.74 · Expand', {
        size: 13,
        color: c.textPrimary,
        mono: true,
    })

    // D1-B: nightly (pruned)
    const d1BY = 186
    connect(rootX + rootW, rootY + rootH / 2, d1X, d1BY + d1H / 2, critical, true)
    fig.rect(d1X, d1BY, d1W, d1H, {
        fill: tint(critical, c.bg, 0.08),
        stroke: critical,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(d1X + 14, d1BY + 20, 'Pin nightly', { size: 14, weight: 700, color: critical })
    fig.text(d1X + 14, d1BY + 42, '0.12 · PRUNED', {
        size: 12,
        weight: 700,
        color: critical,
        mono: true,
    })
    fig.text(d1X + 14, d1BY + 60, 'Fails runtime floor', { size: 12, color: muted })

    // D1-C: parser-v1
    const d1CY = 298
    connect(rootX + rootW, rootY + rootH / 2, d1X, d1CY + d1H / 2, green)
    fig.rect(d1X, d1CY, d1W, d1H, {
        fill: tint(green, c.bg, 0.12),
        stroke: green,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(d1X + 14, d1CY + 22, 'Pin parser-v1', { size: 14, weight: 700, color: green })
    fig.text(d1X + 14, d1CY + 46, 'Score: 0.81 · Expand', {
        size: 13,
        color: c.textPrimary,
        mono: true,
    })

    // --- Depth 2 Nodes ---
    const d2X = 480
    const d2W = 336
    const d2H = 68

    // Child 1A: parser-v2 + API shim (valid finalist)
    const c1AY = 44
    connect(d1X + d1W, d1AY + d1H / 2, d2X, c1AY + d2H / 2, blue)
    fig.rect(d2X, c1AY, d2W, d2H, {
        fill: tint(blue, c.bg, 0.1),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(d2X + 14, c1AY + 22, 'parser-v2 + API shim', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(d2X + d2W - 14, c1AY + 22, '0.70', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'right',
        mono: true,
    })
    fig.text(d2X + 14, c1AY + 46, 'Valid finalist · passes checks', { size: 12, color: blue })

    // Child 1B: removed-API call (pruned)
    const c1BY = 128
    connect(d1X + d1W, d1AY + d1H / 2, d2X, c1BY + d2H / 2, critical, true)
    fig.rect(d2X, c1BY, d2W, d2H, {
        fill: tint(critical, c.bg, 0.08),
        stroke: critical,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(d2X + 14, c1BY + 22, 'Removed-API call', {
        size: 14,
        weight: 700,
        color: critical,
    })
    fig.text(d2X + d2W - 14, c1BY + 22, '0.18', {
        size: 14,
        weight: 700,
        color: critical,
        align: 'right',
        mono: true,
    })
    fig.text(d2X + 14, c1BY + 46, 'PRUNED · fails API invariant', { size: 12, color: critical })

    // Child 3A: parser-v1 + sanitizer patch (WINNER)
    const c3AY = 252
    connect(d1X + d1W, d1CY + d1H / 2, d2X, c3AY + 38, green)
    fig.rect(d2X, c3AY, d2W, 76, {
        fill: tint(green, c.bg, 0.2),
        stroke: green,
        strokeWidth: 2.25,
        radius: 8,
    })
    fig.text(d2X + 14, c3AY + 24, 'parser-v1 + sanitizer patch', {
        size: 15,
        weight: 700,
        color: green,
    })
    fig.rect(d2X + d2W - 116, c3AY + 11, 102, 24, {
        fill: tint(green, c.bg, 0.3),
        stroke: green,
        strokeWidth: 1,
        radius: 12,
    })
    fig.text(d2X + d2W - 65, c3AY + 23, '0.96 WINNER', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
        width: 96,
    })
    fig.text(d2X + 14, c3AY + 52, 'Highest-scoring valid plan · tests & security pass', {
        size: 12,
        weight: 600,
        color: c.textPrimary,
    })

    // Child 3B: defer fix (rejected)
    const c3BY = 342
    connect(d1X + d1W, d1CY + d1H / 2, d2X, c3BY + d2H / 2, critical, true)
    fig.rect(d2X, c3BY, d2W, d2H, {
        fill: tint(critical, c.bg, 0.08),
        stroke: critical,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(d2X + 14, c3BY + 22, 'Defer fix', { size: 14, weight: 700, color: critical })
    fig.text(d2X + d2W - 14, c3BY + 22, '0.39', {
        size: 14,
        weight: 700,
        color: critical,
        align: 'right',
        mono: true,
    })
    fig.text(d2X + 14, c3BY + 46, 'REJECTED · fails security floor', {
        size: 12,
        color: critical,
    })

    return fig.render()
}

export default create()
