import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 350
export const alt =
    'Grouped horizontal bars comparing published Ollama Gemma 4 artifact sizes: E2B is 4.6 GB Q4_K_M vs 4.3 GB QAT (-0.3 GB), E4B is 6.6 GB vs 6.1 GB (-0.5 GB), and 12B is 8.0 GB vs 7.2 GB (-0.8 GB).'

const datasets = [
    { name: 'E2B', q4: 4.6, qat: 4.3, delta: '-0.3 GB' },
    { name: 'E4B', q4: 6.6, qat: 6.1, delta: '-0.5 GB' },
    { name: '12B', q4: 8.0, qat: 7.2, delta: '-0.8 GB' },
] as const

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const purple = f.tone('purple')
    const green = f.tone('green')

    // Top row: compact title + 2-swatch inline legend (zero footer!)
    f.text(18, 26, 'Published artifact size (GB)', {
        size: 17,
        weight: 700,
        color: c.textPrimary,
    })

    // Legend swatches
    f.rect(470, 19, 18, 14, { fill: tint(blue, c.bg, 0.78), stroke: blue, strokeWidth: 1.2, radius: 3 })
    f.text(496, 26, 'Q4_K_M', { size: 14, weight: 600, color: blue, mono: true })

    f.rect(592, 19, 18, 14, {
        fill: tint(purple, c.bg, 0.78),
        stroke: purple,
        strokeWidth: 1.2,
        radius: 3,
    })
    f.text(618, 26, 'QAT', { size: 14, weight: 600, color: purple, mono: true })

    const barLeft = 94
    const barW = 472
    const maxVal = 8.5
    const px = (v: number) => barLeft + (barW * v) / maxVal

    // Vertical gridlines
    const gridTop = 58
    const gridBot = 304
    for (const tick of [0, 2, 4, 6, 8]) {
        const x = px(tick)
        f.line(x, gridTop, x, gridBot, {
            color: c.borderSubtle,
            width: 1,
            dash: tick === 0 ? undefined : '3 4',
            opacity: tick === 0 ? 0.9 : 0.7,
        })
        f.text(x, 324, `${tick} GB`, {
            size: 13.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    datasets.forEach((d, i) => {
        const top = 74 + i * 82
        const yQ4 = top + 12
        const yQat = top + 42
        const barH = 22

        if (i > 0) {
            f.line(18, top - 12, width - 18, top - 12, { color: c.borderSubtle, width: 1 })
        }

        // Model family label
        f.text(80, top + 27, d.name, {
            size: 17,
            weight: 700,
            color: c.textPrimary,
            align: 'right',
            mono: true,
        })

        // Q4_K_M bar
        f.rect(barLeft, yQ4 - barH / 2, px(d.q4) - barLeft, barH, {
            fill: tint(blue, c.bg, 0.76),
            stroke: blue,
            strokeWidth: 1.3,
            radius: 4,
        })
        f.text(px(d.q4) + 10, yQ4, d.q4.toFixed(1), {
            size: 14.5,
            weight: 700,
            color: blue,
            mono: true,
        })

        // QAT bar
        f.rect(barLeft, yQat - barH / 2, px(d.qat) - barLeft, barH, {
            fill: tint(purple, c.bg, 0.78),
            stroke: purple,
            strokeWidth: 1.3,
            radius: 4,
        })
        f.text(px(d.qat) + 10, yQat, d.qat.toFixed(1), {
            size: 14.5,
            weight: 700,
            color: purple,
            mono: true,
        })

        // Right-aligned delta badge per pair
        const badgeX = 642
        const badgeW = 96
        const badgeY = top + 27
        f.rect(badgeX, badgeY - 15, badgeW, 30, {
            fill: tint(green, c.bg, 0.16),
            stroke: green,
            strokeWidth: 1.35,
            radius: 15,
        })
        f.text(badgeX + badgeW / 2, badgeY, d.delta, {
            size: 14,
            weight: 700,
            color: green,
            align: 'center',
            mono: true,
        })
    })

    return f.render()
}

export default create('dark')
