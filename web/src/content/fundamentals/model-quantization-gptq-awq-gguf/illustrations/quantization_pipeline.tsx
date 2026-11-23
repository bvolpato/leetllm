import type { ThemeMode } from 'vizmatic'
import { canvas, pk, tint } from '../../inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 452
export const alt =
    'A shared signed INT4 grid maps five weights to codes [0, −4, 7, −1, 2]. The codes pack low nibble first into bytes C0, F7, and 02, with a zero high-nibble pad in the last byte. Decoding uses scale 2.4/7 and gives mean absolute error 0.091; the count and FP64 scale add a 12-byte header.'

const SCALE = 2.4 / 7
const PX = 490 / 5.4
const at = (v: number) => 8 + (v + 2.8) * PX
const COLS = [130, 206, 282, 358, 434]

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    const weights = [0.15, -1.22, 2.4, -0.45, 0.73]
    const codes = [0, -4, 7, -1, 2]
    const bits = ['0000', '1100', '0111', '1111', '0010']
    const rebuilt = ['0', '−1.371', '2.400', '−0.343', '0.686']

    s.text(8, 12, 'Narrow signed INT4: 15 used codes · S = 2.4 / 7 = 0.3429', { color: k.faint })
    const LINE = 80
    s.line(at(-8 * SCALE), LINE, at(7 * SCALE), LINE, k.mid)
    for (let code = -8; code <= 7; code++)
        s.line(
            at(code * SCALE),
            LINE - 6,
            at(code * SCALE),
            LINE + 6,
            code === -8 ? k.faint : k.mid,
        )
    s.text(8, 38, '−8 reserved', { color: k.faint, w: 88 })
    ;[-2, -1, 0, 1, 2].forEach((v) =>
        s.text(at(v), LINE + 22, String(v).replace('-', '−'), {
            color: k.mid,
            align: 'center',
            w: 40,
        }),
    )
    weights.forEach((w, i) => {
        const q = codes[i] * SCALE
        s.path(`M${at(w)} ${LINE - 20} L${at(q)} ${LINE - 3}`, k.wait, { width: 1.25 })
        s.dot(at(w), LINE - 22, 4.5, k.prefill)
        s.rect(at(q) - 4.5, LINE - 4.5, 9, 9, { fill: k.wait, r: 1 })
        s.text(at(w), LINE - 38, `w${i}`, {
            mono: true,
            align: 'center',
            w: 30,
            color: k.prefill,
            weight: 700,
        })
    })

    s.line(8, 116, 502, 116, k.line)
    const row = (
        y: number,
        name: string,
        values: Array<string | number>,
        color: string,
        weight = 500,
    ) => {
        s.text(8, y, name, { color: k.mid })
        values.forEach((value, i) =>
            s.text(COLS[i] + 30, y, String(value).replace('-', '−'), {
                mono: true,
                align: 'center',
                w: 74,
                color,
                weight,
            }),
        )
    }
    ;['w0', 'w1', 'w2', 'w3', 'w4'].forEach((name, i) =>
        s.text(COLS[i] + 30, 134, name, { mono: true, align: 'center', w: 74, color: k.faint }),
    )
    row(
        158,
        'Weight',
        weights.map((w) => w.toFixed(2)),
        k.prefill,
    )
    row(184, 'Code q', codes, k.ink, 700)
    row(210, 'Four bits', bits, k.ink)
    row(236, 'Rebuilt S · q', rebuilt, k.wait)

    s.line(8, 256, 502, 256, k.line)
    s.text(8, 276, 'Pairs of codes share a byte, low nibble first', { color: k.faint })
    const byte = (
        x: number,
        hex: string,
        hi: string,
        hiName: string,
        lo: string,
        loName: string,
        pad = false,
    ) => {
        s.text(x + 76, 300, `0x${hex}`, { mono: true, weight: 700, align: 'center', w: 80 })
        s.cell(
            x,
            314,
            75,
            32,
            hi,
            pad
                ? { mono: true, dash: '3 3', stroke: k.faint, color: k.faint }
                : { mono: true, fill: tint(k.state, 0.14), stroke: k.state },
        )
        s.cell(x + 77, 314, 75, 32, lo, {
            mono: true,
            fill: tint(k.prefill, 0.14),
            stroke: k.prefill,
        })
        s.text(x + 37, 360, hiName, { align: 'center', w: 75, color: k.mid, mono: !pad })
        s.text(x + 114, 360, loName, { align: 'center', w: 75, color: k.mid, mono: true })
    }
    byte(8, 'C0', '1100', 'q1', '0000', 'q0')
    byte(178, 'F7', '1111', 'q3', '0111', 'q2')
    byte(348, '02', '0000', 'pad', '0010', 'q4', true)

    s.line(8, 380, 502, 380, k.line)
    s.text(8, 402, 'Mean absolute error 0.091', { weight: 600 })
    s.text(8, 426, '3 payload bytes + 12-byte header = 15 bytes', { weight: 600 })
    return s.render()
}
