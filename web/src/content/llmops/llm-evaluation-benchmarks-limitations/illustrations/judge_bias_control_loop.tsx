import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 430
export const alt =
    'Side-by-side order-swapped judge checks. On the left, equivalent answers with slot-A tie bias pick Concise first and Verbose second, mapping to conflicting candidate IDs and routing to human review. On the right, when one reply omits a rule, Concise wins in slot A and then slot B, confirming order stability while still requiring human accuracy calibration.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const warm = fig.tone('warm')
    const red = fig.tone('critical')
    const blue = fig.tone('blue')
    const green = fig.tone('green')

    const soft = (hex: string, amount = 0.13) => tint(hex, c.bg, amount)

    const drawBox = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        sub: string,
        toneHex: string,
        strong = false,
    ) => {
        fig.rect(x, y, w, h, {
            fill: soft(toneHex, strong ? 0.18 : 0.12),
            stroke: toneHex,
            strokeWidth: strong ? 2 : 1.5,
            radius: 8,
        })
        fig.text(x + w / 2, y + h / 2 - 11, title, {
            size: strong ? 15.5 : 14.5,
            weight: 700,
            color: strong ? toneHex : c.textPrimary,
            align: 'center',
        })
        fig.text(x + w / 2, y + h / 2 + 12, sub, {
            size: 13.5,
            weight: strong ? 500 : 600,
            color: strong ? c.textSecondary : toneHex,
            align: 'center',
            mono: !strong,
        })
    }

    // Center hairline divider between the two side-by-side cases
    fig.line(390, 18, 390, height - 18, { color: c.borderLight, width: 1, dash: '5 4' })

    // Left column: Equal facts + slot-A tie bias -> Review
    fig.text(192, 24, 'Equal facts + slot-A tie bias', {
        size: 16,
        weight: 700,
        color: warm,
        align: 'center',
    })
    fig.text(192, 46, 'Slot bias flips the mapped candidate ID', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    drawBox(24, 72, 336, 68, 'Run 1: (Concise, Verbose)', 'Vote A  =>  Concise', warm)
    drawBox(24, 162, 336, 68, 'Run 2: (Verbose, Concise)', 'Vote A  =>  Verbose', red)

    // Converging lines down to outcome
    fig.path('M112 140 V 252 H 192', { color: warm, width: 1.8 })
    fig.path('M272 230 V 252 H 192', { color: red, width: 1.8 })
    fig.arrow(192, 252, 192, 304, { color: red, width: 2.2, head: 7 })
    fig.text(204, 276, 'Conflict: Concise vs Verbose', {
        size: 12.5,
        weight: 600,
        color: red,
        align: 'left',
    })

    drawBox(44, 308, 296, 86, 'Flipped winner', 'Route pair to human review', red, true)

    // Right column: Omission present -> Stable winner
    fig.text(588, 24, 'Omission present -> Stable pick', {
        size: 16,
        weight: 700,
        color: blue,
        align: 'center',
    })
    fig.text(588, 46, 'Both slot orders resolve to the same ID', {
        size: 13,
        color: c.textSecondary,
        align: 'center',
    })

    drawBox(420, 72, 336, 68, 'Run 1: (Concise, Omission)', 'Vote A  =>  Concise', blue)
    drawBox(420, 162, 336, 68, 'Run 2: (Omission, Concise)', 'Vote B  =>  Concise', blue)

    fig.path('M508 140 V 252 H 588', { color: blue, width: 1.8 })
    fig.path('M668 230 V 252 H 588', { color: blue, width: 1.8 })
    fig.arrow(588, 252, 588, 304, { color: green, width: 2.2, head: 7 })
    fig.text(600, 276, 'Same ID in both orders', {
        size: 12.5,
        weight: 600,
        color: green,
        align: 'left',
    })

    drawBox(
        440,
        308,
        296,
        86,
        'Stable: Concise',
        'Calibrate accuracy vs humans',
        green,
        true,
    )

    return fig.render()
}

export default create('dark')
