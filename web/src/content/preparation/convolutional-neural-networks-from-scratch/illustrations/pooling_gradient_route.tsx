import type { ThemeMode, ToneName } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const alt =
    'A 4 by 4 feature map is split into four non-overlapping 2 by 2 windows. The maxima 0.91, 0.44, 0.21, and 0.77 form the pooled map. Incoming gradients 2.0, minus 1.0, 0.5, and 3.0 return only to the four winning cells, producing a sparse 4 by 4 input-gradient map.'

export const width = 884
export const height = 396

const featureMap = [
    [0.1, 0.42, 0.18, 0.3],
    [0.25, 0.91, 0.44, 0.12],
    [0.08, 0.21, 0.77, 0.55],
    [0.16, 0.14, 0.32, 0.49],
]
const upstreamGradient = [
    [2.0, -1.0],
    [0.5, 3.0],
]
const quadrantTones: ToneName[][] = [
    ['cyan', 'purple'],
    ['warm', 'green'],
]

function maxPoolAndRoute() {
    const pooled: number[][] = []
    const winnerLocations: Array<[number, number]> = []
    const inputGradient = featureMap.map((row) => row.map(() => 0))
    for (let row = 0; row < 2; row++) {
        const pooledRow: number[] = []
        for (let col = 0; col < 2; col++) {
            let winner: [number, number] = [row * 2, col * 2]
            for (let lr = 0; lr < 2; lr++) {
                for (let lc = 0; lc < 2; lc++) {
                    const cand: [number, number] = [row * 2 + lr, col * 2 + lc]
                    if (featureMap[cand[0]]![cand[1]]! > featureMap[winner[0]]![winner[1]]!) {
                        winner = cand
                    }
                }
            }
            pooledRow.push(featureMap[winner[0]]![winner[1]]!)
            winnerLocations.push(winner)
            inputGradient[winner[0]]![winner[1]] = upstreamGradient[row]![col]!
        }
        pooled.push(pooledRow)
    }
    return { pooled, winnerLocations, inputGradient }
}

const { pooled, winnerLocations, inputGradient } = maxPoolAndRoute()
if (Math.abs(inputGradient.flat().reduce((s, v) => s + Math.abs(v), 0) - 6.5) > 1e-9) {
    throw new Error('CNN max-pooling route diverges from article gradient values.')
}

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const isLight = theme === 'light'

    const toneColor = (tone: ToneName): string => {
        if (tone === 'warm') return isLight ? '#d07a12' : '#f2b84b'
        return fig.tone(tone)
    }
    const toneText = (tone: ToneName): string => {
        if (tone === 'warm') return isLight ? '#9a5204' : '#f2b84b'
        return fig.tone(tone)
    }

    const cellW = 54
    const cellH = 48
    const gap = 5
    const quadGap = 10

    const pos4 = (idx: number, size: number) =>
        idx * (size + gap) + (idx >= 2 ? quadGap - gap : 0)
    const grid4W = 4 * cellW + 2 * gap + quadGap
    const grid4H = 4 * cellH + 2 * gap + quadGap

    const drawQuadGrid4 = (
        x0: number,
        y0: number,
        values: number[][],
        isGradient: boolean,
    ) => {
        // Draw subtle quadrant outlines behind cells
        const qw = 2 * cellW + gap + 6
        const qh = 2 * cellH + gap + 6
        for (let qr = 0; qr < 2; qr++) {
            for (let qc = 0; qc < 2; qc++) {
                const qx = x0 + pos4(qc * 2, cellW) - 3
                const qy = y0 + pos4(qr * 2, cellH) - 3
                const col = toneColor(quadrantTones[qr]![qc]!)
                fig.rect(qx, qy, qw, qh, {
                    fill: tint(col, c.bg, isLight ? 0.05 : 0.08),
                    stroke: col,
                    strokeWidth: 1.5,
                    radius: 8,
                })
            }
        }

        // Draw cells
        for (let r = 0; r < 4; r++) {
            for (let col = 0; col < 4; col++) {
                const x = x0 + pos4(col, cellW)
                const y = y0 + pos4(r, cellH)
                const qTone = quadrantTones[Math.floor(r / 2)]![Math.floor(col / 2)]!
                const accent = toneColor(qTone)
                const ink = toneText(qTone)
                const isWinner = winnerLocations.some(([wr, wc]) => wr === r && wc === col)
                const val = values[r]![col]!
                const label = isGradient
                    ? val === 0
                        ? '0'
                        : val.toFixed(1)
                    : val.toFixed(2)

                fig.rect(x, y, cellW, cellH, {
                    fill: isWinner
                        ? tint(accent, c.bg, isLight ? 0.24 : 0.34)
                        : isGradient
                          ? c.bgSubtle
                          : tint(accent, c.bg, isLight ? 0.06 : 0.1),
                    stroke: isWinner ? accent : c.borderSubtle,
                    strokeWidth: isWinner ? 2.2 : 1,
                    radius: 6,
                })
                fig.text(x + cellW / 2, y + cellH / 2, label, {
                    size: 17,
                    mono: true,
                    align: 'center',
                    weight: isWinner ? 750 : 500,
                    color: isWinner ? ink : isGradient ? c.textMuted : c.textSecondary,
                    width: cellW - 2,
                })
            }
        }
    }

    const drawGrid2 = (x0: number, y0: number, values: number[][], decimals: number) => {
        const s = 54
        const g = 6
        for (let r = 0; r < 2; r++) {
            for (let col = 0; col < 2; col++) {
                const x = x0 + col * (s + g)
                const y = y0 + r * (s + g)
                const qTone = quadrantTones[r]![col]!
                const accent = toneColor(qTone)
                const ink = toneText(qTone)
                fig.rect(x, y, s, s, {
                    fill: tint(accent, c.bg, isLight ? 0.22 : 0.32),
                    stroke: accent,
                    strokeWidth: 2,
                    radius: 7,
                })
                fig.text(x + s / 2, y + s / 2, values[r]![col]!.toFixed(decimals), {
                    size: 18,
                    mono: true,
                    align: 'center',
                    weight: 750,
                    color: ink,
                    width: s - 2,
                })
            }
        }
    }

    // ── Left half: Forward Max Pool ─────────────────────────────────────────
    const yGrid = 104
    const yMid = yGrid + grid4H / 2
    const ySmall = yMid - 57

    fig.text(20, 26, 'Forward: 2×2 max pool', {
        size: 21,
        weight: 750,
        color: fig.tone('cyan'),
    })
    fig.text(20, 56, 'Largest value in each quadrant survives', {
        size: 17,
        color: c.textSecondary,
    })

    fig.text(20 + grid4W / 2, 84, 'Input A (4×4)', {
        size: 17,
        weight: 650,
        color: c.textPrimary,
        align: 'center',
    })
    drawQuadGrid4(20, yGrid, featureMap, false)

    // Forward arrow
    fig.text(286, yMid - 20, 'max', {
        size: 16,
        color: fig.tone('cyan'),
        align: 'center',
        weight: 650,
    })
    fig.arrow(262, yMid, 310, yMid, { color: fig.tone('cyan'), width: 2.6, head: 7 })

    fig.text(318 + 57, ySmall - 22, 'Pooled y', {
        size: 17,
        weight: 650,
        color: c.textPrimary,
        align: 'center',
    })
    drawGrid2(318, ySmall, pooled, 2)

    // Center vertical divider
    fig.line(446, 20, 446, height - 20, { color: c.borderSubtle, width: 1.25 })

    // ── Right half: Backward Gradient Route ─────────────────────────────────
    fig.text(464, 26, 'Backward: route δ to winners', {
        size: 21,
        weight: 750,
        color: fig.tone('green'),
    })
    fig.text(464, 56, 'Non-winning cells receive exact 0', {
        size: 17,
        color: c.textSecondary,
    })

    fig.text(464 + grid4W / 2, 84, 'Input gradient ∂L/∂A', {
        size: 17,
        weight: 650,
        color: c.textPrimary,
        align: 'center',
    })
    drawQuadGrid4(464, yGrid, inputGradient, true)

    // Backward arrow (routes left from incoming δ into ∂L/∂A)
    fig.text(728, yMid - 20, 'route', {
        size: 16,
        color: fig.tone('green'),
        align: 'center',
        weight: 650,
    })
    fig.arrow(752, yMid, 704, yMid, { color: fig.tone('green'), width: 2.6, head: 7 })

    fig.text(760 + 57, ySmall - 22, 'Incoming δ', {
        size: 17,
        weight: 650,
        color: c.textPrimary,
        align: 'center',
    })
    drawGrid2(760, ySmall, upstreamGradient, 1)

    // Subtle bottom summary
    fig.text(width / 2, height - 22, 'Outlined cells mark each 2×2 window’s argmax winner (stride 2 · 0 parameters).', {
        size: 17,
        color: c.textSecondary,
        align: 'center',
        width: width - 40,
    })

    return fig.render()
}

export default create('dark')
