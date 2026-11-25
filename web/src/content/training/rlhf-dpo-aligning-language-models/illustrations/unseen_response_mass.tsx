import type { ThemeMode, ToneName } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 690
export const alt =
    'A probability simplex contains a uniform reference and two policies. Policy 1 assigns probabilities 0.40, 0.10, and 0.50 to A, B, and unseen C; policy 2 assigns 0.08, 0.02, and 0.90. Both keep A-to-B odds at 4 to 1, so the DPO pair loss remains 0.62623 at beta 0.1 while C mass rises from 50 to 90 percent.'

const policies = [
    { name: 'Policy 1', a: 0.4, b: 0.1, c: 0.5 },
    { name: 'Policy 2', a: 0.08, b: 0.02, c: 0.9 },
]
const parts: { key: 'a' | 'b' | 'c'; label: string; tone: ToneName }[] = [
    { key: 'a', label: 'A', tone: 'green' },
    { key: 'b', label: 'B', tone: 'warm' },
    { key: 'c', label: 'C', tone: 'critical' },
]

export const layoutHeight = (L: Layout) => (L.print ? 290 : 690)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    // A triangle holds every three-answer policy. Corners are certainty on one answer.
    const side = L.print ? 270 : 400
    const triH = (side * Math.sqrt(3)) / 2
    const ox = L.print ? 34 : (L.W - side) / 2
    const oy = L.print ? 26 : 34
    const vertex = { a: [ox, oy + triH], b: [ox + side, oy + triH], c: [ox + side / 2, oy] }
    const point = (a: number, b: number, cc: number): [number, number] => [
        a * vertex.a[0] + b * vertex.b[0] + cc * vertex.c[0],
        a * vertex.a[1] + b * vertex.b[1] + cc * vertex.c[1],
    ]
    k.path(
        `M${vertex.a[0]} ${vertex.a[1]}L${vertex.b[0]} ${vertex.b[1]}L${vertex.c[0]} ${vertex.c[1]}Z`,
        { stroke: c.textMuted, fill: k.tint('blue', 0.06) },
    )
    // Every point on this line has A:B odds of 4 to 1, so the pair loss cannot tell them apart.
    const foot = point(0.8, 0.2, 0)
    k.line(foot[0], foot[1], vertex.c[0], vertex.c[1], {
        stroke: k.ink('purple'),
        strokeWidth: 1.75,
        dash: '5 4',
    })
    k.t(vertex.a[0] - 30, vertex.a[1] + 3, 60, 'A', {
        size: L.S,
        align: 'center',
        weight: 600,
        tone: 'green',
    })
    k.t(vertex.b[0] - 30, vertex.b[1] + 3, 60, 'B', {
        size: L.S,
        align: 'center',
        weight: 600,
        tone: 'warm',
    })
    k.t(vertex.c[0] + 10, vertex.c[1] - 4, 60, 'C', { size: L.S, weight: 600, tone: 'critical' })
    k.t(foot[0] - 70, foot[1] + 3, 140, 'odds 4 to 1', {
        size: L.S,
        align: 'center',
        tone: 'purple',
    })
    const reference = point(1 / 3, 1 / 3, 1 / 3)
    k.dot(reference[0], reference[1], L.print ? 4 : 5, { fill: c.bg, stroke: c.textSecondary })
    k.t(reference[0] + (L.print ? 10 : 14), reference[1] - L.S * 0.7, 118, 'reference', {
        size: L.S,
        color: c.textSecondary,
    })
    policies.forEach((policy) => {
        const [x, y] = point(policy.a, policy.b, policy.c)
        k.dot(x, y, L.print ? 5.5 : 7, { fill: k.ink('critical') })
        // Keep labels off the triangle's edge. Policy 1 has room inside, right of the dashed line.
        // Policy 2 sits near the apex, so its label goes just outside the left edge.
        if (policy.c < 0.7) {
            k.t(x + 10, y - L.S * 0.7, 94, policy.name, { size: L.S, weight: 600 })
        } else {
            const edgeX = vertex.a[0] + ((vertex.c[0] - vertex.a[0]) * (vertex.a[1] - y)) / triH
            k.t(edgeX - 8 - 94, y - L.S * 0.7, 94, policy.name, {
                size: L.S,
                align: 'right',
                weight: 600,
            })
        }
    })

    // Stacked bars read the same two points as probabilities.
    const bx = L.print ? ox + side + 54 : 10
    const by = L.print ? 30 : oy + triH + 62
    const bw = L.W - bx - 10
    const rowH = L.print ? 96 : 108
    const barH = L.print ? 30 : 40
    policies.forEach((policy, row) => {
        const y = by + row * rowH
        k.t(bx, y, bw, `${policy.name}: A:B odds 4 to 1, loss 0.62623`, { size: L.S })
        const barY = y + L.S * 1.5
        let start = 0
        parts.forEach((part) => {
            const value = policy[part.key]
            const w = value * bw
            k.rect(bx + start * bw, barY, w, barH, {
                fill: k.tint(part.tone, 0.42),
                stroke: k.ink(part.tone),
                rx: 0,
            })
            if (w > (L.print ? 44 : 70))
                k.mid(bx + start * bw, barY, w, barH, `${part.label} ${value.toFixed(2)}`, {
                    size: L.S,
                    align: 'center',
                })
            start += value
        })
        if (row === 1) {
            k.t(bx, barY + barH + 3, 70, 'A 0.08', { size: L.S, tone: 'green' })
            k.t(bx + (L.print ? 58 : 78), barY + barH + 3, 70, 'B 0.02', {
                size: L.S,
                tone: 'warm',
            })
        }
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
