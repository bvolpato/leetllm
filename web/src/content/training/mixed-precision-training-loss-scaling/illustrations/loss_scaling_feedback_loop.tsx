import type { ThemeMode } from 'vizmatic'
import { WEB, makeKit, type Layout } from './_kit'
export { createFilm } from './_parts/gradscaler-film'

export const width = 672
export const height = 700
export const alt =
    'A shared log-magnitude axis shows three CPU gradient cases scaled by 1024. The tiny gradient becomes a preserved FP16 subnormal, the quiet gradient stays finite, and the spike exceeds 65504. A connected four-batch trace starts at scale 1024 and Adam step zero. Quiet applies step one; the spike leaves weights and Adam moments unchanged and lowers the scale to 512; two subsequent clean steps advance Adam to step three and restore scale 1024. This configuration grows after two clean steps, versus the default 2000.'

const cases = [
    {
        name: 'Tiny gradient',
        before: 1.2e-8,
        after: 1.2278556823730469e-5,
        beforeText: '1.2e-8',
        afterText: '1.23e-5 subnormal',
        tone: 'green' as const,
    },
    {
        name: 'Quiet gradient',
        before: 0.02,
        after: 20.484375,
        beforeText: '0.02',
        afterText: '20.5',
        tone: 'blue' as const,
    },
    {
        name: 'Spike',
        before: 100,
        after: 102400,
        beforeText: '100',
        afterText: '102400: Inf',
        tone: 'critical' as const,
    },
]
const events = [
    { name: 'quiet', scale: 1024, update: true, steps: 1, clean: 1, next: 1024 },
    { name: 'spike', scale: 1024, update: false, steps: 1, clean: 0, next: 512 },
    { name: 'quiet', scale: 512, update: true, steps: 2, clean: 1, next: 512 },
    { name: 'quiet', scale: 512, update: true, steps: 3, clean: 0, next: 1024 },
]

export const layoutHeight = (L: Layout) => (L.print ? 372 : 700)

export function draw(theme: ThemeMode, L: Layout) {
    const k = makeKit(theme, L)
    const { c } = k

    // Top: what a scale of 1024 does to three gradients on one log axis.
    const nameW = L.print ? 112 : 0
    const ax0 = nameW + (L.print ? 8 : 30)
    const ax1 = L.W - (L.print ? 28 : 34)
    const map = (value: number) => ax0 + ((Math.log10(value) + 9) / 15) * (ax1 - ax0)
    const head = L.print ? 26 : 34
    const rowH = L.print ? 40 : 80
    const bandH = L.print ? 12 : 16
    const axisY = head + rowH * cases.length + 4
    k.t(6, 3, L.W - 12, 'Multiply by 1024, then store in FP16', {
        weight: 600,
        size: L.S,
    })
    cases.forEach((item, i) => {
        const y = head + i * rowH
        const track = y + rowH - (L.print ? 12 : 16)
        k.rect(map(2 ** -24), track - bandH / 2, map(2 ** -14) - map(2 ** -24), bandH, {
            fill: k.tint('blue', 0.1),
            rx: 0,
        })
        k.rect(map(2 ** -14), track - bandH / 2, map(65504) - map(2 ** -14), bandH, {
            fill: k.tint('blue', 0.24),
            rx: 0,
        })
        if (L.print) k.mid(6, track - 12, nameW, 24, item.name, { size: L.S })
        else k.t(6, y, 240, item.name, { size: L.S })
        k.dot(map(item.before), track, L.print ? 4.5 : 6, {
            fill: k.ink(item.tone),
        })
        k.arrow(map(item.before) + 5, track, map(item.after), track, {
            stroke: k.ink(item.tone),
            strokeWidth: 2.25,
        })
        const textY = track - bandH / 2 - L.S * 1.42
        k.t(map(item.before) - 55, textY, 110, item.beforeText, {
            size: L.S,
            align: 'center',
            color: c.textSecondary,
        })
        const w = L.print ? 150 : 190
        const right = i === 2
        const afterX = right ? L.W - 6 - w : map(item.after) - 8
        k.t(afterX, textY, w, item.afterText, {
            size: L.S,
            align: right ? 'right' : 'left',
            weight: 600,
            tone: item.tone,
        })
        k.line(map(65504), track - bandH / 2 - 3, map(65504), track + bandH / 2 + 3, {
            stroke: k.ink('critical'),
            strokeWidth: 2,
        })
    })
    k.line(ax0, axisY, ax1, axisY, { stroke: c.textMuted })
    ;[-9, -6, -3, 0, 3, 6].forEach((power) => {
        const x = map(10 ** power)
        k.line(x, axisY, x, axisY + 5, { stroke: c.textMuted })
        k.t(x - 28, axisY + 6, 56, `1e${power}`, {
            size: L.S,
            align: 'center',
            color: c.textSecondary,
        })
    })
    k.t(L.W / 2, 3, L.W / 2 - 6, 'FP16 ceiling 65504', {
        size: L.S,
        align: 'right',
        tone: 'critical',
    })

    // Bottom: the controller's response across four steps.
    const by = axisY + (L.print ? 42 : 58)
    const labelW = L.print ? 144 : 164
    const colW = (L.W - labelW - 12) / events.length
    const colX = (i: number) => labelW + 6 + i * colW
    const tableRow = L.print ? 26 : 44
    const barMax = colW - (L.print ? 20 : 16)
    k.t(6, by, labelW, 'Batch', { weight: 600, size: L.S })
    events.forEach((event, i) =>
        k.t(colX(i), by, colW, event.name, {
            size: L.S,
            align: 'center',
            weight: 600,
            color: event.update ? c.textPrimary : k.ink('critical'),
        }),
    )
    const rows = ['Scale used', 'Optimizer', 'Steps taken', 'Clean count', 'Next scale']
    rows.forEach((name, r) => {
        const y = by + (L.print ? 22 : 34) + r * tableRow
        k.line(6, y, L.W - 6, y, { opacity: 0.5 })
        k.mid(6, y, labelW, tableRow, name, { size: L.S, color: c.textSecondary })
        events.forEach((event, i) => {
            const x = colX(i)
            if (r === 0)
                k.mid(x, y, colW, tableRow, String(event.scale), {
                    size: L.S,
                    align: 'center',
                })
            if (r === 1)
                k.mid(x, y, colW, tableRow, event.update ? 'update' : 'skip', {
                    size: L.S,
                    align: 'center',
                    weight: 600,
                    tone: event.update ? 'green' : 'critical',
                })
            if (r === 2)
                k.mid(x, y, colW, tableRow, String(event.steps), {
                    size: L.S,
                    align: 'center',
                })
            if (r === 3)
                k.mid(x, y, colW, tableRow, String(event.clean), {
                    size: L.S,
                    align: 'center',
                })
            if (r === 4) {
                const changed = event.next !== event.scale
                const w = (barMax * event.next) / 1024
                k.rect(x + (colW - barMax) / 2, y + 3, w, tableRow - 6, {
                    fill: k.tint(changed ? 'purple' : 'blue', changed ? 0.4 : 0.2),
                    rx: 0,
                })
                k.mid(x, y, colW, tableRow, String(event.next), {
                    size: L.S,
                    align: 'center',
                    weight: changed ? 700 : 400,
                })
            }
        })
    })
    return k.frame(layoutHeight(L))
}

export function create(theme: ThemeMode = 'dark') {
    return draw(theme, WEB)
}

export default create('dark')
