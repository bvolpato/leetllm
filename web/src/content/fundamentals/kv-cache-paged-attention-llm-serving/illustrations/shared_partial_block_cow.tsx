import type { ThemeMode } from 'vizmatic'
import {
    canvas,
    pk,
    tint,
    type Canvas,
} from '../../inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 340
export const alt =
    'A and B begin on shared physical block 0 with values 10, 20, 30 and one empty slot, reference count two. Without copy-on-write, B overwrites A’s appended 90 with 80. In the safe branch A copies only the three valid values to block 1 and writes 90; B keeps block 0 and writes 80. Each block then has one owner.'

const SLOT = 54
const BX = 280

function block(
    s: Canvas,
    y: number,
    name: string,
    refs: string,
    values: Array<string | number>,
    hot: number,
    hotColor: string,
) {
    const k = s.k
    s.text(BX, y - 12, name, { weight: 700 })
    s.text(BX + 4 * SLOT - 2, y - 12, refs, { align: 'right', color: k.mid })
    values.forEach((v, i) => {
        const isHot = i === hot
        if (v === '')
            s.cell(BX + i * SLOT, y, SLOT - 2, 36, 'empty', {
                dash: '3 3',
                stroke: k.faint,
                color: k.faint,
            })
        else
            s.cell(BX + i * SLOT, y, SLOT - 2, 36, v, {
                mono: true,
                fill: isHot ? tint(hotColor, 0.2) : tint(k.state, 0.1),
                stroke: isHot ? hotColor : tint(k.state, 0.45),
                weight: isHot ? 700 : 500,
                color: isHot ? hotColor : k.ink,
            })
    })
}

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    const M = 122

    // 1. Shared.
    s.text(8, 34, 'Before either', { weight: 700 })
    s.text(8, 53, 'branch writes', { weight: 700 })
    s.text(M, 28, 'A table [0]', { mono: true, color: k.prefill })
    s.text(M, 52, 'B table [0]', { mono: true, color: k.decode })
    s.arrow(M + 104, 28, BX - 4, 44, k.prefill)
    s.arrow(M + 104, 52, BX - 4, 50, k.decode)
    block(s, 30, 'Block 0', 'refcount 2', [10, 20, 30, ''], -1, k.ink)

    s.line(8, 84, 502, 84, k.line)

    // 2. Unsafe.
    s.text(8, 128, 'Without', { weight: 700, color: k.fail })
    s.text(8, 147, 'copy-on-write', { weight: 700, color: k.fail })
    s.text(M, 112, 'A writes 90,', { color: k.prefill })
    s.text(M, 131, 'then B writes 80', { color: k.decode })
    s.arrow(M + 126, 122, BX - 4, 122, k.fail)
    block(s, 114, 'Block 0', 'same slot', [10, 20, 30, 80], 3, k.fail)
    s.text(M, 168, 'A expected 90 and reads 80.', { color: k.fail, weight: 700 })

    s.line(8, 186, 502, 186, k.line)

    // 3. Safe.
    s.text(8, 244, 'With', { weight: 700, color: k.pass })
    s.text(8, 263, 'copy-on-write', { weight: 700, color: k.pass })
    s.text(M, 220, 'A copies 3 values,', { color: k.prefill })
    s.text(M, 239, 'then writes 90', { color: k.prefill })
    s.text(M, 290, 'B keeps block 0,', { color: k.decode })
    s.text(M, 309, 'then writes 80', { color: k.decode })
    block(s, 218, 'Block 1', 'A, refcount 1', [10, 20, 30, 90], 3, k.prefill)
    block(s, 290, 'Block 0', 'B, refcount 1', [10, 20, 30, 80], 3, k.decode)
    return s.render()
}
