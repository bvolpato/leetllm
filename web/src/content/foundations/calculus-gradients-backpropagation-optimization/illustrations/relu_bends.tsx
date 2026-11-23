import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 820
export const height = 490
export const alt =
    'Latency against server utilization follows a hockey stick: flat near 50 milliseconds, then rising after 0.6 and more steeply after 0.8. Left: the best straight line misses both the flat region and the steep end. Right: two ReLU units, each flat and then rising from its own bend, add up with a base value to fit the curve exactly.'

const relu = (x: number) => Math.max(0, x)
const unitA = (u: number) => 200 * relu(u - 0.6)
const unitB = (u: number) => 400 * relu(u - 0.8)
const target = (u: number) => 50 + unitA(u) + unitB(u)
const samples = Array.from({ length: 19 }, (_, i) => (i + 1) / 20)
const meanX = samples.reduce((s, x) => s + x, 0) / samples.length
const meanY = samples.reduce((s, x) => s + target(x), 0) / samples.length
const slope =
    samples.reduce((s, x) => s + (x - meanX) * (target(x) - meanY), 0) /
    samples.reduce((s, x) => s + (x - meanX) ** 2, 0)
const intercept = meanY - slope * meanX

export function create(theme: ThemeMode = 'dark') {
    const fig = new Figure(theme, width, height)
    const { c } = fig
    const red = fig.tone('critical'),
        blue = fig.tone('blue'),
        green = fig.tone('green'),
        warm = fig.tone('warm')
    const domain = { x: [0, 1] as const, y: [-20, 190] as const }

    fig.text(28, 28, 'Best straight line', { weight: 650, size: 28 })
    fig.text(28, 68, 'Misses flat region and tail', { size: 25, color: red })
    const left = fig.plot({ x: 88, y: 126, width: 294, height: 224 }, domain)
    left.axes({ xTicks: [0, 0.5, 1], yTicks: [0, 50, 100, 150], labelSize: 25, grid: true })
    left.fn((u) => intercept + slope * u, { color: red, width: 3 }, 2, [0, 1])
    for (const u of samples) left.point(u, target(u), { color: c.textPrimary, r: 4 })
    fig.text(28, 110, 'ms', { size: 24, color: c.textSecondary })
    fig.text(235, 402, 'Utilization', { size: 25, color: c.textSecondary, align: 'center' })

    fig.text(432, 28, 'Base + two ReLU units', { weight: 650, size: 28 })
    fig.text(432, 68, '50 ms base + two slopes', { size: 25, color: green })
    const right = fig.plot({ x: 494, y: 126, width: 294, height: 224 }, domain)
    right.axes({ xTicks: [0, 0.5, 1], yTicks: [0, 50, 100, 150], labelSize: 25, grid: true })
    right.fn(unitA, { color: blue, width: 2, dash: '6 5' })
    right.fn(unitB, { color: warm, width: 2, dash: '6 5' })
    right.fn(target, { color: green, width: 3 }, 200)
    for (const u of samples) right.point(u, target(u), { color: c.textPrimary, r: 4 })
    fig.text(432, 110, 'ms', { size: 24, color: c.textSecondary })
    fig.text(641, 402, 'Utilization', { size: 25, color: c.textSecondary, align: 'center' })

    fig.text(88, 456, 'Blue: 200 ReLU(u − 0.6)', { size: 25, color: blue })
    fig.text(494, 456, 'Amber: 400 ReLU(u − 0.8)', { size: 25, color: warm })
    return fig.render()
}
