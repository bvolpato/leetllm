import type { ThemeMode } from 'vizmatic'
import { canvas, pk, tint } from '../serving-figure-kit'

export const width = 510
export const height = 458
export const alt =
    'A logarithmic dense-BF16 H100 roofline rises from the 3.35 TB/s bandwidth ceiling and meets the 989.5 TFLOPS compute ceiling at 295.4 FLOPs per byte. At intensity 1, the bandwidth ceiling is 3.35 TFLOPS, 0.34% of dense peak. No measured throughput point is plotted. A weight tile reused across 64 activation rows illustrates why the weight-only intensity estimate increases with row count.'

const PL = 46
const PR = 392
const PT = 26
const PB = 322
const x = (intensity: number) => PL + (Math.log10(intensity) / 3) * (PR - PL)
const y = (tflops: number) => PB - (Math.log10(tflops) / 3) * (PB - PT)
const BANDWIDTH = 3.35
const PEAK = 989.5
const RIDGE = 295.4

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)

    for (const v of [1, 10, 100, 1000]) {
        s.line(PL, y(v), PR, y(v), k.line, { width: 0.75 })
        s.line(x(v), PT, x(v), PB, k.line, { width: 0.75 })
        s.text(PL - 6, y(v), v.toLocaleString('en-US'), { align: 'right', color: k.mid })
        s.text(x(v), PB + 14, v.toLocaleString('en-US'), {
            align: v === 1000 ? 'right' : 'center',
            color: k.mid,
        })
    }
    s.text(PL, PB + 36, 'FLOPs per byte read from memory. Both axes are log scales.', {
        color: k.faint,
        w: 440,
    })
    s.text(4, 10, 'TFLOPS', { color: k.faint })

    // The attainable region under the two ceilings.
    const roof = `M${x(1)} ${y(BANDWIDTH)} L${x(RIDGE)} ${y(PEAK)} L${x(1000)} ${y(PEAK)}`
    s.path(`${roof} L${x(1000)} ${PB} L${x(1)} ${PB} Z`, 'none', {
        fill: tint(k.state, 0.07),
        width: 0,
    })
    s.path(`M${x(1)} ${y(BANDWIDTH)} L${x(RIDGE)} ${y(PEAK)}`, k.decode, { width: 2.5 })
    s.path(`M${x(RIDGE)} ${y(PEAK)} L${x(1000)} ${y(PEAK)}`, k.prefill, { width: 2.5 })

    // The ridge.
    s.line(x(RIDGE), y(PEAK), x(RIDGE), PB, k.faint, { dash: '3 3' })
    s.dot(x(RIDGE), y(PEAK), 4.5, k.ink)
    s.text(x(RIDGE) - 8, 12, 'Ridge: 295.4 FLOPs/byte', { align: 'right', weight: 700 })

    // Ceilings, read out in the right margin.
    const M = PR + 10
    s.text(M, y(PEAK) + 4, 'Compute roof', { color: k.prefill, weight: 700 })
    s.text(M, y(PEAK) + 23, '989.5 TFLOPS', { color: k.prefill, w: 104 })
    s.text(M, y(PEAK) + 54, 'Long-prompt', { color: k.mid })
    s.text(M, y(PEAK) + 73, 'prefill tends', { color: k.mid })
    s.text(M, y(PEAK) + 92, 'to sit on it.', { color: k.mid })
    s.text(M, y(PEAK) + 124, 'Sparse spec:', { color: k.mid })
    s.text(M, y(PEAK) + 143, '1,979 TFLOPS.', { color: k.mid, w: 104 })
    s.text(M, y(PEAK) + 162, 'Dense is half.', { color: k.mid })
    s.text(x(30), y(BANDWIDTH * 30) - 44, 'Memory roof', {
        color: k.decode,
        weight: 700,
        align: 'right',
    })
    s.text(x(30), y(BANDWIDTH * 30) - 25, '3.35 TB/s × intensity', {
        color: k.decode,
        align: 'right',
    })

    // Where each phase tends to sit.
    s.dot(x(1), y(BANDWIDTH), 5, k.decode)
    s.text(x(1) + 12, y(BANDWIDTH) - 2, 'Intensity 1: 3.35 TFLOPS,', { weight: 700 })
    s.text(x(1) + 12, y(BANDWIDTH) + 17, '0.34% of peak', { weight: 700 })
    s.arrow(PL + 12, 308, PL + 44, 308, k.decode, { width: 1.5 })
    s.text(PL + 50, 308, 'Batching decode moves right', { color: k.decode, weight: 600 })

    // Why batching moves right: weight reuse only.
    s.line(8, 374, 502, 374, k.line)
    s.text(8, 392, 'One weight tile, reused by more rows (weight reuse only)', { color: k.faint })
    s.cell(8, 408, 30, 30, 'W', { mono: true, fill: tint(k.state, 0.14), stroke: k.state })
    s.rect(46, 420, 76, 6, { fill: k.decode })
    s.text(130, 423, 'B = 1: 1 row')
    s.cell(262, 408, 30, 30, 'W', { mono: true, fill: tint(k.state, 0.14), stroke: k.state })
    for (let r = 0; r < 8; r++) s.rect(300, 408 + r * 4, 76, 2.5, { fill: k.decode, r: 0 })
    s.text(384, 423, 'B = 64: 64 rows')
    return s.render()
}
