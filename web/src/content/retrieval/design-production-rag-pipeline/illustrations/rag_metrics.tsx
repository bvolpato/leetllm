import type { ThemeMode } from 'vizmatic'
import { withColorAlpha } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 414
export const alt =
    'A causal stage-attribution matrix evaluates three candidate records across four ordered checks: Allowed (ACL), Fresh, Key Topic, and Both Limits. EU Key v2 passes all four and is packed as E1; EU Session fails at Stage 3 (Key Topic); Admin Override is blocked immediately at Stage 1 (ACL). On the right, packed E1 separates supported answers (10d age and 48h signal), supported denials (15d age or 49h signal), and abstentions (missing permitted rule).'

interface MatrixRow {
    readonly name: string
    readonly checks: readonly ('PASS' | 'FAIL' | 'SKIP')[]
    readonly outcome: string
    readonly outcomeTone: 'green' | 'warm' | 'critical'
}

const ROWS: readonly MatrixRow[] = [
    {
        name: 'EU Key v2',
        checks: ['PASS', 'PASS', 'PASS', 'PASS'],
        outcome: 'Pack [E1]',
        outcomeTone: 'green',
    },
    {
        name: 'EU Session',
        checks: ['PASS', 'PASS', 'FAIL', 'SKIP'],
        outcome: 'Stop @ 3',
        outcomeTone: 'warm',
    },
    {
        name: 'Admin Override',
        checks: ['FAIL', 'SKIP', 'SKIP', 'SKIP'],
        outcome: 'Block @ 1',
        outcomeTone: 'critical',
    },
]

const STAGES = ['1. Auth', '2. Fresh', '3. Topic', '4. Limits'] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const red = fig.tone('critical')
    const blue = fig.tone('blue')

    // ── Left: Causal Stage-Attribution Matrix ────────────────────────────────
    fig.text(20, 20, 'Causal Stage Attribution', { size: 17, weight: 700, color: c.textPrimary })
    fig.text(20, 42, 'Stop at the earliest failed check before generation', {
        size: 14,
        color: c.textSecondary,
    })

    const nameX = 20
    const colStart = 148
    const cellW = 68
    const cellH = 44
    const colGap = 6
    const rowGap = 10
    const gridTop = 90

    // Stage column headers with directional progression
    STAGES.forEach((st, j) => {
        const cx = colStart + j * (cellW + colGap) + cellW / 2
        fig.text(cx, gridTop - 16, st, {
            size: 14,
            weight: 700,
            color: c.textSecondary,
            align: 'center',
        })
    })
    const outX = colStart + 4 * (cellW + colGap) + 6
    fig.text(outX + 44, gridTop - 16, 'Result', {
        size: 14,
        weight: 700,
        color: c.textMuted,
        align: 'center',
    })

    ROWS.forEach((row, i) => {
        const ry = gridTop + i * (cellH + rowGap)
        const isWinner = i === 0

        fig.text(nameX, ry + cellH / 2, row.name, {
            size: 14,
            weight: isWinner ? 700 : 600,
            color: isWinner ? c.textPrimary : c.textSecondary,
        })

        row.checks.forEach((state, j) => {
            const x = colStart + j * (cellW + colGap)
            const fill =
                state === 'PASS'
                    ? withColorAlpha(green, 0.18)
                    : state === 'FAIL'
                      ? withColorAlpha(red, 0.2)
                      : tint(c.border, c.bg, 0.22)
            const stroke =
                state === 'PASS'
                    ? withColorAlpha(green, 0.7)
                    : state === 'FAIL'
                      ? red
                      : c.borderSubtle
            const textColor =
                state === 'PASS' ? green : state === 'FAIL' ? red : c.textMuted

            fig.rect(x, ry, cellW, cellH, {
                fill,
                stroke,
                strokeWidth: state === 'FAIL' ? 1.8 : 1.25,
                radius: 6,
            })
            fig.text(x + cellW / 2, ry + cellH / 2, state === 'SKIP' ? '--' : state, {
                size: 14,
                mono: true,
                weight: 700,
                color: textColor,
                align: 'center',
            })
        })

        // Right outcome pill
        const outColor = fig.tone(row.outcomeTone)
        fig.rect(outX - 2, ry + 5, 92, cellH - 10, {
            fill: withColorAlpha(outColor, 0.14),
            stroke: outColor,
            strokeWidth: 1.4,
            radius: 16,
        })
        fig.text(outX + 44, ry + cellH / 2, row.outcome, {
            size: 14,
            mono: true,
            weight: 700,
            color: outColor,
            align: 'center',
        })
    })

    // ── Vertical Hairline Divider ────────────────────────────────────────────
    fig.line(544, 16, 544, 266, { color: c.borderSubtle, width: 1 })

    // ── Right: Grounding Outcomes from Packed [E1] ───────────────────────────
    const rx = 556
    const rw = width - rx - 16
    fig.text(rx, 20, 'Grounding Outcomes', { size: 17, weight: 700, color: green })
    fig.text(rx, 42, 'From packed source [E1]', { size: 14, color: c.textSecondary })

    const outcomes = [
        { cond: '10d + 48h signal', verdict: 'Supported Answer [E1]', tone: 'green' as const },
        { cond: '15d or 49h signal', verdict: 'Supported Denial [E1]', tone: 'warm' as const },
        { cond: 'No permitted rule', verdict: 'Abstain (no citation)', tone: 'neutral' as const },
    ] as const

    outcomes.forEach((o, idx) => {
        const oy = 74 + idx * 62
        const color = o.tone === 'neutral' ? c.textSecondary : fig.tone(o.tone)
        fig.rect(rx, oy, rw, 52, {
            fill:
                o.tone === 'neutral'
                    ? tint(c.border, c.bg, 0.25)
                    : withColorAlpha(color, 0.1),
            stroke: o.tone === 'neutral' ? c.border : withColorAlpha(color, 0.65),
            strokeWidth: 1.35,
            radius: 7,
        })
        fig.text(rx + 10, oy + 17, o.cond, {
            size: 14,
            mono: true,
            color: c.textSecondary,
        })
        fig.text(rx + 10, oy + 37, o.verdict, {
            size: 14,
            weight: 700,
            color,
        })
    })

    // ── Bottom: Full Causal Debugging Chain (6 ordered pipeline stages) ──────
    fig.line(20, 290, width - 20, 290, { color: c.borderSubtle, width: 1 })
    fig.text(20, 314, 'Pipeline Attribution Order', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.text(width - 20, 314, 'Debug leftmost failure first', {
        size: 14,
        color: c.textSecondary,
        align: 'right',
    })

    const chain = [
        { label: 'Auth', color: red },
        { label: 'Retrieval', color: blue },
        { label: 'Packing', color: blue },
        { label: 'Faithful', color: green },
        { label: 'Citations', color: green },
        { label: 'Relevance', color: warm },
    ] as const

    const boxW = 100
    const boxH = 38
    const arrowGap = 24
    const chainY = 342
    chain.forEach((step, idx) => {
        const sx = 20 + idx * (boxW + arrowGap)
        fig.rect(sx, chainY, boxW, boxH, {
            fill: withColorAlpha(step.color, 0.12),
            stroke: withColorAlpha(step.color, 0.7),
            strokeWidth: 1.4,
            radius: 7,
        })
        fig.text(sx + boxW / 2, chainY + boxH / 2, step.label, {
            size: 14,
            weight: 700,
            color: step.color,
            align: 'center',
        })
        if (idx < chain.length - 1) {
            fig.arrow(sx + boxW + 3, chainY + boxH / 2, sx + boxW + arrowGap - 3, chainY + boxH / 2, {
                color: c.textMuted,
                width: 1.6,
                head: 6,
            })
        }
    })

    return fig.render()
}

export default create('dark')
