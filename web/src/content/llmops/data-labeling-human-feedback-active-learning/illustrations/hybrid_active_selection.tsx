import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 640
export const alt =
    'A square plot places six cases by coordinates. Cases 1, 2, and 3 are nearby canary examples at the center, and cases 4 handoff, 5 injection, and 6 keyboard lie far out in different corners. A table marks the highest-uncertainty batch as 1, 2, 3, and 5, covering two of four domains, and the hybrid batch as 1, 4, 5, and 6, covering all four. Stacked bars show step two of the hybrid selector with seed 1, where case 4 has the largest score 0.6U plus 0.4D, 0.796.'

const items = [
    { id: 1, domain: 0, x: 0, y: 0, u: 0.99 },
    { id: 2, domain: 0, x: 0.7, y: 0.6, u: 0.96 },
    { id: 3, domain: 0, x: -0.6, y: 0.7, u: 0.94 },
    { id: 4, domain: 1, x: 4.5, y: 4.5, u: 0.66 },
    { id: 5, domain: 2, x: -4.2, y: -4, u: 0.71 },
    { id: 6, domain: 3, x: 4.7, y: -4.1, u: 0.6 },
]
const top = [1, 2, 3, 5]
const hybrid = [1, 4, 5, 6]
const maxDistance = Math.max(...items.slice(1).map((item) => Math.hypot(item.x, item.y)))
const step2 = items.slice(1).map((item) => ({
    ...item,
    weightedU: 0.6 * item.u,
    weightedD: (0.4 * Math.hypot(item.x, item.y)) / maxDistance,
}))

export const layoutHeight = (L: Layout) => (L.print ? 330 : 640)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const domains = [L.print ? 'urgent admin' : 'canary', 'handoff', 'injection', 'keyboard']
    const blue = k.ink('blue')
    const purple = k.ink('purple')
    const green = k.ink('green')

    // Scatter: equal scales, so distance on the page is distance in the score.
    const size = L.print ? 300 : 330
    const ox = 8
    const oy = L.print ? 26 : 34
    const px = (x: number) => ox + ((x + 6) / 12) * size
    const py = (y: number) => oy + ((6 - y) / 12) * size
    k.t(ox, 3, size, 'Embedding position', { weight: 600, size: L.S })
    k.rect(ox, oy, size, size, { stroke: c.border, rx: 0 })
    // Distances from the seed, drawn for the three cases far from it.
    items
        .filter((item) => item.id >= 4)
        .forEach((item) =>
            k.line(px(0), py(0), px(item.x), py(item.y), {
                stroke: purple,
                strokeWidth: 1.25,
                dash: '4 4',
                opacity: 0.8,
            }),
        )
    items.forEach((item) => {
        const chosen = hybrid.includes(item.id)
        k.dot(px(item.x), py(item.y), L.print ? 6 : 8, {
            fill: chosen ? green : c.bg,
            stroke: chosen ? green : c.textPrimary,
            strokeWidth: 2,
        })
    })
    const place: Record<number, [number, number, 'left' | 'right']> = {
        1: [-14, -L.S * 0.7, 'right'],
        2: [12, -L.S * 0.7, 'left'],
        3: [-13, -L.S * 0.9, 'right'],
        4: [-13, -L.S * 1.2, 'right'],
        5: [12, -L.S * 0.2, 'left'],
        6: [-12, L.S * 0.15, 'right'],
    }
    items.forEach((item) => {
        const [dx, dy, align] = place[item.id]
        const w = 150
        const x = align === 'right' ? px(item.x) + dx - w : px(item.x) + dx
        const text = item.id >= 4 ? `${item.id} ${domains[item.domain]}` : String(item.id)
        k.t(x, py(item.y) + dy, w, text, {
            size: L.S,
            align,
            color: item.id >= 4 ? c.textPrimary : c.textSecondary,
        })
    })
    k.t(px(-0.6) - 160, py(0.7) - L.S * 2.4, 160, domains[0], {
        size: L.S,
        align: 'right',
        color: c.textSecondary,
    })

    // Selection table, aligned on case number.
    const tx = ox + size + (L.print ? 26 : 16)
    const tw = L.W - tx - 8
    const col = {
        id: tx,
        domain: tx + (L.print ? 22 : 24),
        u: tx + tw * (L.print ? 0.5 : 0.4),
        topU: tx + tw * (L.print ? 0.66 : 0.6),
        hybrid: tx + tw * (L.print ? 0.84 : 0.8),
    }
    const colW = tw * (L.print ? 0.16 : 0.2)
    const rowH = L.print ? 22 : 32
    k.t(col.u, 3, colW, 'U', { size: L.S, align: 'center', tone: 'blue', weight: 600 })
    k.t(col.topU, 3, colW, 'Top', { size: L.S, align: 'center', tone: 'blue', weight: 600 })
    k.t(col.hybrid, 3, colW, 'Hybrid', { size: L.S, align: 'center', tone: 'green', weight: 600 })
    k.line(tx, oy - 2, tx + tw, oy - 2, { opacity: 0.8 })
    items.forEach((item, i) => {
        const y = oy + i * rowH
        k.mid(col.id, y, 22, rowH, String(item.id), { size: L.S })
        if (L.print)
            k.mid(col.domain, y, 130, rowH, domains[item.domain], {
                size: L.S,
                color: c.textSecondary,
            })
        k.mid(col.u, y, colW, rowH, item.u.toFixed(2), { size: L.S, align: 'center' })
        if (top.includes(item.id))
            k.dot(col.topU + colW / 2, y + rowH / 2, L.print ? 5 : 7, { fill: blue })
        if (hybrid.includes(item.id))
            k.dot(col.hybrid + colW / 2, y + rowH / 2, L.print ? 5 : 7, { fill: green })
    })
    const domainY = oy + items.length * rowH
    k.line(tx, domainY, tx + tw, domainY, { opacity: 0.8 })
    k.mid(tx, domainY, tw * 0.6, rowH, 'Domains', { size: L.S, color: c.textSecondary })
    k.mid(col.topU, domainY, colW, rowH, '2/4', {
        size: L.S,
        align: 'center',
        tone: 'blue',
        weight: 600,
    })
    k.mid(col.hybrid, domainY, colW, rowH, '4/4', {
        size: L.S,
        align: 'center',
        tone: 'green',
        weight: 600,
    })

    // Step two of the hybrid: stacked score bars on one scale.
    const bx = L.print ? tx : ox + 34
    const by = L.print ? domainY + rowH + 8 : oy + size + 24
    const barH = L.print ? 18 : 26
    const barGap = L.print ? 4 : 10
    const scoreW = L.print ? 40 : 66
    const bw = (L.print ? tx + tw : L.W - 8) - bx - scoreW
    const legend = (x: number, y: number, fill: string, text: string, w: number) => {
        k.rect(x, y + L.S * 0.3, L.S * 0.8, L.S * 0.8, { fill, rx: 0 })
        k.t(x + L.S * 1.1, y, w, text, { size: L.S, color: c.textSecondary })
    }
    k.t(
        L.print ? tx : ox,
        by,
        L.print ? 80 : 300,
        L.print ? 'Step two' : 'Hybrid step two, seed = 1',
        { weight: 600, size: L.S },
    )
    if (L.print) {
        legend(tx + 84, by, blue, '0.6U', 50)
        legend(tx + 158, by, purple, '0.4D from seed', 150)
    }
    const barsY = by + L.S * 1.55
    step2.forEach((item, i) => {
        const y = barsY + i * (barH + barGap)
        const win = item.id === 4
        k.mid(L.print ? tx - 18 : ox, y, 24, barH, String(item.id), {
            size: L.S,
            weight: win ? 600 : 400,
        })
        k.rect(bx, y, bw * item.weightedU, barH, { fill: blue, rx: 0, opacity: win ? 1 : 0.55 })
        k.rect(bx + bw * item.weightedU, y, bw * item.weightedD, barH, {
            fill: purple,
            rx: 0,
            opacity: win ? 1 : 0.55,
        })
        k.mid(bx + bw + 2, y, scoreW - 2, barH, (item.weightedU + item.weightedD).toFixed(3), {
            size: L.S,
            align: 'right',
            weight: win ? 700 : 400,
            color: win ? green : c.textPrimary,
        })
    })
    if (!L.print) {
        const legendY = barsY + 5 * (barH + barGap) + 4
        legend(bx, legendY, blue, '0.6U uncertainty', 200)
        legend(bx + 230, legendY, purple, '0.4D distance from seed', L.W - bx - 262)
    }
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
