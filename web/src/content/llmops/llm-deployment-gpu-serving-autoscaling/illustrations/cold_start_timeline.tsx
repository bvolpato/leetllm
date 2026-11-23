import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    type Canvas,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 306
export const alt =
    'One shared clock runs from 8:56 to 9:02. A serial startup trace takes 95 seconds for node provisioning, 22 for the image, 78 for weights, and 12 for warmup, reaching readiness after 207 seconds. Starting at 8:58 reaches readiness at 9:01:27, 87 seconds after the surge; starting at 8:56 reaches readiness at 8:59:27, 33 seconds before it. The first request starts only after readiness.'

const X = 8
const PX = 494 / 360
const at = (t: number) => X + t * PX

function chain(s: Canvas, y: number, start: number, colors: string[]) {
    let t = start
    ;[95, 22, 78, 12].forEach((d, i) => {
        s.rect(at(t) + 0.5, y, d * PX - 1, 26, { fill: colors[i], r: 1 })
        t += d
    })
    s.path(`M${at(t)} ${y - 3} l7 16 l-7 16 l-7 -16 Z`, s.k.ink, { fill: s.k.onFill, width: 1.5 })
}

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    const colors = [k.wait, k.decode, k.prefill, k.state]

    // Clock.
    ;['8:56', '8:57', '8:58', '8:59', '9:00', '9:01', '9:02'].forEach((name, i) => {
        const t = i * 60
        const hot = name === '9:00'
        s.line(at(t), 26, at(t), 172, hot ? k.fail : k.line, { width: hot ? 2 : 0.75 })
        s.text(at(t), 12, name, {
            align: i === 0 ? 'left' : i === 6 ? 'right' : 'center',
            w: 50,
            color: hot ? k.fail : k.mid,
            weight: hot ? 700 : 500,
        })
    })

    s.text(X, 42, 'Start at 8:56, ready at 8:59:27: 33 s early', { color: k.pass, weight: 700 })
    chain(s, 54, 0, colors)
    s.span(at(207), at(240), 67, k.pass)

    s.text(X, 112, 'Start at 8:58, ready at 9:01:27: 87 s late', { color: k.fail, weight: 700 })
    chain(s, 124, 120, colors)
    s.span(at(240), at(327), 164, k.fail)

    s.line(8, 186, 502, 186, k.line)
    const legend: Array<[string, string]> = [
        ['Node 95 s', k.wait],
        ['Image 22 s', k.decode],
        ['Weights 78 s', k.prefill],
        ['Warmup 12 s', k.state],
    ]
    legend.forEach(([name, color], i) => {
        const x = 8 + i * 124
        s.rect(x, 202, 12, 12, { fill: color })
        s.text(x + 17, 208, name)
    })
    s.text(8, 238, '95 + 22 + 78 + 12 = 207 s of serial startup.', { weight: 600, w: 490 })
    s.path(`M15 256 l7 12 l-7 12 l-7 -12 Z`, k.ink, { fill: k.onFill, width: 1.5 })
    s.text(30, 268, 'Ready. The first request can start only from this mark.', { color: k.mid })
    return s.render()
}
