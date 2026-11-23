import type { ThemeMode, ToneName } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 636
export const alt =
    'An authored inventory uses 100 million parameters and 800 million chosen activation values. The FP32 and AMP bars share one GiB scale. Parameters, gradients and Adam moments stay at 0.37, 0.37 and 0.75 GiB. Activations shrink from 2.98 to 1.49 GiB, so the total drops from 4.47 to 2.98 GiB, a 33.3 percent reduction. A separate shared-scale payload comparison shows one 100-million-value gradient tensor at 0.37 GiB for FP32 and 0.19 GiB for BF16; these are logical tensor bytes.'

// All sizes are bytes. Print states them in decimal GB, like the reader's listing and the rest of the book's
// training part. The website article's listing and quiz work in GiB, so its figure does too.
const parts: {
    key: string
    name: string
    fp32: number
    amp: number
    tone: ToneName
}[] = [
    { key: 'W', name: 'Parameters', fp32: 4e8, amp: 4e8, tone: 'blue' },
    { key: 'G', name: 'Gradients', fp32: 4e8, amp: 4e8, tone: 'warm' },
    { key: 'M', name: 'Adam m + v', fp32: 8e8, amp: 8e8, tone: 'purple' },
    { key: 'A', name: 'Activations', fp32: 32e8, amp: 16e8, tone: 'cyan' },
]
const modes = [
    { id: 'fp32' as const, name: 'FP32', total: 48e8 },
    { id: 'amp' as const, name: 'FP32 model with AMP', total: 32e8 },
]
const payloads: { name: string; bytes: number; tone: ToneName }[] = [
    { name: 'FP32', bytes: 4e8, tone: 'purple' },
    { name: 'BF16', bytes: 2e8, tone: 'cyan' },
]

export const layoutHeight = (L: Layout) => (L.print ? 300 : 636)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const unit = L.print ? 'GB' : 'GiB'
    const size = (bytes: number) => bytes / (L.print ? 1e9 : 1024 ** 3)
    const label = (bytes: number) => size(bytes).toFixed(L.print ? 1 : 2)
    const left = 6
    const ax1 = L.W - 8
    const map = (bytes: number) => left + (size(bytes) / 4.8) * (ax1 - left)
    const barH = L.print ? 28 : 40
    const rowH = L.print ? 62 : 88
    modes.forEach((mode, r) => {
        const y = 3 + r * rowH
        k.t(left, y, 300, mode.name, { size: L.S, weight: 600 })
        k.t(ax1 - 180, y, 180, `${label(mode.total)} ${unit}`, {
            size: L.S,
            align: 'right',
            weight: 600,
            ...(r === 1 ? { tone: 'green' as const } : {}),
        })
        let start = 0
        const barY = y + L.S * 1.45
        parts.forEach((part) => {
            const value = part[mode.id]
            k.rect(map(start), barY, map(value) - map(0), barH, {
                fill: k.tint(part.tone, 0.4),
                stroke: k.ink(part.tone),
                rx: 0,
            })
            k.mid(map(start), barY, map(value) - map(0), barH, part.key, {
                size: L.S,
                align: 'center',
            })
            start += value
        })
    })
    const savedY = 3 + 2 * rowH + (L.print ? 2 : 2)
    const a0 = map(modes[1].total)
    const a1 = map(modes[0].total)
    k.arrow(a1, savedY, a0, savedY, { stroke: k.ink('green'), strokeWidth: 1.5 })
    k.t(
        left,
        savedY - L.S * 0.72,
        a0 - left - 10,
        `${label(modes[0].total - modes[1].total)} ${unit} saved, ${((1 - modes[1].total / modes[0].total) * 100).toFixed(1)}% less`,
        { size: L.S, align: 'right', tone: 'green' },
    )

    // Component table, then the gradient payload as its own bars.
    const ty = savedY + (L.print ? 18 : 30)
    const tw = L.print ? 300 : L.W - 12
    const nameW = tw * 0.5
    const colW = tw * 0.25
    const lineH = L.print ? 22 : 34
    k.t(left, ty, nameW, unit, { size: L.S, color: c.textSecondary })
    k.t(left + nameW, ty, colW, 'FP32', {
        size: L.S,
        align: 'right',
        color: c.textSecondary,
    })
    k.t(left + nameW + colW, ty, colW, 'AMP', {
        size: L.S,
        align: 'right',
        color: c.textSecondary,
    })
    parts.forEach((part, i) => {
        const y = ty + (i + 1) * lineH
        k.t(left, y, nameW, `${part.key}  ${part.name}`, {
            size: L.S,
            tone: part.tone,
        })
        k.t(left + nameW, y, colW, label(part.fp32), { size: L.S, align: 'right' })
        k.t(left + nameW + colW, y, colW, label(part.amp), {
            size: L.S,
            align: 'right',
        })
    })
    const px = L.print ? left + tw + 44 : left
    const py = L.print ? ty : ty + 5 * lineH + 18
    const pw = L.W - px - 8
    const labelW = L.print ? 50 : 70
    const valueW = L.print ? 74 : 96
    const barW = pw - labelW - valueW
    k.t(px, py, pw, 'One gradient tensor, 100M values', {
        size: L.S,
        weight: 600,
    })
    payloads.forEach((p, i) => {
        const y = py + (L.print ? 26 : 36) + i * (L.print ? 30 : 42)
        const h = L.print ? 20 : 26
        k.mid(px, y, labelW, h, p.name, { size: L.S, tone: p.tone })
        k.rect(px + labelW, y, (barW * size(p.bytes)) / 0.4, h, {
            fill: k.tint(p.tone, 0.45),
            stroke: k.ink(p.tone),
            rx: 0,
        })
        k.mid(px + labelW + barW, y, valueW, h, `${label(p.bytes)} ${unit}`, {
            size: L.S,
            align: 'right',
        })
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
