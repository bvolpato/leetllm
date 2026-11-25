import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 410
export const alt =
    'Waterfall token-budget chart showing one curation pass reducing a 12,436-token raw prompt to 3,346 tokens (-73.1%). Starting at 12,436, dropping old_pytest_dump removes 8,200 tokens (to 4,236), dropping unused tools removes 770 tokens (to 3,466), dropping disproven BPE/trace noise removes 306 tokens (to 3,160 active kept), and reloading two verified notes adds 186 tokens (kv_mask_shape +90 and bpe_ruled_out +96) to finish at 3,346 tokens.'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const warm = fig.tone('warm')
    const green = fig.tone('green')
    const red = fig.tone('critical')

    fig.text(32, 20, 'Token-budget waterfall · 12,436 → 3,346 tokens (−73.1%)', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    const plot = fig.plot({ x: 74, y: 58, width: 650, height: 258 }, { x: [0, 6], y: [0, 14000] })
    plot.axes({
        yTicks: [0, 3000, 6000, 9000, 12000],
        yFormat: (v) => (v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`),
        grid: true,
        yLabel: 'Tokens',
        labelSize: 13,
    })

    const steps = [
        {
            label: 'Raw input',
            sub: 'before',
            from: 0,
            to: 12436,
            val: '12,436',
            color: blue,
            kind: 'total' as const,
        },
        {
            label: 'old_pytest',
            sub: 'compress',
            from: 12436,
            to: 4236,
            val: '−8,200',
            color: red,
            kind: 'drop' as const,
        },
        {
            label: 'Unused tools',
            sub: '−360 / −410',
            from: 4236,
            to: 3466,
            val: '−770',
            color: warm,
            kind: 'drop' as const,
        },
        {
            label: 'BPE noise',
            sub: 'isolate',
            from: 3466,
            to: 3160,
            val: '−306',
            color: c.textMuted,
            kind: 'drop' as const,
        },
        {
            label: 'Reload notes',
            sub: '+90 / +96',
            from: 3160,
            to: 3346,
            val: '+186',
            color: green,
            kind: 'add' as const,
        },
        {
            label: 'Next call',
            sub: '3,160 + 186',
            from: 0,
            to: 3346,
            val: '3,346',
            color: green,
            kind: 'total' as const,
        },
    ]

    const barW = 68

    steps.forEach((s, i) => {
        const cx = plot.px(i + 0.5)
        const hi = Math.max(s.from, s.to)
        const lo = Math.min(s.from, s.to)
        const yHi = plot.py(hi)
        const yLo = plot.py(lo)
        const h = Math.max(8, yLo - yHi)

        // Horizontal connector from previous step's running level
        if (i > 0) {
            const prevCx = plot.px(i - 0.5)
            const connY = plot.py(steps[i - 1]!.to)
            fig.line(prevCx + barW / 2, connY, cx - barW / 2, connY, {
                color: c.textMuted,
                width: 1.25,
                dash: '3 3',
            })
        }

        fig.rect(cx - barW / 2, yHi, barW, h, {
            fill: tint(
                s.color,
                c.bg,
                theme === 'light'
                    ? s.kind === 'total'
                        ? 0.78
                        : 0.32
                    : s.kind === 'total'
                      ? 0.84
                      : 0.44,
            ),
            stroke: s.color,
            strokeWidth: 1.6,
            radius: 4,
        })

        // Value label cleanly above the bar (for small drops/adds, keep clear of adjacent bars)
        const labelY = i === 3 ? yLo + 14 : yHi - 12
        fig.text(cx, labelY, s.val, {
            size: 13,
            weight: 700,
            color: s.color,
            align: 'center',
            mono: true,
        })

        // Category & sub-label below axis
        fig.text(cx, plot.bottom + 18, s.label, {
            size: 13,
            weight: 700,
            color: c.textPrimary,
            align: 'center',
        })
        fig.text(cx, plot.bottom + 37, s.sub, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    })

    // Compact summary note at bottom
    fig.text(
        380,
        388,
        'Net −9,090 tokens dropped  ·  Reloaded notes: kv_mask_shape (+90) & bpe_ruled_out (+96)',
        {
            size: 13,
            color: c.textSecondary,
            align: 'center',
        },
    )

    return fig.render()
}

export default create
