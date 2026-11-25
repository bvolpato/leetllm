import type { ThemeMode } from 'vizmatic'
import { Figure, tint } from '../../../../../tools/illustrations/lib/plot-kit'

export const width = 760
export const height = 380
export const alt =
    'Selected exact Ollama Qwen3.5 GGUF downloads color-encoded by quantization format: Q8_0 for 0.8B (1.0 GB) and 2B (2.7 GB), and Q4_K_M for 4B (3.3 GB), 9B (6.6 GB), 27B (17 GB), 35B-A3B (22 GB), and 122B-A10B (81 GB).'

const downloads = [
    { name: '0.8B', value: 1.0, quant: 'Q8_0' as const },
    { name: '2B', value: 2.7, quant: 'Q8_0' as const },
    { name: '4B', value: 3.3, quant: 'Q4_K_M' as const },
    { name: '9B', value: 6.6, quant: 'Q4_K_M' as const },
    { name: '27B', value: 17, quant: 'Q4_K_M' as const },
    { name: '35B-A3B', value: 22, quant: 'Q4_K_M' as const },
    { name: '122B-A10B', value: 81, quant: 'Q4_K_M' as const },
] as const

export function create(theme: ThemeMode = 'dark') {
    const f = new Figure(theme, width, height)
    const { c } = f
    const purple = f.tone('purple')
    const blue = f.tone('blue')

    // Top header + 2-swatch inline legend (no buried footer text!)
    f.text(18, 26, 'GGUF download size (decimal GB)', {
        size: 17,
        weight: 700,
        color: c.textPrimary,
    })

    // 2-swatch inline legend
    f.rect(448, 19, 18, 14, {
        fill: tint(purple, c.bg, 0.78),
        stroke: purple,
        strokeWidth: 1.25,
        radius: 3,
    })
    f.text(474, 26, 'Q8_0 (0.8B, 2B)', { size: 13.5, weight: 600, color: purple, mono: true })

    f.rect(618, 19, 18, 14, {
        fill: tint(blue, c.bg, 0.78),
        stroke: blue,
        strokeWidth: 1.25,
        radius: 3,
    })
    f.text(644, 26, 'Q4_K_M (4B+)', { size: 13.5, weight: 600, color: blue, mono: true })

    const barLeft = 140
    const barW = 536
    const maxVal = 90
    const px = (v: number) => barLeft + (barW * v) / maxVal

    const plotTop = 58
    const plotBot = 334
    for (const tick of [0, 20, 40, 60, 80, 90]) {
        const x = px(tick)
        f.line(x, plotTop, x, plotBot, {
            color: c.borderSubtle,
            width: 1,
            dash: tick === 0 ? undefined : '3 4',
            opacity: tick === 0 ? 0.9 : 0.7,
        })
        f.text(x, 354, `${tick} GB`, {
            size: 13,
            color: c.textSecondary,
            align: 'center',
            mono: true,
        })
    }

    const rowStart = 76
    const rowStep = 39
    const barH = 22

    downloads.forEach((d, i) => {
        const y = rowStart + i * rowStep
        const tone = d.quant === 'Q8_0' ? purple : blue
        const bw = Math.max(8, px(d.value) - barLeft)

        f.text(barLeft - 14, y, d.name, {
            size: 14.5,
            weight: 600,
            color: c.textPrimary,
            align: 'right',
            mono: true,
            width: 118,
        })

        f.rect(barLeft, y - barH / 2, bw, barH, {
            fill: tint(tone, c.bg, 0.78),
            stroke: tone,
            strokeWidth: 1.3,
            radius: 4,
        })

        const valLabel = `${d.value < 10 ? d.value.toFixed(1) : String(d.value)} GB`
        f.text(barLeft + bw + 10, y, valLabel, {
            size: 14.5,
            weight: 700,
            color: tone,
            mono: true,
        })
    })

    return f.render()
}

export default create('dark')
