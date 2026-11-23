import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 462
export const alt =
    'A weight number line from 0.85 to 1.05. Gradient plus 2 moved the weight from 1.000000 to 0.900000 and stored moments 0.200000 and 0.004000 at step 1. Both lanes start at 0.900000 and receive the same next gradient, minus 1, at learning rate 0.1. With restored moments the weight moves down to 0.873366. With a fresh optimizer it moves up to 1.000000. The CPU example isolates optimizer history; real continuation also needs scheduler, sampler, RNG, and artifact identity.'

const lanes = [
    {
        name: 'Moments restored',
        state: 'm = 0.2, v = 0.004, step 1',
        end: 0.873366,
        tone: 'green' as const,
    },
    { name: 'Fresh optimizer', state: 'm = 0, v = 0, step 0', end: 1.0, tone: 'critical' as const },
]

export const layoutHeight = (L: Layout) => (L.print ? 202 : 462)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const nameW = L.print ? 252 : 0
    const ax0 = nameW + (L.print ? 16 : 34)
    const ax1 = L.W - (L.print ? 34 : 40)
    const map = (value: number) => ax0 + ((value - 0.85) / 0.2) * (ax1 - ax0)
    const top = L.print ? 34 : 96
    const laneH = L.print ? 58 : 136
    const bottom = top + laneH * lanes.length

    k.t(
        6,
        3,
        L.W - 12,
        L.print
            ? 'Saved after gradient +2 moved the weight from 1.000 to 0.900. Next gradient: -1.'
            : 'Saved after gradient +2: weight 1.000 to 0.900.',
        { size: L.S, color: c.textSecondary },
    )
    if (!L.print)
        k.t(6, 3 + L.S * 1.4, L.W - 12, 'Next gradient for both lanes: -1.', {
            size: L.S,
            color: c.textSecondary,
        })
    if (L.print)
        k.line(map(0.9), top - 4, map(0.9), bottom, { stroke: c.textSecondary, dash: '5 4' })

    lanes.forEach((lane, i) => {
        const y = top + i * laneH
        const trackY = L.print ? y + laneH * 0.66 : y + laneH * 0.68
        const textX = L.print ? 6 : 6
        if (L.print) {
            k.t(textX, y + 3, nameW, lane.name, { weight: 600 })
            k.t(textX, y + L.T * 1.45 + 2, nameW, lane.state, {
                size: L.S,
                color: c.textSecondary,
                mono: true,
            })
        } else {
            k.t(textX, y + 2, L.W - 12, lane.name, { weight: 600 })
            k.t(textX, y + L.T * 1.35, L.W - 12, lane.state, {
                size: L.S,
                color: c.textSecondary,
                mono: true,
            })
        }
        k.line(ax0, trackY, ax1, trackY, { opacity: 0.5 })
        k.arrow(map(0.9), trackY, map(lane.end), trackY, {
            stroke: k.ink(lane.tone),
            strokeWidth: 3,
            size: L.print ? 8 : 8,
        })
        k.dot(map(0.9), trackY, L.print ? 5 : 7, { fill: c.textPrimary })
        const textW = 110
        const y2 = L.print ? trackY - L.S * 1.55 : trackY + 8
        const x2 =
            lane.end < 0.9 ? map(0.9) - textW - 6 : map(lane.end) - textW + (L.print ? 30 : 34)
        k.t(x2, y2, textW, lane.end.toFixed(6), {
            align: 'right',
            size: L.S,
            mono: true,
            weight: 600,
            tone: lane.tone,
        })
    })
    k.line(ax0, bottom, ax1, bottom, { stroke: c.textMuted })
    ;[0.85, 0.9, 0.95, 1.0, 1.05].forEach((tick) => {
        k.line(map(tick), bottom, map(tick), bottom + 6, { stroke: c.textMuted })
        k.t(map(tick) - 30, bottom + 7, 60, tick.toFixed(2), {
            align: 'center',
            size: L.S,
            color: c.textSecondary,
        })
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
