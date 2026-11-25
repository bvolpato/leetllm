import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 340
export const alt =
    'Two paired bar charts on a shared 0 to 5 dollar scale reverse the ranking in a ten-attempt comparison: Setup A spends 20 dollars for 5/10 accepted changes (2.00 per attempt, 4.00 per accepted change), while Setup B spends 30 dollars for 8/10 accepted changes (3.00 per attempt, 3.75 per accepted change).'

const setups = [
    { name: 'Setup A', spent: 20, attempts: 10, accepted: 5, rate: '5/10 accepted' },
    { name: 'Setup B', spent: 30, attempts: 10, accepted: 8, rate: '8/10 accepted' },
] as const

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const blue = f.tone('blue')
    const purple = f.tone('purple')
    const green = f.tone('green')
    const tones = [blue, purple]

    // Left plot: USD / attempt
    const leftPlot = f.plot({ x: 96, y: 74, width: 256, height: 176 }, { x: [0, 5], y: [0, 1] })
    // Right plot: USD / accepted change
    const rightPlot = f.plot({ x: 486, y: 74, width: 256, height: 176 }, { x: [0, 5], y: [0, 1] })

    f.text(96, 26, 'USD / attempt', { size: 18, weight: 700, color: c.textPrimary })
    f.text(96, 49, '10 attempts each', { size: 13.5, color: c.textSecondary })

    f.text(486, 26, 'USD / accepted change', { size: 18, weight: 700, color: c.textPrimary })
    f.text(486, 49, 'Accepted denominator flips rank', { size: 13.5, color: c.textSecondary })

    leftPlot.axes({
        xTicks: [0, 1, 2, 3, 4, 5],
        xFormat: (v) => `$${v}`,
        labelSize: 13,
        grid: true,
    })
    rightPlot.axes({
        xTicks: [0, 1, 2, 3, 4, 5],
        xFormat: (v) => `$${v}`,
        labelSize: 13,
        grid: true,
    })

    // Row positions inside both plots
    const rowY = [122, 206]

    setups.forEach((s, i) => {
        const y = rowY[i]!
        const tone = tones[i]!

        // Left row labels
        f.text(86, y - 9, s.name, { size: 15, weight: 700, color: tone, align: 'right' })
        f.text(86, y + 11, `$${s.spent} spent`, {
            size: 13,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })

        // Left bar: cost per attempt
        const perAttempt = s.spent / s.attempts
        const lw = leftPlot.px(perAttempt) - leftPlot.px(0)
        f.rect(leftPlot.px(0), y - 16, lw, 32, {
            fill: tint(tone, c.bg, 0.78),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 5,
        })
        f.text(leftPlot.px(perAttempt) + 10, y, `$${perAttempt.toFixed(2)}`, {
            size: 16,
            weight: 700,
            color: tone,
            mono: true,
        })

        // Acceptance badge in the bridge column between plots
        const badgeX = 376
        const badgeW = 92
        f.rect(badgeX, y - 15, badgeW, 30, {
            fill: tint(tone, c.bg, 0.14),
            stroke: tone,
            strokeWidth: 1.25,
            radius: 15,
        })
        f.text(badgeX + badgeW / 2, y, `${s.accepted}/10`, {
            size: 14,
            weight: 700,
            color: tone,
            align: 'center',
            mono: true,
        })

        // Right bar: cost per accepted change
        const perAccepted = s.spent / s.accepted
        const rw = rightPlot.px(perAccepted) - rightPlot.px(0)
        f.rect(rightPlot.px(0), y - 16, rw, 32, {
            fill: tint(tone, c.bg, 0.78),
            stroke: tone,
            strokeWidth: 1.5,
            radius: 5,
        })
        f.text(rightPlot.px(perAccepted) + 10, y, `$${perAccepted.toFixed(2)}`, {
            size: 16,
            weight: 700,
            color: tone,
            mono: true,
        })
    })

    // Bridge header
    f.text(422, 49, 'Acceptance', {
        size: 13,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    // Highlight winner badges (rank reversal: A cheaper left, B cheaper right)
    const drawCheaperPill = (cx: number, cy: number, label: string, pw = 88) => {
        f.rect(cx - pw / 2, cy - 11, pw, 22, {
            fill: tint(green, c.bg, 0.18),
            stroke: green,
            strokeWidth: 1.25,
            radius: 11,
        })
        f.text(cx, cy, label, {
            size: 12.5,
            weight: 700,
            color: green,
            align: 'center',
        })
    }

    drawCheaperPill(leftPlot.px(2) + 114, rowY[0]!, 'Cheaper', 76)
    drawCheaperPill(rightPlot.px(3.75) - 66, rowY[1]! + 29, 'Lower / acc.', 92)

    // Rank flip summary below bridge
    f.text(422, 314, 'Rank flips: A ($2.00/attempt) vs B ($3.75/accepted)', {
        size: 13.5,
        weight: 600,
        color: c.textSecondary,
        align: 'center',
    })

    return f.render()
}

export default create('dark')
