import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 552
export const alt =
    'A release example records 184 wins in 400 blinded comparisons, a 46.0 percent rate with a 95 percent Wilson interval from 41.2 to 50.9 percent that crosses the 50 percent baseline. Proxy reward rises by 0.31, while mean response length grows 48 tokens against a 20-token limit. The lower-confidence win gate and length gate both fail, so promotion is held; the interval shows neither improvement nor degradation.'

export const layoutHeight = (L: Layout) => (L.print ? 222 : 552)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const nameW = L.print ? 196 : 0
    const verdictW = L.print ? 84 : 110
    const ax0 = nameW + (L.print ? 14 : 28)
    const ax1 = L.W - verdictW - (L.print ? 26 : 28)
    const rowH = L.print ? 72 : 178
    const y0 = 3
    const fail = k.ink('critical')
    const row = (i: number) => y0 + i * rowH
    const plotY = (i: number) => (L.print ? row(i) + 40 : row(i) + 110)

    const header = (i: number, title: string, note: string) => {
        if (L.print) {
            k.t(6, row(i) + 8, nameW, title, { weight: 600 })
            k.t(6, row(i) + 8 + L.T * 1.35, nameW, note, { size: L.S, color: c.textSecondary })
        } else {
            k.t(6, row(i) + 2, L.W - verdictW - 12, title, { weight: 600 })
            k.t(6, row(i) + 2 + L.T * 1.3, L.W - 12, note, { size: L.S, color: c.textSecondary })
        }
    }
    const verdict = (i: number, text: string, color: string) =>
        k.mid(
            L.W - verdictW - 6,
            L.print ? row(i) + 8 : row(i),
            verdictW,
            L.print ? 44 : 34,
            text,
            { size: L.S, align: 'right', weight: 600, color },
        )
    ;[1, 2].forEach((i) => k.line(6, row(i), L.W - 6, row(i), { opacity: 0.5 }))

    // Row 1: proxy reward moves, but it is not a gate.
    header(0, 'Proxy reward', 'up 0.31, a training signal')
    verdict(0, 'not a gate', c.textSecondary)
    const rewardMap = (v: number) => ax0 + (v / 0.5) * (ax1 - ax0)
    k.line(rewardMap(0), plotY(0), rewardMap(0.5), plotY(0), { stroke: c.textMuted })
    k.arrow(rewardMap(0), plotY(0), rewardMap(0.31), plotY(0), {
        stroke: k.ink('blue'),
        strokeWidth: 3,
        size: 8,
    })
    ;[0, 0.25, 0.5].forEach((t) => {
        k.line(rewardMap(t), plotY(0), rewardMap(t), plotY(0) + 5, { stroke: c.textMuted })
        k.t(rewardMap(t) - 28, plotY(0) + 7, 56, t === 0 ? '0' : `+${t.toFixed(2)}`, {
            size: L.S,
            align: 'center',
            color: c.textSecondary,
        })
    })
    k.t(rewardMap(0.31) - 40, plotY(0) - L.S * 1.55, 80, '+0.31', {
        size: L.S,
        align: 'center',
        tone: 'blue',
        weight: 600,
    })

    // Row 2: win rate interval against the 50 percent line.
    header(1, 'Win rate, 184 of 400', 'low end must pass 50%')
    verdict(1, 'fails', fail)
    const winMap = (p: number) => ax0 + ((p - 0.38) / 0.16) * (ax1 - ax0)
    k.line(winMap(0.38), plotY(1), winMap(0.54), plotY(1), { stroke: c.textMuted })
    ;[0.4, 0.45, 0.5].forEach((t) => {
        k.line(winMap(t), plotY(1), winMap(t), plotY(1) + 5, { stroke: c.textMuted })
        k.t(winMap(t) - 28, plotY(1) + 7, 56, `${Math.round(t * 100)}%`, {
            size: L.S,
            align: 'center',
            color: t === 0.5 ? k.ink('purple') : c.textSecondary,
        })
    })
    k.line(winMap(0.5), plotY(1) - (L.print ? 20 : 24), winMap(0.5), plotY(1) + 5, {
        stroke: k.ink('purple'),
        strokeWidth: 2.25,
    })
    k.line(winMap(0.412), plotY(1) - 2, winMap(0.509), plotY(1) - 2, {
        stroke: fail,
        strokeWidth: 4,
    })
    k.line(winMap(0.412), plotY(1) - 9, winMap(0.412), plotY(1) + 5, {
        stroke: fail,
        strokeWidth: 2,
    })
    k.line(winMap(0.509), plotY(1) - 9, winMap(0.509), plotY(1) + 5, {
        stroke: fail,
        strokeWidth: 2,
    })
    k.dot(winMap(0.46), plotY(1) - 2, L.print ? 5 : 7, { fill: fail })
    k.t(winMap(0.412) - 34, plotY(1) - L.S * 1.75, 68, '41.2%', {
        size: L.S,
        align: 'center',
        color: fail,
    })
    k.t(winMap(0.46) - 34, plotY(1) - L.S * 1.75, 68, '46.0%', {
        size: L.S,
        align: 'center',
        weight: 600,
        color: fail,
    })
    k.t(winMap(0.509) + 3, plotY(1) - L.S * 1.75, 64, '50.9%', { size: L.S, color: fail })

    // Row 3: length growth against the limit we chose.
    header(2, 'Length growth', 'tokens per answer, limit 20')
    verdict(2, 'fails', fail)
    const lenMap = (v: number) => ax0 + (v / 60) * (ax1 - ax0)
    const barH = L.print ? 12 : 16
    k.rect(lenMap(0), plotY(2) - barH - 2, lenMap(48) - lenMap(0), barH, {
        fill: k.tint('critical', 0.5),
        stroke: fail,
        rx: 0,
    })
    k.line(lenMap(0), plotY(2), lenMap(60), plotY(2), { stroke: c.textMuted })
    ;[0, 20, 40, 60].forEach((t) => {
        k.line(lenMap(t), plotY(2), lenMap(t), plotY(2) + 5, { stroke: c.textMuted })
        k.t(lenMap(t) - 28, plotY(2) + 7, 56, String(t), {
            size: L.S,
            align: 'center',
            color: t === 20 ? k.ink('purple') : c.textSecondary,
        })
    })
    k.line(lenMap(20), plotY(2) - barH - 8, lenMap(20), plotY(2) + 5, {
        stroke: k.ink('purple'),
        strokeWidth: 2.25,
    })
    k.t(lenMap(48) - 34, plotY(2) - barH - L.S * 1.5, 68, '+48', {
        size: L.S,
        align: 'center',
        weight: 600,
        color: fail,
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
