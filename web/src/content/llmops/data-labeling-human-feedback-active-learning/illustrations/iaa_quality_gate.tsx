import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 760
export const alt =
    'A three-by-three matrix of reviewer choices across 120 cases, with bubble area showing case counts. The diagonal holds 42, 38, and 27 agreements. Off-diagonal cells hold the 13 disagreements. Observed agreement is 107 over 120, chance agreement is 4956 over 14400, and Cohen kappa is about 0.835, marked on a minus-one-to-one scale above a local threshold of 0.65.'

const matrix = [
    [42, 3, 1],
    [4, 38, 2],
    [2, 1, 27],
]
const names = ['A better', 'B better', 'Tie']
const rowTotals = matrix.map((row) => row.reduce((sum, n) => sum + n, 0))
const colTotals = matrix[0].map((_, col) => matrix.reduce((sum, row) => sum + row[col], 0))
const total = rowTotals.reduce((sum, n) => sum + n, 0)
const agreement = matrix.reduce((sum, row, i) => sum + row[i], 0)
const chance = rowTotals.reduce((sum, n, i) => sum + n * colTotals[i], 0)
const kappa = (agreement * total - chance) / (total * total - chance)

export const layoutHeight = (L: Layout) => (L.print ? 300 : 760)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const match = k.ink('green')
    const differ = k.ink('warm')
    const gate = k.ink('purple')

    // Matrix panel.
    const nameW = L.print ? 104 : 148
    const cellW = L.print ? 76 : 106
    const cellH = L.print ? 62 : 104
    const totalW = L.print ? 50 : 72
    const x0 = 6 + nameW
    const header = L.print ? 48 : 78
    k.t(x0, 4, cellW * 3, 'Reviewer 2', { align: 'center', weight: 600, size: L.S })
    k.t(6, header - L.S * 1.5, nameW, 'Reviewer 1', { weight: 600, size: L.S })
    names.forEach((name, i) =>
        k.t(x0 + i * cellW, header - L.S * 1.5, cellW, name, {
            align: 'center',
            size: L.S,
            color: c.textSecondary,
        }),
    )
    k.t(x0 + 3 * cellW, header - L.S * 1.5, totalW, 'Total', {
        align: 'right',
        size: L.S,
        color: c.textSecondary,
    })
    matrix.forEach((row, r) => {
        const y = header + r * cellH
        k.mid(6, y, nameW - 8, cellH, names[r], { size: L.S, color: c.textSecondary })
        row.forEach((n, col) => {
            const x = x0 + col * cellW
            k.rect(x, y, cellW, cellH, { stroke: c.border, rx: 0 })
            const big = Math.min(cellW, cellH) * 0.46
            k.dot(
                x + cellW / 2,
                y + cellH / 2,
                Math.max(L.print ? 3 : 4, Math.sqrt(n / 42) * big),
                {
                    fill: k.tint(r === col ? 'green' : 'warm', r === col ? 0.28 : 0.5),
                    stroke: r === col ? match : differ,
                },
            )
            const small = n < 10
            if (small)
                k.t(x + cellW - (L.print ? 24 : 32), y + 3, L.print ? 20 : 28, String(n), {
                    align: 'right',
                    size: L.S,
                    color: differ,
                })
            else k.mid(x, y, cellW, cellH, String(n), { align: 'center', weight: 600 })
        })
        k.mid(x0 + 3 * cellW, y, totalW, cellH, String(rowTotals[r]), {
            align: 'right',
            size: L.S,
            color: c.textSecondary,
        })
    })
    const totalY = header + 3 * cellH + 4
    k.t(6, totalY, nameW, 'Total', { size: L.S, color: c.textSecondary })
    colTotals.forEach((n, col) =>
        k.t(x0 + col * cellW, totalY, cellW, String(n), {
            align: 'center',
            size: L.S,
            color: c.textSecondary,
        }),
    )
    k.t(x0 + 3 * cellW, totalY, totalW, String(total), { align: 'right', size: L.S, weight: 600 })

    // Calculation panel: side by side in print, stacked on the web.
    const px = L.print ? x0 + 3 * cellW + totalW + 34 : 6
    const py = L.print ? 4 : totalY + 56
    const pw = L.W - px - 8
    const lineH = L.print ? 54 : 66
    const math = L.print ? 18 : 25
    k.t(px, py, pw, 'Agree on 107, differ on 13', { weight: 600, size: L.S })
    k.tex(px, py + L.S * 1.7, 'p_o=\\frac{107}{120}\\approx0.892', { size: math })
    const py2 = L.print ? py + L.S * 1.7 + lineH : py + L.S * 1.7
    k.tex(L.print ? px : px + 300, py2, 'p_e=\\frac{4956}{14400}\\approx0.344', { size: math })
    const py3 = L.print ? py2 + lineH : py2 + lineH + 8
    k.tex(px, py3, '\\kappa=\\frac{p_o-p_e}{1-p_e}\\approx0.835', { size: math })

    // A kappa scale from chance to perfect.
    const sy = py3 + (L.print ? 82 : 96)
    const sw = pw - 10
    const sx = (value: number) => px + 4 + ((value + 1) / 2) * sw
    const bar = L.print ? 12 : 18
    k.rect(sx(-1), sy, sw, bar, { stroke: c.border, rx: 0 })
    k.line(sx(0), sy, sx(0), sy + bar, { stroke: c.textMuted })
    k.rect(sx(0), sy, sx(kappa) - sx(0), bar, { fill: k.tint('green', 0.45), rx: 0 })
    k.line(sx(kappa), sy - 5, sx(kappa), sy + bar + 5, { stroke: match, strokeWidth: 2.5 })
    k.line(sx(0.65), sy - 5, sx(0.65), sy + bar + 5, { stroke: gate, strokeWidth: 2 })
    const labelY = sy - L.S * 1.75
    k.t(sx(kappa) - 30, labelY, 60, '0.835', {
        align: 'center',
        tone: 'green',
        weight: 600,
        size: L.S,
    })
    k.t(sx(0.65) - 172, labelY, 168, 'threshold 0.65', {
        align: 'right',
        tone: 'purple',
        size: L.S,
    })
    k.t(sx(-1), sy + bar + 6, 40, '-1', { size: L.S, color: c.textSecondary })
    k.t(sx(0) - 50, sy + bar + 6, 100, '0 chance', {
        size: L.S,
        align: 'center',
        color: c.textSecondary,
    })
    k.t(sx(1) - 60, sy + bar + 6, 60, '1', { align: 'right', size: L.S, color: c.textSecondary })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
