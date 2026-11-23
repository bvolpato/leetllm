import { Scene, Column, Row, TextLabel, StackedBar, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Scaled Dot-Product Attention. The grew query assigns 42.1 percent to cache and 57.9 percent to grew, mixing their values into context [1.421, 1.579].'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const blue = theme === 'dark' ? '#60a5fa' : '#1d4ed8'
    return Scene({ c, background: c.bg, padding: 50, contentWidth: 1100, gap: 0, children: Column({ width: 1100, height: 530, justify: 'space-between', children: [
        TextLabel({ c, text: 'Scaled Dot-Product Attention', fontSize: 52, fontWeight: 750, color: c.textPrimary }),
        TextLabel({ c, text: 'One query. Two keys. A weighted read.', fontSize: 29, color: c.textSecondary }),
        Row({ width: 1100, justify: 'space-between', children: [
            TextLabel({ c, text: 'q · k / √2 → softmax', fontSize: 27, mono: true }),
            TextLabel({ c, text: 'query = grew', fontSize: 25, color: c.textSecondary }),
        ] }),
        Row({ width: 1100, gap: 0, children: [
            TextLabel({ c, text: 'cache · 42.1%', fontSize: 25, color: purple, width: 463, align: 'center' }),
            TextLabel({ c, text: 'grew · 57.9%', fontSize: 25, color: blue, width: 637, align: 'center' }),
        ] }),
        StackedBar({ c, width: 1100, height: 102, showLegend: false, segments: [
            { label: 'cache 42.1%', value: 0.421115, color: purple, valueLabel: '' },
            { label: 'grew 57.9%', value: 0.578885, color: blue, valueLabel: '' },
        ] }),
        Row({ width: 1100, justify: 'space-between', children: [
            TextLabel({ c, text: '0.421 × [2, 1]', fontSize: 32, color: purple, mono: true }),
            TextLabel({ c, text: '+', fontSize: 32 }),
            TextLabel({ c, text: '0.579 × [1, 2]', fontSize: 32, color: blue, mono: true }),
            TextLabel({ c, text: '≈ [1.421, 1.579]', fontSize: 32, mono: true }),
        ] }),
        Row({ width: 1100, justify: 'space-between', children: [
            TextLabel({ c, text: 'Q and K choose the weights. V carries the content.', fontSize: 24, color: c.textSecondary }),
            TextLabel({ c, text: 'LeetLLM', fontSize: 26, color: purple, fontWeight: 700 }),
        ] }),
    ] }) })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme' })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Banner must be 1200×630')
    return result
}
export default create('dark')
