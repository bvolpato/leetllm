import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 390
export const alt =
    'Three side-by-side calibrated bar plots track features f1 through f4 on a shared vertical scale from -3 to 6. Stage 1 Input x = [3, 1, -1, 5] has mean 2 (dashed line) and variance 5. Stage 2 subtracts mean 2 to produce centered [1, -1, -3, 3] with mean 0 and variance 5. Stage 3 divides by sqrt(5) to yield normalized [0.45, -0.45, -1.34, 1.34] with mean 0 and variance 1.'

const input = [3, 1, -1, 5]
const mean = input.reduce((s, v) => s + v, 0) / input.length // 2
const centered = input.map((v) => v - mean) // [1, -1, -3, 3]
const variance = centered.reduce((s, v) => s + v * v, 0) / input.length // 5
const std = Math.sqrt(variance) // sqrt(5)
const normalized = centered.map((v) => v / std)

const stages = [
    {
        title: '1. Input x',
        stats: 'μ = 2.0 · σ² = 5.0',
        meanLine: 2,
        stdBand: null as number | null,
        values: input,
        strs: ['3', '1', '−1', '5'],
    },
    {
        title: '2. Center (x − μ)',
        stats: 'μ = 0.0 · σ² = 5.0',
        meanLine: 0,
        stdBand: std,
        values: centered,
        strs: ['1', '−1', '−3', '3'],
    },
    {
        title: '3. Scale (/ √5)',
        stats: 'μ = 0.0 · σ² = 1.0',
        meanLine: 0,
        stdBand: 1,
        values: normalized,
        strs: ['0.45', '−0.45', '−1.34', '1.34'],
    },
]

const featureTones = ['blue', 'purple', 'warm', 'green'] as const

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const colors = featureTones.map((t) => fig.tone(t))

    const panelXs = [58, 294, 530]
    const panelW = 192
    const plotY = 66
    const plotH = 266

    // Shared horizontal gridlines across all three calibrated plots
    const refPlot = fig.plot({ x: panelXs[0]!, y: plotY, width: panelW, height: plotH }, { x: [0, 4], y: [-3.6, 6.2] })
    for (const tick of [-3, 0, 3, 6]) {
        const py = refPlot.py(tick)
        fig.text(panelXs[0]! - 10, py, tick < 0 ? `−${Math.abs(tick)}` : String(tick), {
            size: 13.5,
            color: tick === 0 ? c.textPrimary : c.textSecondary,
            align: 'right',
            mono: true,
            weight: tick === 0 ? 700 : 400,
        })
    }

    stages.forEach((stage, sIdx) => {
        const px = panelXs[sIdx]!
        const p = fig.plot({ x: px, y: plotY, width: panelW, height: plotH }, { x: [0, 4], y: [-3.6, 6.2] })

        // Stage headers (frameless)
        fig.text(px + panelW / 2, 20, stage.title, {
            size: 15,
            color: c.textPrimary,
            align: 'center',
            weight: 700,
        })
        fig.text(px + panelW / 2, 41, stage.stats, {
            size: 13.5,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })

        // Subtle ±1σ spread band on stages 2 & 3
        if (stage.stdBand !== null) {
            const bandCol = sIdx === 2 ? fig.tone('green') : c.textMuted
            const yTop = p.py(stage.stdBand)
            const yBot = p.py(-stage.stdBand)
            fig.rect(px, yTop, panelW, yBot - yTop, {
                fill: tint(bandCol, c.bg, theme === 'dark' ? 0.14 : 0.1),
            })
            fig.text(
                sIdx === 2 ? px + 96 : px + 56,
                yTop - 13,
                sIdx === 2 ? '±1σ (unit)' : '±√5',
                {
                    size: 13.5,
                    color: bandCol,
                    align: 'center',
                    mono: true,
                    weight: 600,
                },
            )
        }

        // Gridlines & axes
        for (const tick of [-3, 0, 3, 6]) {
            const py = p.py(tick)
            fig.line(px, py, px + panelW, py, {
                color: tick === 0 ? c.textMuted : c.borderSubtle,
                width: tick === 0 ? 1.25 : 1,
            })
        }
        fig.line(px, p.area.y, px, p.bottom, { color: c.borderLight, width: 1 })

        // Mean reference line on Stage 1 (μ = 2)
        if (stage.meanLine !== 0) {
            const my = p.py(stage.meanLine)
            fig.line(px, my, px + panelW, my, {
                color: fig.tone('critical'),
                width: 1.6,
                dash: '5 4',
            })
            fig.text(px + 98, my - 11, 'μ = 2', {
                size: 13,
                color: fig.tone('critical'),
                align: 'center',
                mono: true,
                weight: 700,
            })
        }

        // Feature bars f1..f4
        const slot = panelW / 4
        const barW = 30
        const y0 = p.py(0)
        stage.values.forEach((val, fIdx) => {
            const cx = px + (fIdx + 0.5) * slot
            const yVal = p.py(val)
            const col = colors[fIdx]!
            const top = Math.min(y0, yVal)
            const barH = Math.max(2, Math.abs(yVal - y0))

            fig.rect(cx - barW / 2, top, barW, barH, {
                fill: tint(col, c.bg, theme === 'dark' ? 0.38 : 0.26),
                stroke: col,
                strokeWidth: 1.6,
                radius: 3,
            })

            const labelY = val >= 0 ? top - 12 : top + barH + 14
            fig.text(cx, labelY, stage.strs[fIdx]!, {
                size: 13,
                color: col,
                align: 'center',
                mono: true,
                weight: 700,
            })

            fig.text(cx, p.bottom + 18, `f${fIdx + 1}`, {
                size: 13.5,
                color: c.textSecondary,
                align: 'center',
                mono: true,
                weight: 600,
            })
        })

        // Transformation arrows between stages
        if (sIdx < 2) {
            const ax1 = px + panelW + 8
            const ax2 = panelXs[sIdx + 1]! - 8
            const ay = p.py(1.5)
            fig.arrow(ax1, ay, ax2, ay, { color: c.textPrimary, width: 1.75, head: 6 })
            fig.text((ax1 + ax2) / 2, ay - 18, sIdx === 0 ? '−2' : '÷√5', {
                size: 13.5,
                color: c.textPrimary,
                align: 'center',
                mono: true,
                weight: 700,
            })
        }
    })

    return fig.render()
}

export default create('dark')
