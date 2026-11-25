import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 800
export const height = 390
export const alt =
    'DeepSeek report estimates at one million tokens, relative to V3.2 at 100 percent: single-token equivalent FP8 FLOPs are 27 percent for V4 Pro and 10 percent for V4 Flash; accumulated KV cache is 10 percent for Pro and 7 percent for Flash.'

interface MetricBar {
    label: string
    value: number
    delta?: string
    tone: 'neutral' | 'blue' | 'green'
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig

    const tones = {
        neutral: theme === 'light' ? tint('#475569', c.bg, 0.72) : tint('#94a3b8', c.bg, 0.55),
        blue: fig.tone('blue'),
        green: fig.tone('green'),
    }

    const panels: {
        x: number
        title: string
        subtitle: string
        bars: MetricBar[]
    }[] = [
        {
            x: 68,
            title: 'Single-token inference FLOPs',
            subtitle: 'Equivalent FP8 ops vs. V3.2',
            bars: [
                { label: 'V3.2', value: 100, tone: 'neutral' },
                { label: 'V4 Pro', value: 27, delta: '-73%', tone: 'blue' },
                { label: 'V4 Flash', value: 10, delta: '-90%', tone: 'green' },
            ],
        },
        {
            x: 462,
            title: 'Accumulated KV cache',
            subtitle: 'Relative size at 1M context',
            bars: [
                { label: 'V3.2', value: 100, tone: 'neutral' },
                { label: 'V4 Pro', value: 10, delta: '-90%', tone: 'blue' },
                { label: 'V4 Flash', value: 7, delta: '-93%', tone: 'green' },
            ],
        },
    ]

    const plotW = 304
    const plotH = 230
    const plotY = 92

    for (const panel of panels) {
        fig.text(panel.x, 26, panel.title, {
            size: 16,
            weight: 600,
            color: c.textPrimary,
        })
        fig.text(panel.x, 48, panel.subtitle, {
            size: 13,
            color: c.textSecondary,
        })

        const plot = fig.plot(
            { x: panel.x, y: plotY, width: plotW, height: plotH },
            { x: [0, 3], y: [0, 108] },
        )

        plot.axes({
            yTicks: [0, 25, 50, 75, 100],
            yFormat: (v) => `${v}%`,
            grid: true,
            labelSize: 12,
        })

        // Baseline reference rule at 100%
        fig.line(plot.area.x, plot.py(100), plot.right, plot.py(100), {
            color: c.textMuted,
            width: 1,
            dash: '3 4',
            opacity: 0.7,
        })

        const barW = 58
        panel.bars.forEach((bar, i) => {
            const cx = plot.px(i + 0.5)
            const topY = plot.py(bar.value)
            const baseY = plot.py(0)
            const barH = Math.max(4, baseY - topY)
            const fill = tones[bar.tone]

            fig.rect(cx - barW / 2, topY, barW, barH, {
                fill,
                radius: 5,
            })

            fig.text(cx, topY - 14, `${bar.value}%`, {
                size: 14,
                weight: 700,
                color: bar.tone === 'neutral' ? c.textPrimary : fill,
                align: 'center',
                mono: true,
            })

            if (bar.delta) {
                fig.text(cx, topY - 33, bar.delta, {
                    size: 12,
                    weight: 600,
                    color: c.textSecondary,
                    align: 'center',
                    mono: true,
                })
            }

            fig.text(cx, plot.bottom + 20, bar.label, {
                size: 14,
                weight: i === 0 ? 500 : 600,
                color: c.textPrimary,
                align: 'center',
            })
        })
    }

    return fig.render()
}

export default create('dark')
