import type { ThemeMode } from 'vizmatic'
import { Figure } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 560
export const height = 405
export const alt =
    'Calculated Qwen3.5-9B FP16 attention KV cache: 8,192 tokens times one sequence is 0.25 GiB; 32,768 times one is 1 GiB; 65,536 times one is 2 GiB; 32,768 times four is 4 GiB. Weights and all other runtime allocations are excluded.'
const loads = [
    [8192, 1],
    [32768, 1],
    [65536, 1],
    [32768, 4],
] as const
export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height),
        blue = f.tone('blue'),
        purple = f.tone('purple')
    const plot = f.plot({ x: 152, y: 100, width: 300, height: 220 }, { x: [0, 4.5], y: [0, 1] })
    f.text(32, 28, 'Attention KV only · GiB', { size: 24, weight: 600 })
    f.text(32, 66, 'Qwen3.5-9B · FP16', { size: 20, color: f.c.textSecondary })
    plot.axes({ xTicks: [0, 1, 2, 3, 4], labelSize: 18, grid: true })
    loads.forEach(([tokens, sequences], i) => {
        const y = 130 + i * 54,
            value = ((tokens * sequences) / 8192) * 0.25,
            color = sequences === 1 ? blue : purple
        f.text(134, y, `${tokens / 1024}K × ${sequences}`, { size: 22, align: 'right' })
        f.rect(152, y - 16, plot.px(value) - 152, 32, { fill: color, opacity: 0.8 })
        f.text(plot.px(value) + 10, y, String(value), { size: 24, color, weight: 600 })
    })
    f.text(32, 378, 'Context tokens × sequences · K = 1,024', {
        size: 20,
        color: f.c.textSecondary,
    })
    return f.render()
}
export default create('dark')
