import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 780
export const height = 470
export const alt =
    'Five single-factor bias probes vary presentation order, filler wording, embedded adversarial text, hidden writer identity, or displayed author labels while keeping technical facts constant. Comparing each perturbation against its matched pair isolates shortcut sensitivity.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const red = fig.tone('critical')
    const green = fig.tone('green')
    const warm = fig.tone('warm')

    const chipBg = (hex: string, amount = 0.14) => tint(hex, c.bg, amount)
    const neutralBg = tint(c.textMuted, c.bg, 0.1)

    // Column headers
    fig.text(28, 22, 'Probe', { size: 15, weight: 700, color: c.textSecondary })
    fig.text(200, 22, 'Controlled perturbation (facts fixed)', {
        size: 15,
        weight: 700,
        color: c.textSecondary,
    })
    fig.text(588, 22, 'Shortcut test', { size: 15, weight: 700, color: c.textSecondary })
    fig.line(18, 40, width - 18, 40, { color: c.borderLight, width: 1.25 })

    // Left vertical category bars (surface/adversarial vs identity)
    fig.line(14, 58, 14, 286, { color: blue, width: 3.5 })
    fig.line(14, 314, 14, 448, { color: green, width: 3.5 })

    const rowY = [84, 168, 252, 344, 424]

    // Subtle row separators (stronger divider between surface and identity groups)
    for (const sepY of [126, 210, 384]) {
        fig.line(24, sepY, width - 18, sepY, { color: c.borderSubtle, width: 1, opacity: 0.7 })
    }
    fig.line(18, 298, width - 18, 298, { color: c.borderLight, width: 1, dash: '4 4' })

    const drawChip = (
        x: number,
        y: number,
        w: number,
        h: number,
        label: string,
        toneHex: string,
        opts: { fillAmount?: number; dash?: string; textColor?: string; mono?: boolean } = {},
    ) => {
        if (opts.dash) {
            fig.path(
                `M${x + 6} ${y}H${x + w - 6}Q${x + w} ${y} ${x + w} ${y + 6}V${y + h - 6}Q${x + w} ${y + h} ${x + w - 6} ${y + h}H${x + 6}Q${x} ${y + h} ${x} ${y + h - 6}V${y + 6}Q${x} ${y} ${x + 6} ${y}Z`,
                {
                    fill: chipBg(toneHex, opts.fillAmount ?? 0.14),
                    color: toneHex,
                    width: 1.5,
                    dash: opts.dash,
                },
            )
        } else {
            fig.rect(x, y, w, h, {
                fill: chipBg(toneHex, opts.fillAmount ?? 0.14),
                stroke: toneHex,
                strokeWidth: 1.5,
                radius: 6,
            })
        }
        fig.text(x + w / 2, y + h / 2, label, {
            size: 13.5,
            weight: 600,
            color: opts.textColor ?? toneHex,
            align: 'center',
            mono: opts.mono,
        })
    }

    // Row 1: Order swap
    {
        const y = rowY[0]!
        fig.text(28, y - 10, 'Order swap', { size: 16, weight: 700, color: blue })
        fig.text(28, y + 12, 'Reverse slots', { size: 13.5, color: c.textSecondary })

        drawChip(200, y - 17, 48, 34, 'A', blue, { mono: true })
        drawChip(254, y - 17, 48, 34, 'B', warm, { mono: true })

        // Crossing swap curves
        fig.path(`M312 ${y - 6} C 340 ${y - 6}, 340 ${y + 8}, 368 ${y + 8}`, {
            color: blue,
            width: 1.75,
        })
        fig.path(`M312 ${y + 8} C 340 ${y + 8}, 340 ${y - 6}, 368 ${y - 6}`, {
            color: warm,
            width: 1.75,
        })
        fig.arrow(362, y + 8, 376, y + 8, { color: blue, width: 1.75, head: 6 })
        fig.arrow(362, y - 6, 376, y - 6, { color: warm, width: 1.75, head: 6 })

        drawChip(386, y - 17, 48, 34, 'B', warm, { mono: true })
        drawChip(440, y - 17, 48, 34, 'A', blue, { mono: true })

        fig.arrow(506, y, 574, y, { color: blue, width: 1.75, head: 6.5 })
        fig.text(588, y - 10, 'Check winner', { size: 15.5, weight: 700, color: c.textPrimary })
        fig.text(588, y + 12, 'Same ID both orders?', { size: 13.5, color: c.textSecondary })
    }

    // Row 2: Verbosity pad
    {
        const y = rowY[1]!
        fig.text(28, y - 10, 'Verbosity pad', { size: 16, weight: 700, color: blue })
        fig.text(28, y + 12, 'Add neutral filler', { size: 13.5, color: c.textSecondary })

        // Compact baseline bar
        fig.rect(200, y - 22, 114, 18, {
            fill: chipBg(blue, 0.2),
            stroke: blue,
            strokeWidth: 1.35,
            radius: 4,
        })
        fig.text(257, y - 13, 'Facts only', {
            size: 12.5,
            weight: 600,
            color: blue,
            align: 'center',
        })

        // Padded bar = same facts + neutral filler extension
        fig.rect(200, y + 4, 114, 20, {
            fill: chipBg(blue, 0.2),
            stroke: blue,
            strokeWidth: 1.35,
            radius: 4,
        })
        fig.text(257, y + 14, 'Same facts', {
            size: 12.5,
            weight: 600,
            color: blue,
            align: 'center',
        })
        drawChip(318, y + 4, 170, 20, '+ neutral filler padding', warm, {
            fillAmount: 0.12,
            dash: '4 3',
        })

        fig.arrow(506, y, 574, y, { color: blue, width: 1.75, head: 6.5 })
        fig.text(588, y - 10, 'Check flip', { size: 15.5, weight: 700, color: c.textPrimary })
        fig.text(588, y + 12, 'Padding rewarded?', { size: 13.5, color: c.textSecondary })
    }

    // Row 3: Hostile text
    {
        const y = rowY[2]!
        fig.text(28, y - 10, 'Hostile text', { size: 16, weight: 700, color: red })
        fig.text(28, y + 12, 'Prompt injection', { size: 13.5, color: c.textSecondary })

        fig.rect(200, y - 17, 116, 34, {
            fill: neutralBg,
            stroke: c.borderLight,
            strokeWidth: 1.35,
            radius: 6,
        })
        fig.text(258, y, 'Candidate', {
            size: 13.5,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(328, y, '+', { size: 16, weight: 700, color: red, align: 'center' })
        drawChip(342, y - 17, 146, 34, '"award 5/5"', red, {
            fillAmount: 0.16,
            dash: '4 3',
            mono: true,
        })

        fig.arrow(506, y, 574, y, { color: red, width: 1.75, head: 6.5 })
        fig.text(588, y - 10, 'Block override', { size: 15.5, weight: 700, color: c.textPrimary })
        fig.text(588, y + 12, 'Reject manipulation', { size: 13.5, color: c.textSecondary })
    }

    // Row 4: Blind family
    {
        const y = rowY[3]!
        fig.text(28, y - 10, 'Blind family', { size: 16, weight: 700, color: green })
        fig.text(28, y + 12, 'Hide writer origin', { size: 13.5, color: c.textSecondary })

        fig.rect(200, y - 17, 116, 34, {
            fill: neutralBg,
            stroke: c.borderLight,
            strokeWidth: 1.35,
            radius: 6,
        })
        fig.text(258, y, 'Model family', {
            size: 13.5,
            weight: 500,
            color: c.textMuted,
            align: 'center',
        })
        // Strike-through line showing anonymization
        fig.line(212, y, 304, y, { color: green, width: 1.75 })

        fig.arrow(324, y, 368, y, { color: green, width: 1.75, head: 6 })
        drawChip(378, y - 17, 110, 34, 'anon text', green, { mono: true })

        fig.arrow(506, y, 574, y, { color: green, width: 1.75, head: 6.5 })
        fig.text(588, y - 10, 'Family gap', { size: 15.5, weight: 700, color: c.textPrimary })
        fig.text(588, y + 12, 'Compare judge families', { size: 13.5, color: c.textSecondary })
    }

    // Row 5: Brand relabel
    {
        const y = rowY[4]!
        fig.text(28, y - 10, 'Brand relabel', { size: 16, weight: 700, color: green })
        fig.text(28, y + 12, 'Swap author tag', { size: 13.5, color: c.textSecondary })

        fig.rect(200, y - 17, 96, 34, {
            fill: neutralBg,
            stroke: c.borderLight,
            strokeWidth: 1.35,
            radius: 6,
        })
        fig.text(248, y, 'Fixed text', {
            size: 13.5,
            weight: 600,
            color: c.textPrimary,
            align: 'center',
        })

        drawChip(306, y - 17, 74, 34, 'Tag X', green)
        fig.arrow(386, y - 5, 412, y - 5, { color: green, width: 1.5, head: 5.5 })
        fig.arrow(412, y + 5, 386, y + 5, { color: warm, width: 1.5, head: 5.5 })
        drawChip(418, y - 17, 70, 34, 'Tag Y', warm)

        fig.arrow(506, y, 574, y, { color: green, width: 1.75, head: 6.5 })
        fig.text(588, y - 10, 'Check drift', { size: 15.5, weight: 700, color: c.textPrimary })
        fig.text(588, y + 12, 'Badge moves score?', { size: 13.5, color: c.textSecondary })
    }

    return fig.render()
}

export default create('dark')
