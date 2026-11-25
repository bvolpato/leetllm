import { getReadableTextColor, type ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 395
export const alt =
    'Four-stage tenant quota lifecycle on a conserved 0 to 1,000 token scale. Stage 1 starts with 1,000 units available. Stage 2 reserves 700 units (300 input plus 400 max output), leaving 300 available. Stage 3 settles 120 actual output tokens for 420 total billed, releasing 280 unused units to restore 580 available. Stage 4 shows a duplicate settlement delivery leaving 420 settled and 580 available unchanged.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const soft = (hex: string, a = 0.18) => tint(hex, c.bg, a)
    const onBlue = getReadableTextColor(blue, c, c.bg)
    const onWarm = getReadableTextColor(warm, c, c.bg)
    const onGreen = getReadableTextColor(green, c, c.bg)

    // Conservation equation at top
    fig.math(
        445,
        28,
        String.raw`\text{limit }(1{,}000) = \text{settled} + \text{held} + \text{available}`,
        { size: 15, color: c.textPrimary, align: 'center' },
    )

    // Shared 0..1,000 token bar plot area
    const plot = fig.plot({ x: 170, y: 66, width: 580, height: 248 }, { x: [0, 1000], y: [0, 4] })
    const ticks = [0, 200, 400, 600, 800, 1000]
    for (const t of ticks) {
        const x = plot.px(t)
        fig.line(x, 66, x, 314, { color: c.borderSubtle, width: 1, opacity: 0.65 })
        fig.line(x, 314, x, 320, { color: c.textMuted, width: 1.2 })
        fig.text(x, 336, `${t}`, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            mono: true,
            width: 56,
        })
    }
    fig.line(plot.px(0), 314, plot.px(1000), 314, { color: c.textMuted, width: 1.3 })
    fig.text(plot.px(500), 362, 'Tenant quota budget (tokens)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
        width: 240,
    })

    // Reference guides at 420 and 700
    fig.line(plot.px(420), 66, plot.px(420), 314, {
        color: blue,
        width: 1.2,
        dash: '4 3',
        opacity: 0.7,
    })
    fig.line(plot.px(700), 66, plot.px(700), 314, {
        color: warm,
        width: 1.2,
        dash: '4 3',
        opacity: 0.7,
    })

    const barH = 34
    const rows = [
        { y: 82, title: '1. Initial', sub: 'Full allowance' },
        { y: 142, title: '2. Reserve', sub: '300 in + 400 max' },
        { y: 202, title: '3. Settle', sub: '120 actual out' },
        { y: 262, title: '4. Replay', sub: 'Duplicate report' },
    ]
    for (const row of rows) {
        fig.text(156, row.y + 8, row.title, {
            size: 14,
            color: c.textPrimary,
            align: 'right',
            weight: 700,
            width: 138,
        })
        fig.text(156, row.y + 26, row.sub, {
            size: 12,
            color: c.textSecondary,
            align: 'right',
            width: 138,
        })
    }

    const seg = (
        x0: number,
        x1: number,
        y: number,
        fill: string,
        label: string,
        textColor: string,
        opts: { stroke?: string; dash?: boolean } = {},
    ) => {
        const px0 = plot.px(x0)
        const w = plot.px(x1) - px0
        fig.rect(px0, y, w, barH, {
            fill,
            stroke: opts.stroke,
            strokeWidth: opts.stroke ? 1.4 : 0,
            radius: 5,
        })
        if (opts.dash) {
            fig.line(px0 + 4, y + barH - 4, px0 + w - 4, y + barH - 4, {
                color: green,
                width: 1.5,
                dash: '4 3',
            })
        }
        fig.text(px0 + w / 2, y + barH / 2, label, {
            size: 13,
            color: textColor,
            align: 'center',
            weight: 700,
            width: Math.max(40, w - 8),
        })
    }

    // Row 1: 1,000 available
    seg(0, 1000, rows[0]!.y, green, '1,000 available', onGreen)

    // Row 2: 700 held (300 in + 400 max out) + 300 available
    seg(0, 700, rows[1]!.y, warm, '700 held (300 in + 400 max)', onWarm)
    fig.line(plot.px(300), rows[1]!.y, plot.px(300), rows[1]!.y + 6, {
        color: onWarm,
        width: 1.5,
        opacity: 0.85,
    })
    fig.line(plot.px(300), rows[1]!.y + barH - 6, plot.px(300), rows[1]!.y + barH, {
        color: onWarm,
        width: 1.5,
        opacity: 0.85,
    })
    seg(700, 1000, rows[1]!.y, soft(green, theme === 'light' ? 0.2 : 0.25), '300 free', green, {
        stroke: green,
    })

    // Row 3: 420 settled + 280 released + 300 existing = 580 available
    seg(0, 420, rows[2]!.y, blue, '420 settled', onBlue)
    seg(
        420,
        700,
        rows[2]!.y,
        soft(green, theme === 'light' ? 0.14 : 0.2),
        '+280 released',
        green,
        { stroke: green, dash: true },
    )
    seg(700, 1000, rows[2]!.y, soft(green, theme === 'light' ? 0.22 : 0.28), '300 free', green, {
        stroke: green,
    })
    fig.text(764, rows[2]!.y + 17, '= 580', {
        size: 13,
        color: green,
        align: 'left',
        weight: 700,
        mono: true,
        width: 50,
    })

    // Row 4: Duplicate settlement (idempotent no-op)
    seg(0, 420, rows[3]!.y, blue, '420 settled (unchanged)', onBlue)
    seg(420, 1000, rows[3]!.y, green, '580 available (no-op)', onGreen)
    fig.text(764, rows[3]!.y + 17, '= 580', {
        size: 13,
        color: green,
        align: 'left',
        weight: 700,
        mono: true,
        width: 50,
    })

    return fig.render()
}
