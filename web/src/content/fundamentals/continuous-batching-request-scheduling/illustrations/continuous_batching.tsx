import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'
export { createFilm } from './_parts/continuous-batching-film'

export const alt =
    'On one shared 0 to 1,800 position scale, the current 1,024-position iteration contains 96 decode positions and 928 prefill positions. The 1,800-token prompt sends 928 positions now and leaves 872 queued. Position counts describe work placed into the step.'

export const width = 760
export const height = 370

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')

    fig.text(28, 22, '1,024-position step budget · 96 decode + 928 chunked prefill', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const x0 = 128
    const x1 = 716
    const maxPos = 1800
    const xOf = (p: number) => x0 + (p / maxPos) * (x1 - x0)

    const axisTop = 58
    const axisBot = 282

    // Gridlines & ticks
    for (const tick of [0, 450, 900, 1350, 1800]) {
        const tx = xOf(tick)
        fig.line(tx, axisTop, tx, axisBot, {
            color: c.borderSubtle,
            width: tick === 0 ? 1.5 : 1,
            dash: tick === 0 ? undefined : '3 3',
        })
        fig.text(tx, axisBot + 16, tick === 1800 ? '1,800' : String(tick), {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }
    fig.text((x0 + x1) / 2, axisBot + 38, 'Token positions on shared 0–1,800 scale', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    // 1,024 step cap vertical dashed line
    const capX = xOf(1024)
    fig.line(capX, axisTop, capX, 178, { color: warm, width: 2, dash: '5 4' })
    fig.text(capX + 8, 66, '1,024 step cap', {
        size: 13,
        weight: 700,
        color: warm,
        mono: true,
    })

    // --- Row 1: Current iteration step (96 decode + 928 prefill = 1,024) ---
    const r1Y = 122
    const barH = 42
    fig.text(x0 - 14, r1Y - 9, 'Current step', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'right',
    })
    fig.text(x0 - 14, r1Y + 12, '1,024 cap', {
        size: 13,
        color: warm,
        align: 'right',
        mono: true,
    })

    // 96 decode slice
    const decW = xOf(96) - x0
    fig.rect(x0, r1Y - barH / 2, decW, barH, {
        fill: tint(purple, c.bg, theme === 'light' ? 0.78 : 0.85),
        stroke: purple,
        strokeWidth: 1.5,
        radius: 4,
    })
    // 928 prefill slice
    const prefX = xOf(96)
    const prefW = xOf(1024) - prefX
    fig.rect(prefX, r1Y - barH / 2, prefW, barH, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.76 : 0.84),
        stroke: blue,
        strokeWidth: 1.5,
        radius: 4,
    })
    fig.text(prefX + prefW / 2, r1Y, '928 prefill chunk', {
        size: 14,
        weight: 700,
        color: theme === 'light' ? '#ffffff' : '#0b0c10',
        align: 'center',
    })

    // Callout for narrow 96 decode slice
    fig.callout([x0 + decW / 2, r1Y - barH / 2 - 2], [x0 + 58, 72], '96 decode (priority)', {
        color: purple,
        size: 13,
        weight: 700,
        align: 'left',
        bend: 0.18,
    })

    // --- Row 2: Incoming 1,800-token prompt (928 scheduled now + 872 queued) ---
    const r2Y = 232
    fig.text(x0 - 14, r2Y - 8, 'Prompt queue', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'right',
    })
    fig.text(x0 - 14, r2Y + 12, '1,800 tokens', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
        mono: true,
    })

    const schedW = xOf(928) - x0
    const queueX = xOf(928)
    const queueW = xOf(1800) - queueX

    fig.rect(x0, r2Y - barH / 2, schedW, barH, {
        fill: tint(blue, c.bg, theme === 'light' ? 0.24 : 0.36),
        stroke: blue,
        strokeWidth: 1.75,
        radius: 4,
    })
    fig.text(x0 + schedW / 2, r2Y, '928 scheduled now', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })

    fig.rect(queueX, r2Y - barH / 2, queueW, barH, {
        fill: tint(c.textMuted, c.bg, theme === 'light' ? 0.14 : 0.2),
        stroke: c.borderLight,
        strokeWidth: 1.5,
        radius: 4,
    })
    fig.text(queueX + queueW / 2, r2Y, '872 queued for next steps', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    // Subtle shaded transfer parallelogram linking 928 scheduled -> 928 prefill chunk
    fig.path(
        `M${x0.toFixed(1)} ${(r2Y - barH / 2).toFixed(1)} L${prefX.toFixed(1)} ${(r1Y + barH / 2).toFixed(1)} L${(prefX + prefW).toFixed(1)} ${(r1Y + barH / 2).toFixed(1)} L${(x0 + schedW).toFixed(1)} ${(r2Y - barH / 2).toFixed(1)} Z`,
        { fill: blue, fillOpacity: theme === 'light' ? 0.08 : 0.12, color: 'none' },
    )
    fig.line(x0, r2Y - barH / 2, prefX, r1Y + barH / 2, {
        color: blue,
        width: 1.25,
        dash: '4 3',
        opacity: 0.7,
    })
    fig.line(x0 + schedW, r2Y - barH / 2, prefX + prefW, r1Y + barH / 2, {
        color: blue,
        width: 1.25,
        dash: '4 3',
        opacity: 0.7,
    })

    fig.text(380, 350, '96 decode + 928 prefill = 1,024 step positions · 872 prompt tokens remain queued', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })

    return fig.render()
}

export default create
