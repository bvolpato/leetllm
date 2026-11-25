import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 390
export const alt =
    'Gateway and difficulty router send requests to a 1x single path, a Best-of-3 lane, or a capped tree, then rejoin at one verifier before releasing an answer.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const critical = fig.tone('critical')
    const muted = c.textSecondary

    const connect = (x1: number, y1: number, x2: number, y2: number, color: string) => {
        const mx = (x1 + x2) / 2
        fig.path(`M${x1} ${y1}C${mx} ${y1},${mx} ${y2},${x2 - 6} ${y2}`, {
            color,
            width: 2,
        })
        fig.arrow(x2 - 12, y2, x2 - 2, y2, { color, width: 2, head: 5 })
    }

    // Column headers
    fig.text(98, 22, '1. Gateway', {
        size: 14,
        weight: 700,
        color: cyan,
        align: 'center',
        width: 150,
    })
    fig.text(320, 22, '2. Difficulty Router', {
        size: 14,
        weight: 700,
        color: blue,
        align: 'center',
        width: 200,
    })
    fig.text(566, 22, '3. Shared Verifier', {
        size: 14,
        weight: 700,
        color: purple,
        align: 'center',
        width: 196,
    })
    fig.text(764, 22, '4. Release', {
        size: 14,
        weight: 700,
        color: green,
        align: 'center',
        width: 112,
    })

    // --- Col 1: Gateway & Budget ---
    const gX = 24
    const gW = 148
    fig.rect(gX, 114, gW, 152, {
        fill: tint(cyan, c.bg, 0.11),
        stroke: cyan,
        strokeWidth: 1.75,
        radius: 9,
    })
    fig.text(gX + gW / 2, 146, 'Gateway', {
        size: 15,
        weight: 700,
        color: cyan,
        align: 'center',
        width: gW - 12,
    })
    fig.text(gX + gW / 2, 174, 'Auth + quota', {
        size: 13,
        color: c.textPrimary,
        align: 'center',
        width: gW - 12,
    })
    fig.rect(gX + 12, 198, gW - 24, 52, {
        fill: tint(cyan, c.bg, 0.2),
        stroke: tint(cyan, c.bg, 0.55),
        strokeWidth: 1,
        radius: 6,
    })
    fig.text(gX + gW / 2, 215, 'Budget Reserve', {
        size: 12,
        weight: 700,
        color: cyan,
        align: 'center',
        width: gW - 28,
    })
    fig.text(gX + gW / 2, 236, 'Cap: 4k tokens', {
        size: 12,
        color: muted,
        align: 'center',
        mono: true,
        width: gW - 28,
    })

    // --- Col 2: 3 Adaptive Lanes ---
    const lX = 224
    const lW = 192
    const lH = 74
    const lanes = [
        { y: 54, title: '1x Single Path', sub: 'Easy · greedy decode', tone: green },
        { y: 154, title: '3x Best-of-3', sub: 'Medium · parallel samples', tone: blue },
        { y: 254, title: '8x Capped Tree', sub: 'Hard · pruned tree search', tone: warm },
    ] as const

    lanes.forEach((ln) => {
        const midY = ln.y + lH / 2
        connect(gX + gW, 190, lX, midY, ln.tone)
        fig.rect(lX, ln.y, lW, lH, {
            fill: tint(ln.tone, c.bg, 0.13),
            stroke: ln.tone,
            strokeWidth: 1.75,
            radius: 8,
        })
        fig.text(lX + 14, ln.y + 26, ln.title, { size: 14, weight: 700, color: ln.tone })
        fig.text(lX + 14, ln.y + 50, ln.sub, { size: 12, color: muted })
        connect(lX + lW, midY, 468, 190, ln.tone)
    })

    // --- Col 3: Shared Dual Verifier ---
    const vX = 468
    const vW = 196
    fig.rect(vX, 54, vW, 274, {
        fill: tint(purple, c.bg, 0.05),
        stroke: tint(purple, c.bg, 0.45),
        strokeWidth: 1.5,
        radius: 10,
    })

    // Shared Prefix KV chip at top
    fig.rect(vX + 14, 70, vW - 28, 42, {
        fill: tint(cyan, c.bg, 0.14),
        stroke: cyan,
        strokeWidth: 1.25,
        radius: 6,
    })
    fig.text(vX + vW / 2, 91, 'Radix Prefix KV', {
        size: 13,
        weight: 700,
        color: cyan,
        align: 'center',
        width: vW - 32,
    })

    // Gate 1: Exact Invariants
    fig.rect(vX + 14, 128, vW - 28, 76, {
        fill: tint(critical, c.bg, 0.11),
        stroke: critical,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(vX + vW / 2, 150, '1. Exact Invariants', {
        size: 13,
        weight: 700,
        color: critical,
        align: 'center',
        width: vW - 32,
    })
    fig.text(vX + vW / 2, 172, 'Tests + schema checks', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        width: vW - 32,
    })
    fig.text(vX + vW / 2, 191, '0 false-accepts', {
        size: 11,
        weight: 600,
        color: critical,
        align: 'center',
        width: vW - 32,
    })

    fig.arrow(vX + vW / 2, 204, vX + vW / 2, 232, { color: purple, width: 1.75, head: 5 })

    // Gate 2: Learned PRM / ORM
    fig.rect(vX + 14, 236, vW - 28, 76, {
        fill: tint(purple, c.bg, 0.14),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 7,
    })
    fig.text(vX + vW / 2, 258, '2. Learned PRM/ORM', {
        size: 13,
        weight: 700,
        color: purple,
        align: 'center',
        width: vW - 32,
    })
    fig.text(vX + vW / 2, 280, 'Rank valid survivors', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        width: vW - 32,
    })
    fig.text(vX + vW / 2, 299, 'Stepwise pruning', {
        size: 11,
        color: muted,
        align: 'center',
        width: vW - 32,
    })

    // --- Col 4: Release / Abstain ---
    const rX = 712
    const rW = 104
    connect(vX + vW, 175, rX, 134, green)
    connect(vX + vW, 215, rX, 248, critical)

    fig.rect(rX, 94, rW, 80, {
        fill: tint(green, c.bg, 0.18),
        stroke: green,
        strokeWidth: 1.75,
        radius: 8,
    })
    fig.text(rX + rW / 2, 124, 'Release', {
        size: 15,
        weight: 700,
        color: green,
        align: 'center',
        width: rW - 8,
    })
    fig.text(rX + rW / 2, 150, 'Verified', {
        size: 12,
        color: c.textPrimary,
        align: 'center',
        width: rW - 8,
    })

    fig.rect(rX, 208, rW, 80, {
        fill: tint(critical, c.bg, 0.12),
        stroke: critical,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(rX + rW / 2, 238, 'Abstain', {
        size: 15,
        weight: 700,
        color: critical,
        align: 'center',
        width: rW - 8,
    })
    fig.text(rX + rW / 2, 264, 'Fallback', {
        size: 12,
        color: muted,
        align: 'center',
        width: rW - 8,
    })

    // Bottom frameless takeaway line
    fig.line(24, 350, 816, 350, { color: c.borderSubtle, width: 1 })
    fig.text(420, 372, 'Route by difficulty first so easy queries stay 1x  ·  Every lane rejoins one shared verifier', {
        size: 13,
        weight: 600,
        color: muted,
        align: 'center',
        width: 760,
    })

    return fig.render()
}

export default create()
