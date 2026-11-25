import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 720
export const height = 355
export const alt =
    'A math prompt (14 workers × 12 slots = 168) produces two completions: Trace A uses sound multiplication (14 × 12 = 168) and Trace B guesses a shortcut ("ends in 8"), yet both end with \\boxed{168}. Because the deterministic verifier only extracts and checks the final answer (168 = 168), both receive reward r = 1, illustrating why outcome rewards alone do not verify intermediate reasoning.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const muted = c.textSecondary

    const pX = 16
    const pY = 104
    const pW = 138
    const pH = 100
    fig.rect(pX, pY, pW, pH, {
        fill: tint(cyan, c.bg, 0.14),
        stroke: cyan,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(pX + pW / 2, pY + 24, 'Task prompt', {
        size: 14,
        weight: 700,
        color: cyan,
        align: 'center',
    })
    fig.text(pX + pW / 2, pY + 52, '14 × 12 = ?', {
        size: 16,
        mono: true,
        weight: 700,
        align: 'center',
    })
    fig.text(pX + pW / 2, pY + 78, 'gold = 168', {
        size: 14,
        mono: true,
        color: muted,
        align: 'center',
    })

    const tX = 192
    const tW = 296
    const tH = 92
    const topY = 36
    const botY = 180

    fig.arrow(pX + pW + 2, pY + 28, tX - 4, topY + tH / 2, { color: green, width: 1.9, head: 7 })
    fig.arrow(pX + pW + 2, pY + 72, tX - 4, botY + tH / 2, { color: warm, width: 1.9, head: 7 })

    fig.rect(tX, topY, tW, tH, {
        fill: tint(green, c.bg, 0.12),
        stroke: green,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(tX + 12, topY + 24, 'Trace A · Sound ✓', { size: 15, weight: 700, color: green })
    fig.text(tX + 12, topY + 58, '14×10 + 14×2 = 168', {
        size: 14,
        mono: true,
        color: c.textPrimary,
    })
    fig.rect(tX + 186, topY + 42, 100, 32, {
        fill: tint(green, c.bg, 0.24),
        stroke: green,
        strokeWidth: 1.3,
        radius: 5,
    })
    fig.text(tX + 236, topY + 58, '\\boxed{168}', {
        size: 14,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })

    fig.rect(tX, botY, tW, tH, {
        fill: tint(warm, c.bg, 0.12),
        stroke: warm,
        strokeWidth: 1.6,
        radius: 8,
    })
    fig.text(tX + 12, botY + 24, 'Trace B · Shortcut ✕', { size: 15, weight: 700, color: warm })
    fig.text(tX + 12, botY + 58, '“4×2 ends in 8…”', { size: 14, color: c.textPrimary })
    fig.rect(tX + 186, botY + 42, 100, 32, {
        fill: tint(warm, c.bg, 0.24),
        stroke: warm,
        strokeWidth: 1.3,
        radius: 5,
    })
    fig.text(tX + 236, botY + 58, '\\boxed{168}', {
        size: 14,
        mono: true,
        weight: 700,
        color: warm,
        align: 'center',
    })

    const vX = 526
    const vY = 86
    const vW = 178
    const vH = 136
    fig.arrow(tX + tW + 2, topY + tH / 2, vX - 4, vY + 40, { color: green, width: 1.9, head: 7 })
    fig.arrow(tX + tW + 2, botY + tH / 2, vX - 4, vY + 96, { color: warm, width: 1.9, head: 7 })

    fig.rect(vX, vY, vW, vH, {
        fill: tint(purple, c.bg, 0.14),
        stroke: purple,
        strokeWidth: 1.75,
        radius: 9,
    })
    fig.text(vX + vW / 2, vY + 24, 'Outcome verifier', {
        size: 15,
        weight: 700,
        color: purple,
        align: 'center',
    })
    fig.text(vX + vW / 2, vY + 52, 'extract(\\boxed{…})', {
        size: 14,
        mono: true,
        color: muted,
        align: 'center',
    })
    fig.text(vX + vW / 2, vY + 80, '168 == 168', {
        size: 16,
        mono: true,
        weight: 700,
        color: c.textPrimary,
        align: 'center',
    })
    fig.rect(vX + 29, vY + 98, 120, 28, {
        fill: tint(green, c.bg, 0.25),
        stroke: green,
        strokeWidth: 1.3,
        radius: 14,
    })
    fig.text(vX + vW / 2, vY + 112, 'r = 1 (both)', {
        size: 14,
        mono: true,
        weight: 700,
        color: green,
        align: 'center',
    })

    fig.line(16, 298, width - 16, 298, { color: c.borderSubtle, width: 1 })
    fig.text(
        width / 2,
        326,
        'Outcome rewards check final answers only; separate review checks reasoning.',
        { size: 14, color: muted, align: 'center' },
    )

    return fig.render()
}

export default create('dark')
