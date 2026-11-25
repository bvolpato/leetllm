import type { ThemeMode, ToneName } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 435
export const alt =
    'Product quantization and asymmetric distance computation (ADC) across four 2d subspaces s1 through s4. Top: four mini 2d Voronoi plots show unquantized query subvectors qs sitting close to centroid ID 1 (distance 0.02 each) and far from centroid ID 0 (distances 12.10, 4.49, 30.28, 9.70). Middle: aligned 2x4 ADC lookup table T[id][s] stores those squared distances. Bottom: scoring stored 4-byte PQ codes reduces to four table additions, with FlashAttn [1,1,1,1] summing to 0.08 while LayerNorm [0,0,0,0] sums to 56.57.'

const subspaces: Array<{
    name: string
    slice: string
    d0: number
    d1: number
    tone: ToneName
    c0: [number, number]
    c1: [number, number]
    q: [number, number]
}> = [
    { name: 's₁', slice: '[0:2]', d0: 12.1, d1: 0.02, tone: 'purple', c0: [0.22, 0.26], c1: [0.76, 0.72], q: [0.71, 0.67] },
    { name: 's₂', slice: '[2:4]', d0: 4.49, d1: 0.02, tone: 'blue', c0: [0.28, 0.74], c1: [0.75, 0.3], q: [0.7, 0.35] },
    { name: 's₃', slice: '[4:6]', d0: 30.28, d1: 0.02, tone: 'cyan', c0: [0.18, 0.2], c1: [0.82, 0.8], q: [0.77, 0.76] },
    { name: 's₄', slice: '[6:8]', d0: 9.7, d1: 0.02, tone: 'green', c0: [0.24, 0.68], c1: [0.76, 0.28], q: [0.72, 0.33] },
]

const adcTable = [
    subspaces.map((s) => s.d0),
    subspaces.map((s) => s.d1),
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const red = fig.tone('critical')
    const green = fig.tone('green')
    const cyan = fig.tone('cyan')
    const isDark = theme === 'dark'

    // ─── TOP: 4 mini 2D Voronoi subspace cells aligned above the 4 ADC columns ───
    fig.text(398, 18, 'Four 2D subspaces: exact query subvector qₛ vs centroids c₀, c₁', {
        size: 14,
        color: c.textPrimary,
        align: 'center',
        weight: 700,
    })

    const gridX = 112
    const colW = 140
    const colGap = 12
    const vorY = 50
    const vorH = 104

    subspaces.forEach((s, idx) => {
        const x = gridX + idx * (colW + colGap)
        const subCol = fig.tone(s.tone)

        // Subspace header
        fig.text(x + colW / 2, vorY - 12, `${s.name} ${s.slice}`, {
            size: 13.5,
            color: subCol,
            align: 'center',
            mono: true,
            weight: 700,
        })

        // Subtle Voronoi box
        fig.rect(x, vorY, colW, vorH, {
            fill: tint(subCol, c.bg, isDark ? 0.09 : 0.06),
            stroke: c.borderSubtle,
            strokeWidth: 1.2,
            radius: 6,
        })

        const mapPt = ([u, v]: [number, number]): [number, number] => [
            x + 12 + u * (colW - 24),
            vorY + vorH - 12 - v * (vorH - 24),
        ]
        const p0 = mapPt(s.c0)
        const p1 = mapPt(s.c1)
        const pq = mapPt(s.q)

        // Perpendicular Voronoi bisector between c0 and c1 (clipped nicely inside box)
        const mx = (p0[0] + p1[0]) / 2
        const my = (p0[1] + p1[1]) / 2
        const dx = p1[0] - p0[0]
        const dy = p1[1] - p0[1]
        const len = Math.hypot(dx, dy) || 1
        const nx = -dy / len
        const ny = dx / len
        const halfBis = 36
        fig.line(mx - nx * halfBis, my - ny * halfBis, mx + nx * halfBis, my + ny * halfBis, {
            color: c.borderLight,
            width: 1.25,
            dash: '4 3',
        })

        // Distance segments from query q_s to both centroids
        fig.line(pq[0], pq[1], p0[0], p0[1], { color: red, width: 1.5, dash: '3 3', opacity: 0.85 })
        fig.line(pq[0], pq[1], p1[0], p1[1], { color: green, width: 2.2 })

        // Centroid markers + query dot
        fig.circle(p0[0], p0[1], 5.5, { fill: red, stroke: c.bg, width: 1.6 })
        fig.circle(p1[0], p1[1], 5.5, { fill: green, stroke: c.bg, width: 1.6 })
        fig.circle(pq[0], pq[1], 4.2, { fill: cyan, stroke: c.bg, width: 1.4 })

        // Micro labels c0, c1, q
        fig.text(p0[0] + (p0[0] < mx ? -12 : 12), p0[1] + (p0[1] > my ? 10 : -10), 'c₀', {
            size: 12.5,
            color: red,
            align: 'center',
            mono: true,
            weight: 700,
        })
        fig.text(p1[0] + 12, p1[1] + (p1[1] < my ? -8 : 10), 'c₁', {
            size: 12.5,
            color: green,
            align: 'center',
            mono: true,
            weight: 700,
        })

        // Arrow down from Voronoi subspace directly into its column in the ADC lookup table
        fig.arrow(x + colW / 2, vorY + vorH + 4, x + colW / 2, 180, {
            color: subCol,
            width: 1.5,
            head: 5,
        })
    })

    // ─── MIDDLE: Aligned 2x4 ADC lookup table T[id][s] ───
    const tableW = 4 * colW + 3 * colGap
    fig.heatGrid(adcTable, { x: gridX, y: 186, width: tableW, height: 92 }, {
        scale: 'sequential',
        domain: [0, 32],
        rowLabels: ['ID 0', 'ID 1'],
        labelSize: 13.5,
        valueSize: 14.5,
        format: (v) => v.toFixed(2),
        gap: colGap,
        radius: 5,
        highlightRow: 1,
        highlightColor: green,
        rowLabelGap: 12,
    })

    fig.math(398, 298, String.raw`T[\mathrm{id}][s] = \| q_s - c_{s,\mathrm{id}} \|^2`, {
        size: 14.5,
        color: c.textSecondary,
        align: 'center',
    })

    // ─── BOTTOM: Code lookup + table-sum strips (replacing HTML tables) ───
    const stripY1 = 344
    const stripY2 = 394

    const drawCodeSum = (
        y: number,
        name: string,
        code: string,
        sumExpr: string,
        total: string,
        col: string,
        winner: boolean,
    ) => {
        fig.text(20, y, name, { size: 14, color: col, weight: 700 })
        // 4-byte code pill
        fig.rect(112, y - 15, 118, 30, {
            fill: tint(col, c.bg, isDark ? 0.28 : 0.18),
            stroke: col,
            strokeWidth: 1.5,
            radius: 5,
        })
        fig.text(171, y, code, {
            size: 13.5,
            color: c.textPrimary,
            align: 'center',
            mono: true,
            weight: 700,
        })
        fig.arrow(236, y, 268, y, { color: col, width: 1.6, head: 5 })
        fig.text(276, y, sumExpr, {
            size: 13.5,
            color: c.textSecondary,
            mono: true,
        })
        fig.text(width - 20, y, winner ? `= ${total}  ★ nearest` : `= ${total}`, {
            size: 14.5,
            color: col,
            align: 'right',
            mono: true,
            weight: 800,
        })
    }

    drawCodeSum(
        stripY1,
        'FlashAttn',
        '[1, 1, 1, 1]',
        '0.02 + 0.02 + 0.02 + 0.02',
        '0.08',
        green,
        true,
    )
    drawCodeSum(
        stripY2,
        'LayerNorm',
        '[0, 0, 0, 0]',
        '12.10 + 4.49 + 30.28 + 9.70',
        '56.57',
        red,
        false,
    )

    return fig.render()
}

export default create('dark')
