import { BadgePill, Column, FlowArrow, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'AI Lab Technical Presentation. A paired retrieval migration rises from 148 to 162 hits out of 200 queries (+7 percentage points), including 8 regressions. Present gains, regressions, and causal limits together.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({ c, background: c.bg, padding: 56, gap: 30, contentWidth: 1088, children: [
        TextLabel({ c, text: 'AI Lab Technical Presentation', fontSize: 49, fontWeight: 750, color: c.textPrimary }),
        TextLabel({ c, text: 'Show the result. Explain what it does not prove.', fontSize: 32 }),
        Row({ width: 1088, gap: 40, align: 'center', children: [
            Column({ width: 420, gap: 14, align: 'center', children: [TextLabel({ c, text: 'BM25 BASELINE', fontSize: 25 }), BadgePill({ c, text: '148 / 200', width: 420, height: 100, fontSize: 58, tone: 'blue' })] }),
            FlowArrow({ c, direction: 'right', length: 168, tone: 'purple' }),
            Column({ width: 420, gap: 14, align: 'center', children: [TextLabel({ c, text: 'CROSS-ENCODER', fontSize: 25 }), BadgePill({ c, text: '162 / 200', width: 420, height: 100, fontSize: 58, tone: 'green' })] }),
        ] }),
        Row({ width: 1088, gap: 28, children: [BadgePill({ c, text: '+7 percentage points', width: 530, height: 67, fontSize: 33, tone: 'green' }), BadgePill({ c, text: '8 queries regressed', width: 530, height: 67, fontSize: 33, tone: 'critical' })] }),
        Column({ height: 18, children: [] }),
        Row({ width: 1088, justify: 'space-between', children: [TextLabel({ c, text: 'Paired RAG evaluation · 200-query McNemar audit (p = 0.0161)', fontSize: 25 }), TextLabel({ c, text: 'LeetLLM', fontSize: 27, fontWeight: 700, color: c.primaryLight })] }),
    ] })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme' })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error(`Unexpected banner dimensions ${result.pixelWidth}x${result.pixelHeight}`)
    return result
}
export default create('dark')
