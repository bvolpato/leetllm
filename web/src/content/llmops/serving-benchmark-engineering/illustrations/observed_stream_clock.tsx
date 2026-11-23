import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 316
export const alt =
    'Request r01 shares one millisecond clock: send at 0, normalized token events at 240, 280, 320, 440, and 480, and terminal completion at 500. TTFT spans 0 to 240. The four inter-token gaps are 40, 40, 120, and 40 milliseconds. Their first-to-last span is 240 milliseconds over four intervals, giving TPOT 60. Last-token latency is 480, while terminal E2E is 500. The aligned r02 inset has send at 125 and one token at 295, so TTFT is 170 milliseconds and TPOT is not applicable. These token events come directly from logged arrivals rather than reconstructed SSE chunks.'

const X = 8
const PX = 0.97
const at = (ms: number) => X + ms * PX

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    const tokens = [240, 280, 320, 440, 480]

    s.text(8, 12, 'r01, on one client clock, in ms', { color: k.faint })
    s.span(at(0), at(240), 48, k.prefill)
    s.text(at(120), 36, 'TTFT 240 ms', { align: 'center', color: k.prefill, weight: 700 })

    const LINE = 82
    s.line(at(0), LINE, at(500), LINE, k.mid)
    s.dot(at(0), LINE, 4.5, k.ink)
    s.text(at(0), LINE + 18, 'send 0', { color: k.mid })
    tokens.forEach((ms, i) => {
        s.dot(at(ms), LINE, 5.5, k.decode)
        s.text(at(ms), LINE - 18, i + 1, { align: 'center', w: 20, weight: 700, color: k.decode })
        s.line(at(ms), LINE + 7, at(ms), 118, k.line, { width: 0.75 })
    })
    s.rect(at(500) - 4.5, LINE - 4.5, 9, 9, { fill: k.ink, r: 1 })
    s.text(at(500), LINE + 18, 'terminal 500', { align: 'right', weight: 700 })

    // Gaps.
    const gaps: Array<[number, number, number]> = [
        [240, 280, 40],
        [280, 320, 40],
        [320, 440, 120],
        [440, 480, 40],
    ]
    gaps.forEach(([a, b, gap]) => {
        const hot = gap === 120
        s.span(at(a) + 1, at(b) - 1, 120, hot ? k.fail : k.decode, { width: hot ? 2 : 1 })
        s.text((at(a) + at(b)) / 2, 136, gap, {
            align: 'center',
            w: 36,
            color: hot ? k.fail : k.decode,
            weight: 700,
        })
    })
    s.text(at(232), 120, 'Gaps', { align: 'right', color: k.faint })
    s.span(at(240), at(480), 158, k.decode)
    s.text(at(480), 174, 'Mean pacing: 240 ms / 4 gaps = 60 ms', {
        align: 'right',
        color: k.decode,
        weight: 700,
    })
    s.text(at(0) + 6, 186, 'last token 480', { color: k.mid })
    s.span(at(0), at(480), 200, k.mid)
    s.span(at(0), at(500), 222, k.ink)
    s.text(at(0) + 6, 236, 'terminal end-to-end 500', { weight: 700 })

    s.line(8, 250, 502, 250, k.line)
    s.text(8, 268, 'r02', { color: k.faint, mono: true })
    s.span(at(125), at(295), 276, k.prefill)
    s.dot(at(295), 276, 5.5, k.decode)
    s.text(at(210), 263, 'TTFT 170 ms', { align: 'center', color: k.prefill, weight: 700 })
    s.text(8, 298, 'One token, so its pacing is undefined.', { color: k.wait, weight: 700 })
    return s.render()
}
