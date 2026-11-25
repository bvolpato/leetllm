import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const alt =
    'A tied 16-filter bank is reused across a 222 by 222 field of local output positions, for 448 total parameters. Giving every position its own bank uses 22,079,232 parameters for the same output shape. A dense layer over a flattened 224 by 224 RGB crop uses 38,535,424 parameters and produces 256 scores.'

export const width = 800
export const height = 466

const inputValues = 3 * 224 * 224
const filterCount = 16
const parametersPerFilter = 3 * 3 * 3 + 1
const sharedParameters = filterCount * parametersPerFilter
const localSites = 222 * 222
const separateLocalParameters = localSites * sharedParameters
const denseParameters = (inputValues + 1) * 256

if (
    sharedParameters !== 448 ||
    separateLocalParameters !== 22_079_232 ||
    denseParameters !== 38_535_424
) {
    throw new Error('CNN parameter calculation mismatch against worked example.')
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const cyan = fig.tone('cyan')
    const purple = fig.tone('purple')
    const green = fig.tone('green')
    const blue = fig.tone('blue')
    const amberMark = isLight ? '#d07a12' : '#f2b84b'
    const amberText = isLight ? '#9a5204' : '#f2b84b'

    const draw3x3 = (
        x0: number,
        y0: number,
        labels: string[][],
        stroke: string,
        fill: string,
        textColor: string,
    ) => {
        const s = 30
        const g = 4
        for (let r = 0; r < 3; r++) {
            for (let k = 0; k < 3; k++) {
                const x = x0 + k * (s + g)
                const y = y0 + r * (s + g)
                fig.rect(x, y, s, s, { fill, stroke, strokeWidth: 1.5, radius: 5 })
                fig.text(x + s / 2, y + s / 2, labels[r]![k]!, {
                    size: 16,
                    mono: true,
                    align: 'center',
                    weight: 650,
                    color: textColor,
                    width: s,
                })
            }
        }
    }

    const outLabels = [
        ['y', 'y', 'y'],
        ['y', 'y', 'y'],
        ['y', 'y', 'y'],
    ]

    // ── Top Left: Shared Filter Bank ────────────────────────────────────────
    fig.text(24, 24, 'Shared conv (weight tying)', { size: 20, weight: 750, color: cyan })
    fig.text(24, 52, '1 bank reused at all 222² output sites', { size: 17, color: c.textSecondary })

    // Single K bank box
    fig.rect(48, 102, 56, 56, {
        fill: tint(cyan, c.bg, isLight ? 0.2 : 0.28),
        stroke: cyan,
        strokeWidth: 2,
        radius: 8,
    })
    fig.text(76, 130, 'K', { size: 22, mono: true, align: 'center', weight: 750, color: cyan })

    // Fan-out arrows from 1 bank to multiple sites
    fig.arrow(108, 118, 186, 94, { color: cyan, width: 1.9, head: 6 })
    fig.arrow(108, 130, 186, 130, { color: cyan, width: 2.2, head: 6 })
    fig.arrow(108, 142, 186, 166, { color: cyan, width: 1.9, head: 6 })

    draw3x3(192, 80, outLabels, green, tint(green, c.bg, isLight ? 0.14 : 0.22), green)
    fig.text(241, 198, '16 × 222 × 222', {
        size: 17,
        mono: true,
        color: c.textSecondary,
        align: 'center',
    })

    // Vertical divider
    fig.line(396, 20, 396, 212, { color: c.borderSubtle, width: 1.25 })

    // ── Top Right: Separate Local Weights ───────────────────────────────────
    fig.text(420, 24, 'Unshared local weights', { size: 20, weight: 750, color: purple })
    fig.text(420, 52, '1 private bank per site (222² banks)', { size: 17, color: c.textSecondary })

    const sepLabels = [
        ['K₁', 'K₂', 'K₃'],
        ['K₄', 'K₅', 'K₆'],
        ['K₇', 'K₈', 'K₉'],
    ]
    draw3x3(436, 80, sepLabels, purple, tint(purple, c.bg, isLight ? 0.14 : 0.22), purple)

    fig.arrow(546, 130, 608, 130, { color: purple, width: 2.2, head: 6.5 })

    draw3x3(616, 80, outLabels, green, tint(green, c.bg, isLight ? 0.14 : 0.22), green)
    fig.text(665, 198, 'same 16 × 222 × 222', {
        size: 17,
        mono: true,
        color: c.textSecondary,
        align: 'center',
    })

    // Horizontal divider
    fig.line(20, 224, width - 20, 224, { color: c.borderSubtle, width: 1.25 })

    // ── Bottom: Log-Scale Parameter Comparison ──────────────────────────────
    fig.text(24, 248, 'Parameter count on 224 × 224 × 3 input (log₁₀ scale)', {
        size: 20,
        weight: 750,
        color: c.textPrimary,
    })

    const barPlot = fig.plot(
        { x: 186, y: 276, width: 572, height: 138 },
        { x: [100, 1e8], y: [0, 3], xScale: 'log' },
    )
    barPlot.axes({
        xTicks: [100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8],
        yTicks: [],
        grid: true,
        minorGrid: true,
        labelSize: 16,
        xLabel: 'Parameters (log scale)',
    })

    const bars = [
        {
            label: 'Shared conv',
            val: sharedParameters,
            note: '448  (16×28)',
            color: cyan,
            textColor: cyan,
            yIdx: 2.5,
        },
        {
            label: 'Unshared local',
            val: separateLocalParameters,
            note: '22.1M  (49,284×)',
            color: purple,
            textColor: purple,
            yIdx: 1.5,
        },
        {
            label: 'Dense (256 out)',
            val: denseParameters,
            note: '38.5M  (86,017×)',
            color: amberMark,
            textColor: amberText,
            yIdx: 0.5,
        },
    ] as const

    for (const b of bars) {
        const cy = barPlot.py(b.yIdx)
        const xLeft = barPlot.px(100)
        const xRight = barPlot.px(b.val)
        const barH = 26

        fig.text(xLeft - 14, cy, b.label, {
            size: 18,
            weight: 650,
            color: b.textColor,
            align: 'right',
            width: 166,
        })
        fig.rect(xLeft, cy - barH / 2, Math.max(8, xRight - xLeft), barH, {
            fill: b.color,
            radius: 4,
        })

        // Place note outside bar if room, or neatly inside/right
        const placeRight = xRight < 560
        fig.text(placeRight ? xRight + 10 : xRight - 10, cy, b.note, {
            size: 17,
            mono: true,
            weight: 700,
            color: placeRight ? b.textColor : isLight ? '#ffffff' : '#0b0c10',
            align: placeRight ? 'left' : 'right',
        })
    }

    // Silence unused blue lint if any
    void blue

    return fig.render()
}

export default create('dark')
