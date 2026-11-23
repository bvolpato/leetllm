import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout, type Kit } from './_kit'

export const width = 672
export const height = 556
export const alt =
    'Right-padded tokens have mask [1, 1, 0], and left-padded tokens have mask [0, 1, 1]. Both select the final real hidden state [2, 3] and ignore the padding hidden state [99, 99]. The shared reward head [0.5, 1.0] gives score 4.0 in either layout.'

const sequences = [
    {
        name: 'Right padding',
        mask: [1, 1, 0],
        cells: [
            ['token 0', '[1, 0]'],
            ['token 1', '[2, 3]'],
            ['PAD', '[99, 99]'],
        ],
        chosen: 1,
    },
    {
        name: 'Left padding',
        mask: [0, 1, 1],
        cells: [
            ['PAD', '[99, 99]'],
            ['token 0', '[1, 0]'],
            ['token 1', '[2, 3]'],
        ],
        chosen: 2,
    },
]

export const layoutHeight = (L: Layout) => (L.print ? 214 : 556)

function step(
    k: Kit,
    L: Layout,
    x: number,
    y: number,
    w: number,
    h: number,
    heading: string,
    value: string,
    strong = false,
) {
    k.rect(x, y, w, h, {
        fill: k.tint('green', strong ? 0.34 : 0.14),
        stroke: k.ink('green'),
        strokeWidth: strong ? 1.75 : 1,
    })
    k.t(x, y + h / 2 - L.S * 1.35, w, heading, { size: L.S, align: 'center' })
    k.t(x, y + h / 2, w, value, { size: L.S, align: 'center', mono: true, weight: 600 })
}

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const left = 6
    const cellW = L.print ? 104 : 174
    const cellH = L.print ? 46 : 64
    const gap = L.print ? 6 : 12
    const maskH = L.print ? 22 : 32
    const nameH = L.print ? 22 : 30
    const rowH = nameH + cellH + maskH + (L.print ? 12 : 16)
    const y0 = 3
    sequences.forEach((seq, r) => {
        const y = y0 + r * rowH
        k.t(left, y, 330, `${seq.name}, mask [${seq.mask.join(', ')}]`, { size: L.S, weight: 600 })
        seq.cells.forEach((cell, i) => {
            const x = left + i * (cellW + gap)
            const cy = y + nameH
            const chosen = i === seq.chosen
            const pad = cell[0] === 'PAD'
            k.rect(
                x,
                cy,
                cellW,
                cellH,
                chosen
                    ? { fill: k.tint('green', 0.3), stroke: k.ink('green'), strokeWidth: 1.75 }
                    : pad
                      ? { stroke: c.textMuted, dash: '4 3' }
                      : { stroke: c.border },
            )
            k.t(x, cy + cellH / 2 - L.S * 1.35, cellW, cell[0], {
                size: L.S,
                align: 'center',
                color: pad ? c.textMuted : c.textPrimary,
            })
            k.t(x, cy + cellH / 2, cellW, cell[1], {
                size: L.S,
                align: 'center',
                mono: true,
                color: pad ? c.textMuted : c.textPrimary,
            })
            k.t(x, cy + cellH + 1, cellW, String(seq.mask[i]), {
                size: L.S,
                align: 'center',
                mono: true,
                color: c.textSecondary,
            })
        })
    })
    // Both selections feed one head.
    const fx = L.print ? left + 3 * (cellW + gap) + 18 : left
    const boxW = L.print ? 118 : (L.W - 12 - 2 * 28) / 3
    const boxH = L.print ? 54 : 84
    const fy = L.print ? y0 + 6 : y0 + 2 * rowH + 8
    const boxes: [string, string][] = [
        ['hidden state', '[2, 3]'],
        ['shared head', '[0.5, 1.0]'],
        ['reward', '4.0'],
    ]
    boxes.forEach((box, i) => {
        const x = L.print ? fx + 40 : fx + i * (boxW + 28)
        const y = L.print ? fy + i * (boxH + 14) : fy
        step(k, L, x, y, boxW, boxH, box[0], box[1], i === 2)
        if (i > 0) {
            if (L.print)
                k.arrow(x + boxW / 2, y - 13, x + boxW / 2, y - 1, { stroke: c.textSecondary })
            else k.arrow(x - 26, y + boxH / 2, x - 2, y + boxH / 2, { stroke: c.textSecondary })
        }
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
