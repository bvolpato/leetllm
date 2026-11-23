import type { ThemeMode } from 'vizmatic'
import { canvas, pk, tint } from '../serving-figure-kit'

export const width = 510
export const height = 358
export const alt =
    'For a four-token prompt, prefill stores four K/V pairs and emits y1 outside the cache. Decoding consumes y1, appends its pair, and emits y2; consuming y2 makes six cached positions and emits y3. Each query attends over its consumed prefix. One stream has one input row per step; a batch of four has four rows.'

const CELL = 49
const GAP = 3
const X = 90

export function create(theme: ThemeMode = 'dark') {
    const k = pk(theme)
    const s = canvas(k, width, height)

    const steps = [
        {
            name: 'Prefill',
            input: 'p1 to p4',
            cached: ['p1', 'p2', 'p3', 'p4'],
            fresh: 4,
            emit: 'y1',
        },
        {
            name: 'Decode',
            input: 'y1',
            cached: ['p1', 'p2', 'p3', 'p4', 'y1'],
            fresh: 1,
            emit: 'y2',
        },
        {
            name: 'Decode',
            input: 'y2',
            cached: ['p1', 'p2', 'p3', 'p4', 'y1', 'y2'],
            fresh: 1,
            emit: 'y3',
        },
    ]
    s.text(8, 12, 'Step', { color: k.faint })
    s.text(X, 12, 'K and V pairs in the cache after this step', { color: k.state, weight: 700 })
    s.text(476, 12, 'Emits', { color: k.faint, align: 'center' })

    steps.forEach((step, row) => {
        const y = 28 + row * 58
        s.text(8, y + 13, step.name, { weight: 700 })
        s.text(8, y + 33, step.input, { mono: true, color: k.mid })
        step.cached.forEach((label, i) => {
            const isNew = i >= step.cached.length - step.fresh
            const color = label.startsWith('y') ? k.decode : k.prefill
            s.cell(X + i * (CELL + GAP), y, CELL, 46, label, {
                mono: true,
                fill: isNew ? tint(k.state, 0.22) : tint(color, 0.1),
                stroke: isNew ? k.state : tint(color, 0.45),
                width: isNew ? 1.5 : 1,
                weight: isNew ? 700 : 500,
            })
        })
        const tail = X + step.cached.length * (CELL + GAP)
        s.arrow(tail + 2, y + 23, 448, y + 23, k.faint, { dash: '3 3' })
        s.cell(452, y + 4, 48, 38, step.emit, {
            mono: true,
            stroke: k.decode,
            color: k.decode,
            weight: 700,
            r: 19,
        })
    })

    s.text(8, 216, 'P = 4 and O = 3 give P + O − 1 = 6 cached positions.', { color: k.mid })

    // Batch shape.
    s.line(8, 238, 502, 238, k.line)
    s.text(8, 256, 'One decode step, by input shape', { color: k.faint })
    const grid = (x: number, y: number, rows: number) => {
        for (let r = 0; r < rows; r++) s.rect(x, y + r * 13, 120, 10, { fill: k.decode })
    }
    grid(8, 280, 1)
    s.text(138, 285, 'One stream: 1 row of width d')
    grid(8, 304, 4)
    s.text(138, 327, 'Batch of 4: 4 rows')
    return s.render()
}
