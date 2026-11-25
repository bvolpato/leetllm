import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 444
export const alt =
    'For each class, a number line compares predicted probability p with one-hot target y on zero to one, with directional arrows from p toward y showing the SGD push minus (p minus y). The gradients p minus y are +0.844 for bug, -0.886 for docs, and +0.042 for security, summing to zero.'

const rows = [
    {
        label: 'bug',
        p: 0.844,
        y: 0,
        grad: '+0.844',
        action: 'push z down',
        tone: 'critical' as const,
        correct: false,
    },
    {
        label: 'docs',
        p: 0.114,
        y: 1,
        grad: '−0.886',
        action: 'push z up (target)',
        tone: 'green' as const,
        correct: true,
    },
    {
        label: 'security',
        p: 0.042,
        y: 0,
        grad: '+0.042',
        action: 'nudge z down',
        tone: 'cyan' as const,
        correct: false,
    },
] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const predCol = fig.tone('purple')
    const targetCol = isLight ? '#d07a12' : '#f2b84b'

    // Header
    fig.text(24, 24, 'Cross-entropy gradient:  ∂L/∂zᵢ = pᵢ − yᵢ', {
        size: 21,
        weight: 750,
        color: c.textPrimary,
    })
    fig.text(468, 24, 'SGD:  zᵢ ← zᵢ − η(pᵢ − yᵢ)', {
        size: 18,
        mono: true,
        color: c.textSecondary,
        weight: 600,
    })

    // Compact legend row
    const legY = 64
    fig.circle(32, legY, 6.5, { fill: predCol })
    fig.text(46, legY, 'model p', { size: 17, color: c.textSecondary, weight: 600 })

    // Diamond for target y
    const dyX = 166
    fig.path(`M${dyX} ${legY - 7} L${dyX + 7} ${legY} L${dyX} ${legY + 7} L${dyX - 7} ${legY} Z`, {
        fill: targetCol,
    })
    fig.text(180, legY, 'target y', { size: 17, color: c.textSecondary, weight: 600 })

    fig.arrow(292, legY, 330, legY, { color: fig.tone('green'), width: 3, head: 7 })
    fig.text(340, legY, 'SGD push −(p − y) from p toward y', {
        size: 17,
        color: c.textSecondary,
        weight: 600,
    })

    // Number-line column geometry
    const lineLeft = 228
    const lineRight = 548
    const lineSpan = lineRight - lineLeft
    const px = (v: number) => lineLeft + v * lineSpan

    // Axis ticks at top & vertical subtle guides
    const yTop = 112
    const yBot = 362
    for (const tick of [0, 0.5, 1]) {
        const tx = px(tick)
        fig.line(tx, yTop, tx, yBot, {
            color: c.borderSubtle,
            width: 1.2,
            dash: tick === 0.5 ? '4 4' : undefined,
        })
        fig.text(tx, yTop - 16, tick === 0.5 ? '0.5' : String(tick), {
            size: 16,
            mono: true,
            color: c.textSecondary,
            align: 'center',
            weight: 600,
        })
    }

    fig.text(578, yTop - 16, 'Gradient p − y', {
        size: 16,
        color: c.textSecondary,
        weight: 650,
    })

    // Rows
    rows.forEach((row, idx) => {
        const cy = 152 + idx * 86
        const col = fig.tone(row.tone)
        const xP = px(row.p)
        const xY = px(row.y)

        if (row.correct) {
            fig.rect(18, cy - 36, width - 36, 72, {
                fill: tint(col, c.bg, isLight ? 0.08 : 0.13),
                stroke: col,
                strokeWidth: 1.3,
                radius: 10,
            })
        }

        // Left label & values
        fig.text(30, cy - 12, row.label, { size: 20, weight: 750, color: col })
        fig.text(30, cy + 14, `p=${row.p.toFixed(3)} · y=${row.y}`, {
            size: 16,
            mono: true,
            color: c.textSecondary,
        })

        // Track rail
        fig.line(lineLeft, cy, lineRight, cy, { color: c.border, width: 3 })

        // Directional push arrow from p toward y
        const dir = xY > xP ? 1 : -1
        const dist = Math.abs(xY - xP)
        if (dist >= 16) {
            fig.arrow(xP + dir * 10, cy, xY - dir * 9, cy, {
                color: col,
                width: row.correct ? 4.5 : 3.5,
                head: 8,
            })
        } else {
            // Short nudge for security (p=0.042 -> y=0)
            fig.arrow(xP + 16, cy - 18, xY + 5, cy - 10, {
                color: col,
                width: 2.4,
                head: 6,
            })
        }

        // Target y diamond
        fig.path(`M${xY} ${cy - 8} L${xY + 8} ${cy} L${xY} ${cy + 8} L${xY - 8} ${cy} Z`, {
            fill: targetCol,
            color: c.bg,
            width: 1.8,
        })

        // Predicted p circle
        fig.circle(xP, cy, 8, { fill: predCol, stroke: c.bg, width: 2.2 })

        // Right column: gradient & action
        fig.text(578, cy - 12, row.grad, {
            size: 20,
            mono: true,
            weight: 750,
            color: col,
        })
        fig.text(578, cy + 14, row.action, {
            size: 17,
            color: c.textSecondary,
            weight: 600,
        })
    })

    // Bottom zero-sum balance equation
    fig.line(24, 386, width - 24, 386, { color: c.borderSubtle, width: 1.1 })
    fig.text(400, 416, 'Zero-sum balance:   +0.844  −  0.886  +  0.042  =  0.000', {
        size: 19,
        mono: true,
        weight: 750,
        color: c.textPrimary,
        align: 'center',
        width: 740,
    })

    return fig.render()
}

export default create('dark')
