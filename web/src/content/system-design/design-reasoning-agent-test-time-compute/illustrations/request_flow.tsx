import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 395
export const alt =
    'Canary request shares one prefix cache, expands two live branches, prunes a third branch early, and verifies survivors before releasing a hold recommendation.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const critical = fig.tone('critical')
    const muted = c.textSecondary

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

    // Column headers
    fig.text(104, 22, '1. Shared Prefix', {
        size: 14,
        weight: 700,
        color: cyan,
        align: 'center',
        width: 160,
    })
    fig.text(334, 22, '2. Branch Suffixes', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        width: 210,
    })
    fig.text(578, 22, '3. Verifier', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
        width: 180,
    })
    fig.text(764, 22, '4. Advisory', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
        width: 108,
    })

    // --- Col 1: Canary Request -> Shared Prefix KV ---
    const c1X = 24
    const c1W = 160
    fig.rect(c1X, 66, c1W, 74, {
        fill: tint(blue, c.bg, 0.12),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(c1X + c1W / 2, 92, 'Canary Request', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        width: c1W - 12,
    })
    fig.text(c1X + c1W / 2, 118, 'Rev 7 metrics', {
        size: 12,
        color: muted,
        align: 'center',
        width: c1W - 12,
    })

    fig.arrow(c1X + c1W / 2, 140, c1X + c1W / 2, 180, { color: cyan, width: 2, head: 5 })

    fig.rect(c1X, 184, c1W, 114, {
        fill: tint(cyan, c.bg, 0.15),
        stroke: cyan,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(c1X + c1W / 2, 210, 'Shared Prefix KV', {
        size: 14,
        weight: 700,
        color: cyan,
        align: 'center',
        width: c1W - 12,
    })
    fig.text(c1X + c1W / 2, 238, 'Prompt + tools', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        width: c1W - 12,
    })
    fig.text(c1X + c1W / 2, 266, 'Cached once in VRAM', {
        size: 12,
        color: cyan,
        align: 'center',
        mono: true,
        width: c1W - 12,
    })

    // --- Col 2: Three Candidate Suffixes ---
    const c2X = 230
    const c2W = 208
    const bH = 74

    // Branch A: Hold 10% (live)
    const bAY = 54
    connect(c1X + c1W, 241, c2X, bAY + bH / 2, green)
    fig.rect(c2X, bAY, c2W, bH, {
        fill: tint(green, c.bg, 0.14),
        stroke: green,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(c2X + 14, bAY + 24, 'Branch A · Hold 10%', { size: 14, weight: 700, color: green })
    fig.text(c2X + 14, bAY + 48, 'p95 = 240 ms  ·  live', {
        size: 12,
        color: c.textPrimary,
        mono: true,
    })

    // Branch B: Rollback (live)
    const bBY = 154
    connect(c1X + c1W, 241, c2X, bBY + bH / 2, blue)
    fig.rect(c2X, bBY, c2W, bH, {
        fill: tint(blue, c.bg, 0.12),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(c2X + 14, bBY + 24, 'Branch B · Rollback', { size: 14, weight: 700, color: blue })
    fig.text(c2X + 14, bBY + 48, 'Safe fallback  ·  live', { size: 12, color: muted })

    // Branch C: Promote 50% (PRUNED early, stops here)
    const bCY = 254
    connect(c1X + c1W, 241, c2X, bCY + bH / 2, critical, true)
    fig.rect(c2X, bCY, c2W, bH, {
        fill: tint(critical, c.bg, 0.08),
        stroke: critical,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(c2X + 14, bCY + 24, 'Branch C · Promote 50%', {
        size: 14,
        weight: 700,
        color: critical,
    })
    fig.text(c2X + 14, bCY + 48, 'PRUNED early · SLA breach', {
        size: 12,
        weight: 700,
        color: critical,
    })

    // --- Col 3: Two-Stage Verifier (Only A & B reach here) ---
    const c3X = 486
    const c3W = 184
    connect(c2X + c2W, bAY + bH / 2, c3X, 134, green)
    connect(c2X + c2W, bBY + bH / 2, c3X, 174, blue)

    fig.rect(c3X, 66, c3W, 242, {
        fill: tint(purple, c.bg, 0.05),
        stroke: tint(purple, c.bg, 0.45),
        strokeWidth: 1.5,
        radius: 10,
    })

    // Exact Checks
    fig.rect(c3X + 14, 84, c3W - 28, 86, {
        fill: tint(purple, c.bg, 0.13),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(c3X + c3W / 2, 106, '1. Exact Checks', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'center',
        width: c3W - 32,
    })
    fig.text(c3X + c3W / 2, 130, 'Rev 7 match: OK', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        width: c3W - 32,
    })
    fig.text(c3X + c3W / 2, 152, 'Age <= 30s: OK', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        width: c3W - 32,
    })

    fig.arrow(c3X + c3W / 2, 170, c3X + c3W / 2, 200, { color: green, width: 1.75, head: 5 })

    // Proxy Scoring
    fig.rect(c3X + 14, 204, c3W - 28, 86, {
        fill: tint(green, c.bg, 0.13),
        stroke: green,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(c3X + c3W / 2, 226, '2. Proxy Rank', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
        width: c3W - 32,
    })
    fig.text(c3X + c3W / 2, 250, 'A (Hold): 0.90', {
        size: 13,
        weight: 700,
        color: green,
        align: 'center',
        mono: true,
        width: c3W - 32,
    })
    fig.text(c3X + c3W / 2, 272, 'B (Rollback): 0.70', {
        size: 12,
        color: muted,
        align: 'center',
        mono: true,
        width: c3W - 32,
    })

    // --- Col 4: Final Release Advisory ---
    const c4X = 710
    const c4W = 106
    connect(c3X + c3W, 247, c4X, 190, green)

    fig.rect(c4X, 130, c4W, 120, {
        fill: tint(green, c.bg, 0.2),
        stroke: green,
        strokeWidth: 2,
        radius: 9,
    })
    fig.text(c4X + c4W / 2, 160, 'Canary', {
        size: 13,
        weight: 600,
        color: muted,
        align: 'center',
        width: c4W - 10,
    })
    fig.text(c4X + c4W / 2, 190, 'HOLD', {
        size: 19,
        weight: 800,
        color: green,
        align: 'center',
        width: c4W - 10,
    })
    fig.text(c4X + c4W / 2, 220, 'at 10%', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
        width: c4W - 10,
    })

    // Bottom frameless note
    fig.line(24, 352, 816, 352, { color: c.borderSubtle, width: 1 })
    fig.text(420, 374, 'Extra KV memory spent only on surviving suffixes A & B  ·  Branch C pruned before verification', {
        size: 13,
        weight: 600,
        color: muted,
        align: 'center',
        width: 780,
    })

    return fig.render()
}

export default create()
