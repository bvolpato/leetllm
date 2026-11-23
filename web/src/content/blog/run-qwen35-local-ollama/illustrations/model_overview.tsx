import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 560
export const height = 570
export const alt =
    'Selected exact Ollama Qwen3.5 GGUF downloads on October 10, 2026: 0.8B is 1.0 GB, 2B is 2.7 GB, 4B is 3.3 GB, 9B is 6.6 GB, 27B is 17 GB, 35B-A3B is 22 GB, and 122B-A10B is 81 GB. The two smallest selected tags use Q8_0, and the others use Q4_K_M.'
const downloads = [
    ['0.8B', 1],
    ['2B', 2.7],
    ['4B', 3.3],
    ['9B', 6.6],
    ['27B', 17],
    ['35B-A3B', 22],
    ['122B-A10B', 81],
] as const
export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height),
        blue = f.tone('blue')
    const plot = f.plot({ x: 166, y: 105, width: 300, height: 365 }, { x: [0, 90], y: [0, 1] })
    f.text(32, 28, 'GGUF download · decimal GB', { size: 24, weight: 600 })
    f.text(32, 66, 'Catalog snapshot · 10 Oct 2026', { size: 20, color: f.c.textSecondary })
    plot.axes({ xTicks: [0, 30, 60, 90], labelSize: 18, grid: true })
    downloads.forEach(([name, value], i) => {
        const y = 128 + i * 52
        f.text(148, y, name, { size: 20, align: 'right' })
        f.rect(166, y - 14, plot.px(value) - 166, 28, { fill: blue, opacity: 0.8 })
        f.text(plot.px(value) + 9, y, value < 10 ? value.toFixed(1) : String(value), {
            size: 22,
            color: blue,
            weight: 600,
        })
    })
    f.text(32, 535, '0.8B, 2B: Q8_0 · others: Q4_K_M', { size: 20, color: f.c.textSecondary })
    return f.render()
}
export default create('dark')
