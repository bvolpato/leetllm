import { Column, FlowArrow, Grid, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Mixture of Experts. One token selects two of eight stored experts. Two cells are marked run, six are marked stored. Sparse compute is not small weight memory. LeetLLM.'

export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'), shadow: 'transparent' }
    return Scene({ c, background: c.bg, padding: 48, gap: 32, contentWidth: 1104, children: [
        TextLabel({ c, text: 'Mixture of Experts', fontSize: 68, fontWeight: 750, color: c.textPrimary }),
        TextLabel({ c, text: 'Two experts run. Eight remain stored.', fontSize: 32, color: c.primaryLight }),
        Row({ gap: 32, align: 'center', children: [
            Column({ width: 225, gap: 18, children: [
                TextLabel({ c, text: 'One token', fontSize: 38, fontWeight: 700, color: c.textPrimary }),
                TextLabel({ c, text: 'top-2 router', fontSize: 27 }),
            ] }),
            FlowArrow({ c, direction: 'right', length: 75, tone: 'purple' }),
            Grid({ c, rows: [0, 1].map(row => [0, 1, 2, 3].map(col => {
                const i = row * 4 + col
                return { label: `E${i + 1}\n${i === 0 || i === 5 ? 'RUN' : 'stored'}`, tone: i === 0 || i === 5 ? 'green' as const : 'neutral' as const }
            })), cellWidth: 164, cellHeight: 94, gap: 12, fontSize: 23 }),
        ] }),
        Row({ width: 1104, justify: 'space-between', children: [
            TextLabel({ c, text: 'Sparse arithmetic ≠ small weight memory', fontSize: 26 }),
            TextLabel({ c, text: 'LeetLLM', fontSize: 26, fontWeight: 700, color: c.primaryLight }),
        ] }),
    ] })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const output = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (output.pixelWidth !== width || output.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return output
}
export default create('dark')
