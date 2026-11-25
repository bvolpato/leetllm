import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 456
export const alt =
    'The prompt The function returns the gives result 60 percent, value 25, index 10 and other tokens together 5. A flowing ribbon connects the 60 percent result slice downward into step 2, where appending result assigns 80 percent to period and 20 percent to and, yielding 2-token joint probabilities: result + period 48 percent, result + and 12 percent, and other first tokens 40 percent.'

export const firstProbabilities = [0.6, 0.25, 0.1, 0.05]
export const secondProbabilities = [0.8, 0.2]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const purple = fig.tone('purple')
    const amberMark = isLight ? '#d07a12' : '#f2b84b'
    const amberText = isLight ? '#9a5204' : '#f2b84b'
    const mutedBar = isLight ? '#b8b1a3' : '#4a505d'

    // ── Step 1 Header & Prompt Chips ────────────────────────────────────────
    fig.text(24, 24, 'Step 1: score next token from prompt', {
        size: 20,
        weight: 750,
        color: c.textPrimary,
    })

    const promptChips = [
        { txt: 'The', x: 24, w: 62 },
        { txt: 'function', x: 96, w: 108 },
        { txt: 'returns', x: 214, w: 100 },
        { txt: 'the', x: 324, w: 60 },
    ] as const
    for (const ch of promptChips) {
        fig.rect(ch.x, 48, ch.w, 32, {
            fill: c.bgSubtle,
            stroke: c.border,
            strokeWidth: 1.4,
            radius: 6,
        })
        fig.text(ch.x + ch.w / 2, 64, ch.txt, {
            size: 17,
            mono: true,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
            width: ch.w - 4,
        })
    }
    fig.arrow(394, 64, 434, 64, { color: green, width: 2.4, head: 6.5 })
    fig.rect(442, 48, 152, 32, {
        fill: tint(green, c.bg, isLight ? 0.16 : 0.24),
        stroke: green,
        strokeWidth: 1.8,
        radius: 6,
    })
    fig.text(518, 64, 'pick "result"', {
        size: 17,
        mono: true,
        weight: 750,
        color: green,
        align: 'center',
    })

    // ── Step 1 Probability Strip (y = 114..152) ─────────────────────────────
    const barX = 24
    const barW = 752
    const y1 = 114
    const barH = 38

    const wResult = barW * 0.6 // 451.2
    const wValue = barW * 0.25 // 188.0
    const wIndex = barW * 0.1 // 75.2
    const wOther = barW - wResult - wValue - wIndex // 37.6

    fig.rect(barX, y1, wResult - 2, barH, { fill: green, radius: 5 })
    fig.rect(barX + wResult, y1, wValue - 2, barH, { fill: blue, radius: 5 })
    fig.rect(barX + wResult + wValue, y1, wIndex - 2, barH, { fill: purple, radius: 5 })
    fig.rect(barX + wResult + wValue + wIndex, y1, wOther, barH, { fill: mutedBar, radius: 5 })

    // Direct labels above/inside Step 1 strip
    const darkInk = isLight ? '#ffffff' : '#0b0c10'
    fig.text(barX + wResult / 2, y1 + barH / 2, 'result · 60%', {
        size: 18,
        weight: 750,
        color: darkInk,
        align: 'center',
    })
    fig.text(barX + wResult + wValue / 2, y1 + barH / 2, 'value · 25%', {
        size: 17,
        weight: 750,
        color: darkInk,
        align: 'center',
    })
    fig.text(barX + wResult + wValue + wIndex / 2, y1 - 14, 'index 10%', {
        size: 15,
        weight: 650,
        color: purple,
        align: 'center',
    })
    fig.text(barX + barW, y1 - 14, '5%', {
        size: 15,
        weight: 600,
        color: c.textSecondary,
        align: 'right',
    })

    // ── Flowing Ribbons from Step 1 (y = 152) -> Step 2 Joint Strip (y = 292) ─
    const y2 = 294
    const wPeriod = wResult * 0.8 // 360.96 (= 48% of total)
    const wAnd = wResult - wPeriod // 90.24 (= 12% of total)

    const ribbon = (
        xTopL: number,
        xTopR: number,
        xBotL: number,
        xBotR: number,
        fill: string,
        opacity: number,
    ) => {
        const yMid = (y1 + barH + y2) / 2
        const d =
            `M${xTopL.toFixed(1)} ${y1 + barH}` +
            `C${xTopL.toFixed(1)} ${yMid}, ${xBotL.toFixed(1)} ${yMid}, ${xBotL.toFixed(1)} ${y2}` +
            `L${xBotR.toFixed(1)} ${y2}` +
            `C${xBotR.toFixed(1)} ${yMid}, ${xTopR.toFixed(1)} ${yMid}, ${xTopR.toFixed(1)} ${y1 + barH}Z`
        fig.path(d, { fill, fillOpacity: opacity })
    }

    // Ribbon 1: result (60%) splits into period (80% -> 48% joint) and and (20% -> 12% joint)
    ribbon(barX, barX + wPeriod - 2, barX, barX + wPeriod - 2, blue, isLight ? 0.16 : 0.22)
    ribbon(
        barX + wPeriod,
        barX + wResult - 2,
        barX + wPeriod,
        barX + wResult - 2,
        amberMark,
        isLight ? 0.18 : 0.24,
    )
    // Ribbon 2: remaining 40% other first tokens continue downward
    ribbon(barX + wResult, barX + barW, barX + wResult, barX + barW, mutedBar, isLight ? 0.12 : 0.14)

    // Mid-ribbon annotation explaining the conditional multiplication
    fig.text(barX + wResult / 2, 198, 'Step 2: append "result" → score next token', {
        size: 18,
        weight: 750,
        color: green,
        align: 'center',
    })
    fig.text(barX + wPeriod / 2, 238, '80% → period "."', {
        size: 18,
        weight: 750,
        color: blue,
        align: 'center',
    })
    fig.text(barX + wPeriod + wAnd / 2, 238, '20% → and', {
        size: 16,
        weight: 750,
        color: amberText,
        align: 'center',
    })
    fig.text(barX + wResult + (barW - wResult) / 2, 222, 'Other first tokens (40%)', {
        size: 17,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    // ── Step 2 Joint Probability Strip (y = 294..332) ───────────────────────
    fig.rect(barX, y2, wPeriod - 2, barH, { fill: blue, radius: 5 })
    fig.rect(barX + wPeriod, y2, wAnd - 2, barH, { fill: amberMark, radius: 5 })
    fig.rect(barX + wResult, y2, barW - wResult, barH, { fill: mutedBar, radius: 5 })

    fig.text(barX + wPeriod / 2, y2 + barH / 2, 'result + period · 48%', {
        size: 18,
        weight: 750,
        color: darkInk,
        align: 'center',
    })
    fig.text(barX + wPeriod + wAnd / 2, y2 + barH / 2, '12%', {
        size: 17,
        weight: 750,
        color: darkInk,
        align: 'center',
    })
    fig.text(barX + wResult + (barW - wResult) / 2, y2 + barH / 2, 'other paths · 40%', {
        size: 17,
        weight: 700,
        color: isLight ? '#1d1b16' : '#f2efe6',
        align: 'center',
    })

    // ── Bottom explicit joint-probability breakdown (zero cryptic abbreviations) ─
    const yLeg = 368
    fig.text(24, yLeg, '2-token joint path probabilities:', {
        size: 18,
        weight: 750,
        color: c.textPrimary,
    })

    // Two clean rows so equations never crowd or collide
    fig.rect(24, yLeg + 26, 12, 12, { fill: blue, radius: 3 })
    fig.text(44, yLeg + 32, 'result + period:  0.60 × 0.80 = 48%', {
        size: 16,
        mono: true,
        weight: 700,
        color: blue,
    })

    fig.rect(456, yLeg + 26, 12, 12, { fill: mutedBar, radius: 3 })
    fig.text(476, yLeg + 32, 'other first tokens:  40%', {
        size: 16,
        mono: true,
        weight: 700,
        color: c.textSecondary,
    })

    fig.rect(24, yLeg + 56, 12, 12, { fill: amberMark, radius: 3 })
    fig.text(44, yLeg + 62, 'result + and:     0.60 × 0.20 = 12%', {
        size: 16,
        mono: true,
        weight: 700,
        color: amberText,
    })

    return fig.render()
}

export default create('dark')
