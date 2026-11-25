import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 370
export const alt =
    'Before-and-after bars for an internal FAQ assistant. p95 latency drops from 4.2 seconds to 1.1 seconds (a 74 percent reduction), and a token-cost index drops from 100 to 38 (a 62 percent reduction) after routing, caching, and shorter context.'

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const green = f.tone('green')
    const warm = f.tone('warm')

    const barLeft = 112
    const barW = 528

    const drawMetric = (
        title: string,
        before: number,
        after: number,
        max: number,
        unit: string,
        deltaLabel: string,
        ticks: readonly number[],
        top: number,
    ) => {
        const px = (v: number) => barLeft + (barW * v) / max

        f.text(18, top, title, { size: 18, weight: 700, color: c.textPrimary })

        const yBefore = top + 46
        const yAfter = top + 96
        const barH = 26

        // Subtle vertical gridlines
        for (const t of ticks) {
            const x = px(t)
            f.line(x, yBefore - 18, x, yAfter + 22, {
                color: c.borderSubtle,
                width: 1,
                opacity: 0.7,
            })
            f.text(x, yAfter + 34, `${t}${unit}`, {
                size: 13,
                color: c.textSecondary,
                align: 'center',
                mono: true,
            })
        }

        // Before bar
        f.text(barLeft - 14, yBefore, 'Before', {
            size: 15,
            weight: 600,
            color: c.textSecondary,
            align: 'right',
        })
        f.rect(barLeft, yBefore - barH / 2, px(before) - barLeft, barH, {
            fill: tint(warm, c.bg, 0.72),
            stroke: warm,
            strokeWidth: 1.4,
            radius: 5,
        })
        f.text(px(before) + 12, yBefore, `${before}${unit}`, {
            size: 16,
            weight: 700,
            color: warm,
            mono: true,
        })

        // After bar
        f.text(barLeft - 14, yAfter, 'After', {
            size: 15,
            weight: 600,
            color: green,
            align: 'right',
        })
        f.rect(barLeft, yAfter - barH / 2, px(after) - barLeft, barH, {
            fill: tint(green, c.bg, 0.78),
            stroke: green,
            strokeWidth: 1.5,
            radius: 5,
        })
        f.text(px(after) + 10, yAfter, `${after}${unit}`, {
            size: 16,
            weight: 700,
            color: green,
            mono: true,
        })

        // Shaded saved span + crisp delta bracket from after -> before
        const savedStart = px(after) + 56
        const savedEnd = px(before)
        if (savedEnd > savedStart + 30) {
            f.rect(px(after), yAfter - barH / 2, px(before) - px(after), barH, {
                fill: tint(green, c.bg, 0.1),
                stroke: green,
                strokeWidth: 1,
                opacity: 0.6,
                radius: 4,
            })
            // Vertical alignment drop line from end of Before bar
            f.line(px(before), yBefore + barH / 2 + 2, px(before), yAfter + barH / 2, {
                color: warm,
                width: 1.25,
                dash: '3 3',
                opacity: 0.8,
            })
            // Delta bracket inside the saved region
            const bx1 = px(after) + 64
            const bx2 = px(before) - 6
            f.brace(bx1, yAfter - 4, bx2, yAfter - 4, deltaLabel, {
                side: -1,
                depth: 7,
                labelGap: 11,
                color: green,
                labelColor: green,
                labelSize: 15,
                weight: 700,
            })
        }
    }

    drawMetric('FAQ p95 latency (seconds)', 4.2, 1.1, 5, 's', '-74% saved', [0, 1, 2, 3, 4, 5], 24)
    f.line(18, 186, width - 18, 186, { color: c.borderSubtle, width: 1.25 })
    drawMetric(
        'Token cost / conversation (index)',
        100,
        38,
        100,
        '',
        '-62% saved',
        [0, 25, 50, 75, 100],
        210,
    )

    return f.render()
}

export default create('dark')
