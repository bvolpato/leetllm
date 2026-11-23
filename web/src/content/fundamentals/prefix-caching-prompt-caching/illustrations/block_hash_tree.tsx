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
    'One system block, digest prefix 314414, branches to two guide blocks. Guide v1 hashes to f6015e and guide v2 hashes to 79a94c. Both branches then contain the same tools block text, but the child digest prefixes differ: 6223fb and a238c9. These short hashes come from the article teaching serialization.'

const W = 106
const H = 62

function node(
    s: Canvas,
    x: number,
    y: number,
    name: string,
    value: string,
    color: string,
    code = true,
) {
    s.rect(x, y, W, H, { fill: tint(color, 0.1), stroke: color })
    s.text(x + 8, y + 20, name, { weight: 600 })
    s.text(x + 8, y + 42, value, { mono: code, color, weight: code ? 700 : 500 })
}

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    const X = [8, 137, 266, 396]
    const top = 8
    const bottom = 128
    const mid = (top + bottom) / 2

    node(s, X[0], mid, 'System', '314414', k.ink)
    s.arrow(X[0] + W, mid + 24, X[1] - 2, top + 34, k.prefill)
    s.arrow(X[0] + W, mid + 38, X[1] - 2, bottom + 30, k.wait)

    node(s, X[1], top, 'Guide v1', 'f6015e', k.prefill)
    node(s, X[1], bottom, 'Guide v2', '79a94c', k.wait)
    s.arrow(X[1] + W, top + H / 2, X[2] - 2, top + H / 2, k.prefill)
    s.arrow(X[1] + W, bottom + H / 2, X[2] - 2, bottom + H / 2, k.wait)

    node(s, X[2], top, 'Tools', 'same bytes', k.mid, false)
    node(s, X[2], bottom, 'Tools', 'same bytes', k.mid, false)
    s.text(X[2] + W / 2, (top + H + bottom) / 2, 'identical text', {
        color: k.mid,
        align: 'center',
    })
    s.arrow(X[2] + W, top + H / 2, X[3] - 2, top + H / 2, k.prefill)
    s.arrow(X[2] + W, bottom + H / 2, X[3] - 2, bottom + H / 2, k.wait)

    node(s, X[3], top, 'Child key', '6223fb', k.prefill)
    node(s, X[3], bottom, 'Child key', 'a238c9', k.fail)
    s.text(X[3] + W / 2, (top + H + bottom) / 2, 'keys differ', {
        color: k.fail,
        weight: 700,
        align: 'center',
    })
    s.text(8, 216, 'Each key hashes the parent key and this block,', {
        color: k.mid,
    })
    s.text(8, 238, 'so one edit changes every key below it.', { color: k.mid })
    return s.render()
}
