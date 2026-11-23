import type { ThemeMode } from 'vizmatic'
import { canvas, pk, tint } from '../../inference-mechanics-ttft-tps-kv-cache/serving-figure-kit'

export const width = 510
export const height = 408
export const alt =
    'With block size four and valid length five, A maps logical block zero to physical block 19 and logical block one to physical block 7. Positions 0 through 3 fill block 19; position 4 maps by divmod(4, 4) = (1, 0) to block 7 slot 0. The other three slots in block 7 remain owned by A but invalid for attention. B owns separate physical block 12.'

const SLOT = 38
const B7 = 8
const B12 = 177
const B19 = 346

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)
    const A = k.prefill

    // Logical addresses.
    s.text(8, 48, 'Logical', { color: k.faint })
    s.text(8, 67, 'positions', { color: k.faint })
    const logical = (x: number, labels: string[], title: string) => {
        labels.forEach((label, i) =>
            s.cell(x + i * SLOT, 8, SLOT - 3, 36, label, {
                mono: true,
                fill: tint(A, 0.14),
                stroke: tint(A, 0.5),
            }),
        )
        s.text(x + (labels.length * SLOT - 3) / 2, 58, title, {
            align: 'center',
            color: A,
            weight: 600,
            w: 130,
        })
    }
    logical(130, ['0', '1', '2', '3'], 'logical block 0')
    logical(342, ['4'], 'logical block 1')

    // The table.
    s.text(8, 110, 'Block table', { color: k.faint })
    const t0 = 206
    const t1 = 359
    s.cell(t0 - 66, 92, 132, 36, 'table[0] = 19', {
        mono: true,
        fill: tint(k.state, 0.14),
        stroke: k.state,
        weight: 600,
    })
    s.cell(t1 - 66, 92, 132, 36, 'table[1] = 7', {
        mono: true,
        fill: tint(k.state, 0.14),
        stroke: k.state,
        weight: 600,
    })
    s.arrow(t0, 70, t0, 90, k.mid)
    s.arrow(t1, 70, t1, 90, k.mid)

    // Physical memory, in address order, so the mapping visibly crosses.
    s.text(255, 178, 'Physical memory, in address order', { color: k.faint, align: 'center' })
    const physical = (x: number, name: string, cells: Array<[string, boolean]>, owned: string) => {
        s.text(x, 202, name, { weight: 700 })
        s.text(x + 4 * SLOT - 3, 202, owned, { align: 'right', color: k.mid })
        cells.forEach(([label, valid], i) => {
            if (owned === 'B')
                s.cell(x + i * SLOT, 216, SLOT - 3, 38, 'B', {
                    fill: tint(k.decode, 0.14),
                    stroke: tint(k.decode, 0.5),
                    color: k.decode,
                })
            else if (valid)
                s.cell(x + i * SLOT, 216, SLOT - 3, 38, label, {
                    mono: true,
                    fill: tint(A, 0.14),
                    stroke: A,
                    weight: 600,
                })
            else
                s.cell(x + i * SLOT, 216, SLOT - 3, 38, label, {
                    dash: '3 3',
                    stroke: k.faint,
                    color: k.faint,
                })
        })
    }
    physical(
        B7,
        'Block 7',
        [
            ['4', true],
            ['tail', false],
            ['tail', false],
            ['tail', false],
        ],
        'A',
    )
    physical(
        B12,
        'Block 12',
        [
            ['', true],
            ['', true],
            ['', true],
            ['', true],
        ],
        'B',
    )
    physical(
        B19,
        'Block 19',
        [
            ['0', true],
            ['1', true],
            ['2', true],
            ['3', true],
        ],
        'A',
    )

    const to19 = B19 + 2 * SLOT + 40
    const to7 = B7 + 2 * SLOT - 10
    s.path(`M${t0} 128 V142 H${to19} V180`, k.state)
    s.arrow(to19, 178, to19, 192, k.state)
    s.path(`M${t1} 128 V156 H${to7} V180`, k.state)
    s.arrow(to7, 178, to7, 192, k.state)

    // Worked translation and the valid length.
    s.line(8, 274, 502, 274, k.line)
    s.text(8, 296, 'position 4: divmod(4, 4) = (1, 0)', { mono: true, weight: 600 })
    s.text(8, 318, 'table[1] = 7, so block 7, slot 0', { mono: true, weight: 600 })
    s.text(8, 350, 'Valid length is 5, so attention stops at position 4.')
    s.text(8, 372, 'The three tail slots belong to A but hold nothing to read.', {
        color: k.mid,
        w: 460,
    })
    return s.render()
}
