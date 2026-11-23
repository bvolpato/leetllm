import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
} from '../../../fundamentals/inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 464
export const alt =
    'Six request identities share a 0 to 2500 millisecond clock. Scheduled arrivals are 0, 120, 700, 760, 800, and 1900; actual sends are 0, 125, 705, 765, 805, and 1905; terminal outcomes are 500, 310, 1220, 1310, 1180, and 2500. The arrival cohort ends at 2000 and drain continues to the r06 timeout at 2500. Requests r01, r02, and r04 qualify; r03 misses TTFT, r05 fails the quality check, and r06 times out. Six offered, five successful, and three qualified give 50 percent attainment. Offered rate is 3.0 per second over the two-second arrival window; success and qualified rates are 2.0 and 1.2 over the 2.5-second cohort horizon. An inset changes only r04 send from 765 to 800 while its first token remains at 1050. Send-relative TTFT falls from 285 to 250 milliseconds, but schedule lag rises from 5 to 40 and exceeds the 20 millisecond limit.'

const X = 44
const PX = 0.14
const at = (ms: number) => X + ms * PX

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    const rows: Array<[string, number, number, number, string, string]> = [
        ['r01', 0, 0, 500, 'qualified', k.pass],
        ['r02', 120, 125, 310, 'qualified', k.pass],
        ['r03', 700, 705, 1220, 'TTFT 340 ms', k.fail],
        ['r04', 760, 765, 1310, 'qualified', k.pass],
        ['r05', 800, 805, 1180, 'quality failed', k.fail],
        ['r06', 1900, 1905, 2500, 'timed out', k.fail],
    ]
    s.rect(at(2000), 30, at(2500) - at(2000), 176, { fill: tint(k.wait, 0.14) })
    s.text(at(1000), 14, 'arrivals, [0, 2000) ms', { align: 'center', color: k.faint })
    s.text(at(2250), 14, 'drain', { align: 'center', color: k.wait, weight: 700 })
    for (const ms of [0, 1000, 2000, 2500]) {
        s.line(at(ms), 30, at(ms), 206, k.line, { width: 0.75 })
        s.text(at(ms), 220, ms, { align: 'center', w: 44, color: k.mid })
    }
    rows.forEach(([id, scheduled, sent, terminal, verdict, color], r) => {
        const y = 46 + r * 28
        s.text(8, y, id, { mono: true, weight: 700 })
        s.path(`M${at(scheduled)} ${y - 3} l-4 -8 h8 Z`, k.ink, { fill: k.ink, width: 0 })
        s.line(at(sent), y, at(terminal), y, color, { width: 2.5 })
        s.dot(at(sent), y, 3.5, k.ink)
        s.dot(at(terminal), y, 5, color)
        s.text(502, y, verdict, { align: 'right', color, weight: 700, w: 108 })
    })

    s.path(`M16 240 l-4 -8 h8 Z`, k.ink, { fill: k.ink, width: 0 })
    s.text(26, 238, 'due')
    s.dot(74, 238, 3.5, k.ink)
    s.text(84, 238, 'sent')
    s.dot(134, 238, 5, k.pass)
    s.text(144, 238, 'terminal outcome')

    s.line(8, 256, 502, 256, k.line)
    // Offered, then successful, then qualified.
    const blocks = (y: number, name: string, lit: number, color: string, rate: string) => {
        s.text(8, y + 9, name, { weight: 600 })
        for (let i = 0; i < 6; i++)
            s.rect(
                92 + i * 21,
                y,
                17,
                18,
                i < lit ? { fill: color } : { stroke: k.faint, dash: '2 2' },
            )
        s.text(226, y + 9, rate, { color: k.mid })
    }
    blocks(270, 'Offered', 6, k.prefill, '3.0/s over the 2 s of arrivals')
    blocks(298, 'Successful', 5, k.decode, '2.0/s over the 2.5 s horizon')
    blocks(326, 'Qualified', 3, k.pass, '1.2/s over the 2.5 s horizon')
    s.text(8, 362, '3 of 6 offered requests qualified: 50% attainment.', {
        weight: 700,
        color: k.pass,
    })

    s.line(8, 380, 502, 380, k.line)
    s.text(8, 398, 'Delay only the send of r04, and its TTFT looks better', { color: k.faint })
    s.text(8, 422, 'send 765')
    s.text(84, 422, 'TTFT 285 ms, lag 5 ms', { weight: 600 })
    s.text(8, 446, 'send 800')
    s.text(84, 446, 'TTFT 250 ms, lag 40 ms', { weight: 600 })
    s.text(502, 446, 'over 20 ms: invalid', { align: 'right', color: k.fail, weight: 700 })
    return s.render()
}
