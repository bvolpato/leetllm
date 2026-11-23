import { BadgePill, Column, FlowArrow, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Deep Dive - DeepSpeed. A full eight-element parameter view is assembled from four two-element rank shards. The local shard remains allocated alongside the gathered view.'
export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({ c, background: c.bg, padding: 56, gap: 28, contentWidth: 1088, children: [
        TextLabel({ c, text: 'Deep Dive - DeepSpeed', fontSize: 54, fontWeight: 750, color: c.textPrimary }),
        TextLabel({ c, text: 'ZeRO-3: own a shard, gather a working view', fontSize: 33 }),
        Row({ width: 1088, gap: 24, children: [0, 1, 2, 3].map(rank => Column({ width: 254, gap: 12, align: 'center', children: [TextLabel({ c, text: `RANK ${rank}`, fontSize: 25 }), BadgePill({ c, text: `${2 * rank}  ${2 * rank + 1}`, width: 254, height: 70, fontSize: 40, tone: rank === 0 ? 'purple' : 'blue' })] })) }),
        Row({ width: 1088, gap: 26, align: 'center', children: [Column({ width: 254, align: 'center', children: [FlowArrow({ c, direction: 'down', length: 54, tone: 'purple' })] }), TextLabel({ c, text: 'All-gather → complete view on each rank', fontSize: 29, color: c.textPrimary })] }),
        Row({ width: 1088, gap: 24, align: 'center', children: [BadgePill({ c, text: '0  1', width: 254, height: 80, fontSize: 40, tone: 'purple' }), BadgePill({ c, text: '0  1  2  3  4  5  6  7', width: 810, height: 80, fontSize: 36, tone: 'cyan' })] }),
        Row({ width: 1088, justify: 'space-between', children: [TextLabel({ c, text: 'Rank 0: retained shard + separate gathered allocation', fontSize: 25 }), TextLabel({ c, text: 'LeetLLM', fontSize: 27, fontWeight: 700, color: c.primaryLight })] }),
    ] })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme' })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error(`Unexpected banner dimensions ${result.pixelWidth}x${result.pixelHeight}`)
    return result
}
export default create('dark')
