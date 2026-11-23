import type { ThemeMode, ToneName } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 606
export const alt =
    'A routing grid. Five kinds of cleaned record are rows, and five destinations are columns, split by a wall into three destinations outside training and two that lead to it. A reserved unsafe attack goes to the evaluation set and incident review. An unsafe trace that grants access or exposes data goes to incident review. A safe pair that needs more context goes to human review. A safe pair with a clear winner goes to the preference queue. An approved answer goes to the demonstration queue. Only those last two rows cross the wall.'

const destinations = [
    ['Eval', 'set'],
    ['Incident', 'review'],
    ['Human', 'review'],
    ['Pair', 'queue'],
    ['Demo', 'queue'],
]
const rows: { name: string; id?: string; note: string; printNote?: string; to: number[] }[] = [
    { name: 'Reserved attack', id: 'attack-014', note: 'unsafe, held for testing', to: [0, 1] },
    {
        name: 'Unsafe trace',
        id: 'leak-008',
        note: 'exposes private data',
        printNote: 'grants access or exposes data',
        to: [1],
    },
    // The reader's edition names its REVIEW label. The website's lesson has no such label.
    {
        name: 'Safe pair',
        note: 'needs more context',
        printNote: 'REVIEW, needs more context',
        to: [2],
    },
    { name: 'Safe pair', id: 'eligible-102', note: 'clear winner', to: [3] },
    { name: 'Approved answer', note: 'reviewed target', to: [4] },
]

export const layoutHeight = (L: Layout) => (L.print ? 268 : 606)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const left = 6
    const nameW = (L.print ? 0.5 : 0.37) * L.W
    const colW = (L.W - nameW - 8) / destinations.length
    const colX = (i: number) => nameW + i * colW
    const wall = colX(3)
    const strip = L.print ? 0 : 46
    const head = (L.print ? 70 : 118) + strip
    const rowH = L.print ? 38 : 84
    const rowY = (r: number) => head + r * rowH
    const bottom = rowY(rows.length)
    const line = L.S * 1.3

    // The website's example records carry their IDs, and redaction comes first.
    if (!L.print) {
        k.t(left, 3, 340, 'Cleaned first: owner email becomes', {
            size: L.S,
            color: c.textSecondary,
        })
        k.t(left + 350, 3, L.W - left - 356, '<OWNER_1>', { size: L.S, mono: true })
    }
    k.rect(wall, 3 + strip, colW * 2, bottom - strip + 1, { fill: k.tint('green', 0.1), rx: 3 })
    k.t(colX(0), 5 + strip, colW * 3 - 6, 'Kept out of training', {
        tone: 'warm',
        align: 'center',
        weight: 600,
        size: L.S,
    })
    k.t(colX(3), 5 + strip, colW * 2, 'Can train', {
        tone: 'green',
        align: 'center',
        weight: 600,
        size: L.S,
    })
    destinations.forEach((words, i) => {
        words.forEach((word, n) =>
            k.t(colX(i), head - 8 - (words.length - n) * line, colW, word, {
                align: 'center',
                size: L.S,
                color: c.textSecondary,
            }),
        )
        k.line(colX(i) + colW / 2, head, colX(i) + colW / 2, bottom, { opacity: 0.3 })
    })
    rows.forEach((row, index) => {
        const y = rowY(index)
        k.line(left, y, L.W - 6, y, { opacity: 0.7 })
        if (L.print) {
            // The note may run up to the first column's dot, so it stays on one line.
            const noteX = left + 0.2 * L.W
            k.mid(left, y, 0.2 * L.W, rowH, row.name, { weight: 600 })
            k.mid(noteX, y, colX(0) + colW / 2 - 12 - noteX, rowH, row.printNote ?? row.note, {
                color: c.textSecondary,
            })
        } else {
            k.t(left, y + 10, nameW, row.id ?? row.name, {
                weight: 600,
                mono: Boolean(row.id),
                size: row.id ? L.S : L.T,
            })
            k.t(left, y + 44, nameW, row.note, { size: L.S, color: c.textSecondary })
        }
        row.to.forEach((col) => {
            const tone: ToneName = col >= 3 ? 'green' : col === 2 ? 'purple' : 'warm'
            k.dot(colX(col) + colW / 2, y + rowH / 2, L.print ? 7.5 : 11, { fill: k.ink(tone) })
        })
    })
    k.line(left, bottom, L.W - 6, bottom, { opacity: 0.7 })
    k.line(wall, 3 + strip, wall, bottom + 4, { stroke: c.textPrimary, strokeWidth: 2 })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
