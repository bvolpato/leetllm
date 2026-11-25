import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 496
export const alt =
    'Top left: equal-unit 2D Voronoi map showing centroids C0=(0,0) and C1=(10,0), their dividing line x=5, query q=(4.9,0), and vectors v0, v1, v2, v3, v4. Top right: magnified view of the x=5 boundary showing distances 0.30 from q to v2=(4.6,0) and 0.50 from q to v3=(5.4,0) across the boundary. Bottom: aligned distance-rank comparison strips showing nprobe=1 (List 0 only) returning v2 and v1 for 50% Recall@2, while nprobe=2 (List 0 + List 1) recovers v2 and v3 for 100% Recall@2.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const cyan = fig.tone('cyan')
    const red = fig.tone('critical')
    const purple = fig.tone('purple')

    // ── Top Left: Main Equal-Unit 2D Voronoi Space ───────────────────────────
    fig.text(20, 18, 'Voronoi Partition Space (equal x/y units)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })

    const mainArea = { x: 46, y: 42, width: 396, height: 165 } // 396/12 = 33px/unit; 165/5 = 33px/unit
    const mainPlot = fig.plot(mainArea, { x: [-1, 11], y: [-2.5, 2.5] })

    // Soft List 0 and List 1 Voronoi cell regions
    const boundX = mainPlot.px(5)
    fig.rect(mainArea.x, mainArea.y, boundX - mainArea.x, mainArea.height, {
        fill: withColorAlpha(blue, 0.06),
    })
    fig.rect(boundX, mainArea.y, mainPlot.right - boundX, mainArea.height, {
        fill: withColorAlpha(warm, 0.06),
    })

    mainPlot.axes({
        xTicks: [0, 5, 10],
        yTicks: [-2, 0, 2],
        grid: true,
        labelSize: 15,
    })

    // Cell tags inside top corners
    fig.text(mainArea.x + 10, mainArea.y + 16, 'List 0 (C₀)', {
        size: 15,
        weight: 700,
        color: blue,
    })
    fig.text(mainPlot.right - 10, mainArea.y + 16, 'List 1 (C₁)', {
        size: 15,
        weight: 700,
        color: warm,
        align: 'right',
    })

    // Voronoi boundary x = 5
    fig.line(boundX, mainArea.y, boundX, mainPlot.bottom, {
        color: red,
        width: 2.2,
        dash: '5 4',
    })

    // Zoom region indicator rectangle around [4, 6] x [-1, 1]
    const zx1 = mainPlot.px(4)
    const zx2 = mainPlot.px(6)
    const zy1 = mainPlot.py(1)
    const zy2 = mainPlot.py(-1)
    fig.rect(zx1, zy1, zx2 - zx1, zy2 - zy1, {
        stroke: c.textSecondary,
        strokeWidth: 1.25,
        radius: 3,
    })

    // Centroids & vectors on main plot
    mainPlot.point(0, 0, { color: purple, r: 7 })
    mainPlot.point(10, 0, { color: warm, r: 7 })
    mainPlot.point(0.2, 0.1, { color: blue, r: 4.5 })
    mainPlot.point(0.4, -0.1, { color: blue, r: 4.5 })
    mainPlot.point(4.6, 0, { color: green, r: 5.5 })
    mainPlot.point(5.4, 0, { color: green, r: 5.5 })
    mainPlot.point(9.8, 0.2, { color: warm, r: 4.5 })

    // Query diamond q = (4.9, 0)
    const mqx = mainPlot.px(4.9)
    const mqy = mainPlot.py(0)
    fig.path(`M${mqx} ${mqy - 6}L${mqx + 6} ${mqy}L${mqx} ${mqy + 6}L${mqx - 6} ${mqy}Z`, {
        fill: cyan,
        color: c.bg,
        width: 1.2,
    })

    fig.text(mainPlot.px(0), mainPlot.py(0) + 22, 'C₀', {
        size: 15,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(mainPlot.px(10), mainPlot.py(0) + 22, 'C₁', {
        size: 15,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(mainPlot.px(0.35), mainPlot.py(0) - 22, 'v₀, v₁', {
        size: 15,
        weight: 600,
        color: blue,
        align: 'center',
    })
    fig.text(mainPlot.px(9.8), mainPlot.py(0.2) - 20, 'v₄', {
        size: 15,
        weight: 600,
        color: warm,
        align: 'center',
    })

    // ── Top Right: Boundary Zoom ([4.1, 5.9] x [-0.9, 0.9]) ──────────────────
    const zoomArea = { x: 486, y: 42, width: 234, height: 165 }
    fig.text(zoomArea.x, 18, 'Boundary Zoom (x = 5)', {
        size: 15,
        weight: 700,
        color: red,
    })

    // Subtle zoom connector line from main zoom box to detail frame
    fig.line(zx2, zy1, zoomArea.x, zoomArea.y, {
        color: c.borderSubtle,
        width: 1,
        dash: '3 4',
    })

    const zoomPlot = fig.plot(zoomArea, { x: [4.1, 5.9], y: [-0.9, 0.9] })
    const zBoundX = zoomPlot.px(5.0)
    fig.rect(zoomArea.x, zoomArea.y, zBoundX - zoomArea.x, zoomArea.height, {
        fill: withColorAlpha(blue, 0.06),
        radius: 6,
    })
    fig.rect(zBoundX, zoomArea.y, zoomPlot.right - zBoundX, zoomArea.height, {
        fill: withColorAlpha(warm, 0.06),
        radius: 6,
    })
    fig.rect(zoomArea.x, zoomArea.y, zoomArea.width, zoomArea.height, {
        stroke: c.border,
        strokeWidth: 1.2,
        radius: 6,
    })

    // Horizontal y = 0 axis and vertical x = 5 boundary
    fig.line(zoomArea.x + 6, zoomPlot.py(0), zoomPlot.right - 6, zoomPlot.py(0), {
        color: c.border,
        width: 1.25,
    })
    fig.line(zBoundX, zoomArea.y, zBoundX, zoomPlot.bottom, {
        color: red,
        width: 2.2,
        dash: '5 4',
    })

    // Distance span indicators: q-v2 (0.30) above axis, q-v3 (0.50) below axis
    const zv2x = zoomPlot.px(4.6)
    const zqx = zoomPlot.px(4.9)
    const zv3x = zoomPlot.px(5.4)
    const zy0 = zoomPlot.py(0)

    fig.line(zv2x, zy0 - 24, zqx, zy0 - 24, { color: green, width: 2.2 })
    fig.line(zv2x, zy0 - 29, zv2x, zy0 - 19, { color: green, width: 1.5 })
    fig.line(zqx, zy0 - 29, zqx, zy0 - 19, { color: green, width: 1.5 })
    fig.text(zBoundX - 10, zy0 - 38, 'd = 0.30', {
        size: 15,
        mono: true,
        weight: 700,
        color: green,
        align: 'right',
    })

    fig.line(zqx, zy0 + 26, zv3x, zy0 + 26, { color: warm, width: 2.2 })
    fig.line(zqx, zy0 + 21, zqx, zy0 + 31, { color: warm, width: 1.5 })
    fig.line(zv3x, zy0 + 21, zv3x, zy0 + 31, { color: warm, width: 1.5 })
    fig.text(zBoundX + 10, zy0 + 44, 'd = 0.50', {
        size: 15,
        mono: true,
        weight: 700,
        color: warm,
        align: 'left',
    })

    // Points on zoom plot
    zoomPlot.point(4.6, 0, { color: green, r: 6.5 })
    zoomPlot.point(5.4, 0, { color: green, r: 6.5 })
    fig.path(`M${zqx} ${zy0 - 7}L${zqx + 7} ${zy0}L${zqx} ${zy0 + 7}L${zqx - 7} ${zy0}Z`, {
        fill: cyan,
        color: c.bg,
        width: 1.5,
    })

    fig.text(zv2x - 6, zy0 + 24, 'v₂ (4.6)', {
        size: 15,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(zBoundX - 10, zy0 - 62, 'q (4.9)', {
        size: 15,
        mono: true,
        weight: 700,
        color: cyan,
        align: 'right',
    })
    fig.text(zv3x + 8, zy0 - 22, 'v₃ (5.4)', {
        size: 15,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })
    fig.text(zBoundX, zoomPlot.bottom + 16, 'x = 5', {
        size: 15,
        mono: true,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Divider between spatial plots and rank strips
    fig.line(20, 250, width - 20, 250, { color: c.borderSubtle, width: 1 })

    // ── Bottom: Visual Top-2 Rank Comparison Strips (nprobe=1 vs nprobe=2) ───
    const drawStrip = (
        sx: number,
        sw: number,
        title: string,
        sub: string,
        badge: string,
        badgeColor: string,
        items: readonly {
            id: string
            list: string
            dist: number
            rank: string
            state: 'hit' | 'wrong' | 'missed'
        }[],
    ) => {
        const topY = 272
        fig.text(sx, topY, title, { size: 16, weight: 700, color: c.textPrimary })
        fig.text(sx, topY + 26, sub, { size: 15, color: c.textSecondary })

        // Recall badge
        fig.rect(sx + sw - 146, topY - 12, 146, 30, {
            fill: withColorAlpha(badgeColor, 0.16),
            stroke: badgeColor,
            strokeWidth: 1.5,
            radius: 15,
        })
        fig.text(sx + sw - 73, topY + 3, badge, {
            size: 15,
            mono: true,
            weight: 700,
            color: badgeColor,
            align: 'center',
        })

        // Distance bar scale: 0..5.0 units -> 124px (shorter bar = closer!)
        const barX = sx + 74
        const barMaxW = 124
        const dMax = 5.0

        fig.text(barX, topY + 54, 'Distance to q (closer = shorter)', {
            size: 15,
            color: c.textMuted,
        })

        items.forEach((it, idx) => {
            const ry = topY + 84 + idx * 42
            const col =
                it.state === 'hit' ? green : it.state === 'wrong' ? warm : red
            const isMissed = it.state === 'missed'

            fig.text(sx, ry, `${it.id}`, {
                size: 15,
                mono: true,
                weight: 700,
                color: isMissed ? red : c.textPrimary,
            })
            fig.text(sx + 32, ry, it.list, {
                size: 15,
                color: c.textMuted,
            })

            // Bar track
            fig.rect(barX, ry - 8, barMaxW, 16, {
                fill: tint(c.border, c.bg, 0.25),
                radius: 4,
            })
            const bw = Math.max(10, (it.dist / dMax) * barMaxW)
            fig.rect(barX, ry - 8, bw, 16, {
                fill: isMissed ? withColorAlpha(red, 0.14) : col,
                stroke: isMissed ? red : 'none',
                strokeWidth: isMissed ? 1.4 : 0,
                opacity: isMissed ? 1 : 0.88,
                radius: 4,
            })

            fig.text(barX + barMaxW + 8, ry, it.dist.toFixed(2), {
                size: 15,
                mono: true,
                weight: 700,
                color: col,
            })

            fig.text(sx + sw, ry, it.rank, {
                size: 15,
                mono: true,
                weight: 700,
                color: col,
                align: 'right',
            })
        })
    }

    drawStrip(20, 336, 'nprobe = 1', 'List 0 only (v₀–v₂)', 'Recall@2: 50%', red, [
        { id: 'v₂', list: 'L0', dist: 0.3, rank: '#1 hit', state: 'hit' },
        { id: 'v₁', list: 'L0', dist: 4.5, rank: '#2 far', state: 'wrong' },
        { id: 'v₃', list: 'L1', dist: 0.5, rank: 'missed', state: 'missed' },
    ])

    fig.line(372, 264, 372, 480, { color: c.borderSubtle, width: 1 })

    drawStrip(390, 330, 'nprobe = 2', 'List 0 + List 1 (v₀–v₄)', 'Recall@2: 100%', green, [
        { id: 'v₂', list: 'L0', dist: 0.3, rank: '#1 hit', state: 'hit' },
        { id: 'v₃', list: 'L1', dist: 0.5, rank: '#2 hit', state: 'hit' },
        { id: 'v₁', list: 'L0', dist: 4.5, rank: '#3', state: 'wrong' },
    ])

    return fig.render()
}

export default create('dark')
