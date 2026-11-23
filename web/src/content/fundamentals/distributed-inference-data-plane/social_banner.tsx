import { BadgePill, Column, FlowArrow, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Distributed Inference Data Plane. Two 1.25 GiB KV shards move from a two-rank prefill group to its decode group, totaling 2.50 GiB for an 8,192-token prompt.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const rank = (n: number) => Row({ width: 1088, gap: 28, align: 'center', children: [
        BadgePill({ c, text: `P7:${n}`, width: 275, height: 82, fontSize: 36, tone: 'blue' }),
        Column({ width: 426, gap: 8, align: 'center', children: [
            TextLabel({ c, text: '1.25 GiB KV', fontSize: 30, color: c.primaryLight }),
            FlowArrow({ c, direction: 'right', tone: 'purple', length: 400 }),
        ] }),
        BadgePill({ c, text: `D3:${n}`, width: 275, height: 82, fontSize: 36, tone: 'green' }),
    ] })
    return Scene({ c, background: c.bg, padding: 56, gap: 26, contentWidth: 1088, children: [
        TextLabel({ c, text: 'Distributed Inference Data Plane', fontSize: 47, fontWeight: 750, color: c.textPrimary }),
        Row({ width: 1088, justify: 'space-between', children: [
            TextLabel({ c, text: 'PREFILL', width: 275, fontSize: 29, color: c.textPrimary, align: 'center' }),
            TextLabel({ c, text: '2.50 GiB total', width: 426, fontSize: 32, color: c.primaryLight, align: 'center' }),
            TextLabel({ c, text: 'DECODE', width: 275, fontSize: 29, color: c.textPrimary, align: 'center' }),
        ] }),
        rank(0), rank(1),
        Column({ height: 75, children: [] }),
        Row({ width: 1088, justify: 'space-between', children: [
            TextLabel({ c, text: '8,192 tokens. Two shards. One request.', fontSize: 26 }),
            TextLabel({ c, text: 'LeetLLM', fontSize: 27, fontWeight: 700, color: c.primaryLight }),
        ] }),
    ] })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme' })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error(`Unexpected banner dimensions ${result.pixelWidth}x${result.pixelHeight}`)
    return result
}
export default create('dark')
