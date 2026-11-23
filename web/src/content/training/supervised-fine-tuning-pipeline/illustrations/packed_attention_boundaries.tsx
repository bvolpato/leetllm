import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout, type Kit } from './_kit'

export const width = 672
export const height = 520
export const alt =
    'Two six-by-six attention masks for packed examples Ex A and Ex B, whose position IDs each reset to 0, 1, and 2. In the block-causal mask, query 4 reads only keys 3 and 4, with values 10 and 20, so its output is 15.0 and stays 15.0 after adding 100 to Ex A. In the global causal mask, query 4 also reads Ex A, and its output moves from 7.2 to 67.2. Gold dividers separate the two examples.'

const values = [1, 2, 3, 10, 20, 30]
const positions = [0, 1, 2, 0, 1, 2]
const example = [0, 0, 0, 1, 1, 1]
const QUERY = 4

export const layoutHeight = (L: Layout) => (L.print ? 362 : 520)

function panel(k: Kit, L: Layout, x0: number, y0: number, isolated: boolean) {
    const { c } = k
    const cell = L.print ? 32 : 38
    const label = L.print ? 34 : 46
    const mx = x0 + label
    const nameRow = L.print ? 26 : 38
    const headerH = L.print ? 22 : 30
    const my = y0 + nameRow * 2 + headerH * 2
    const names = L.print ? ['first', 'second'] : ['Ex A', 'Ex B']
    const tone = isolated ? 'green' : 'critical'

    k.t(x0, y0, L.print ? 320 : 322, isolated ? 'Block-causal mask' : 'Global causal mask', {
        weight: 600,
        size: L.S,
    })
    names.forEach((name, i) =>
        k.t(mx + i * 3 * cell, y0 + nameRow, cell * 3, name, {
            align: 'center',
            size: L.S,
            color: c.textSecondary,
        }),
    )
    k.mid(x0, y0 + nameRow * 2, label, headerH, 'val', { size: L.S, color: c.textSecondary })
    k.mid(x0, y0 + nameRow * 2 + headerH, label, headerH, 'pos', {
        size: L.S,
        color: c.textSecondary,
    })
    values.forEach((value, j) => {
        k.mid(mx + j * cell, y0 + nameRow * 2, cell, headerH, String(value), {
            align: 'center',
            size: L.S,
            mono: true,
        })
        k.mid(mx + j * cell, y0 + nameRow * 2 + headerH, cell, headerH, String(positions[j]), {
            align: 'center',
            size: L.S,
            mono: true,
            color: c.textSecondary,
        })
    })
    values.forEach((_, row) => {
        k.mid(x0, my + row * cell, label - 6, cell, String(row), {
            align: 'right',
            size: L.S,
            mono: true,
            color: row === QUERY ? c.textPrimary : c.textSecondary,
            weight: row === QUERY ? 700 : 400,
        })
        values.forEach((__, col) => {
            const reachable = col <= row && (!isolated || example[col] === example[row])
            const leak = row === QUERY && reachable && example[col] !== example[row]
            const fill = !reachable
                ? 'none'
                : row === QUERY
                  ? k.tint(leak ? 'critical' : 'green', leak ? 0.36 : 0.28)
                  : k.tint('blue', 0.22)
            k.rect(mx + col * cell, my + row * cell, cell, cell, {
                fill,
                stroke: c.border,
                rx: 0,
                strokeWidth: 1,
            })
            if (row === QUERY && reachable)
                k.dot(mx + col * cell + cell / 2, my + row * cell + cell / 2, L.print ? 4 : 5, {
                    fill: k.ink(leak ? 'critical' : 'green'),
                })
        })
    })
    const gold = k.ink('warm')
    k.line(mx + 3 * cell, y0 + nameRow, mx + 3 * cell, my + 6 * cell + 2, {
        stroke: gold,
        strokeWidth: 2.5,
    })
    k.line(mx - 2, my + 3 * cell, mx + 6 * cell + 2, my + 3 * cell, {
        stroke: gold,
        strokeWidth: 2.5,
    })
    const after = my + 6 * cell + (L.print ? 8 : 12)
    k.t(
        x0,
        after,
        L.print ? 320 : 322,
        isolated ? 'Query 4 reads 10, 20' : 'Query 4 reads all five values',
        { size: L.S, color: c.textSecondary },
    )
    k.t(
        x0,
        after + L.S * 1.45,
        L.print ? 320 : 322,
        isolated ? 'Add 100 to first: 15.0 to 15.0' : 'Add 100 to first: 7.2 to 67.2',
        { size: L.S, weight: 600, tone },
    )
}

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    panel(k, L, 6, 3, true)
    panel(k, L, L.W / 2 + 6, 3, false)
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
