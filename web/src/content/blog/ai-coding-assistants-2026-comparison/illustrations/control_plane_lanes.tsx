import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 560
export const height = 490
export const alt =
    'Two paired bar charts reverse the ranking in a ten-attempt comparison: A costs 2 dollars per attempt and 4 dollars per accepted change; B costs 3 dollars per attempt and 3.75 dollars per accepted change. A accepts five changes and B eight.'
const setups = [
    { name: 'A', spent: 20, attempts: 10, accepted: 5 },
    { name: 'B', spent: 30, attempts: 10, accepted: 8 },
]

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const tones = [f.tone('blue'), f.tone('purple')]
    for (const [index, metric] of ['attempts', 'accepted'].entries()) {
        const top = 65 + index * 250
        const plot = f.plot({ x: 110, y: top, width: 350, height: 110 }, { x: [0, 6], y: [0, 1] })
        f.text(40, top - 38, metric === 'attempts' ? 'USD / attempt' : 'USD / accepted change', {
            size: 24,
            weight: 600,
        })
        plot.axes({ xTicks: [0, 2, 4, 6], labelSize: 18, grid: true })
        setups.forEach((s, i) => {
            const y = top + 30 + i * 50
            const value = s.spent / (metric === 'attempts' ? s.attempts : s.accepted)
            f.text(90, y, s.name, { size: 24, align: 'right', weight: 600 })
            f.rect(plot.px(0), y - 14, plot.px(value) - plot.px(0), 28, {
                fill: tones[i],
                opacity: 0.8,
            })
            f.text(plot.px(value) + 10, y, value.toFixed(2), {
                size: 22,
                color: tones[i],
                weight: 600,
            })
        })
    }
    return f.render()
}
export default create('dark')
