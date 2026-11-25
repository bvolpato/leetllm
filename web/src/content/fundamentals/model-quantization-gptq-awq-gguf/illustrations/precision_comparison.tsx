import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 740
export const height = 420
export const preset = 'engineering'
export const alt =
    'Comparison of 8-bit, 4-bit, and 2-bit symmetric quantization on four weights [0.3, -1.2, 2.0, 0.7]. Left aligned number lines show original weights snapping to 8-bit [0.2992, -1.1969, 2, 0.6929], 4-bit [0.2857, -1.1429, 2, 0.5714], and 2-bit [0, -2, 2, 0] with ideal code payloads 4, 2, and 1 bytes. Right bar chart compares held-out output MSE across three activation columns: 0.000204 at 8-bit, 0.067010 at 4-bit, and 1.007200 at 2-bit (a 15x jump).'

const weights = [0.3, -1.2, 2.0, 0.7]
const levels = [
    {
        bits: '8-bit',
        bytes: '4 B',
        rebuilt: [19 * (2 / 127), -76 * (2 / 127), 2.0, 44 * (2 / 127)],
        stepLabel: 'step 2/127',
        mse: 0.000204,
        mseText: '0.000204',
        tone: 'blue' as const,
    },
    {
        bits: '4-bit',
        bytes: '2 B',
        rebuilt: [1 * (2 / 7), -4 * (2 / 7), 2.0, 2 * (2 / 7)],
        stepLabel: 'step 2/7',
        mse: 0.06701,
        mseText: '0.067010',
        tone: 'warm' as const,
    },
    {
        bits: '2-bit',
        bytes: '1 B',
        rebuilt: [0, -2, 2, 0],
        stepLabel: 'codes {-1,0,1}',
        mse: 1.0072,
        mseText: '1.007200',
        tone: 'critical' as const,
    },
]

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const purple = fig.tone('purple')
    const toneColors = levels.map((l) => fig.tone(l.tone))

    // --- Left panel: 8/4/2-bit snapping number lines ---
    fig.text(28, 22, 'Weight snapping on [-2, +2]', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })

    // Legend swatches
    fig.circle(34, 48, 4.5, { fill: purple })
    fig.text(46, 48, 'Original W = [0.3, −1.2, 2, 0.7]', {
        size: 14,
        color: purple,
        mono: true,
    })
    fig.rect(336, 43, 10, 10, { fill: toneColors[1], radius: 2 })
    fig.text(352, 48, 'Rebuilt Ŵ', { size: 14, color: c.textSecondary })

    const xMin = 98
    const xMax = 428
    const xOf = (v: number) => xMin + ((v + 2) / 4) * (xMax - xMin)
    const rowYs = [116, 212, 308]

    // Shared vertical guides at -2, -1, 0, 1, 2
    for (const tick of [-2, -1, 0, 1, 2]) {
        const tx = xOf(tick)
        fig.line(tx, 76, tx, 344, {
            color: c.borderSubtle,
            width: tick === 0 ? 1.25 : 0.85,
            dash: tick === 0 ? undefined : '3 3',
        })
        fig.text(tx, 360, tick < 0 ? `−${Math.abs(tick)}` : String(tick), {
            size: 14,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    levels.forEach((lvl, r) => {
        const y = rowYs[r]!
        const col = toneColors[r]!

        // Row label + byte count
        fig.text(84, y - 9, lvl.bits, {
            size: 14,
            weight: 700,
            color: col,
            align: 'right',
        })
        fig.text(84, y + 11, lvl.bytes, {
            size: 14,
            color: c.textSecondary,
            align: 'right',
            mono: true,
        })

        // Main spine
        fig.line(xMin, y, xMax, y, { color: c.textMuted, width: 1.75 })

        // Draw representable grid tick marks for 4-bit (15 marks) & 2-bit (3 marks)
        if (r === 1) {
            for (let q = -7; q <= 7; q++) {
                const gx = xOf((q * 2) / 7)
                fig.line(gx, y - 5, gx, y + 5, { color: col, width: 1, opacity: 0.45 })
            }
        } else if (r === 2) {
            for (const q of [-2, 0, 2]) {
                const gx = xOf(q)
                fig.line(gx, y - 8, gx, y + 8, { color: col, width: 2, opacity: 0.7 })
            }
        }

        // Original dots (top) snapping to reconstructed squares (bottom)
        weights.forEach((w, i) => {
            const xo = xOf(w)
            const xr = xOf(lvl.rebuilt[i]!)
            // Snap displacement line
            if (Math.abs(xr - xo) > 1.5) {
                fig.line(xo, y - 9, xr, y + 9, { color: col, width: 2.25, opacity: 0.85 })
            } else {
                fig.line(xo, y - 9, xr, y + 9, { color: col, width: 1.5, opacity: 0.6 })
            }
            fig.circle(xo, y - 10, 4.5, { fill: purple, stroke: c.bg, width: 1.5 })
            fig.rect(xr - 4.5, y + 5.5, 9, 9, {
                fill: col,
                stroke: c.bg,
                strokeWidth: 1.25,
                radius: 2,
            })
        })

        // Compact step annotation below each row
        fig.text(xMax, y + 29, lvl.stepLabel, {
            size: 14,
            color: c.textMuted,
            align: 'right',
            mono: true,
        })
    })

    fig.text(262, 394, '2-bit collapses 0.3 & 0.7 to 0 and −1.2 to −2', {
        size: 14,
        color: c.textSecondary,
        align: 'center',
    })

    // Vertical divider
    fig.line(456, 22, 456, 398, { color: c.borderSubtle, width: 1 })

    // --- Right panel: Compact Held-Out Output MSE bar chart ---
    fig.text(476, 22, 'Held-out output MSE', {
        size: 15,
        weight: 600,
        color: c.textPrimary,
    })
    fig.text(476, 44, '3 columns · mean((WX − ŴX)²)', {
        size: 14,
        color: c.textSecondary,
    })

    const plot = fig.plot({ x: 516, y: 84, width: 198, height: 224 }, { x: [0, 3], y: [0, 1.15] })
    plot.axes({
        yTicks: [0, 0.25, 0.5, 0.75, 1.0],
        yFormat: (v) => v.toFixed(2),
        grid: true,
        labelSize: 14,
    })

    levels.forEach((lvl, i) => {
        const col = toneColors[i]!
        const cx = plot.px(i + 0.5)
        const barW = 40
        const topY = plot.py(lvl.mse)
        const h = Math.max(4, plot.bottom - topY)
        fig.rect(cx - barW / 2, plot.bottom - h, barW, h, {
            fill: tint(col, c.bg, theme === 'light' ? 0.78 : 0.85),
            stroke: col,
            strokeWidth: 1.5,
            radius: 4,
        })
        fig.text(cx, plot.bottom + 18, lvl.bits, {
            size: 14,
            weight: 700,
            color: col,
            align: 'center',
        })
        // Stagger 4-bit value label higher than 8-bit so 8-char mono numbers never touch
        const valY = i === 1 ? plot.bottom - h - 30 : plot.bottom - h - 14
        if (i === 1) {
            fig.line(cx, plot.bottom - h - 2, cx, valY + 10, {
                color: col,
                width: 1,
                dash: '2 2',
                opacity: 0.7,
            })
        }
        fig.text(cx, valY, lvl.mseText, {
            size: 14,
            weight: 700,
            color: col,
            align: 'center',
            mono: true,
        })
    })

    // Crisp callout highlighting the 15x spike at 2-bit (arrow sweeps right, text sits cleanly left!)
    fig.callout(
        [plot.px(2.15), plot.py(0.7)],
        [plot.px(1.52), plot.py(0.84)],
        '15× jump',
        {
            color: toneColors[2],
            size: 14,
            weight: 700,
            align: 'right',
            bend: -0.15,
        },
    )

    fig.text(602, 360, 'x₀ = [2, 1, −1, 0.2]', {
        size: 14,
        color: c.textSecondary,
        align: 'center',
        mono: true,
    })
    fig.text(602, 384, 'y₀ = −2.46 · 4-bit ŷ₀ = −2.457', {
        size: 14,
        color: toneColors[1],
        align: 'center',
        mono: true,
    })

    return fig.render()
}

export default create
