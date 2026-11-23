import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
    type Canvas,
} from '../../inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 262
export const alt =
    'Four completed requests reach three initially cold workers. Round robin sends them to A, B, C, A and pays three cold warmups; prefix affinity sends all four to B and pays one. After either trace, only workers that received a request are warm.'

const CELL = 34

function matrix(
    s: Canvas,
    x0: number,
    title: string,
    summary: string,
    route: string[],
    after: boolean[],
    summaryColor: string,
) {
    const k = s.k
    const X = x0 + 50
    s.text(x0, 12, title, { weight: 700 })
    s.text(x0, 32, summary, { color: summaryColor, weight: 700 })
    ;['R1', 'R2', 'R3', 'R4'].forEach((name, i) =>
        s.text(X + i * CELL + CELL / 2, 60, name, {
            align: 'center',
            w: CELL,
            color: k.faint,
            mono: true,
        }),
    )
    s.text(X + 4 * CELL + 28, 60, 'After', {
        align: 'center',
        w: 48,
        color: k.faint,
    })
    const seen = new Set<string>()
    ;['A', 'B', 'C'].forEach((worker, r) => {
        const y = 76 + r * 44
        s.text(x0, y + 20, `GPU ${worker}`, { weight: 600 })
        s.line(X, y + 20, X + 4 * CELL, y + 20, k.line)
        s.text(X + 4 * CELL + 28, y + 20, after[r] ? 'warm' : 'cold', {
            align: 'center',
            w: 48,
            weight: 700,
            color: after[r] ? k.pass : k.faint,
        })
    })
    route.forEach((worker, i) => {
        const r = ['A', 'B', 'C'].indexOf(worker)
        const cx = X + i * CELL + CELL / 2
        const cy = 76 + r * 44 + 20
        const warm = seen.has(worker)
        seen.add(worker)
        if (warm) s.dot(cx, cy, 11, k.pass)
        else s.dot(cx, cy, 11, tint(k.wait, 0.22), { stroke: k.wait, width: 1.5 })
    })
}

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    matrix(s, 8, 'Round robin', '3 cold warmups', ['A', 'B', 'C', 'A'], [true, true, true], k.fail)
    matrix(
        s,
        266,
        'Prefix affinity',
        '1 cold warmup',
        ['B', 'B', 'B', 'B'],
        [false, true, false],
        k.pass,
    )
    s.dot(16, 240, 8, tint(k.wait, 0.22), { stroke: k.wait, width: 1.5 })
    s.text(30, 240, 'served after a cold warmup')
    s.dot(266, 240, 8, k.pass)
    s.text(280, 240, 'served warm')
    return s.render()
}
