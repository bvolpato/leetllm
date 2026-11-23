import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 560
export const height = 330
export const alt =
    'Output throughput comparison: A has 60 SLO-compliant plus 20 late tokens per second, totaling 80; B has 40 compliant plus 60 late, totaling 100. Bars use the same scale.'
export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height),
        green = f.tone('green')
    const plot = f.plot({ x: 90, y: 72, width: 380, height: 170 }, { x: [0, 100], y: [0, 1] })
    f.text(40, 28, 'Output tokens / second', { size: 24, weight: 600 })
    plot.axes({ xTicks: [0, 50, 100], labelSize: 18, grid: true })
    for (const [i, row] of [
        { name: 'A', good: 60, late: 20 },
        { name: 'B', good: 40, late: 60 },
    ].entries()) {
        const y = 112 + i * 80,
            total = row.good + row.late
        f.text(68, y, row.name, { size: 24, weight: 600, align: 'right' })
        f.rect(90, y - 22, plot.px(row.good) - 90, 44, { fill: tint(green, f.c.bg, 0.18) })
        f.rect(plot.px(row.good), y - 22, plot.px(total) - plot.px(row.good), 44, {
            fill: tint(f.c.textMuted, f.c.bg, 0.18),
        })
        f.text((90 + plot.px(row.good)) / 2, y, String(row.good), {
            size: 24,
            color: green,
            align: 'center',
            weight: 600,
        })
        f.text((plot.px(row.good) + plot.px(total)) / 2, y, String(row.late), {
            size: 24,
            color: f.c.textSecondary,
            align: 'center',
        })
        f.text(plot.px(total) + 10, y, String(total), { size: 22, weight: 600 })
    }
    f.text(90, 300, 'Within SLO', { size: 20, color: green })
    f.text(300, 300, 'Outside SLO', { size: 20, color: f.c.textSecondary })
    return f.render()
}
export default create('dark')
