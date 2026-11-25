import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 430
export const alt =
    'Radix tree prefix matching and chunked-prefill scheduling: two requests share cached token prefix A B C D at KV slots 12 to 15. A six-token step budget admits one R0 decode token and five R1 prompt tokens, deferring four remaining prompt tokens to the next step.'

const SHARED = [
    { tok: 'A', slot: 'KV12' },
    { tok: 'B', slot: 'KV13' },
    { tok: 'C', slot: 'KV14' },
    { tok: 'D', slot: 'KV15' },
] as const

const ADMITTED = [
    { tok: 'D0', req: 'R0 dec', isDecode: true },
    { tok: 'P1', req: 'R1 pre', isDecode: false },
    { tok: 'P2', req: 'R1 pre', isDecode: false },
    { tok: 'P3', req: 'R1 pre', isDecode: false },
    { tok: 'P4', req: 'R1 pre', isDecode: false },
    { tok: 'P5', req: 'R1 pre', isDecode: false },
] as const

const DEFERRED = ['P6', 'P7', 'P8', 'P9'] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const cyan = fig.tone('cyan')
    const muted = c.textSecondary

    // --- Left Zone: Radix Prefix Tree ---
    fig.text(24, 24, 'Radix Prefix Tree', { size: 16, weight: 700, color: purple })
    fig.text(24, 46, 'Shared prefix node: 4 cached tokens (ref = 2)', {
        size: 13,
        color: muted,
    })

    // Shared prefix root block (A, B, C, D)
    const rootX = 24
    const rootY = 74
    const rootW = 356
    const rootH = 82
    fig.rect(rootX, rootY, rootW, rootH, {
        fill: tint(purple, c.bg, 0.1),
        stroke: purple,
        strokeWidth: 1.75,
        radius: 8,
    })
    SHARED.forEach((st, i) => {
        const cx = rootX + 12 + i * 84
        fig.rect(cx, rootY + 12, 76, 58, {
            fill: tint(purple, c.bg, 0.2),
            stroke: tint(purple, c.bg, 0.65),
            strokeWidth: 1.25,
            radius: 6,
        })
        fig.text(cx + 38, rootY + 31, st.tok, {
            size: 18,
            weight: 700,
            color: purple,
            align: 'center',
            width: 72,
        })
        fig.text(cx + 38, rootY + 55, st.slot, {
            size: 12,
            weight: 600,
            color: muted,
            align: 'center',
            mono: true,
            width: 72,
        })
    })

    // Branch arrows from shared prefix to R0 and R1
    const childY = 212
    fig.arrow(rootX + 94, rootY + rootH, rootX + 84, childY - 3, {
        color: blue,
        width: 2,
        head: 6,
    })
    fig.arrow(rootX + 262, rootY + rootH, rootX + 272, childY - 3, {
        color: warm,
        width: 2,
        head: 6,
    })
    fig.text(rootX + 178, 184, '0 recomputation', {
        size: 12,
        weight: 600,
        color: cyan,
        align: 'center',
        width: 140,
    })

    // Child R0
    fig.rect(rootX, childY, 168, 140, {
        fill: tint(blue, c.bg, 0.09),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(rootX + 12, childY + 22, 'Request R0', { size: 15, weight: 700, color: blue })
    fig.text(rootX + 12, childY + 48, 'Active decode', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(rootX + 12, childY + 74, 'Needs: 1 token', { size: 13, color: muted })
    fig.text(rootX + 12, childY + 98, 'Reuses: KV12..15', {
        size: 12,
        weight: 600,
        color: cyan,
        mono: true,
    })
    fig.text(rootX + 12, childY + 120, 'Writes: KV16', {
        size: 12,
        color: muted,
        mono: true,
    })

    // Child R1
    const r1X = rootX + 188
    fig.rect(r1X, childY, 168, 140, {
        fill: tint(warm, c.bg, 0.09),
        stroke: warm,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(r1X + 12, childY + 22, 'Request R1', { size: 15, weight: 700, color: warm })
    fig.text(r1X + 12, childY + 48, 'New prompt', {
        size: 13,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(r1X + 12, childY + 74, 'Needs: 9 tokens', { size: 13, color: muted })
    fig.text(r1X + 12, childY + 98, 'Reuses: KV12..15', {
        size: 12,
        weight: 600,
        color: cyan,
        mono: true,
    })
    fig.text(r1X + 12, childY + 120, 'Chunked prefill', { size: 12, color: muted })

    // Divider & bridge arrow
    fig.line(404, 20, 404, 376, { color: c.borderSubtle, width: 1 })
    fig.arrow(386, 184, 426, 184, { color: green, width: 2.25, head: 6 })

    // --- Right Zone: 6-Token Step Budget ---
    const rx = 434
    fig.text(rx, 24, 'Step Budget Admission (6 / 6)', {
        size: 16,
        weight: 700,
        color: green,
    })
    fig.text(rx, 46, 'Admits 1 decode token + 5 prefill tokens', { size: 13, color: muted })

    // 6-slot horizontal token budget strip (proportional)
    const slotW = 58
    const slotH = 74
    const slotGap = 7
    const stripY = 82
    ADMITTED.forEach((item, i) => {
        const sx = rx + i * (slotW + slotGap)
        const tone = item.isDecode ? blue : warm
        fig.rect(sx, stripY, slotW, slotH, {
            fill: tint(tone, c.bg, 0.18),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 6,
        })
        fig.text(sx + slotW / 2, stripY + 28, item.tok, {
            size: 16,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
            width: slotW,
        })
        fig.text(sx + slotW / 2, stripY + 54, item.req, {
            size: 11,
            weight: 600,
            color: c.textSecondary,
            align: 'center',
            width: slotW,
        })
    })

    // Curly brace under the 6 admitted tokens
    const stripEnd = rx + 6 * slotW + 5 * slotGap
    fig.brace(rx, stripY + slotH + 8, stripEnd, stripY + slotH + 8, 'Budget filled: 1 R0 + 5 R1 = 6 tokens', {
        side: 1,
        depth: 10,
        color: green,
        labelColor: green,
        labelSize: 13,
        weight: 600,
        labelGap: 16,
    })

    // Deferred queue section
    const defY = 238
    fig.text(rx, defY, 'Deferred to Next Step (4 prompt tokens)', {
        size: 14,
        weight: 700,
        color: cyan,
    })
    fig.rect(rx, defY + 20, stripEnd - rx, 86, {
        fill: tint(cyan, c.bg, 0.06),
        stroke: tint(cyan, c.bg, 0.45),
        strokeWidth: 1.25,
        radius: 8,
    })
    DEFERRED.forEach((tok, i) => {
        const dx = rx + 14 + i * 92
        fig.rect(dx, defY + 38, 78, 50, {
            fill: tint(c.textMuted, c.bg, 0.08),
            stroke: c.border,
            strokeWidth: 1.25,
            radius: 6,
        })
        fig.text(dx + 39, defY + 63, tok, {
            size: 15,
            weight: 600,
            color: c.textSecondary,
            align: 'center',
            mono: true,
            width: 74,
        })
    })

    // Bottom clean summary line
    fig.line(24, 386, 816, 386, { color: c.borderSubtle, width: 1 })
    fig.text(420, 408, '4 shared KV slots reused (A, B, C, D)  ·  6 tokens scheduled now  ·  4 deferred', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
        width: 760,
    })

    return fig.render()
}

export default create()
