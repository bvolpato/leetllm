import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'

export const width = 672
export const height = 424
export const alt =
    'Three checkpoints, steps 200, 400, and 600, are rows plotted against three aligned scales. All clear the inclusive 0.98 format gate with 0.99, 1.00, and 0.98. Task pass rates are 0.93, 0.91, and 0.97, so step 600 wins. Validation losses are 1.91, 1.77, and 1.79. Step 400 is lowest, but validation loss only breaks a task-rate tie.'

const steps = [
    { step: 200, format: 0.99, task: 0.93, loss: 1.91 },
    { step: 400, format: 1.0, task: 0.91, loss: 1.77 },
    { step: 600, format: 0.98, task: 0.97, loss: 1.79 },
]
const scales = [
    {
        key: 'format' as const,
        title: 'Format',
        note: 'at least 0.98',
        min: 0.96,
        max: 1.0,
        ticks: [0.96, 0.98, 1.0],
        digits: 2,
    },
    {
        key: 'task' as const,
        title: 'Task',
        note: 'highest wins',
        min: 0.9,
        max: 1.0,
        ticks: [0.9, 0.95, 1.0],
        digits: 2,
    },
    {
        key: 'loss' as const,
        title: 'Val. loss',
        note: 'only breaks ties',
        min: 1.7,
        max: 2.0,
        ticks: [1.7, 1.85, 2.0],
        digits: 2,
    },
]

export const layoutHeight = (L: Layout) => (L.print ? 232 : 424)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k
    const nameW = L.print ? 74 : 90
    const gap = L.print ? 26 : 20
    const colW = (L.W - nameW - 12 - gap * 2) / 3
    const colX = (i: number) => nameW + 6 + i * (colW + gap)
    const head = L.print ? 50 : 78
    const rowH = L.print ? 46 : 84
    const rowY = (r: number) => head + r * rowH
    const bottom = rowY(steps.length)
    const inset = L.print ? 22 : 30

    k.rect(4, rowY(2) + 1, L.W - 8, rowH - 2, { fill: k.tint('green', 0.13), rx: 3 })
    scales.forEach((scale, i) => {
        const x = colX(i)
        k.t(x, 3, colW, scale.title, { weight: 600, size: L.S, align: 'center' })
        k.t(x, L.S * 1.5 + 3, colW, scale.note, {
            size: L.S,
            color: c.textSecondary,
            align: 'center',
        })
        const map = (value: number) =>
            x + inset + ((value - scale.min) / (scale.max - scale.min)) * (colW - inset * 2)
        k.line(map(scale.min), bottom + 2, map(scale.max), bottom + 2, { stroke: c.textMuted })
        scale.ticks.forEach((tick) => {
            k.line(map(tick), bottom + 2, map(tick), bottom + 8, { stroke: c.textMuted })
            k.t(map(tick) - inset, bottom + 9, inset * 2, tick.toFixed(2), {
                align: 'center',
                size: L.S,
                color: c.textSecondary,
            })
        })
        if (scale.key === 'format')
            k.line(map(0.98), head, map(0.98), bottom + 2, {
                stroke: k.ink('purple'),
                strokeWidth: 2.25,
            })
        steps.forEach((row, r) => {
            const y = rowY(r)
            const value = row[scale.key]
            const midY = y + rowH * 0.66
            k.line(map(scale.min), midY, map(scale.max), midY, { opacity: 0.45 })
            const winner = scale.key === 'task' && row.step === 600
            const lowest = scale.key === 'loss' && row.step === 400
            const color = winner ? k.ink('green') : lowest ? k.ink('warm') : c.textPrimary
            k.dot(map(value), midY, winner || lowest ? (L.print ? 6.5 : 9) : L.print ? 5 : 7, {
                fill: color,
            })
            const onGate = scale.key === 'format' && value === 0.98
            k.t(
                map(value) - inset + (onGate ? inset + 4 : 0),
                midY - L.S * 1.65,
                inset * 2,
                value.toFixed(2),
                {
                    align: onGate ? 'left' : 'center',
                    size: L.S,
                    weight: winner || lowest ? 700 : 400,
                    color,
                },
            )
        })
    })
    steps.forEach((row, r) => {
        k.mid(8, rowY(r), nameW, rowH, `Step ${row.step}`, {
            size: L.S,
            weight: row.step === 600 ? 700 : 400,
        })
        if (r > 0) k.line(4, rowY(r), L.W - 4, rowY(r), { opacity: 0.5 })
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
