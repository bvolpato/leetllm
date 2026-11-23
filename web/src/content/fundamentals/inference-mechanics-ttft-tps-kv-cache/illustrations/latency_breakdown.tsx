import type { ThemeMode } from 'vizmatic'
import { canvas, pk, tint } from '../serving-figure-kit'

export const width = 510
export const height = 268
export const alt =
    'A linear 0–428 ms request clock marks the 320 ms first-token boundary and three later token events. An enlarged, separately scaled decode rail shows gaps of 35, 37, and 36 ms at token times 320, 355, 392, and 428 ms. The 108 ms decode window gives 36 ms TPOT and 27.8 tokens per second; four tokens over the full 428 ms give 9.35 tokens per second.'

const L = 8
const R = 502
const at = (ms: number) => L + (ms / 428) * (R - L)
const zoom = (ms: number) => L + ((ms - 320) / 108) * (R - L)

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)

    // The whole request, to scale.
    s.text(L, 12, 'Whole request: 4 tokens in 428 ms = 9.35 tokens/s', { color: k.mid })
    s.span(at(0), at(428), 32, k.mid)
    s.rect(at(0), 44, at(320) - at(0), 34, { fill: k.prefill })
    s.rect(at(320), 44, at(428) - at(320), 34, { fill: k.decode })
    s.text(at(160), 61, 'wait for the first token', {
        color: k.onFill,
        align: 'center',
        weight: 600,
    })
    s.text(at(374), 61, 'decode', { color: k.onFill, align: 'center', weight: 600 })
    for (const ms of [355, 392]) s.line(at(ms), 44, at(ms), 52, k.onFill, { width: 2 })
    s.text(at(0), 94, 'TTFT = 320 ms', { color: k.prefill, weight: 700 })
    s.text(at(320), 94, '320 ms', { align: 'center', color: k.prefill })
    s.text(at(428), 94, '428 ms', { align: 'right', color: k.mid })

    // The decode window, enlarged.
    s.path(`M${at(320)} 106 L${L} 146`, k.faint, { dash: '3 3' })
    s.path(`M${at(428)} 106 L${R} 146`, k.faint, { dash: '3 3' })
    s.text(490, 134, '108 ms enlarged, on its own scale', { color: k.faint, align: 'right' })
    s.rect(L, 152, R - L, 38, { fill: tint(k.decode, 0.14), stroke: k.decode })
    ;[320, 355, 392, 428].forEach((ms, i) => {
        s.line(zoom(ms), 146, zoom(ms), 196, k.decode)
        s.text(zoom(ms), 210, `y${i + 1} at ${ms}`, {
            color: k.mid,
            align: i === 0 ? 'left' : i === 3 ? 'right' : 'center',
        })
    })
    ;[
        [320, 355, 35],
        [355, 392, 37],
        [392, 428, 36],
    ].forEach(([a, b, gap]) => {
        s.text((zoom(a) + zoom(b)) / 2, 171, `${gap} ms`, { align: 'center', weight: 700 })
    })
    s.span(L, R, 232, k.decode)
    s.text(255, 252, 'Decode: 3 gaps in 108 ms, so 36 ms per token, 27.8 tokens/s', {
        align: 'center',
        color: k.decode,
        weight: 700,
        w: 494,
    })
    return s.render()
}
