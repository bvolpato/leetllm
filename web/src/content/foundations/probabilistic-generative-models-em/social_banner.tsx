import React from 'react'
import { Column, FlowArrow, Row, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Probabilistic Generative Models. Worked Gaussian-mixture example: equal weights, means 30 and 90 milliseconds, and standard deviation 20 milliseconds. A 50-millisecond observation has component responsibilities 81.8% and 18.2% under the assumed model. Hardware traces or queue state would identify a physical cause.'

export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'), shadow: 'transparent' }
    const label = (text: string, size: number, color = c.textPrimary) => React.createElement('div', {
        style: { display: 'flex', fontFamily: 'Inter', fontWeight: 600, fontSize: size, color },
    }, text)
    const score = (mean: number) => 0.5 * Math.exp(-0.5 * ((50 - mean) / 20) ** 2)
    const fast = score(30) / (score(30) + score(90))
    const segment = (fraction: number, color: string) => React.createElement('div', {
        style: { display: 'flex', width: 600 * fraction, height: 76, alignItems: 'center', justifyContent: 'center', backgroundColor: color, color: '#ffffff', fontFamily: 'Inter', fontWeight: 700, fontSize: 25 },
    }, `${(fraction * 100).toFixed(1)}%`)
    return Scene({ c, background: c.bg, padding: 44, gap: 30, contentWidth: 1112, children: [
        label('Probabilistic Generative Models', 43),
        label('The E-step assigns fractional component membership.', 27, c.textSecondary),
        Column({ gap: 12, align: 'start', children: [
            label('WORKED EXAMPLE', 21, c.primaryLight),
            label('Equal weights · means 30 and 90 ms · standard deviation 20 ms', 23),
        ] }),
        Row({ gap: 40, align: 'center', justify: 'center', children: [
            Column({ gap: 10, align: 'center', children: [label('50 ms', 48), label('observation', 23, c.textSecondary)] }),
            FlowArrow({ c, direction: 'right', length: 58, tone: 'neutral' }),
            Column({ gap: 14, align: 'start', children: [
                label('Responsibilities sum to 100%', 25),
                Row({ gap: 0, children: [segment(fast, c.secondaryDark), segment(1 - fast, c.primaryDark)] }),
                Row({ width: 600, justify: 'space-between', children: [
                    label('30 ms component', 22, c.secondaryLight), label('90 ms component', 22, c.primaryLight),
                ] }),
            ] }),
        ] }),
        label('Membership depends on the fitted model.', 26),
        Row({ justify: 'space-between', children: [
            label('M-step: update parameters using these fractional memberships.', 20, c.textSecondary),
            label('LeetLLM', 25, c.primaryLight),
        ] }),
    ] })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}

export default create('dark')
