import { Column, Row, Panel, Scene, TextLabel, StackedBar, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Scaling LLM Inference. Weights remain fixed while KV grows with active requests. A memory budget divides into weights, runtime reserve, and KV cache. Batching reuses weight reads, but memory and token latency limit concurrency.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({ c, background: c.bg, padding: 40, gap: 22, contentWidth: 1120, children: [
        TextLabel({ c, text: 'Scaling LLM Inference', fontSize: 54, fontWeight: 800, color: c.textPrimary }),
        TextLabel({ c, text: 'More requests. The same memory budget.', fontSize: 30 }),
        StackedBar({ c, width: 1090, height: 60, showLegend: false, segments: [
            { label: 'Weights', value: 16, color: c.primary, valueLabel: 'Weights' },
            { label: 'Runtime', value: 9, color: c.warning, valueLabel: 'Runtime' },
            { label: 'KV cache', value: 55, color: c.secondary, valueLabel: 'KV cache grows with requests' },
        ] }),
        Row({ gap: 24, children: [
            Panel({ c, title: '', width: 530, padding: 20, tone: 'purple', children: Column({ gap: 12, children: [
                TextLabel({ c, text: 'Reuse each weight read', fontSize: 30, fontWeight: 700, color: c.textPrimary }),
                TextLabel({ c, text: 'Batch live tokens across requests', fontSize: 24 }),
            ] }) }),
            Panel({ c, title: '', width: 530, padding: 20, tone: 'blue', children: Column({ gap: 12, children: [
                TextLabel({ c, text: 'Leave room for the answer', fontSize: 30, fontWeight: 700, color: c.textPrimary }),
                TextLabel({ c, text: 'Cache growth limits admission', fontSize: 24 }),
            ] }) }),
        ] }),
        TextLabel({ c, text: 'Track capacity, throughput, and token latency as separate serving limits.', fontSize: 29, fontWeight: 650, color: c.textPrimary }),
        Row({ justify: 'end', children: TextLabel({ c, text: 'LeetLLM', fontSize: 24, fontWeight: 750, color: c.primaryLight }) }),
    ] })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    return renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
}
export default create('dark')
