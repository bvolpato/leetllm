import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 398
export const alt =
    'Two side-by-side paired grouped bar charts compare LayerNorm (purple) and RMSNorm (green) on input x = [3, 1, -1, 5] and shifted input x + 10 = [13, 11, 9, 15] over a shared [-1.6, 1.9] axis. LayerNorm outputs remain invariant at [0.45, -0.45, -1.34, 1.34] after the +10 shift because mean subtraction removes uniform offsets, whereas uncentered RMSNorm shifts from [1.00, 0.33, -0.33, 1.67] to all-positive [1.07, 0.90, 0.74, 1.23].'

const input = [3, 1, -1, 5]
function computeNorms(values: number[]) {
    const mean = values.reduce((s, v) => s + v, 0) / values.length
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
    const rms = Math.sqrt(values.reduce((s, v) => s + v * v, 0) / values.length)
    return {
        ln: values.map((v) => (v - mean) / Math.sqrt(variance)),
        rms: values.map((v) => v / rms),
        rmsScalar: rms,
        sdScalar: Math.sqrt(variance),
    }
}

const leftData = computeNorms(input)
const rightData = computeNorms(input.map((v) => v + 10))

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const green = fig.tone('green')

    // Compact frameless legend centered at top
    fig.rect(198, 12, 14, 14, {
        fill: tint(purple, c.bg, theme === 'dark' ? 0.38 : 0.26),
        stroke: purple,
        strokeWidth: 1.6,
        radius: 3,
    })
    fig.text(218, 19, 'LayerNorm (centered)', { size: 14.5, color: purple, weight: 700 })

    fig.rect(404, 12, 14, 14, {
        fill: tint(green, c.bg, theme === 'dark' ? 0.38 : 0.26),
        stroke: green,
        strokeWidth: 1.6,
        radius: 3,
    })
    fig.text(424, 19, 'RMSNorm (uncentered)', { size: 14.5, color: green, weight: 700 })

    const panels = [
        {
            x: 62,
            title: 'Input x = [3, 1, −1, 5]',
            sub: `σ = ${leftData.sdScalar.toFixed(2)} · RMS = ${leftData.rmsScalar.toFixed(2)}`,
            data: leftData,
            isShifted: false,
        },
        {
            x: 422,
            title: 'Shifted x + 10 = [13, 11, 9, 15]',
            sub: 'LN unchanged · RMS all positive',
            data: rightData,
            isShifted: true,
        },
    ]

    const panelW = 296
    const plotY = 92
    const plotH = 258
    const yTicks = [-1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5]

    // Left shared y-axis labels
    const refPlot = fig.plot({ x: panels[0]!.x, y: plotY, width: panelW, height: plotH }, { x: [0, 4], y: [-1.7, 2.0] })
    for (const tick of yTicks) {
        const py = refPlot.py(tick)
        fig.text(panels[0]!.x - 10, py, tick === 0 ? '0' : tick < 0 ? `−${Math.abs(tick).toFixed(1)}` : `+${tick.toFixed(1)}`, {
            size: 14.5,
            color: tick === 0 ? c.textPrimary : c.textSecondary,
            align: 'right',
            mono: true,
            weight: tick === 0 ? 700 : 400,
        })
    }

    // Shift arrow between the two panels
    fig.arrow(366, refPlot.py(0.25), 414, refPlot.py(0.25), {
        color: c.textPrimary,
        width: 1.85,
        head: 6,
    })
    fig.text(390, refPlot.py(0.25) - 18, '+10', {
        size: 14.5,
        color: c.textPrimary,
        align: 'center',
        mono: true,
        weight: 700,
    })

    for (const panel of panels) {
        const p = fig.plot({ x: panel.x, y: plotY, width: panelW, height: plotH }, { x: [0, 4], y: [-1.7, 2.0] })

        fig.text(panel.x + panelW / 2, 52, panel.title, {
            size: 14.5,
            color: c.textPrimary,
            align: 'center',
            weight: 700,
        })
        fig.text(panel.x + panelW / 2, 72, panel.sub, {
            size: 14.5,
            color: panel.isShifted ? green : c.textSecondary,
            align: 'center',
            mono: !panel.isShifted,
            weight: panel.isShifted ? 600 : 400,
        })

        // Subtle green positive-only band highlight on right panel above y=0
        if (panel.isShifted) {
            const yZero = p.py(0)
            const yTop = p.py(1.42)
            fig.rect(panel.x, yTop, panelW, yZero - yTop, {
                fill: tint(green, c.bg, theme === 'dark' ? 0.08 : 0.07),
            })
        }

        // Gridlines & zero axis
        for (const tick of yTicks) {
            const py = p.py(tick)
            fig.line(panel.x, py, panel.x + panelW, py, {
                color: tick === 0 ? c.textMuted : c.borderSubtle,
                width: tick === 0 ? 1.3 : 1,
            })
        }
        fig.line(panel.x, p.area.y, panel.x, p.bottom, { color: c.borderLight, width: 1 })

        const slotW = panelW / 4
        const barW = 22
        const gap = 8
        const y0 = p.py(0)

        for (let i = 0; i < 4; i++) {
            const groupCx = panel.x + (i + 0.5) * slotW
            const lnVal = panel.data.ln[i]!
            const rmsVal = panel.data.rms[i]!

            // LayerNorm bar (left in pair)
            const lnX = groupCx - gap / 2 - barW
            const lnY = p.py(lnVal)
            const lnTop = Math.min(y0, lnY)
            const lnH = Math.max(2, Math.abs(lnY - y0))
            fig.rect(lnX, lnTop, barW, lnH, {
                fill: tint(purple, c.bg, theme === 'dark' ? 0.38 : 0.26),
                stroke: purple,
                strokeWidth: 1.5,
                radius: 3,
            })
            fig.text(
                lnX + barW / 2 - 3,
                lnVal >= 0 ? lnTop - 13 : lnTop + lnH + 14,
                lnVal < 0 ? `−${Math.abs(lnVal).toFixed(2)}` : lnVal.toFixed(2),
                {
                    size: 14.5,
                    color: purple,
                    align: 'center',
                    mono: true,
                    weight: 700,
                },
            )

            // RMSNorm bar (right in pair)
            const rmsX = groupCx + gap / 2
            const rmsY = p.py(rmsVal)
            const rmsTop = Math.min(y0, rmsY)
            const rmsH = Math.max(2, Math.abs(rmsY - y0))
            fig.rect(rmsX, rmsTop, barW, rmsH, {
                fill: tint(green, c.bg, theme === 'dark' ? 0.38 : 0.26),
                stroke: green,
                strokeWidth: 1.5,
                radius: 3,
            })
            fig.text(
                rmsX + barW / 2 + 3,
                rmsVal >= 0 ? rmsTop - 13 : rmsTop + rmsH + 14,
                rmsVal < 0 ? `−${Math.abs(rmsVal).toFixed(2)}` : rmsVal.toFixed(2),
                {
                    size: 14.5,
                    color: green,
                    align: 'center',
                    mono: true,
                    weight: 700,
                },
            )

            // Feature label below plot
            fig.text(groupCx, p.bottom + 18, `f${i + 1}`, {
                size: 14.5,
                color: c.textPrimary,
                align: 'center',
                mono: true,
                weight: 600,
            })
        }
    }

    return fig.render()
}

export default create('dark')
