import type { ThemeMode, ToneName } from 'vizmatic'
import { WEB, makeKit, type Layout, type Kit } from './_kit'

export const width = 672
export const height = 694
export const alt =
    'The first counterexample, chosen feature vector (1, 0) and verbose-error vector (0, 2), is projected by two heads fitted for 300 updates. On shared equal-unit axes, the confounded weight direction (1.629, 1.629) scores them 1.629 and 3.259; the balanced direction (2.667, 0) scores them 2.667 and 0. Both heads fit 2 of 2 training pairs, while their measured accuracy on the three controlled counterexamples is 1 of 3 and 3 of 3.'

const heads: {
    name: string
    w: [number, number]
    chosen: string
    violation: string
    accuracy: string
    tone: ToneName
}[] = [
    {
        name: 'Fit on confounded pairs',
        w: [1.629, 1.629],
        chosen: '1.629',
        violation: '3.259',
        accuracy: 'Counterexamples 1 of 3',
        tone: 'critical',
    },
    {
        name: 'Fit on balanced pairs',
        w: [2.667, 0],
        chosen: '2.667',
        violation: '0.000',
        accuracy: 'Counterexamples 3 of 3',
        tone: 'green',
    },
]

export const layoutHeight = (L: Layout) => (L.print ? 244 : 694)

function panel(k: Kit, L: Layout, x0: number, y0: number, head: (typeof heads)[number]) {
    const { c } = k
    const ink = k.ink(head.tone)
    const size = L.print ? 156 : 240
    const ox = x0 + (L.print ? 18 : 22)
    const oy = y0 + L.S * 1.5 + (L.print ? 14 : 20)
    const map = (x: number, y: number): [number, number] => [
        ox + (x / 3) * size,
        oy + size - (y / 3) * size,
    ]
    k.t(x0, y0, L.print ? 330 : L.W - 12, head.name, { size: L.S, weight: 600, tone: head.tone })
    ;[0, 1, 2, 3].forEach((v) => {
        k.line(map(v, 0)[0], map(v, 0)[1], map(v, 3)[0], map(v, 3)[1], { opacity: 0.3 })
        k.line(map(0, v)[0], map(0, v)[1], map(3, v)[0], map(3, v)[1], { opacity: 0.3 })
        k.t(map(v, 0)[0] - 14, map(v, 0)[1] + 2, 28, String(v), {
            size: L.S,
            align: 'center',
            color: c.textSecondary,
        })
        if (v > 0)
            k.t(map(0, v)[0] - 20, map(0, v)[1] - L.S * 0.7, 16, String(v), {
                size: L.S,
                align: 'right',
                color: c.textSecondary,
            })
    })
    // The figure's point is which feature a head leans on, so name both axes.
    k.t(ox, oy + size + 2 + L.S * 1.2, size, 'correctness', {
        size: L.S,
        align: 'center',
        color: c.textSecondary,
    })
    k.t(ox, oy - L.S * 1.25, size, 'length', { size: L.S, color: c.textSecondary })
    // Dashed: every point with the same score as the chosen answer.
    const [wx, wy] = head.w
    if (wy > 0) {
        const score = wx * 1
        const a = map(score / wx, 0)
        const b = map(0, score / wy)
        k.line(a[0], a[1], b[0], b[1], { stroke: k.ink('blue'), dash: '4 3' })
        const violationLevel = wy * 2
        const va = map(violationLevel / wx, 0)
        const vb = map(0, violationLevel / wy)
        k.line(va[0], va[1], vb[0], vb[1], { stroke: k.ink('warm'), dash: '4 3' })
    } else {
        const a = map(1, 0)
        const b = map(1, 3)
        k.line(a[0], a[1], b[0], b[1], { stroke: k.ink('blue'), dash: '4 3' })
        const va = map(0, 0)
        const vb = map(0, 3)
        k.line(va[0], va[1], vb[0], vb[1], { stroke: k.ink('warm'), dash: '4 3' })
    }
    const norm = Math.hypot(wx, wy)
    const tip = map((wx / norm) * 1.9, (wy / norm) * 1.9)
    const start = map(0, 0)
    k.arrow(start[0], start[1], tip[0], tip[1], { stroke: ink, strokeWidth: 2.25, size: 8 })
    const chosen = map(1, 0)
    const violation = map(0, 2)
    k.dot(chosen[0], chosen[1], L.print ? 5 : 7, { fill: k.ink('blue') })
    k.dot(violation[0], violation[1], L.print ? 5 : 7, { fill: k.ink('warm') })

    const tx = ox + size + (L.print ? 12 : 30)
    const tw = L.print ? 150 : L.W - tx - 8
    const ty = oy + (L.print ? 2 : 14)
    const lh = L.S * 1.42
    const rows: [string, ToneName | null, boolean][] = [
        [`w = (${wx.toFixed(3)}, ${wy.toFixed(3)})`, null, true],
        ['Chosen (1, 0)', 'blue', false],
        [`score ${head.chosen}`, 'blue', true],
        ['Verbose error (0, 2)', 'warm', false],
        [`score ${head.violation}`, 'warm', true],
        ['Train 2 of 2', null, false],
        [head.accuracy.replace('Counterexamples ', 'Tests '), head.tone, true],
    ]
    rows.forEach(([text, tone, strong], i) => {
        if (tone) k.t(tx, ty + i * lh, tw, text, { size: L.S, tone, weight: strong ? 600 : 400 })
        else k.t(tx, ty + i * lh, tw, text, { size: L.S, weight: strong ? 600 : 400 })
    })
}

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    panel(k, L, 6, 3, heads[0])
    if (L.print) panel(k, L, L.W / 2 + 6, 3, heads[1])
    else panel(k, L, 6, 348, heads[1])
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
