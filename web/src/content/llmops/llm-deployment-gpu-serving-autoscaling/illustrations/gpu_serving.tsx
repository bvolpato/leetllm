import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
    type Canvas,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 250
export const alt =
    'Two connected serving loops. A queue with an original deadline enters capacity gating, a ready batch, GPU decode, and a token stream. Rejected requests return 429 with Retry-After and signal the capacity loop. Future replicas join the ready batch only after their engines are loaded, warm, and healthy.'

function node(
    s: Canvas,
    x: number,
    y: number,
    w: number,
    a: string,
    b: string | undefined,
    color: string,
    fill = 0.1,
) {
    s.rect(x, y, w, 54, { fill: tint(color, fill), stroke: color })
    s.text(x + w / 2, y + 18, a, { align: 'center', w, weight: 700, size: 18 })
    if (b) s.text(x + w / 2, y + 37, b, { align: 'center', w, color: s.k.mid, size: 16.5 })
}

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)

    // Data path.
    s.rect(5, 5, 500, 113, { fill: tint(k.prefill, 0.04), stroke: tint(k.prefill, 0.35) })
    s.text(10, 18, 'Data path: serve current work', { color: k.prefill, weight: 700, size: 18 })
    const Y = 38
    node(s, 10, Y, 122, 'Queue', 'deadline held', k.wait)
    s.arrow(133, Y + 27, 147, Y + 27, k.mid)
    node(s, 149, Y, 72, 'Room in', 'budget?', k.ink, 0.04)
    s.arrow(222, Y + 27, 252, Y + 27, k.pass, { width: 1.5 })
    s.text(237, Y + 13, 'yes', { align: 'center', color: k.pass, weight: 700, w: 30 })
    node(s, 254, Y, 112, 'Ready batch', 'token + KV', k.state)
    s.arrow(367, Y + 27, 381, Y + 27, k.mid)
    node(s, 383, Y, 62, 'GPU', 'decode', k.decode, 0.16)
    s.arrow(446, Y + 27, 460, Y + 27, k.mid)
    ;[0, 1, 2].forEach((i) => s.rect(462 + i * 14, Y + 17, 11, 20, { fill: k.decode, r: 1 }))

    // The branch between the two loops.
    s.arrow(185, Y + 56, 185, 168, k.fail, { width: 1.5 })
    s.text(194, 124, 'no', { color: k.fail, weight: 700 })

    // Capacity path.
    s.rect(5, 132, 500, 108, { fill: tint(k.state, 0.04), stroke: tint(k.state, 0.35) })
    const C = 170
    node(s, 126, C, 118, '429', 'Retry-After', k.fail)
    s.arrow(245, C + 27, 259, C + 27, k.mid)
    node(s, 261, C, 66, 'Scale', 'signal', k.state, 0.14)
    s.arrow(328, C + 27, 342, C + 27, k.mid)
    node(s, 344, C, 158, 'Future replicas', 'warm + healthy', k.state, 0.14)
    s.text(10, 150, 'Capacity path', { color: k.state, weight: 700, size: 18 })
    s.text(10, 186, 'More workers', { color: k.state })
    s.text(10, 205, 'arrive later', { color: k.state })

    // New capacity joins the data path only when ready.
    s.path(`M423 168 V154 H310 V100`, k.state, { dash: '5 4' })
    s.arrow(310, 104, 310, 94, k.state)
    s.text(318, 144, 'joins when ready', { color: k.state, weight: 600 })

    return s.render()
}
