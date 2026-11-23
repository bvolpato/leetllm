import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 520
export const alt =
    'Three token transitions have rewards 0, 0, and 1. The critic predicts zero at all four states, including terminal V3, so the TD residuals are 0, 0, and 1. Backward GAE accumulation gives advantages [1, 1, 1] at lambda 1 and [0.25, 0.5, 1] at lambda 0.5; arrows point from the terminal decision toward earlier tokens.'

const rewards = [0, 0, 1]
const values = [0, 0, 0, 0]

function advantages(lambda: number) {
    const result = [0, 0, 0]
    let running = 0
    for (let t = rewards.length - 1; t >= 0; t--) {
        running = rewards[t] + values[t + 1] - values[t] + lambda * running
        result[t] = running
    }
    return result
}

export const layoutHeight = (L: Layout) => (L.print ? 282 : 520)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const nameW = L.print ? 150 : 186
    const colW = (L.W - nameW - 12) / 3
    const colX = (i: number) => nameW + 6 + i * colW
    const rowH = L.print ? 25 : 42
    const head = L.print ? 34 : 50
    const textRows: { name: string; cells: string[] }[] = [
        { name: 'Reward r', cells: rewards.map(String) },
        { name: 'Critic V', cells: ['0', '0', '0'] },
        { name: 'Residual δ', cells: rewards.map(String) },
    ]
    k.t(6, 10, nameW, 'Token decision', { size: L.S, color: c.textSecondary })
    ;[0, 1, 2].forEach((i) => {
        const w = colW - 16
        k.rect(colX(i) + 8, 6, w, head - 12, {
            fill: k.tint(i === 2 ? 'green' : 'blue', 0.18),
            stroke: k.ink(i === 2 ? 'green' : 'blue'),
        })
        k.mid(colX(i), 6, colW, head - 12, i === 2 ? `t${i + 1}, final` : `t${i + 1}`, {
            size: L.S,
            align: 'center',
        })
    })
    textRows.forEach((row, r) => {
        const y = head + r * rowH
        k.line(6, y, L.W - 6, y, { opacity: 0.45 })
        k.mid(6, y, nameW, rowH, row.name, { size: L.S, color: c.textSecondary })
        row.cells.forEach((cell, i) => {
            if (cell === '1')
                k.mid(colX(i), y, colW, rowH, cell, {
                    size: L.S,
                    align: 'center',
                    weight: 700,
                    tone: 'green',
                })
            else k.mid(colX(i), y, colW, rowH, cell, { size: L.S, align: 'center' })
        })
    })
    const barsTop = head + textRows.length * rowH + (L.print ? 16 : 24)
    const barMax = L.print ? 50 : 84
    const rowGap = L.print ? 14 : 22
    ;[
        { lambda: 1, tone: 'blue' as const },
        { lambda: 0.5, tone: 'purple' as const },
    ].forEach((series, s) => {
        const base = barsTop + (s + 1) * barMax + s * rowGap
        k.line(6, base, L.W - 6, base, { stroke: c.textMuted })
        k.mid(6, base - barMax, nameW, barMax, `Advantage, λ = ${series.lambda}`, {
            size: L.S,
            weight: 600,
            tone: series.tone,
        })
        advantages(series.lambda).forEach((value, i) => {
            const h = value * (barMax - L.S * 1.25)
            const w = colW * 0.44
            const x = colX(i) + (colW - w) / 2
            k.rect(x, base - h, w, h, {
                fill: k.tint(series.tone, 0.55),
                stroke: k.ink(series.tone),
                rx: 0,
            })
            k.t(colX(i), base - h - L.S * 1.38, colW, String(value), { size: L.S, align: 'center' })
        })
    })
    // Credit travels backward from the terminal decision.
    const arrowY = barsTop - (L.print ? 7 : 10)
    k.arrow(colX(2) + colW / 2, arrowY, colX(0) + colW / 2, arrowY, {
        stroke: k.ink('green'),
        strokeWidth: 2,
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
