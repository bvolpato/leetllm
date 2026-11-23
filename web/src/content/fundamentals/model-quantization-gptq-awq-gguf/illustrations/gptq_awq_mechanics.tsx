import type { ThemeMode } from 'vizmatic'
import { canvas, pk, tint } from '../../inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 424
export const alt =
    'In the weight plane, fixed calibration inputs make the SSE contours elongated along correlated weight changes. Rounding w₀ from 1.2 to 1 and compensating the still-free w₁ moves it from 0.61 to 1.51, then GPTQ rounds it to 2. Calibration outputs are [6.61, 5.41] before rounding, [6, 5] after independent rounding, and [7, 6] after compensation. Calibration SSE falls from 0.5402 to 0.5002; held-out identity SSE rises from 0.1921 to 1.9721.'

const CENTER = [1.2, 0.61] as const
const HIGH = (43 + Math.sqrt(1845)) / 2
const LOW = (43 - Math.sqrt(1845)) / 2
const ANGLE = Math.atan2(HIGH - 41, 9)
const HV = [Math.cos(ANGLE), Math.sin(ANGLE)] as const
const LV = [-Math.sin(ANGLE), Math.cos(ANGLE)] as const

const PL = 28
const PR = 240
const PT = 30
const PB = 262
const px = (w0: number) => PL + (w0 / 2) * (PR - PL)
const py = (w1: number) => PB - ((w1 + 0.5) / 2.6) * (PB - PT)

function contour(level: number): string {
    const a = Math.sqrt(level / HIGH)
    const b = Math.sqrt(level / LOW)
    const points = Array.from({ length: 121 }, (_, i) => {
        const t = (i * Math.PI * 2) / 120
        const x = CENTER[0] + a * Math.cos(t) * HV[0] + b * Math.sin(t) * LV[0]
        const y = CENTER[1] + a * Math.cos(t) * HV[1] + b * Math.sin(t) * LV[1]
        return `${i === 0 ? 'M' : 'L'}${px(x).toFixed(2)} ${py(y).toFixed(2)}`
    })
    return `${points.join(' ')} Z`
}

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)

    // The weight plane.
    s.text(8, 12, 'Weight plane, error contours', { color: k.faint })
    for (const v of [0, 1, 2]) {
        s.line(px(v), PT, px(v), PB, k.line, { width: 0.75 })
        s.text(px(v), PB + 14, v, { align: 'center', w: 30, color: k.mid })
        s.line(PL, py(v), PR, py(v), k.line, { width: 0.75 })
        s.text(PL - 6, py(v), v, { align: 'right', w: 20, color: k.mid })
    }
    s.text((PL + PR) / 2, PB + 34, 'w0', { mono: true, align: 'center', w: 40, color: k.faint })
    s.text(PL + 6, PT + 10, 'w1', { mono: true, color: k.faint })
    s.path(contour(0.04), k.state, { fill: tint(k.state, 0.08) })
    s.path(contour(0.02), k.state, { fill: tint(k.state, 0.12) })

    s.arrow(px(1.2), py(0.61), px(1) + 1, py(0.61), k.mid)
    s.arrow(px(1), py(0.61), px(1), py(1.51) + 5, k.pass, { width: 1.5 })
    s.arrow(px(1), py(1.51) - 4, px(1), py(2) + 5, k.pass, { width: 1.5 })
    s.dot(px(1.2), py(0.61), 4.5, k.prefill)
    s.rect(px(1) - 4.5, py(1) - 4.5, 9, 9, { fill: k.wait, r: 1 })
    s.dot(px(1), py(1.51), 4, k.onFill, { stroke: k.pass, width: 1.5 })
    s.dot(px(1), py(2), 5, k.pass)
    s.text(px(1.2) + 10, py(0.61) + 2, 'start [1.2, 0.61]', {
        color: k.prefill,
        weight: 600,
        w: 128,
    })
    s.text(px(1) - 10, py(1) - 9, 'rounded', { color: k.wait, weight: 600, align: 'right' })
    s.text(px(1) - 10, py(1) + 9, '[1, 1]', { color: k.wait, weight: 600, align: 'right' })
    s.text(px(1) + 10, py(1.51), 'w1 free: 1.51', { color: k.pass })
    s.text(px(1) + 10, py(2), 'GPTQ [1, 2]', { color: k.pass, weight: 700 })

    // Outputs on the calibration inputs.
    const OX = 306
    const ox = (v: number) => OX + 80 + ((v - 5) / 2) * 96
    s.text(OX, 12, 'Calibration outputs', { color: k.faint })
    const rows: Array<[string, number, number, string]> = [
        ['Original', 6.61, 5.41, k.prefill],
        ['Rounded', 6, 5, k.wait],
        ['GPTQ', 7, 6, k.pass],
    ]
    for (const v of [5, 6, 7]) {
        s.line(ox(v), 44, ox(v), 190, k.line, { width: 0.75 })
        s.text(ox(v), 206, v, { align: 'center', w: 30, color: k.mid })
    }
    rows.forEach(([name, a, b, color], r) => {
        const y = 74 + r * 48
        s.text(OX, y, name, { color, weight: 600 })
        s.line(ox(b), y, ox(a), y, color, { width: 1.5 })
        s.dot(ox(a), y, 5, color)
        s.rect(ox(b) - 4.5, y - 4.5, 9, 9, { fill: color, r: 1 })
        s.text(ox(a), y - 16, a.toFixed(2).replace('.00', ''), { align: 'center', w: 40, color })
        s.text(ox(b), y - 16, b.toFixed(2).replace('.00', ''), { align: 'center', w: 40, color })
    })
    s.dot(OX + 6, 232, 4.5, k.mid)
    s.text(OX + 16, 232, 'x1 = [5, 1]')
    s.rect(OX + 1.5, 247.5, 9, 9, { fill: k.mid, r: 1 })
    s.text(OX + 16, 252, 'x2 = [4, 1]')

    // One error scale for both sets, so the two changes can be compared directly.
    s.line(8, 316, 502, 316, k.line)
    s.text(8, 334, 'Squared error, on one scale', { color: k.faint })
    const BX = 146
    const E = 290 / 2.1
    const bar = (y: number, name: string, naive: number, gptq: number) => {
        s.text(8, y + 16, name, { weight: 600 })
        s.rect(BX, y, naive * E, 15, { fill: k.wait })
        s.text(BX + naive * E + 6, y + 7, naive.toFixed(4))
        s.rect(BX, y + 17, gptq * E, 15, { fill: k.pass })
        s.text(BX + gptq * E + 6, y + 24, gptq.toFixed(4), { weight: 700 })
    }
    bar(346, 'Calibration inputs', 0.5402, 0.5002)
    bar(386, 'Held-out identity', 0.1921, 1.9721)
    return s.render()
}
