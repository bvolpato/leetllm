import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 356
export const alt =
    'Six reviewed requests share a 0 to 500 ms first-visible-token axis. All return HTTP 200; nearest-rank p95 is 240 ms under the 500 ms warning line. One safe answer, three abstentions, and two unsafe served answers yield 2/6 unsafe reviewed requests and 2/3 unsafe served answers.'

const X = 224
const W = 270
const at = (ms: number) => X + (ms / 500) * W

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    const rows: Array<[string, 'safe' | 'held' | 'unsafe', number]> = [
        ['trace-01', 'safe', 172],
        ['trace-02', 'held', 181],
        ['trace-03', 'held', 188],
        ['trace-04', 'held', 205],
        ['trace-05', 'unsafe', 218],
        ['trace-06', 'unsafe', 240],
    ]
    const color = { safe: k.pass, held: k.wait, unsafe: k.fail }
    const name = { safe: 'served safe', held: 'abstained', unsafe: 'served unsafe' }

    s.text(8, 12, 'Each returned HTTP 200', { color: k.faint })
    s.text(X, 12, 'First visible token, ms', { color: k.faint })
    for (const ms of [0, 250, 500]) {
        s.line(at(ms), 36, at(ms), 222, k.line, { width: 0.75 })
        s.text(at(ms), 234, ms, { align: ms === 500 ? 'right' : 'center', w: 44, color: k.mid })
    }
    s.line(at(500), 30, at(500), 222, k.wait, { dash: '4 3' })
    s.text(at(500), 30, 'warning', { align: 'right', color: k.wait, weight: 700 })
    s.line(at(240), 30, at(240), 222, k.ink, { dash: '4 3' })
    s.text(at(240) - 6, 30, 'p95 = 240', { weight: 700, align: 'right' })

    rows.forEach(([id, outcome, ms], r) => {
        const y = 52 + r * 30
        s.text(8, y, id, { mono: true })
        s.text(84, y, name[outcome], { color: color[outcome], weight: 600 })
        s.line(X, y, at(ms), y, color[outcome], { width: 2.5 })
        s.dot(at(ms), y, 4.5, color[outcome])
        s.text(at(262), y, ms, { color: k.mid })
    })

    s.line(8, 252, 502, 252, k.line)
    const squares = (x: number, y: number, list: string[]) =>
        list.forEach((c, i) => s.rect(x + i * 24, y, 20, 20, { fill: c }))
    s.text(8, 276, 'All reviewed requests', { color: k.mid })
    squares(8, 290, [k.pass, k.wait, k.wait, k.wait, k.fail, k.fail])
    s.text(8, 330, '2 of 6 unsafe', { weight: 700, color: k.fail })
    s.text(264, 276, 'Answers actually served', { color: k.mid })
    squares(264, 290, [k.pass, k.fail, k.fail])
    s.text(264, 330, '2 of 3 unsafe', { weight: 700, color: k.fail })
    return s.render()
}
