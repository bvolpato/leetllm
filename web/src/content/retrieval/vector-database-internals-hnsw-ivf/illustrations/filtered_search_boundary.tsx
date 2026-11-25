import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 472
export const alt =
    'Side-by-side 2D vector neighborhoods compare post-filtering versus pre-filtered ACORN traversal for query q=(5,5) with predicate region=EU and k=3. On the left, the unfiltered top-3 circle captures eu-1, us-1, and us-2; dropping disallowed US points leaves only eu-1 (1/3 underfilled). On the right, filter-aware ACORN traversal skips US nodes and steps cleanly through eligible EU vectors eu-4, eu-2, eu-1, and eu-3 to fill all 3/3 slots.'

interface VecPoint {
    readonly id: string
    readonly x: number
    readonly y: number
    readonly eu: boolean
}

const POINTS: readonly VecPoint[] = [
    { id: 'eu-1', x: 5.5, y: 5.6, eu: true },
    { id: 'us-1', x: 4.3, y: 5.4, eu: false },
    { id: 'us-2', x: 5.7, y: 4.5, eu: false },
    { id: 'us-3', x: 4.2, y: 4.0, eu: false },
    { id: 'us-4', x: 6.4, y: 5.8, eu: false },
    { id: 'us-5', x: 3.3, y: 5.9, eu: false },
    { id: 'us-6', x: 6.8, y: 3.5, eu: false },
    { id: 'us-7', x: 3.0, y: 3.0, eu: false },
    { id: 'eu-2', x: 7.3, y: 6.6, eu: true },
    { id: 'eu-3', x: 2.6, y: 6.9, eu: true },
    { id: 'eu-4', x: 7.9, y: 2.5, eu: true },
]

const QUERY = { x: 5.0, y: 5.0 }

// Explicit pixel offsets (dx, dy, align) verified clear of dots, rings, arrows, and borders
const LEFT_LABELS: Record<
    string,
    { dx: number; dy: number; align: 'left' | 'center' | 'right' }
> = {
    'eu-1': { dx: 12, dy: -16, align: 'left' },
    'us-1': { dx: -13, dy: -14, align: 'right' },
    'us-2': { dx: 14, dy: 12, align: 'left' },
    'eu-2': { dx: 0, dy: -18, align: 'center' },
    'eu-3': { dx: 0, dy: -18, align: 'center' },
}

const RIGHT_LABELS: Record<
    string,
    { dx: number; dy: number; align: 'left' | 'center' | 'right' }
> = {
    'eu-1': { dx: 15, dy: 14, align: 'left' },
    'eu-2': { dx: 0, dy: -23, align: 'center' },
    'eu-3': { dx: 0, dy: -23, align: 'center' },
    'eu-4': { dx: 0, dy: 20, align: 'center' },
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const warm = fig.tone('warm')

    // ── Shared Top Legend (crisp 13px labels, frameless) ─────────────────────
    const legY = 18
    fig.text(20, legY, 'Filter: region = EU · k = 3', {
        size: 13,
        mono: true,
        weight: 700,
        color: c.textPrimary,
    })

    // Query diamond legend mark
    const qLx = 266
    fig.path(
        `M${qLx} ${legY - 6}L${qLx + 6} ${legY}L${qLx} ${legY + 6}L${qLx - 6} ${legY}Z`,
        { fill: cyan },
    )
    fig.text(qLx + 12, legY, 'Query q', { size: 13, color: c.textSecondary })

    // Eligible EU circle
    fig.circle(362, legY, 5.5, { fill: green })
    fig.text(373, legY, 'EU (eligible)', { size: 13, color: c.textSecondary })

    // Excluded US circle
    fig.circle(486, legY, 5, { fill: c.textMuted, opacity: 0.5 })
    fig.text(497, legY, 'US (excluded)', { size: 13, color: c.textSecondary })

    // Dropped X mark
    const xLx = 618
    fig.line(xLx - 4.5, legY - 4.5, xLx + 4.5, legY + 4.5, { color: red, width: 2 })
    fig.line(xLx + 4.5, legY - 4.5, xLx - 4.5, legY + 4.5, { color: red, width: 2 })
    fig.text(xLx + 11, legY, 'Dropped', { size: 13, color: c.textSecondary })

    fig.line(20, 36, width - 20, 36, { color: c.borderSubtle, width: 1 })

    // ── Equal-Unit 2D Plots (domain [0.5, 9.5] x [1.2, 8.8] => exact 1:1 scale)
    const plotW = 334
    const plotH = 282 // 334 / 9.0 = 37.11 px/unit; 282 / 7.6 = 37.11 px/unit
    const unitPx = plotW / 9.0
    const leftX = 20
    const rightX = 406
    const plotY = 92
    const domain = { x: [0.5, 9.5] as const, y: [1.2, 8.8] as const }

    const leftPlot = fig.plot({ x: leftX, y: plotY, width: plotW, height: plotH }, domain)
    const rightPlot = fig.plot({ x: rightX, y: plotY, width: plotW, height: plotH }, domain)

    // Panel headings (frameless)
    fig.text(leftX, 54, 'Post-Filtering · Fixed top-3 disk', {
        size: 16,
        weight: 700,
        color: red,
    })
    fig.text(leftX, 74, 'Unfiltered top-3 grabs us-1, us-2 then drops them', {
        size: 13,
        color: c.textSecondary,
    })

    fig.text(rightX, 54, 'Pre-Filtered · ACORN Traversal', {
        size: 16,
        weight: 700,
        color: green,
    })
    fig.text(rightX, 74, 'Skips US nodes inside index to reach EU neighbors', {
        size: 13,
        color: c.textSecondary,
    })

    // Subtle vertical divider between plots
    fig.line(380, 48, 380, 456, { color: c.borderSubtle, width: 1 })

    // Draw subtle plot backgrounds & gridlines
    for (const p of [leftPlot, rightPlot]) {
        fig.rect(p.area.x, p.area.y, p.area.width, p.area.height, {
            fill: withColorAlpha(c.bgSubtle, theme === 'light' ? 0.55 : 0.38),
            stroke: c.borderSubtle,
            strokeWidth: 1,
            radius: 8,
        })
        for (const v of [2, 4, 6, 8]) {
            fig.line(p.px(v), p.area.y + 4, p.px(v), p.bottom - 4, {
                color: c.borderSubtle,
                width: 0.75,
                dash: '3 4',
                opacity: 0.65,
            })
            fig.line(p.area.x + 4, p.py(v), p.right - 4, p.py(v), {
                color: c.borderSubtle,
                width: 0.75,
                dash: '3 4',
                opacity: 0.65,
            })
        }
    }

    // ── LEFT PLOT: Post-filtering disk (true circle r = 1.15 units) ──────────
    const lqx = leftPlot.px(QUERY.x)
    const lqy = leftPlot.py(QUERY.y)
    fig.circle(lqx, lqy, 1.15 * unitPx, {
        fill: withColorAlpha(warm, 0.14),
        stroke: warm,
        width: 2,
    })

    for (const pt of POINTS) {
        const cx = leftPlot.px(pt.x)
        const cy = leftPlot.py(pt.y)
        const dropped = pt.id === 'us-1' || pt.id === 'us-2'
        const kept = pt.id === 'eu-1'

        if (kept) {
            fig.circle(cx, cy, 12, { stroke: green, width: 2.2 })
        }
        fig.circle(cx, cy, pt.eu ? 6.5 : 5.5, {
            fill: pt.eu ? green : c.textMuted,
            stroke: c.bg,
            width: 1.5,
            opacity: pt.eu || dropped ? 1 : 0.4,
        })
        if (dropped) {
            fig.line(cx - 7, cy - 7, cx + 7, cy + 7, { color: red, width: 2.4 })
            fig.line(cx + 7, cy - 7, cx - 7, cy + 7, { color: red, width: 2.4 })
        }

        const spec = LEFT_LABELS[pt.id]
        if (spec) {
            fig.text(cx + spec.dx, cy + spec.dy, pt.id, {
                size: 13,
                mono: true,
                weight: 700,
                color: pt.eu ? green : red,
                align: spec.align,
            })
        }
    }

    // Left Query Diamond + label
    fig.path(
        `M${lqx} ${lqy - 8}L${lqx + 8} ${lqy}L${lqx} ${lqy + 8}L${lqx - 8} ${lqy}Z`,
        { fill: cyan, color: c.bg, width: 1.5 },
    )
    fig.text(lqx - 14, lqy + 16, 'q', {
        size: 14,
        mono: true,
        weight: 800,
        color: cyan,
        align: 'center',
    })

    // ── RIGHT PLOT: Pre-filtered ACORN traversal (true circle r = 3.15 units) ─
    const rqx = rightPlot.px(QUERY.x)
    const rqy = rightPlot.py(QUERY.y)
    fig.circle(rqx, rqy, 3.15 * unitPx, {
        fill: withColorAlpha(green, 0.08),
        stroke: withColorAlpha(green, 0.65),
        width: 1.75,
    })

    const byId = Object.fromEntries(POINTS.map((p) => [p.id, p]))
    const hops: readonly (readonly [string, string])[] = [
        ['eu-4', 'eu-2'],
        ['eu-2', 'eu-1'],
        ['eu-1', 'eu-3'],
    ]
    for (const [fromId, toId] of hops) {
        const a = byId[fromId]!
        const b = byId[toId]!
        const x1 = rightPlot.px(a.x)
        const y1 = rightPlot.py(a.y)
        const x2 = rightPlot.px(b.x)
        const y2 = rightPlot.py(b.y)
        const len = Math.hypot(x2 - x1, y2 - y1) || 1
        const ux = (x2 - x1) / len
        const uy = (y2 - y1) / len
        fig.arrow(x1 + ux * 10, y1 + uy * 10, x2 - ux * 13, y2 - uy * 13, {
            color: green,
            width: 2.2,
            head: 8,
        })
    }

    for (const pt of POINTS) {
        const cx = rightPlot.px(pt.x)
        const cy = rightPlot.py(pt.y)
        const selected = pt.id === 'eu-1' || pt.id === 'eu-2' || pt.id === 'eu-3'

        if (selected) {
            fig.circle(cx, cy, 12, { stroke: green, width: 2.2 })
        }
        fig.circle(cx, cy, pt.eu ? 6.5 : 4.5, {
            fill: pt.eu ? green : c.textMuted,
            stroke: c.bg,
            width: 1.5,
            opacity: pt.eu ? 1 : 0.25,
        })

        const spec = RIGHT_LABELS[pt.id]
        if (spec) {
            fig.text(cx + spec.dx, cy + spec.dy, pt.id, {
                size: 13,
                mono: true,
                weight: 700,
                color: green,
                align: spec.align,
            })
        }
    }

    // Right Query Diamond + label
    fig.path(
        `M${rqx} ${rqy - 8}L${rqx + 8} ${rqy}L${rqx} ${rqy + 8}L${rqx - 8} ${rqy}Z`,
        { fill: cyan, color: c.bg, width: 1.5 },
    )
    fig.text(rqx - 14, rqy + 16, 'q', {
        size: 14,
        mono: true,
        weight: 800,
        color: cyan,
        align: 'center',
    })

    // ── Bottom Aligned Result Slots ──────────────────────────────────────────
    const slotLabelY = 394
    const slotY = 414
    const slotW = 104
    const slotH = 38
    const slotGap = 11

    fig.text(leftX, slotLabelY, 'Returned: 1 / 3 (underfilled)', {
        size: 14,
        weight: 700,
        color: red,
    })
    const leftSlots = ['eu-1', 'empty', 'empty'] as const
    leftSlots.forEach((txt, i) => {
        const sx = leftX + i * (slotW + slotGap)
        const filled = i === 0
        fig.rect(sx, slotY, slotW, slotH, {
            fill: filled ? withColorAlpha(green, 0.16) : withColorAlpha(red, 0.06),
            stroke: filled ? green : red,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(sx + slotW / 2, slotY + slotH / 2, txt, {
            size: 14,
            mono: true,
            weight: 700,
            color: filled ? green : red,
            align: 'center',
        })
    })

    fig.text(rightX, slotLabelY, 'Returned: 3 / 3 (full top-k)', {
        size: 14,
        weight: 700,
        color: green,
    })
    const rightSlots = ['eu-1', 'eu-2', 'eu-3'] as const
    rightSlots.forEach((txt, i) => {
        const sx = rightX + i * (slotW + slotGap)
        fig.rect(sx, slotY, slotW, slotH, {
            fill: withColorAlpha(green, 0.16),
            stroke: green,
            strokeWidth: 1.6,
            radius: 7,
        })
        fig.text(sx + slotW / 2, slotY + slotH / 2, txt, {
            size: 14,
            mono: true,
            weight: 700,
            color: green,
            align: 'center',
        })
    })

    return fig.render()
}

export default create('dark')
