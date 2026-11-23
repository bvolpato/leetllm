import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 304
export const alt =
    'Two client-slot timelines share a 700 to 1400 millisecond clock. With independent arrivals, r03 occupies one slot from its actual send at 705 to terminal completion at 1220, while r04 is due at 760 and occupies another slot from send 765 to terminal 1310. A separate illustrative single-virtual-user model stays occupied by r03 through 1220, then uses a declared 80 millisecond think time before a next send at 1300. The due-time marker remains at 760. This depicts client occupancy and backpressure; server queue timestamps are unknown.'

const X = 44
const PX = 456 / 700
const at = (ms: number) => X + (ms - 700) * PX

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    const bar = (y: number, name: string, from: number, to: number, color: string) => {
        s.text(8, y + 13, name, { mono: true, weight: 700 })
        s.rect(at(700), y, at(1400) - at(700), 26, { stroke: k.line })
        s.rect(at(from), y, at(to) - at(from), 26, { fill: color })
        s.text(at(from) + 8, y + 13, `sent ${from}`, { color: k.onFill, weight: 600 })
        s.text(at(to) - 8, y + 13, `done ${to}`, { color: k.onFill, weight: 600, align: 'right' })
    }
    const due = (y: number, text: string, color: string) => {
        s.path(`M${at(760)} ${y} l-5 -9 h10 Z`, color, { fill: color, width: 0 })
        s.text(at(760) + 10, y - 6, text, { color, weight: 600 })
    }
    for (const ms of [700, 1000, 1400]) {
        s.text(at(ms), 258, ms, { align: ms === 1400 ? 'right' : 'center', w: 44, color: k.mid })
    }
    s.text(at(1200), 258, 'client time, ms', { align: 'center', color: k.faint })

    s.text(8, 12, 'Open loop: an independent clock sends each request when due', {
        weight: 700,
        w: 490,
    })
    bar(28, 'r03', 705, 1220, k.prefill)
    due(76, 'r04 due at 760, sent while r03 still runs', k.pass)
    bar(84, 'r04', 765, 1310, k.prefill)

    s.line(8, 130, 502, 130, k.line)

    s.text(8, 150, 'Closed loop: one virtual user waits, so arrivals slow too', { weight: 700 })
    bar(166, 'r03', 705, 1220, k.prefill)
    s.rect(at(1220), 166, at(1300) - at(1220), 26, {
        fill: tint(k.wait, 0.25),
        stroke: k.wait,
        dash: '3 3',
    })
    s.text((at(1220) + at(1300)) / 2 - 4, 179, '80 ms', {
        align: 'center',
        color: k.wait,
        weight: 700,
        w: 44,
    })
    s.dot(at(1300), 179, 5, k.state)
    s.text(at(1300) + 10, 179, 'next', { color: k.state, weight: 700 })
    s.text(502, 206, 'think time, then next send at 1300', { color: k.mid, align: 'right' })
    due(236, 'Nothing is sent at 760. The user is busy.', k.fail)
    s.line(at(760), 192, at(760), 226, k.fail, { dash: '3 3' })
    s.line(8, 272, 502, 272, k.line)
    s.text(8, 290, 'Client slots only. These say nothing about server queues.', { color: k.mid })
    return s.render()
}
