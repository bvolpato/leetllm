import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 435
export const alt =
    'vLLM PagedAttention KV block pool and logical-to-physical block table mapping. Request R0 maps prefix block ABCD to physical block 12 and suffix EFGH to block 41. Request R1 shares prefix block 12 (reference count 2), while its diverge suffix EFXY maps to block 73 and partial block Z to block 90. Unreferenced physical blocks 88, 52, and 19 reside in the free allocation queue.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const muted = c.textSecondary

    // Column headers
    fig.text(24, 22, 'Logical Block Tables (5 blocks)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(444, 22, 'Physical GPU KV Pool (4 active)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const lX = 24
    const lW = 296
    const pX = 444
    const pW = 372

    // --- Left: Request R0 (2 logical blocks) ---
    fig.text(lX, 54, 'Request R0 (8 tokens)', { size: 13, weight: 700, color: purple })

    const drawLogical = (
        y: number,
        slot: string,
        tokens: string,
        target: string,
        tone: string,
        bold = false,
    ) => {
        fig.rect(lX, y, lW, 42, {
            fill: tint(tone, c.bg, bold ? 0.18 : 0.11),
            stroke: tone,
            strokeWidth: bold ? 2 : 1.25,
            radius: 6,
        })
        fig.text(lX + 12, y + 21, `${slot}: "${tokens}"`, {
            size: 14,
            weight: 700,
            color: c.textPrimary,
            mono: true,
        })
        fig.text(lX + lW - 12, y + 21, `-> #${target}`, {
            size: 14,
            weight: 700,
            color: tone,
            align: 'right',
            mono: true,
        })
    }

    const r0L0Y = 70
    const r0L1Y = 122
    drawLogical(r0L0Y, 'L0', 'ABCD', '12', green, true)
    drawLogical(r0L1Y, 'L1', 'EFGH', '41', purple)

    // --- Left: Request R1 (3 logical blocks) ---
    fig.text(lX, 192, 'Request R1 (9 tokens, shared prefix)', {
        size: 13,
        weight: 700,
        color: blue,
    })
    const r1L0Y = 208
    const r1L1Y = 260
    const r1L2Y = 312
    drawLogical(r1L0Y, 'L0', 'ABCD', '12', green, true)
    drawLogical(r1L1Y, 'L1', 'EFXY', '73', blue)
    drawLogical(r1L2Y, 'L2', 'Z...', '90', blue)

    // --- Right: Physical Active Blocks ---
    const drawPhysical = (
        y: number,
        id: string,
        tokens: string,
        refLabel: string,
        tone: string,
        shared = false,
    ) => {
        fig.rect(pX, y, pW, 46, {
            fill: tint(tone, c.bg, shared ? 0.18 : 0.1),
            stroke: tone,
            strokeWidth: shared ? 2 : 1.25,
            radius: 6,
        })
        fig.text(pX + 14, y + 23, `#${id}`, {
            size: 15,
            weight: 700,
            color: tone,
            mono: true,
        })
        fig.text(pX + 64, y + 23, `"${tokens}"`, {
            size: 14,
            weight: 600,
            color: c.textPrimary,
            mono: true,
        })
        fig.rect(pX + pW - 122, y + 9, 110, 28, {
            fill: tint(tone, c.bg, shared ? 0.28 : 0.14),
            stroke: tint(tone, c.bg, 0.55),
            strokeWidth: 1,
            radius: 14,
        })
        fig.text(pX + pW - 67, y + 23, refLabel, {
            size: 12,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
            width: 106,
        })
    }

    const p12Y = 68
    const p41Y = 128
    const p73Y = 188
    const p90Y = 248

    drawPhysical(p12Y, '12', 'ABCD', 'ref = 2', green, true)
    drawPhysical(p41Y, '41', 'EFGH', 'ref = 1 · R0', purple)
    drawPhysical(p73Y, '73', 'EFXY', 'ref = 1 · R1', blue)
    drawPhysical(p90Y, '90', 'Z _ _ _', 'ref = 1 · R1', blue)

    // Free allocation queue
    const freeY = 314
    fig.text(pX, freeY, 'Free Queue (ref = 0, reuse / LRU eviction)', {
        size: 13,
        weight: 600,
        color: muted,
    })
    const freeBlocks = ['#88', '#52', '#19', '...'] as const
    freeBlocks.forEach((blk, i) => {
        const fx = pX + i * 92
        fig.rect(fx, freeY + 18, 80, 36, {
            fill: tint(c.textMuted, c.bg, 0.07),
            stroke: c.border,
            strokeWidth: 1,
            radius: 6,
        })
        fig.text(fx + 40, freeY + 36, blk, {
            size: 14,
            weight: 600,
            color: muted,
            align: 'center',
            mono: true,
            width: 76,
        })
    })

    // --- Smooth Bezier Pointer Connectors ---
    const connect = (yFrom: number, yTo: number, color: string, widthPx = 2, dash?: string) => {
        const x1 = lX + lW
        const x2 = pX - 8
        const mx = (x1 + x2) / 2
        fig.path(`M${x1} ${yFrom}C${mx} ${yFrom},${mx} ${yTo},${x2} ${yTo}`, {
            color,
            width: widthPx,
            dash,
        })
        fig.arrow(x2 - 8, yTo, pX - 3, yTo, { color, width: widthPx, head: 6 })
    }

    // R0 L0 -> #12 (shared)
    connect(r0L0Y + 21, p12Y + 18, green, 2.25)
    // R1 L0 -> #12 (shared!)
    connect(r1L0Y + 21, p12Y + 30, green, 2.25)
    // R0 L1 -> #41
    connect(r0L1Y + 21, p41Y + 23, purple, 1.75)
    // R1 L1 -> #73
    connect(r1L1Y + 21, p73Y + 23, blue, 1.75)
    // R1 L2 -> #90
    connect(r1L2Y + 21, p90Y + 23, blue, 1.75, '5 4')

    // Bottom frameless invariant
    fig.line(24, 390, 816, 390, { color: c.borderSubtle, width: 1 })
    fig.text(420, 412, '5 logical blocks map to 4 physical slots  ·  Block #12 shared zero-copy (ref = 2)', {
        size: 13,
        weight: 600,
        color: green,
        align: 'center',
        width: 760,
    })

    return fig.render()
}

export default create()
