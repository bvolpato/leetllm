import type { ThemeMode, ToneName } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 640
export const alt =
    'Three positive-range rows share a logarithmic magnitude axis. FP32 has 1 sign, 8 exponent and 23 fraction bits; FP16 has 1, 5 and 10; BF16 has 1, 8 and 7. Bit ribbons use the same width per bit. Solid intervals show normal ranges and dashed intervals extend to encoded subnormal minima. Shared markers locate the 1.2e-8 and 100000 inputs. The CPU cast table records FP16 zero and infinity, versus finite BF16 results near 1.20e-8 and 99840. Encoded subnormals can be flushed by a device path.'

const formats: {
    name: string
    bits: [number, number, number]
    normal: number
    subnormal: number
    maximum: number
    tone: ToneName
}[] = [
    {
        name: 'FP32',
        bits: [1, 8, 23],
        normal: 2 ** -126,
        subnormal: 2 ** -149,
        maximum: (2 - 2 ** -23) * 2 ** 127,
        tone: 'purple',
    },
    {
        name: 'FP16',
        bits: [1, 5, 10],
        normal: 2 ** -14,
        subnormal: 2 ** -24,
        maximum: 65504,
        tone: 'blue',
    },
    {
        name: 'BF16',
        bits: [1, 8, 7],
        normal: 2 ** -126,
        subnormal: 2 ** -133,
        maximum: (2 - 2 ** -7) * 2 ** 127,
        tone: 'cyan',
    },
]
const inputs = [
    { value: 1.2e-8, text: '1.2e-8' },
    { value: 1e5, text: '1e5' },
]
const casts = [
    ['FP16', '0', 'Inf'],
    ['BF16', '1.20e-8', '99840'],
]

export const layoutHeight = (L: Layout) => (L.print ? 228 : 640)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const warm = k.ink('warm')
    const bit = L.print ? 5.4 : 11.4
    const nameW = L.print ? 46 : 74
    const ribbonX = nameW + 6
    const rowH = L.print ? 40 : 60
    const top = 5

    // Bit ribbons: the same width per bit in every row.
    formats.forEach((format, r) => {
        const y = top + r * rowH
        k.t(6, y + 2, nameW, format.name, {
            weight: 600,
            size: L.S,
            tone: format.tone,
        })
        let start = 0
        format.bits.forEach((count, field) => {
            k.rect(ribbonX + start * bit, y + 2, count * bit, L.print ? 15 : 22, {
                fill: k.tint(format.tone, [0.7, 0.42, 0.18][field]),
                stroke: k.ink(format.tone),
                rx: 0,
            })
            start += count
        })
        const [s, e, f] = format.bits
        k.t(
            ribbonX,
            y + (L.print ? 18 : 26),
            L.print ? 226 : L.W - ribbonX - 8,
            `${s} sign, ${e} exponent, ${f} fraction`,
            { size: L.S, color: c.textSecondary },
        )
    })

    // Ranges on one log axis, with shared markers for the two test inputs.
    const px = L.print ? 286 : 34
    const py = L.print ? top : top + 3 * rowH + 44
    const ax1 = L.W - 34
    const map = (value: number) => px + ((Math.log10(value) + 46) / 86) * (ax1 - px)
    const axisGap = L.print ? 40 : 44
    const axisY = py + (L.print ? 14 : 8) + 3 * axisGap
    formats.forEach((format, r) => {
        const y = py + (L.print ? 14 : 8) + r * axisGap + 8
        k.line(px, y, ax1, y, { opacity: 0.45 })
        k.rect(map(format.normal), y - 6, map(format.maximum) - map(format.normal), 12, {
            fill: k.tint(format.tone, 0.5),
            stroke: k.ink(format.tone),
            rx: 0,
        })
        k.line(map(format.subnormal), y, map(format.normal), y, {
            stroke: k.ink(format.tone),
            strokeWidth: 1.75,
            dash: '3 3',
        })
    })
    inputs.forEach((input) => {
        const x = map(input.value)
        k.line(x, py + (L.print ? 10 : 4), x, axisY, {
            stroke: warm,
            strokeWidth: 1.5,
        })
        k.dot(x, axisY, L.print ? 3.5 : 4.5, { fill: warm })
    })
    k.t(map(1.2e-8) - 62, py - (L.print ? 5 : 16), 60, inputs[0].text, {
        size: L.S,
        align: 'right',
        color: warm,
    })
    k.t(map(1e5) + 3, py - (L.print ? 5 : 16), 60, inputs[1].text, {
        size: L.S,
        color: warm,
    })
    k.line(px, axisY, ax1, axisY, { stroke: c.textMuted })
    ;[-40, -20, 0, 20, 40].forEach((power) => {
        const x = map(10 ** power)
        k.line(x, axisY, x, axisY + 5, { stroke: c.textMuted })
        k.tex(x - (L.print ? 15 : 18), axisY + 7, `10^{${power}}`, {
            size: L.print ? 13 : 17,
            color: c.textSecondary,
        })
    })

    // The two CPU casts as a small table.
    const tx = L.print ? 6 : 6
    const ty = L.print ? top + 3 * rowH + 8 : axisY + 58
    const colA = L.print ? 74 : 230
    const colW = L.print ? 96 : 160
    const lineH = L.print ? 22 : 34
    k.t(tx, ty, colA, 'CPU cast', { size: L.S, color: c.textSecondary })
    k.t(tx + colA, ty, colW, '1.2e-8', {
        size: L.S,
        align: 'center',
        color: warm,
    })
    k.t(tx + colA + colW, ty, colW, '100000', {
        size: L.S,
        align: 'center',
        color: warm,
    })
    casts.forEach((row, r) => {
        const y = ty + (r + 1) * lineH
        k.line(tx, y - 2, tx + colA + colW * 2, y - 2, { opacity: 0.5 })
        k.t(tx, y, colA, row[0], {
            size: L.S,
            weight: 600,
            tone: r === 0 ? 'blue' : 'cyan',
        })
        k.t(tx + colA, y, colW, row[1], { size: L.S, align: 'center' })
        k.t(tx + colA + colW, y, colW, row[2], { size: L.S, align: 'center' })
    })
    const noteY = ty + 3 * lineH + (L.print ? 2 : 6)
    k.t(
        tx,
        noteY,
        L.W - 12,
        'Solid: normal range. Dashed: subnormal, which a device path may flush.',
        { size: L.S, color: c.textSecondary },
    )
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
