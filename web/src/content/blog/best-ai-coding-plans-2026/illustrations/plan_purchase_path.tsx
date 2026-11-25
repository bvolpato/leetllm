import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 355
export const alt =
    'Modeled monthly cost breakdown: 200 dollars for seats, 80 dollars for extra usage, and 600 dollars for review and correction. Vendor charges total 280 dollars; economic cost totals 880 dollars. Forty accepted changes yields 7 dollars vendor cost or 22 dollars including labor per change.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const warm = fig.tone('warm')

    // Compact legend along top
    const legend = [
        { label: 'Seats ($200)', color: blue, x: 36 },
        { label: 'Extra usage ($80)', color: purple, x: 174 },
        { label: 'Review labor ($600)', color: warm, x: 342 },
    ]
    for (const item of legend) {
        fig.rect(item.x, 22, 13, 13, { fill: item.color, radius: 3 })
        fig.text(item.x + 20, 29, item.label, {
            size: 13.5,
            weight: 600,
            color: c.textPrimary,
        })
    }
    fig.text(width - 36, 29, '40 accepted / mo', {
        size: 13,
        color: c.textSecondary,
        align: 'right',
    })

    const barX = 36
    const maxW = 640
    const maxVal = 900
    const sx = (v: number) => barX + (v / maxVal) * maxW
    const sw = (v: number) => (v / maxVal) * maxW

    // Faint vertical reference grid ($0, $200, $400, $600, $800)
    const gridTop = 64
    const gridBottom = 290
    for (const tick of [0, 200, 400, 600, 800]) {
        const tx = sx(tick)
        fig.line(tx, gridTop, tx, gridBottom, {
            color: c.borderSubtle,
            width: 1,
        })
        fig.text(tx, gridBottom + 18, `$${tick}`, {
            size: 12.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    // Row 1: Vendor invoice ($280)
    const row1Y = 104
    const barH = 44
    fig.text(barX, row1Y - 18, 'Vendor invoice', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.rect(barX, row1Y, sw(200) - 2, barH, { fill: blue, radius: 5 })
    fig.rect(barX + sw(200), row1Y, sw(80), barH, { fill: purple, radius: 5 })

    fig.text(barX + sw(200) / 2, row1Y + barH / 2, '$200', {
        size: 13.5,
        weight: 700,
        color: theme === 'light' ? '#ffffff' : '#0b0c10',
        align: 'center',
        mono: true,
    })
    fig.text(barX + sw(200) + sw(80) / 2, row1Y + barH / 2, '$80', {
        size: 12.5,
        weight: 700,
        color: theme === 'light' ? '#ffffff' : '#0b0c10',
        align: 'center',
        mono: true,
    })
    fig.text(barX + sw(280) + 14, row1Y + barH / 2, '$280 ÷ 40 = $7 / accepted', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
        mono: true,
    })

    // Row 2: Full economic cost ($880)
    const row2Y = 212
    fig.text(barX, row2Y - 18, 'Vendor invoice + review labor (8 hr × $75/hr)', {
        size: 15,
        weight: 700,
        color: c.textPrimary,
    })
    fig.rect(barX, row2Y, sw(200) - 2, barH, { fill: blue, radius: 5 })
    fig.rect(barX + sw(200), row2Y, sw(80) - 2, barH, { fill: purple, radius: 5 })
    fig.rect(barX + sw(280), row2Y, sw(600), barH, { fill: warm, radius: 5 })

    fig.text(barX + sw(200) / 2, row2Y + barH / 2, '$200', {
        size: 13.5,
        weight: 700,
        color: theme === 'light' ? '#ffffff' : '#0b0c10',
        align: 'center',
        mono: true,
    })
    fig.text(barX + sw(200) + sw(80) / 2, row2Y + barH / 2, '$80', {
        size: 12.5,
        weight: 700,
        color: theme === 'light' ? '#ffffff' : '#0b0c10',
        align: 'center',
        mono: true,
    })
    fig.text(barX + sw(280) + sw(600) / 2, row2Y + barH / 2, '$600 review & correction (68%)', {
        size: 14,
        weight: 700,
        color: theme === 'light' ? '#ffffff' : '#0b0c10',
        align: 'center',
    })
    fig.text(barX + sw(880), row2Y + barH + 22, '$880 ÷ 40 = $22 / accepted (3.1× invoice)', {
        size: 15,
        weight: 700,
        color: warm,
        align: 'right',
        mono: true,
    })

    fig.text(barX + maxW / 2, gridBottom + 44, 'Monthly cost (USD, zero-based scale)', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    return fig.render()
}

export default create('dark')
