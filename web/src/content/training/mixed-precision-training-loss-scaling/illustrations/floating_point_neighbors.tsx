import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout, type Kit } from './_kit'

export const width = 672
export const height = 612
export const alt =
    'Two number lines share a delta-from-one scale. FP16 has neighbors 0.99951172 and 1.00097656; BF16 has neighbors 0.99609375 and 1.00781250. Shaded nearest-even rounding cells around one are asymmetric. A 0.0001 decrement returns to one in both formats, while decrements of 0.0003 in FP16 and 0.0025 in BF16 reach their lower neighbors. The FP32 update stores approximately 0.99989998.'

const formats = [
    {
        name: 'FP16',
        bits: 10,
        below: 1 - 2 ** -11,
        above: 1 + 2 ** -10,
        decrement: 0.0003,
        tone: 'blue' as const,
    },
    {
        name: 'BF16',
        bits: 7,
        below: 1 - 2 ** -8,
        above: 1 + 2 ** -7,
        decrement: 0.0025,
        tone: 'cyan' as const,
    },
]

export const layoutHeight = (L: Layout) => (L.print ? 298 : 612)

function line(k: Kit, L: Layout, y: number, format: (typeof formats)[number]) {
    const { c } = k
    const ax0 = L.print ? 30 : 34
    const ax1 = L.W - (L.print ? 30 : 34)
    const map = (delta: number) => ax0 + ((delta * 1000 + 4.5) / 13) * (ax1 - ax0)
    const ink = k.ink(format.tone)
    const warm = k.ink('warm')
    const rowH = L.print ? 118 : 248
    const axis = y + (L.print ? 62 : 112)

    k.t(6, y, L.W / 2, `${format.name}, ${format.bits} fraction bits`, {
        weight: 600,
        size: L.S,
        color: ink,
    })
    const zero = map(0)
    const lower = map(format.below - 1)
    const upper = map(format.above - 1)
    const cellL = map((format.below - 1) / 2)
    const cellR = map((format.above - 1) / 2)
    const small = map(-0.0001)
    const large = map(-format.decrement)
    k.rect(cellL, axis - 13, cellR - cellL, 26, {
        fill: k.tint(format.tone, 0.24),
        rx: 0,
    })
    k.line(ax0, axis, ax1, axis, { stroke: c.textMuted, strokeWidth: 1.5 })
    ;[-4, 0, 4, 8].forEach((tick) => {
        const x = map(tick / 1000)
        k.line(x, axis, x, axis + 5, { stroke: c.textMuted })
        k.t(x - 24, axis + 14, 48, tick > 0 ? `+${tick}` : String(tick), {
            size: L.S,
            align: 'center',
            color: c.textSecondary,
        })
    })
    ;[lower, zero, upper].forEach((x) =>
        k.line(x, axis - 13, x, axis + 13, { stroke: ink, strokeWidth: 2.5 }),
    )

    // Above the axis: the small update rounds back to one. Below it: the larger one reaches a neighbor.
    const topY = axis - (L.print ? 26 : 42)
    k.dot(small, topY, L.print ? 3.5 : 5, { fill: warm })
    k.arrow(small + 1, topY + 3, zero - 1, axis - 13, {
        stroke: warm,
        strokeWidth: 1.75,
        size: 5,
    })
    k.t(small + 12, topY - L.S * 0.72, L.W - small - 18, 'Subtract 0.0001: stores 1.00000000', {
        size: L.S,
        color: warm,
    })

    const botY = axis + (L.print ? 42 : 62)
    const neighborText = `Subtract ${format.decrement}: stores ${format.below.toFixed(8)}`
    k.dot(large, botY, L.print ? 3.5 : 5, { fill: warm })
    k.arrow(large, botY - 4, lower, axis + 14, {
        stroke: warm,
        strokeWidth: 1.75,
        size: 5,
    })
    k.t(large + 12, botY - L.S * 0.72, L.W - large - 18, neighborText, {
        size: L.S,
        color: warm,
    })
    if (!L.print)
        k.t(6, axis + 94, L.W - 12, `Upper neighbor ${format.above.toFixed(8)}`, {
            size: L.S,
            color: c.textSecondary,
        })
    else
        k.t(L.W / 2, y, L.W / 2 - 6, `Upper neighbor ${format.above.toFixed(8)}`, {
            size: L.S,
            align: 'right',
            color: c.textSecondary,
        })
    return rowH
}

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const y0 = 3
    const rowH = line(k, L, y0, formats[0])
    line(k, L, y0 + rowH, formats[1])
    const foot = y0 + rowH * 2 + (L.print ? 6 : 8)
    k.t(
        6,
        foot,
        L.W - 12,
        L.print
            ? 'Axis: w - 1, in 0.001 units. Shaded cells round to 1.0. FP32 stores 0.99989998.'
            : 'Axis: w - 1, in 0.001 units. Shaded cells round to 1.0.',
        { size: L.S, color: c.textSecondary },
    )
    if (!L.print)
        k.t(6, foot + L.S * 1.4, L.W - 12, 'FP32 stores 0.99989998.', {
            size: L.S,
            tone: 'green',
            weight: 600,
        })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
