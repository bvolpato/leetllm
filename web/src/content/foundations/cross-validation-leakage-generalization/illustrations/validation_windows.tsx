import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 860
export const height = 430
export const alt =
    'Walk-forward validation calendar matrix across January through August with two queries per month. Fold 1 fits Jan-Feb and scores Mar-Apr; Fold 2 fits Jan-Apr and scores May-Jun; Candidate fits Jan-Jun, tunes threshold in July, and locks August; Final Test freezes Jan-Jun weights and the July threshold and evaluates once on August. Aligned on the same timeline, prompt r2 opens on June 20 yet its label arrives on August 2 across the July 1 fit cutoff, excluding it from the July 1 training fit.'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'] as const

type Role = 'train' | 'val' | 'tune' | 'test' | 'locked' | 'future'

interface ScheduleRow {
    label: string
    sub: string
    segments: readonly { start: number; span: number; role: Role; text: string }[]
}

const SCHEDULE: readonly ScheduleRow[] = [
    {
        label: 'CV Fold 1',
        sub: '4 fit · 4 val',
        segments: [
            { start: 0, span: 2, role: 'train', text: 'Fit (4)' },
            { start: 2, span: 2, role: 'val', text: 'Val (4)' },
            { start: 4, span: 4, role: 'future', text: 'Future (unseen)' },
        ],
    },
    {
        label: 'CV Fold 2',
        sub: '8 fit · 4 val',
        segments: [
            { start: 0, span: 4, role: 'train', text: 'Fit (8)' },
            { start: 4, span: 2, role: 'val', text: 'Val (4)' },
            { start: 6, span: 2, role: 'future', text: 'Future' },
        ],
    },
    {
        label: 'Candidate',
        sub: 'tune θ on Jul',
        segments: [
            { start: 0, span: 6, role: 'train', text: 'Fit (12)' },
            { start: 6, span: 1, role: 'tune', text: 'Jul θ' },
            { start: 7, span: 1, role: 'locked', text: 'Lock' },
        ],
    },
    {
        label: 'Final Test',
        sub: 'score once',
        segments: [
            { start: 0, span: 6, role: 'train', text: 'Frozen Jan–Jun (12)' },
            { start: 6, span: 1, role: 'tune', text: 'θ fixed' },
            { start: 7, span: 1, role: 'test', text: 'Test' },
        ],
    },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const red = fig.tone('critical')
    const isLight = theme === 'light'

    const gridX = 148
    const gridW = 684
    const colW = gridW / 8
    const topY = 56
    const rowH = 34
    const rowGap = 14

    const roleColor = (role: Role): { fill: string; stroke: string; ink: string } => {
        switch (role) {
            case 'train':
                return {
                    fill: tint(blue, c.bg, isLight ? 0.2 : 0.3),
                    stroke: blue,
                    ink: c.textPrimary,
                }
            case 'val':
                return {
                    fill: tint(warm, c.bg, isLight ? 0.24 : 0.34),
                    stroke: warm,
                    ink: c.textPrimary,
                }
            case 'tune':
                return {
                    fill: tint(purple, c.bg, isLight ? 0.24 : 0.34),
                    stroke: purple,
                    ink: c.textPrimary,
                }
            case 'test':
                return {
                    fill: tint(green, c.bg, isLight ? 0.25 : 0.36),
                    stroke: green,
                    ink: c.textPrimary,
                }
            case 'locked':
                return {
                    fill: tint(c.textMuted, c.bg, isLight ? 0.14 : 0.18),
                    stroke: c.textMuted,
                    ink: c.textSecondary,
                }
            case 'future':
                return {
                    fill: tint(c.textMuted, c.bg, isLight ? 0.06 : 0.09),
                    stroke: c.borderSubtle,
                    ink: c.textMuted,
                }
        }
    }

    // Month column headers and subtle vertical grid lines
    for (let m = 0; m < 8; m++) {
        const x = gridX + m * colW
        fig.text(x + colW / 2, 28, MONTHS[m]!, {
            size: 13,
            weight: 600,
            color: m >= 6 ? c.textPrimary : c.textSecondary,
            align: 'center',
        })
        fig.line(x, 44, x, 376, {
            color: c.borderSubtle,
            width: 1,
            opacity: 0.7,
        })
    }
    fig.line(gridX + gridW, 44, gridX + gridW, 376, {
        color: c.borderSubtle,
        width: 1,
        opacity: 0.7,
    })

    // Draw the 4 walk-forward rows
    SCHEDULE.forEach((row, r) => {
        const y = topY + r * (rowH + rowGap)
        fig.text(gridX - 14, y + 11, row.label, {
            size: 14,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
        })
        fig.text(gridX - 14, y + 26, row.sub, {
            size: 11,
            color: c.textMuted,
            align: 'right',
            mono: true,
        })

        for (const seg of row.segments) {
            const x = gridX + seg.start * colW + 2
            const w = seg.span * colW - 4
            const style = roleColor(seg.role)
            fig.rect(x, y, w, rowH, {
                fill: style.fill,
                stroke: style.stroke,
                strokeWidth: seg.role === 'future' ? 1 : 1.5,
                radius: 5,
            })
            fig.text(x + w / 2, y + rowH / 2, seg.text, {
                size: 13,
                weight: seg.role === 'future' ? 400 : 600,
                color: style.ink,
                align: 'center',
            })
        }
    })

    // Vertical Jul 1 Fit Cutoff spanning matrix and r2 track
    const jul1X = gridX + 6 * colW
    fig.line(jul1X, 42, jul1X, 392, { color: red, width: 2.2, dash: '5 4' })
    fig.text(jul1X, 408, 'Jul 1 fit cutoff', {
        size: 12,
        weight: 700,
        color: red,
        align: 'center',
    })

    // Divider line before delayed-label track
    const sepY = topY + 4 * (rowH + rowGap) + 12
    fig.line(24, sepY, gridX + gridW, sepY, { color: c.borderSubtle, width: 1 })

    // Delayed-label track for prompt r2 aligned to the exact month calendar
    const r2Y = sepY + 66
    fig.text(gridX - 14, r2Y - 8, 'Prompt r2', {
        size: 14,
        weight: 700,
        color: c.textPrimary,
        align: 'right',
    })
    fig.text(gridX - 14, r2Y + 10, 'user u2', {
        size: 12,
        color: c.textSecondary,
        align: 'right',
        mono: true,
    })

    // Jun 20 = month 5 + 20/30, Aug 2 = month 7 + 2/31
    const jun20X = gridX + (5 + 20 / 30) * colW
    const aug2X = gridX + (7 + 2 / 31) * colW

    // Baseline for r2 track
    fig.line(gridX, r2Y, gridX + gridW, r2Y, { color: c.borderSubtle, width: 1.5 })

    // Arrow from Jun 20 to Aug 2 crossing Jul 1 cutoff
    fig.arrow(jun20X + 7, r2Y, aug2X - 7, r2Y, {
        color: red,
        width: 2.5,
        dash: '5 3',
        head: 7,
    })
    fig.circle(jun20X, r2Y, 6, { fill: blue, stroke: c.bg, width: 2 })
    fig.circle(aug2X, r2Y, 6, { fill: purple, stroke: c.bg, width: 2 })

    // Clean non-overlapping callout labels for r2 (completely clear of Jul 1 line)
    fig.callout([jun20X, r2Y - 8], [jun20X - 42, r2Y - 36], 'Jun 20 · logged (u2 seen)', {
        color: blue,
        labelColor: blue,
        align: 'right',
        size: 13,
        weight: 600,
        bend: -0.15,
    })
    fig.text(aug2X, r2Y - 40, 'Aug 2 · label ready', {
        color: purple,
        align: 'center',
        size: 13,
        weight: 600,
    })
    fig.arrow(aug2X, r2Y - 26, aug2X, r2Y - 9, {
        color: purple,
        width: 1.8,
        head: 5.5,
    })

    // Explicit callout where r2 crosses the Jul 1 barrier
    fig.text(jul1X + 12, r2Y + 24, 'arrives after Jul 1 -> skip in Jul 1 fit', {
        size: 12,
        weight: 600,
        color: red,
        align: 'left',
    })

    return fig.render()
}

export default create
