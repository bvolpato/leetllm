import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
    type Canvas,
} from '../../inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 402
export const alt =
    'Static and continuous schedules use the same 0 to 200 completed-iteration axis and three seats. Static requests A, B, and C need 10, 50, and 200 iterations, leaving the first two seats idle. Continuous batching admits D for iteration 11 and E for iteration 51; both continue beyond the view.'

const X = 60
const STEP = 1.8
const at = (step: number) => X + step * STEP

function work(s: Canvas, y: number, from: number, to: number, name: string) {
    s.rect(at(from) + 0.75, y, (to - from) * STEP - 1.5, 26, { fill: s.k.decode })
    s.text((at(from) + at(to)) / 2, y + 13, name, {
        color: s.k.onFill,
        align: 'center',
        weight: 700,
        w: Math.max((to - from) * STEP, 20),
    })
}

function idle(s: Canvas, y: number, from: number, to: number) {
    s.rect(at(from) + 0.75, y, (to - from) * STEP - 1.5, 26, {
        fill: tint(s.k.wait, 0.12),
        stroke: s.k.wait,
        dash: '4 3',
    })
    s.text((at(from) + at(to)) / 2, y + 13, 'seat held, doing nothing', {
        color: s.k.wait,
        align: 'center',
        weight: 600,
    })
}

function axis(s: Canvas, y: number) {
    for (const step of [0, 50, 100, 150, 200])
        s.text(at(step), y, step, { color: s.k.mid, align: 'center', w: 40 })
}

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    const seats = (top: number) => [top, top + 32, top + 64]

    s.text(8, 12, 'Static batching', { weight: 700 })
    const [a, b, c] = seats(28)
    ;[a, b, c].forEach((y, i) => s.text(8, y + 13, `Seat ${i + 1}`, { color: k.mid }))
    work(s, a, 0, 10, 'A')
    idle(s, a, 10, 200)
    work(s, b, 0, 50, 'B')
    idle(s, b, 50, 200)
    work(s, c, 0, 200, 'C')
    axis(s, 132)
    s.text(8, 156, '260 useful seat-steps (43.3%) and 340 idle (56.7%)', {
        color: k.wait,
        weight: 700,
    })

    s.line(8, 174, 502, 174, k.line)

    s.text(8, 192, 'Continuous batching', { weight: 700 })
    const [d, e, f] = seats(208)
    ;[d, e, f].forEach((y, i) => s.text(8, y + 13, `Seat ${i + 1}`, { color: k.mid }))
    work(s, d, 0, 10, 'A')
    work(s, d, 10, 200, 'D starts at step 11')
    work(s, e, 0, 50, 'B')
    work(s, e, 50, 200, 'E starts at step 51')
    work(s, f, 0, 200, 'C')
    s.arrow(at(200) + 2, d + 13, at(200) + 14, d + 13, k.decode)
    s.arrow(at(200) + 2, e + 13, at(200) + 14, e + 13, k.decode)
    s.text(at(200) + 18, d + 13, '60 left', { color: k.decode, weight: 600 })
    s.text(at(200) + 18, e + 13, '100 left', { color: k.decode, weight: 600 })
    axis(s, 312)
    s.text(8, 336, '600 useful seat-steps by step 200, with no seat idle', {
        color: k.pass,
        weight: 700,
    })

    s.line(8, 354, 502, 354, k.line)
    s.text(8, 372, 'D and E each need 250 steps.', { color: k.mid })
    s.text(8, 392, 'Run all five: static ends at step 450, continuous at step 300.', {
        weight: 600,
        w: 490,
    })
    return s.render()
}
