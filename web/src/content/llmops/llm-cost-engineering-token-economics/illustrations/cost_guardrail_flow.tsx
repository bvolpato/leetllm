import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 450
export const alt =
    'Top: horizontal stacked bar breaks down the $23.91 daily generation bill into Orders (46%), Docs (33%), Eval (12%), and Review (9%). Bottom: daily spend bars on a 0 to 25 dollar scale compare cash cohorts Orders ($11.03), Docs ($7.78), Eval ($2.82), and Review ($2.29) beside $13.82 of avoided semantic-cache exposure.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const red = fig.tone('critical')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const green = fig.tone('green')

    // Top section: Share of $23.91 daily generation bill
    fig.text(64, 20, 'Share of $23.91 daily generation bill (%)', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const barX = 64
    const barY = 46
    const barTotalW = 666
    const barH = 42
    const segments = [
        { label: 'Orders', pct: 46, color: red },
        { label: 'Docs', pct: 33, color: blue },
        { label: 'Eval', pct: 12, color: purple },
        { label: 'Review', pct: 9, color: green },
    ]

    let cursorX = barX
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]!
        const segW = (seg.pct / 100) * barTotalW - (i < segments.length - 1 ? 3 : 0)
        const fill = tint(seg.color, c.bg, 0.35)
        fig.rect(cursorX, barY, segW, barH, {
            fill,
            stroke: seg.color,
            strokeWidth: 1.5,
            radius: 5,
        })
        const ink = getReadableTextColor(fill, c, c.bg)
        if (seg.pct >= 12) {
            fig.text(cursorX + segW / 2, barY + barH / 2, `${seg.label} ${seg.pct}%`, {
                size: 13.5,
                weight: 700,
                color: ink,
                align: 'center',
            })
        } else {
            // Review 9% sits cleanly with crisp percentage inside and explicit label below
            fig.text(cursorX + segW / 2, barY + barH / 2, `${seg.pct}%`, {
                size: 13.5,
                weight: 700,
                color: ink,
                align: 'center',
            })
            fig.line(cursorX + segW / 2, barY + barH + 2, cursorX + segW / 2, barY + barH + 14, {
                color: seg.color,
                width: 1.4,
            })
            fig.text(cursorX + segW, barY + barH + 25, 'Review 9%', {
                size: 13.5,
                weight: 700,
                color: seg.color,
                align: 'right',
            })
        }
        cursorX += (seg.pct / 100) * barTotalW
    }

    // Compact legend for remaining cohorts on left side under the stacked bar
    const legY = barY + barH + 25
    let legX = barX
    for (const seg of segments.slice(0, 3)) {
        fig.rect(legX, legY - 6, 12, 12, {
            fill: tint(seg.color, c.bg, 0.4),
            stroke: seg.color,
            strokeWidth: 1.2,
            radius: 2.5,
        })
        fig.text(legX + 18, legY, `${seg.label} ${seg.pct}%`, {
            size: 13,
            weight: 600,
            color: c.textSecondary,
        })
        legX += 118
    }

    // Bottom section: Daily cohort spend vs avoided semantic cache
    fig.text(64, 152, 'Daily cohort spend vs avoided semantic cache ($/day)', {
        size: 16,
        weight: 700,
        color: c.textPrimary,
    })

    const plot = fig.plot(
        { x: 64, y: 188, width: 666, height: 204 },
        { x: [0, 5.4], y: [0, 25] },
    )
    plot.axes({
        yTicks: [0, 5, 10, 15, 20, 25],
        yFormat: (v) => `$${v}`,
        yLabel: '$ / day',
        grid: true,
        labelSize: 13.5,
    })

    // Subtle vertical divider separating cash spend cohorts from avoided exposure pool
    const divX = plot.px(4.12)
    fig.line(divX, plot.area.y, divX, plot.bottom, {
        color: c.borderLight,
        width: 1.25,
        dash: '5 4',
    })
    fig.text(plot.px(2.05), plot.area.y + 12, 'Billed daily cash spend ($23.91 total)', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })
    fig.text(plot.px(4.8), plot.area.y + 12, 'Avoided exposure', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    const bars = [
        { cx: 0.55, label: 'Orders', value: 11.03, text: '$11.03', color: red, dashed: false },
        { cx: 1.55, label: 'Docs', value: 7.78, text: '$7.78', color: blue, dashed: false },
        { cx: 2.55, label: 'Eval', value: 2.82, text: '$2.82', color: purple, dashed: false },
        { cx: 3.55, label: 'Review', value: 2.29, text: '$2.29', color: green, dashed: false },
        {
            cx: 4.8,
            label: 'Avoided cache',
            value: 13.82,
            text: '$13.82',
            color: c.textSecondary,
            dashed: true,
        },
    ]

    const barW = 68
    for (const b of bars) {
        const x = plot.px(b.cx) - barW / 2
        const yTop = plot.py(b.value)
        const h = plot.bottom - yTop
        if (b.dashed) {
            fig.path(
                `M${x + 4} ${yTop}H${x + barW - 4}Q${x + barW} ${yTop} ${x + barW} ${yTop + 4}V${plot.bottom}H${x}V${yTop + 4}Q${x} ${yTop} ${x + 4} ${yTop}Z`,
                {
                    fill: tint(c.textMuted, c.bg, 0.16),
                    color: c.textSecondary,
                    width: 1.6,
                    dash: '5 3',
                },
            )
        } else {
            fig.rect(x, yTop, barW, h, {
                fill: tint(b.color, c.bg, 0.3),
                stroke: b.color,
                strokeWidth: 1.6,
                radius: 4,
            })
        }
        fig.text(plot.px(b.cx), yTop - 13, b.text, {
            size: 14,
            weight: 700,
            color: b.color,
            align: 'center',
            mono: true,
        })
        fig.text(plot.px(b.cx), plot.bottom + 18, b.label, {
            size: 13.5,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
    }

    return fig.render()
}

export default create('dark')
