import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 435
export const alt =
    'Two-step branching decoding tree from prefix "The autumn light is". At step 1, bright (0.45) and fading (0.30) are kept by beam width 2 while soft (0.15) and nine tail tokens (0.10) are pruned. At step 2, bright expands to period (x0.40 = 0.180, greedy choice), today (x0.35 = 0.158), and now (x0.25 = 0.113), while fading expands to fast (x0.90 = 0.270, beam winner) and slowly (x0.10 = 0.030). Aligned score bars on the right confirm fading fast (0.270) outscores bright . (0.180).'

function cubicEdge(x1: number, y1: number, x2: number, y2: number): string {
    const mx = (x1 + x2) / 2
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}C${mx.toFixed(1)} ${y1.toFixed(1)},${mx.toFixed(1)} ${y2.toFixed(1)},${x2.toFixed(1)} ${y2.toFixed(1)}`
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const muted = c.textMuted

    // Column headers (frameless)
    fig.text(78, 18, 'Prefix', { size: 13.5, color: c.textSecondary, align: 'center', weight: 700 })
    fig.text(240, 18, 'Step 1 (B = 2)', { size: 13.5, color: c.textSecondary, align: 'center', weight: 700 })
    fig.text(422, 18, 'Step 2 continuation', { size: 13.5, color: c.textSecondary, align: 'center', weight: 700 })
    fig.text(628, 18, 'Joint path probability', { size: 13.5, color: c.textSecondary, align: 'center', weight: 700 })

    // Root node
    const rootX = 14
    const rootW = 132
    const rootY = 196
    fig.rect(rootX, rootY - 26, rootW, 52, {
        fill: tint(c.textPrimary, c.bg, theme === 'dark' ? 0.09 : 0.06),
        stroke: c.borderLight,
        strokeWidth: 1.5,
        radius: 8,
    })
    fig.text(rootX + rootW / 2, rootY - 8, '"The autumn', {
        size: 13.5,
        color: c.textPrimary,
        align: 'center',
        weight: 600,
    })
    fig.text(rootX + rootW / 2, rootY + 11, 'light is"', {
        size: 13.5,
        color: c.textPrimary,
        align: 'center',
        weight: 600,
    })

    // Step 1 nodes
    const s1X = 200
    const s1W = 86
    const s1Nodes = [
        { token: 'bright', p: '0.45', y: 122, col: warm, kept: true, tag: 'greedy #1' },
        { token: 'fading', p: '0.30', y: 274, col: green, kept: true, tag: 'beam #2' },
        { token: 'soft', p: '0.15', y: 356, col: muted, kept: false, tag: 'pruned' },
        { token: '9 tail', p: '0.10', y: 404, col: muted, kept: false, tag: 'pruned' },
    ]

    for (const n of s1Nodes) {
        fig.path(cubicEdge(rootX + rootW, rootY, s1X, n.y), {
            color: n.kept ? n.col : c.borderLight,
            width: n.kept ? 2.4 : 1.25,
            dash: n.kept ? undefined : '4 4',
            opacity: n.kept ? 0.9 : 0.65,
        })
        const h = n.kept ? 38 : 30
        fig.rect(s1X, n.y - h / 2, s1W, h, {
            fill: n.kept
                ? tint(n.col, c.bg, theme === 'dark' ? 0.24 : 0.16)
                : tint(muted, c.bg, 0.08),
            stroke: n.kept ? n.col : c.borderSubtle,
            strokeWidth: n.kept ? 1.75 : 1,
            radius: 6,
        })
        fig.text(s1X + s1W / 2, n.y, n.token, {
            size: n.kept ? 14 : 13,
            color: n.kept ? c.textPrimary : muted,
            align: 'center',
            mono: true,
            weight: n.kept ? 700 : 500,
        })
        // Step-1 probability label near branch entry
        const labelY = n.y < rootY ? n.y - 26 : n.kept ? n.y - 26 : n.y
        const labelX = n.kept ? s1X + s1W / 2 : s1X + s1W + 12
        const labelAlign = n.kept ? 'center' : 'left'
        fig.text(
            labelX,
            labelY,
            n.kept ? `p = ${n.p}` : `p = ${n.p}  (${n.tag})`,
            {
                size: 13,
                color: n.kept ? n.col : muted,
                align: labelAlign,
                mono: true,
                weight: n.kept ? 700 : 500,
            },
        )
    }

    // Step 2 terminal leaves + aligned right score bars
    const s2X = 374
    const s2W = 104
    const barX = 508
    const barMaxW = 152

    const leaves = [
        {
            parentY: 122,
            token: 'bright .',
            cond: '×0.40',
            score: 0.18,
            y: 66,
            col: warm,
            badge: 'Greedy',
            bold: true,
        },
        {
            parentY: 122,
            token: 'bright today',
            cond: '×0.35',
            score: 0.1575,
            y: 122,
            col: c.textSecondary,
            badge: '',
            bold: false,
        },
        {
            parentY: 122,
            token: 'bright now',
            cond: '×0.25',
            score: 0.1125,
            y: 178,
            col: c.textSecondary,
            badge: '',
            bold: false,
        },
        {
            parentY: 274,
            token: 'fading fast',
            cond: '×0.90',
            score: 0.27,
            y: 252,
            col: green,
            badge: 'Beam B=2',
            bold: true,
        },
        {
            parentY: 274,
            token: 'fading slowly',
            cond: '×0.10',
            score: 0.03,
            y: 308,
            col: c.textSecondary,
            badge: '',
            bold: false,
        },
    ]

    // Baseline vertical axis for score bars
    fig.line(barX, 42, barX, 336, { color: c.textMuted, width: 1 })
    for (const tick of [0, 0.1, 0.2, 0.3]) {
        const tx = barX + (tick / 0.3) * barMaxW
        fig.line(tx, 42, tx, 336, { color: c.borderSubtle, width: 1, opacity: 0.65 })
        fig.text(tx, 352, tick === 0 ? '0' : tick.toFixed(1), {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    for (const leaf of leaves) {
        fig.path(cubicEdge(s1X + s1W, leaf.parentY, s2X, leaf.y), {
            color: leaf.bold ? leaf.col : c.borderLight,
            width: leaf.bold ? 2.4 : 1.35,
            opacity: leaf.bold ? 0.95 : 0.75,
        })

        // Conditional probability label midway along edge, clear of Bezier curves
        const edgeMidX =
            leaf.y === leaf.parentY
                ? (s1X + s1W + s2X) / 2 + 16
                : (s1X + s1W + s2X) / 2 - 4
        const edgeMidY =
            leaf.y < leaf.parentY
                ? (leaf.parentY + leaf.y) / 2 - 16
                : leaf.y > leaf.parentY
                  ? (leaf.parentY + leaf.y) / 2 + 16
                  : leaf.y - 14
        fig.text(edgeMidX, edgeMidY, leaf.cond, {
            size: 12.5,
            color: leaf.bold ? leaf.col : c.textSecondary,
            align: 'center',
            mono: true,
            weight: leaf.bold ? 700 : 500,
        })

        // Leaf pill
        fig.rect(s2X, leaf.y - 17, s2W, 34, {
            fill: leaf.bold
                ? tint(leaf.col, c.bg, theme === 'dark' ? 0.28 : 0.18)
                : tint(c.textPrimary, c.bg, theme === 'dark' ? 0.06 : 0.04),
            stroke: leaf.bold ? leaf.col : c.borderSubtle,
            strokeWidth: leaf.bold ? 1.8 : 1,
            radius: 6,
        })
        fig.text(s2X + s2W / 2, leaf.y, leaf.token, {
            size: 13,
            color: leaf.bold ? c.textPrimary : c.textSecondary,
            align: 'center',
            mono: true,
            weight: leaf.bold ? 700 : 500,
        })

        // Aligned score bar
        const bw = (leaf.score / 0.3) * barMaxW
        fig.rect(barX, leaf.y - 11, Math.max(4, bw), 22, {
            fill: tint(leaf.col, c.bg, leaf.bold ? (theme === 'dark' ? 0.42 : 0.28) : 0.2),
            stroke: leaf.bold ? leaf.col : c.borderLight,
            strokeWidth: leaf.bold ? 1.6 : 1,
            radius: 4,
        })
        fig.text(barX + bw + 8, leaf.y, leaf.score.toFixed(3), {
            size: 13.5,
            color: leaf.bold ? leaf.col : c.textSecondary,
            mono: true,
            weight: leaf.bold ? 700 : 500,
        })

        if (leaf.badge) {
            fig.text(barX + bw + 8, leaf.y + 18, leaf.badge, {
                size: 12.5,
                color: leaf.col,
                weight: 700,
            })
        }
    }

    // Concise single-line callout on bottom-right showing why beam wins
    fig.text(width - 16, 396, 'Beam 0.270  >  Greedy 0.180', {
        size: 13.5,
        color: green,
        align: 'right',
        mono: true,
        weight: 700,
    })

    return fig.render()
}

export default create('dark')
