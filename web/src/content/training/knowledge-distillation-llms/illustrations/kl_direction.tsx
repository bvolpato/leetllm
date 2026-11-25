import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 400
export const alt =
    'Two scenarios compare teacher probabilities (0.58, 0.40, 0.02) against student distributions for 7d, 3d, and never on a shared 0 to 0.60 axis. In Scenario A (student never = 0.10, +0.08 extra mass), forward KL is 0.051 and reverse KL is 0.084. In Scenario B (student never = 0.25, +0.23 extra mass), forward KL climbs to 0.218 while reverse KL jumps to 0.436, roughly twice as steep.'

const teacher = [0.58, 0.4, 0.02]
const outcomes = ['7d', '3d', 'never']

const scenarios = [
    {
        title: 'Scenario A · mild tail leak',
        sub: 'student never = 0.10 (+0.08)',
        student: [0.54, 0.36, 0.1],
        fwd: 0.051,
        rev: 0.084,
        accent: 'cyan' as const,
    },
    {
        title: 'Scenario B · heavy tail leak',
        sub: 'student never = 0.25 (+0.23)',
        student: [0.4, 0.35, 0.25],
        fwd: 0.218,
        rev: 0.436,
        accent: 'warm' as const,
    },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const blue = fig.tone('blue')
    const red = fig.tone('critical')
    const muted = c.textSecondary

    // Top legend & formulas
    fig.rect(24, 16, 14, 8, { fill: c.textMuted, radius: 2 })
    fig.text(46, 20, 'Teacher P_T', { size: 14, weight: 600, color: muted })
    fig.rect(162, 16, 14, 8, { fill: cyan, radius: 2 })
    fig.text(184, 20, 'Student P_S', { size: 14, weight: 600, color: cyan })
    fig.math(470, 20, String.raw`\text{Fwd: } D_{\mathrm{KL}}(P_T \| P_S)`, {
        size: 14,
        color: blue,
        align: 'center',
    })
    fig.math(654, 20, String.raw`\text{Rev: } D_{\mathrm{KL}}(P_S \| P_T)`, {
        size: 14,
        color: red,
        align: 'center',
    })

    const panelW = 344
    const panelXs = [24, 392]

    scenarios.forEach((sc, sIdx) => {
        const x0 = panelXs[sIdx]!
        const accent = sc.accent === 'cyan' ? cyan : warm

        // Header
        fig.text(x0, 56, sc.title, { size: 16, weight: 700, color: c.textPrimary })
        fig.text(x0, 77, sc.sub, { size: 13, color: accent, weight: 600 })

        // Probability bars plot area (shared 0..0.60)
        const axX = x0 + 58
        const axW = 200
        const topY = 104
        const botY = 232
        const px = (v: number) => axX + (v / 0.6) * axW

        // Grid ticks at 0, 0.2, 0.4, 0.6
        ;[0, 0.2, 0.4, 0.6].forEach((tick) => {
            const tx = px(tick)
            fig.line(tx, topY, tx, botY, {
                color: c.borderSubtle,
                width: 1,
                dash: tick === 0 ? undefined : '3 3',
            })
            fig.text(tx, botY + 14, tick.toFixed(1), {
                size: 12,
                mono: true,
                color: muted,
                align: 'center',
            })
        })
        fig.line(axX, botY, axX + axW, botY, { color: c.textMuted, width: 1 })

        const rowYs = [124, 166, 208]
        outcomes.forEach((label, rIdx) => {
            const cy = rowYs[rIdx]!
            const tv = teacher[rIdx]!
            const sv = sc.student[rIdx]!
            const isTail = rIdx === 2

            fig.text(axX - 10, cy, label, {
                size: 14,
                mono: true,
                weight: isTail ? 700 : 600,
                color: isTail ? accent : c.textPrimary,
                align: 'right',
            })

            // Teacher bar (top half)
            fig.rect(axX, cy - 11, Math.max(2, px(tv) - axX), 9, {
                fill: c.textMuted,
                opacity: 0.72,
                radius: 2,
            })
            // Student bar (bottom half)
            fig.rect(axX, cy + 1, Math.max(2, px(sv) - axX), 10, {
                fill: isTail ? accent : cyan,
                radius: 2,
            })

            // Numeric readout to right
            fig.text(axX + axW + 10, cy, `${tv.toFixed(2)} / ${sv.toFixed(2)}`, {
                size: 13,
                mono: true,
                weight: isTail ? 700 : 500,
                color: isTail ? accent : muted,
            })
        })

        // KL divergence comparison bars below (shared 0..0.50 scale)
        const klTop = 278
        fig.line(x0, klTop - 14, x0 + panelW, klTop - 14, { color: c.borderSubtle, width: 1 })
        fig.text(x0, klTop, 'KL divergence (nats)', { size: 13, weight: 600, color: muted })

        const klAx = x0 + 82
        const klW = 192
        const klMax = 0.5

        const klRows = [
            { name: 'Forward', val: sc.fwd, color: blue },
            { name: 'Reverse', val: sc.rev, color: red },
        ]
        klRows.forEach((kr, kIdx) => {
            const ky = klTop + 28 + kIdx * 34
            const bw = (kr.val / klMax) * klW
            fig.text(klAx - 10, ky, kr.name, {
                size: 14,
                weight: 600,
                color: kr.color,
                align: 'right',
            })
            fig.rect(klAx, ky - 9, klW, 18, {
                fill: tint(c.textMuted, c.bg, 0.08),
                radius: 4,
            })
            fig.rect(klAx, ky - 9, Math.max(4, bw), 18, {
                fill: tint(kr.color, c.bg, 0.32),
                stroke: kr.color,
                strokeWidth: 1.5,
                radius: 4,
            })
            fig.text(klAx + klW + 10, ky, kr.val.toFixed(3), {
                size: 14,
                mono: true,
                weight: 700,
                color: kr.color,
            })
        })

        if (sIdx === 1) {
            fig.text(klAx, klTop + 92, 'Reverse KL = 2.0× Forward KL', {
                size: 13,
                weight: 700,
                color: red,
            })
        }
    })

    // Vertical center hairline separator
    fig.line(376, 46, 376, 376, { color: c.borderSubtle, width: 1 })

    return fig.render()
}

export default create('dark')
