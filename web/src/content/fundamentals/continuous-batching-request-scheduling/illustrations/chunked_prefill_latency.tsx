import type { ThemeMode } from 'vizmatic'
import { canvas, pk, tint } from '../../inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 372
export const alt =
    'Eight iteration columns show prefill chunks of 512, 512, 512, 512, 512, 512, 512, and 416 tokens. The same 96-position decode lane continues through every iteration. The first seven iterations total 608 positions each and the tail totals 512. Queue bars shrink after each slice, with seven rescheduling checkpoints; column widths do not represent time.'

const X = 8
const COL = 62
const BAR = 56
const BASE = 214
const H = 0.25

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    const chunks = [512, 512, 512, 512, 512, 512, 512, 416]
    const queued = [3488, 2976, 2464, 1952, 1440, 928, 416, 0]

    s.text(8, 12, 'Positions scheduled in each step', { color: k.faint })
    s.rect(312, 6, 12, 12, { fill: k.prefill })
    s.text(330, 12, 'prefill')
    s.rect(404, 6, 12, 12, { fill: k.decode })
    s.text(422, 12, 'decode')
    chunks.forEach((chunk, i) => {
        const x = X + i * COL
        const d = 96 * H
        const p = chunk * H
        s.text(x + BAR / 2, 34, `step ${i + 1}`, { align: 'center', w: COL, weight: 700 })
        s.rect(x, BASE - d, BAR, d - 1, { fill: k.decode })
        s.rect(x, BASE - d - p, BAR, p - 1, { fill: k.prefill })
        s.text(x + BAR / 2, BASE - d - p / 2, chunk, {
            align: 'center',
            w: BAR,
            color: k.onFill,
            weight: 600,
        })
        s.text(x + BAR / 2, BASE - d / 2 - 0.5, 96, {
            align: 'center',
            w: BAR,
            color: k.onFill,
            weight: 600,
        })
        s.text(x + BAR / 2, BASE - d - p - 11, chunk + 96, {
            align: 'center',
            w: BAR,
            color: k.mid,
        })
    })

    // Each checkpoint is a chance for the scheduler to decide again.
    for (let i = 1; i < 8; i++) {
        const x = X + i * COL - (COL - BAR) / 2
        s.path(`M${x} 222 l-4 7 h8 Z`, k.state, { fill: k.state, width: 0 })
    }
    s.text(X, 242, 'Seven points where the scheduler can choose again', {
        color: k.state,
        weight: 600,
    })

    s.line(8, 260, 502, 260, k.line)
    s.text(8, 278, 'Prompt positions left to process', { color: k.faint })
    queued.forEach((value, i) => {
        const x = X + i * COL
        const h = (value / 4000) * 52
        if (h > 0) s.rect(x, 346 - h, BAR, h, { fill: tint(k.wait, 0.75) })
        s.line(x, 346, x + BAR, 346, k.line)
        s.text(x + BAR / 2, 360, value.toLocaleString('en-US'), { align: 'center', w: COL })
    })
    return s.render()
}
