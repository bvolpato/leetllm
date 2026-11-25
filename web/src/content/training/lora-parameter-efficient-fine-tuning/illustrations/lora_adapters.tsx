import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'
export { createFilm } from './_parts/lora-film'

export const width = 672
export const height = 470
export const alt =
    'One 4096-value input branches into a frozen 4096 by 4096 projection and a trainable low-rank path. A maps 4096 values to rank 16, then B maps rank 16 back to 4096, with heights drawn to scale. The scaled update joins the base output: h = W0x + (alpha/r)B(Ax). B starts at zero, so the initial correction is zero. A and B hold 131,072 trainable values, 0.78 percent of the 16,777,216 values in W0.'

export const layoutHeight = (L: Layout) => (L.print ? 312 : 470)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const green = k.ink('green')
    const H = L.print ? 72 : 96
    const neck = Math.max(2, (H * 16) / 4096)
    const x = (f: number) => f * L.W
    const topMid = (L.print ? 26 : 36) + H / 2 + (L.print ? 4 : 0)
    const botMid = topMid + H + (L.print ? 50 : 76)
    const mid = (topMid + botMid) / 2
    const flow = c.textSecondary

    // Input, with its width drawn at the same scale as everything else.
    const inX = x(0.07)
    k.rect(inX - 5, mid - H / 2, 10, H, {
        fill: k.tint('blue', 0.5),
        stroke: k.ink('blue'),
        rx: 0,
    })
    k.t(4, mid + H / 2 + 4, inX + 40, 'x, 4096', { size: L.S })
    const forkX = x(0.14)
    k.line(inX + 5, mid, forkX, mid, { stroke: flow, strokeWidth: 1.5 })
    k.line(forkX, topMid, forkX, botMid, { stroke: flow, strokeWidth: 1.5 })

    // Frozen base, as a square because its shape is 4096 by 4096.
    const baseX = x(0.36)
    k.arrow(forkX, topMid, baseX - H / 2 - 1, topMid, { stroke: flow })
    k.rect(baseX - H / 2, topMid - H / 2, H, H, {
        fill: c.textMuted,
        opacity: 0.35,
        rx: 0,
    })
    k.rect(baseX - H / 2, topMid - H / 2, H, H, {
        stroke: c.textSecondary,
        rx: 0,
    })
    k.mid(baseX - H / 2, topMid - H / 2, H, H, 'W0', {
        align: 'center',
        weight: 700,
    })
    k.t(baseX + H / 2 + 12, topMid - L.S * 1.4, L.W - baseX - H / 2 - 18, 'frozen, 4096 × 4096', {
        size: L.S,
    })
    k.t(baseX + H / 2 + 12, topMid + 1, L.W - baseX - H / 2 - 18, '16,777,216 values', {
        size: L.S,
        color: c.textSecondary,
    })

    // Low-rank path: two trapezoids, each drawn with true input and output widths.
    const a0 = x(0.2)
    const a1 = x(0.36)
    const b0 = x(0.46)
    const b1 = x(0.62)
    k.path(
        `M${a0} ${botMid - H / 2}L${a1} ${botMid - neck / 2}L${a1} ${botMid + neck / 2}L${a0} ${botMid + H / 2}Z`,
        { fill: k.tint('green', 0.42), stroke: green },
    )
    k.path(
        `M${b0} ${botMid - neck / 2}L${b1} ${botMid - H / 2}L${b1} ${botMid + H / 2}L${b0} ${botMid + neck / 2}Z`,
        { fill: k.tint('green', 0.42), stroke: green },
    )
    k.line(a1, botMid, b0, botMid, { stroke: green, strokeWidth: neck })
    k.arrow(forkX, botMid, a0 - 1, botMid, { stroke: flow })
    k.mid(a0 + 4, botMid - 14, 34, 28, 'A', { weight: 700 })
    k.mid(b1 - 36, botMid - 14, 30, 28, 'B', { weight: 700, align: 'right' })
    k.t(a1 - 8, botMid - L.S * 1.65, b0 - a1 + 16, 'r = 16', {
        size: L.S,
        align: 'center',
        tone: 'green',
        weight: 600,
    })
    k.t(a0 - 8, botMid + H / 2 + 4, a1 - a0 + 40, '16 × 4096', {
        size: L.S,
        color: c.textSecondary,
    })
    k.t(b0 - 22, botMid + H / 2 + 4, b1 - b0 + 30, '4096 × 16', {
        size: L.S,
        color: c.textSecondary,
        align: 'right',
    })

    // Join.
    const plusX = x(0.86)
    const r = L.print ? 12 : 16
    const scaleW = L.print ? 58 : 74
    k.mid(b1 + 4, botMid - 18, scaleW, 36, '× α/r', {
        size: L.S,
        align: 'center',
        weight: 600,
    })
    k.path(`M${b1 + 4 + scaleW} ${botMid}L${plusX} ${botMid}L${plusX} ${mid + r + 6}`, {
        stroke: green,
        strokeWidth: 1.75,
    })
    k.arrow(plusX, mid + r + 8, plusX, mid + r + 1, {
        stroke: green,
        strokeWidth: 1.75,
    })
    k.path(
        `M${baseX + H / 2 + 1} ${topMid + (L.print ? 22 : 30)}L${plusX} ${topMid + (L.print ? 22 : 30)}L${plusX} ${mid - r - 6}`,
        { stroke: flow, strokeWidth: 1.5 },
    )
    k.arrow(plusX, mid - r - 8, plusX, mid - r - 1, { stroke: flow })
    k.dot(plusX, mid, r, { fill: c.bg, stroke: c.textPrimary })
    k.mid(plusX - r, mid - r, r * 2, r * 2, '+', {
        align: 'center',
        weight: 700,
    })
    k.arrow(plusX + r, mid, L.W - 34, mid, { stroke: flow })
    k.mid(L.W - 32, mid - 16, 26, 32, 'h', { align: 'center', weight: 700 })

    const footY = botMid + H / 2 + L.S * 1.4 + (L.print ? 12 : 18)
    k.t(6, footY, L.W - 12, 'A and B train: 131,072 values, 0.78% of W0.', {
        size: L.S,
        weight: 600,
        tone: 'green',
    })
    k.t(6, footY + L.S * 1.4, L.W - 12, 'B starts at zero, so the correction starts at zero.', {
        size: L.S,
        color: c.textSecondary,
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
