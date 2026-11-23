import type { ThemeMode, ToneName } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 700
export const alt =
    'Three pairs share one score axis. The original scores 1.80 and 0.70 have margin 1.10 and sigmoid probability 0.7503. Adding 10 to both scores gives 11.80 and 10.70 with the same margin and probability. Multiplying both by 3 gives 5.40 and 2.10, margin 3.30, and probability 0.9644 under the same fixed sigmoid link. Translation preserves the pair loss; scaling changes it.'

const pairs: { name: string; chosen: number; rejected: number; tone: ToneName }[] = [
    { name: 'Base', chosen: 1.8, rejected: 0.7, tone: 'blue' },
    { name: 'Add 10', chosen: 11.8, rejected: 10.7, tone: 'blue' },
    { name: 'Times 3', chosen: 5.4, rejected: 2.1, tone: 'warm' },
]
const sigmoid = (m: number) => 1 / (1 + Math.exp(-m))

export const layoutHeight = (L: Layout) => (L.print ? 216 : 700)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const nameW = L.print ? 58 : 84
    const panelW = L.print ? 400 : L.W - 12
    const ax0 = 6 + nameW
    const ax1 = 6 + panelW - (L.print ? 12 : 22)
    const map = (score: number) => ax0 + (score / 12) * (ax1 - ax0)
    const rowH = L.print ? 54 : 80
    const y0 = 3
    pairs.forEach((pair, r) => {
        const y = y0 + r * rowH
        const track = y + L.S * 1.65 + (L.print ? 6 : 10)
        const margin = pair.chosen - pair.rejected
        k.t(6, track - L.S * 0.72, nameW, pair.name, { size: L.S, weight: 600, tone: pair.tone })
        k.t(
            ax0,
            y,
            ax1 - ax0,
            `${pair.chosen.toFixed(2)} and ${pair.rejected.toFixed(2)}: margin ${margin.toFixed(2)}, p ${sigmoid(margin).toFixed(4)}`,
            { size: L.S, color: c.textSecondary },
        )
        k.line(ax0, track, ax1, track, { opacity: 0.5 })
        k.line(map(pair.rejected), track, map(pair.chosen), track, {
            stroke: k.ink(pair.tone),
            strokeWidth: 3,
        })
        k.dot(map(pair.rejected), track, L.print ? 4.5 : 6, { fill: k.ink('critical') })
        k.dot(map(pair.chosen), track, L.print ? 4.5 : 6, { fill: k.ink('green') })
    })
    const axisY = y0 + 3 * rowH + (L.print ? 2 : 4)
    k.line(ax0, axisY, ax1, axisY, { stroke: c.textMuted })
    ;[0, 3, 6, 9, 12].forEach((tick) => {
        k.line(map(tick), axisY, map(tick), axisY + 5, { stroke: c.textMuted })
        k.t(map(tick) - 18, axisY + 6, 36, String(tick), {
            size: L.S,
            align: 'center',
            color: c.textSecondary,
        })
    })

    // One fixed sigmoid: the same margin lands on the same point.
    const px0 = L.print ? 6 + panelW + 40 : 60
    const px1 = L.W - 14
    const py0 = L.print ? 14 : axisY + 54
    const py1 = L.print ? 184 : 652
    const plotX = (m: number) => px0 + ((m + 1) / 5) * (px1 - px0)
    const plotY = (p: number) => py1 - p * (py1 - py0)
    ;[0, 0.5, 1].forEach((p) => {
        k.line(px0, plotY(p), px1, plotY(p), {
            opacity: p === 0 ? 1 : 0.4,
            stroke: p === 0 ? c.textMuted : c.border,
        })
        k.t(px0 - 36, plotY(p) - L.S * 0.7, 32, p === 0 ? '0' : p === 1 ? '1' : '0.5', {
            size: L.S,
            align: 'right',
            color: c.textSecondary,
        })
    })
    const curve = Array.from({ length: 51 }, (_, i) => {
        const m = -1 + i * 0.1
        return `${i === 0 ? 'M' : 'L'}${plotX(m).toFixed(1)} ${plotY(sigmoid(m)).toFixed(1)}`
    }).join('')
    k.path(curve, { stroke: k.ink('purple'), strokeWidth: 2 })
    const points: [number, ToneName][] = [
        [1.1, 'blue'],
        [3.3, 'warm'],
    ]
    points.forEach(([m, tone]) => {
        k.line(plotX(m), plotY(sigmoid(m)), plotX(m), py1, {
            stroke: k.ink(tone),
            strokeWidth: 1.25,
        })
        k.dot(plotX(m), plotY(sigmoid(m)), L.print ? 5 : 7, { fill: k.ink(tone) })
        k.t(plotX(m) - 22, py1 + 5, 44, m.toFixed(1), { size: L.S, align: 'center', tone })
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
