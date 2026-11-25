import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 840
export const height = 395
export const alt =
    'Side-by-side task-difference distributions on a shared 0 to 100 percent scale comparing unpaired prompts (rho = 0) against paired tasks (rho = 0.80) at 50 percent marginal pass rates. Unpaired differences spread across -1 (25%), 0 (50%), and +1 (25%) with N = 40 variance 0.0125 (SE 0.112, nominal 95% margin +/-21.9 pp). Pairing concentrates 90% of differences at 0 with 5% each at -1 and +1, cutting variance 5x to 0.0025 (SE 0.050, margin +/-9.8 pp).'

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const blue = fig.tone('blue')
    const green = fig.tone('green')
    const warm = fig.tone('warm')
    const isLight = theme === 'light'

    // Centered governing variance equation at top
    fig.math(
        width / 2,
        24,
        '\\operatorname{Var}(\\bar{D}) = \\frac{\\sigma_X^2 + \\sigma_Y^2 - 2\\operatorname{Cov}(X, Y)}{N}',
        {
            size: 15,
            color: c.textPrimary,
            align: 'center',
        },
    )

    const drawPanel = (
        areaX: number,
        title: string,
        titleTone: string,
        bars: readonly { label: string; pct: number; tone: string }[],
        varText: string,
        marginText: string,
        showYLabel: boolean,
    ) => {
        fig.text(areaX + 148, 56, title, {
            size: 14,
            weight: 700,
            color: titleTone,
            align: 'center',
        })

        const plot = fig.plot(
            { x: areaX, y: 92, width: 296, height: 204 },
            { x: [0.3, 3.7], y: [0, 100] },
        )
        plot.axes({
            yTicks: [25, 50, 75, 100],
            yFormat: (v) => `${v}%`,
            yLabel: showYLabel ? 'Task share' : undefined,
            xLabel: 'Row difference (B − A)',
            grid: true,
            labelSize: 12,
        })

        const bw = 62
        bars.forEach((b, i) => {
            const cx = plot.px(i + 1)
            const yTop = plot.py(b.pct)
            const yBot = plot.py(0)
            fig.rect(cx - bw / 2, yTop, bw, yBot - yTop, {
                fill: tint(b.tone, c.bg, isLight ? 0.24 : 0.36),
                stroke: b.tone,
                strokeWidth: 1.6,
                radius: 4,
            })
            fig.text(cx, yTop - 13, `${b.pct}%`, {
                size: 13,
                weight: 700,
                color: b.tone,
                align: 'center',
                mono: true,
            })
            fig.text(cx, plot.bottom + 15, b.label, {
                size: 13,
                weight: 600,
                color: c.textPrimary,
                align: 'center',
                mono: true,
            })
        })

        fig.text(areaX + 148, 354, varText, {
            size: 13,
            weight: 700,
            color: titleTone,
            align: 'center',
            mono: true,
        })
        fig.text(areaX + 148, 375, marginText, {
            size: 12,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    drawPanel(
        76,
        'Unpaired prompts (ρ = 0)',
        warm,
        [
            { label: '−1', pct: 25, tone: warm },
            { label: '0', pct: 50, tone: blue },
            { label: '+1', pct: 25, tone: warm },
        ],
        'N = 40: Var = 0.0125 · SE = 0.112',
        '±1.96 · SE = ±21.9 pp',
        true,
    )

    // Center divider + 5x badge
    fig.line(422, 62, 422, 378, { color: c.borderSubtle, width: 1 })
    fig.rect(390, 174, 64, 28, {
        fill: tint(green, c.bg, isLight ? 0.18 : 0.28),
        stroke: green,
        strokeWidth: 1.5,
        radius: 14,
    })
    fig.text(422, 188, '5× less', {
        size: 12,
        weight: 700,
        color: green,
        align: 'center',
    })

    drawPanel(
        494,
        'Paired identical tasks (ρ = 0.80)',
        green,
        [
            { label: '−1', pct: 5, tone: warm },
            { label: '0', pct: 90, tone: green },
            { label: '+1', pct: 5, tone: green },
        ],
        'N = 40: Var = 0.0025 · SE = 0.050',
        '±1.96 · SE = ±9.8 pp (equiv. 200 unpaired)',
        false,
    )

    return fig.render()
}

export default create
