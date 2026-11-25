import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 385
export const alt =
    'Three aligned probability distributions compare a hard one-hot target with teacher softmax probabilities at T=1 and T=4 from logits [4.0, 2.0, 1.0, 0.7] over 7d, 3d, 30d, and never. Raising temperature to T=4 preserves the exact ranking while narrowing the top gap (7d minus 3d) from 1.000 to 0.708 to 0.156 and lifting informative probability mass onto secondary candidates.'

const answers = ['7d', '3d', '30d', 'never']
const logits = ['4.0', '2.0', '1.0', '0.7']

const panels = [
    {
        title: 'Hard target',
        gap: 'gap 1.000',
        tone: 'muted' as const,
        values: [1.0, 0.0, 0.0, 0.0],
        shown: ['1.0000', '0.0000', '0.0000', '0.0000'],
    },
    {
        title: 'Teacher · T = 1',
        gap: 'gap 0.708',
        tone: 'cyan' as const,
        values: [0.8183, 0.1107, 0.0407, 0.0302],
        shown: ['0.8183', '0.1107', '0.0407', '0.0302'],
    },
    {
        title: 'Teacher · T = 4',
        gap: 'gap 0.156',
        tone: 'warm' as const,
        values: [0.3973, 0.241, 0.1877, 0.1741],
        shown: ['0.3973', '0.2410', '0.1877', '0.1741'],
    },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const cyan = fig.tone('cyan')
    const warm = fig.tone('warm')
    const muted = c.textSecondary

    // Top equation showing softmax(z / T)
    fig.math(
        width / 2,
        24,
        String.raw`p_i(T) = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)},\quad z = [4.0,\; 2.0,\; 1.0,\; 0.7]`,
        { size: 15, color: c.textPrimary, align: 'center' },
    )

    // Left shared outcome + logit labels
    const rowYs = [126, 180, 234, 288]
    fig.text(104, 88, 'token · z', { size: 13, mono: true, color: muted, align: 'right' })
    answers.forEach((ans, i) => {
        const ry = rowYs[i]!
        fig.text(64, ry, ans, {
            size: 15,
            mono: true,
            weight: 700,
            color: c.textPrimary,
            align: 'right',
        })
        fig.text(104, ry, logits[i]!, {
            size: 13,
            mono: true,
            color: muted,
            align: 'right',
        })
    })

    // Three aligned small-multiple panels
    const panelW = 196
    const panelGap = 20
    const startX = 128
    const barMaxW = 118

    panels.forEach((p, pIdx) => {
        const x0 = startX + pIdx * (panelW + panelGap)
        const color = p.tone === 'cyan' ? cyan : p.tone === 'warm' ? warm : muted

        fig.text(x0 + barMaxW / 2, 62, p.title, {
            size: 15,
            weight: 700,
            color,
            align: 'center',
        })

        // Vertical hairline gridlines at 0, 0.5, 1.0
        ;[0, 0.5, 1.0].forEach((t) => {
            const tx = x0 + t * barMaxW
            fig.line(tx, 102, tx, 314, {
                color: t === 0 ? c.textMuted : c.borderSubtle,
                width: 1,
                dash: t === 0 ? undefined : '3 3',
            })
            fig.text(tx, 88, t === 0 ? '0' : t.toFixed(1), {
                size: 12,
                mono: true,
                color: muted,
                align: 'center',
            })
        })

        // Bars + right-aligned exact values
        p.values.forEach((v, rIdx) => {
            const ry = rowYs[rIdx]!
            const bw = v * barMaxW
            const isSecondary = rIdx > 0 && pIdx === 2
            fig.rect(x0, ry - 11, barMaxW, 22, {
                fill: tint(c.textMuted, c.bg, 0.06),
                radius: 3,
            })
            if (bw > 0.5) {
                fig.rect(x0, ry - 11, Math.max(3, bw), 22, {
                    fill: tint(color, c.bg, isSecondary ? 0.34 : 0.42),
                    stroke: color,
                    strokeWidth: isSecondary ? 1.75 : 1.25,
                    radius: 3,
                })
            }
            fig.text(x0 + barMaxW + 8, ry, p.shown[rIdx]!, {
                size: 13,
                mono: true,
                weight: rIdx === 0 || isSecondary ? 700 : 500,
                color: rIdx === 0 || isSecondary ? color : muted,
            })
        })

        // Bottom gap readout
        fig.text(x0 + barMaxW / 2, 336, p.gap, {
            size: 13,
            mono: true,
            weight: 700,
            color,
            align: 'center',
        })
    })

    // Bottom crisp note on dark knowledge
    fig.text(
        width / 2,
        368,
        'Top-2 margin (7d − 3d) compresses 1.000 → 0.708 → 0.156, exposing secondary token rankings.',
        { size: 13, color: muted, align: 'center' },
    )

    return fig.render()
}

export default create('dark')
