import { type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 390
export const alt =
    'Paired benchmark comparison between FP16/BF16 baseline and Q4_K_M quantized checkpoint across four tasks. Both score 3 out of 4 (75%), yet Q4_K_M fails critical JSON schema validation while gaining a pass on long-context needle recall. Bar lengths and pass/fail indicators show why aggregate accuracy hides regressions.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const red = fig.tone('red')
    const warm = fig.tone('warm')

    fig.text(24, 22, 'Paired checks expose regressions hidden by equal accuracy', {
        size: 15.5,
        weight: 700,
        color: c.textPrimary,
    })

    // Column headers
    const taskX = 32
    const bfX = 278
    const q4X = 438
    const diffX = 540

    fig.text(taskX, 58, 'Task prompt', { size: 12.5, weight: 700, color: c.textSecondary })
    fig.text(bfX, 58, 'BF16', { size: 13, weight: 700, color: blue, align: 'center' })
    fig.text(q4X, 58, 'Q4_K_M', { size: 13, weight: 700, color: warm, align: 'center' })
    fig.text(diffX, 58, 'Paired delta', { size: 12.5, weight: 700, color: c.textSecondary })
    fig.line(24, 72, width - 24, 72, { color: c.border, width: 1.2 })

    const cases = [
        { name: 'json_tool_schema', base: true, quant: false, delta: 'REGRESSED (blocks)', tone: red },
        { name: 'mmlu_core', base: true, quant: true, delta: 'unchanged', tone: c.textSecondary },
        { name: 'gsm8k_exact', base: true, quant: true, delta: 'unchanged', tone: c.textSecondary },
        { name: 'long_ctx_recall', base: false, quant: true, delta: 'improved', tone: warm },
    ]

    cases.forEach((row, i) => {
        const cy = 98 + i * 44
        if (i === 0) {
            fig.rect(24, cy - 18, width - 48, 36, {
                fill: tint(red, c.bg, isLight ? 0.08 : 0.16),
                stroke: red,
                strokeWidth: 1.2,
                radius: 6,
            })
        } else if (i < cases.length) {
            fig.line(24, cy - 22, width - 24, cy - 22, { color: c.borderSubtle, width: 1 })
        }

        fig.text(taskX, cy, row.name, {
            size: 13.5,
            weight: i === 0 ? 700 : 600,
            color: i === 0 ? red : c.textPrimary,
            mono: true,
        })

        // Status pills for BF16 and Q4_K_M
        const drawBadge = (cx: number, pass: boolean) => {
            const col = pass ? green : red
            fig.rect(cx - 32, cy - 12, 64, 24, {
                fill: tint(col, c.bg, isLight ? 0.16 : 0.28),
                stroke: col,
                strokeWidth: 1.3,
                radius: 12,
            })
            fig.text(cx, cy, pass ? 'Pass' : 'Fail', {
                size: 12.5,
                weight: 700,
                color: col,
                align: 'center',
            })
        }

        drawBadge(bfX, row.base)
        drawBadge(q4X, row.quant)

        // Connecting transition arrow
        const changed = row.base !== row.quant
        fig.arrow(bfX + 38, cy, q4X - 38, cy, {
            color: changed ? row.tone : c.borderSubtle,
            width: changed ? 2.2 : 1.3,
            dash: changed ? undefined : '3 3',
            head: changed ? 6 : 4,
        })

        fig.text(diffX, cy, row.delta, {
            size: 13,
            weight: changed ? 700 : 500,
            color: row.tone,
        })
    })

    // Bottom aggregate accuracy comparison bars (identical 75% hides the flip)
    const barSep = 266
    fig.line(24, barSep, width - 24, barSep, { color: c.borderSubtle, width: 1 })
    fig.text(24, barSep + 20, 'Aggregate score looks identical', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
    })

    const barX = 166
    const fullW = 360
    const threeFourths = fullW * 0.75

    // BF16 total bar
    const yB = barSep + 42
    fig.text(24, yB + 12, 'BF16 baseline', { size: 13, weight: 700, color: blue })
    fig.rect(barX, yB, fullW, 24, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.08 : 0.14),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 5,
    })
    fig.rect(barX, yB, threeFourths, 24, {
        fill: tint(blue, c.bg, isLight ? 0.25 : 0.4),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(barX + fullW + 14, yB + 12, '3 / 4 (75%)', {
        size: 13,
        weight: 700,
        color: blue,
        mono: true,
    })

    // Q4_K_M total bar
    const yQ = barSep + 78
    fig.text(24, yQ + 12, 'Q4_K_M quant', { size: 13, weight: 700, color: red })
    fig.rect(barX, yQ, fullW, 24, {
        fill: tint(c.textMuted, c.bg, isLight ? 0.08 : 0.14),
        stroke: c.borderSubtle,
        strokeWidth: 1,
        radius: 5,
    })
    fig.rect(barX, yQ, threeFourths, 24, {
        fill: tint(red, c.bg, isLight ? 0.22 : 0.36),
        stroke: red,
        strokeWidth: 1.5,
        radius: 5,
    })
    fig.text(barX + fullW + 14, yQ + 12, '3 / 4 (75% · blocks!)', {
        size: 13,
        weight: 700,
        color: red,
        mono: true,
    })

    return fig.render()
}

export default create('dark')
