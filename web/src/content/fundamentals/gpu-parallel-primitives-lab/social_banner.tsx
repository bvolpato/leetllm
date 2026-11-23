import React from 'react'
import { BadgePill, Column, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'GPU Parallel Primitives Lab. The same eight input values produce one total, 11, or eight exclusive prefixes, 0,3,2,6,7,12,3,5. Reduction shrinks the output; scan preserves positions.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const values = (items: number[], tone: 'blue' | 'purple' | 'green') => Row({ width: 1088, gap: 12, children: items.map(value => BadgePill({ c, text: String(value), width: (1088 - 12 * (items.length - 1)) / items.length, height: 65, fontSize: 35, tone })) })
    return Scene({ c, background: c.bg, padding: 56, gap: 24, contentWidth: 1088, children: [
        TextLabel({ c, text: 'GPU Parallel Primitives Lab', fontSize: 48, fontWeight: 750, color: c.textPrimary }),
        values([3, -1, 4, 1, 5, -9, 2, 6], 'blue'),
        Row({ width: 1088, gap: 26, align: 'center', children: [
            TextLabel({ c, text: 'REDUCE', width: 255, fontSize: 29, color: c.textPrimary }),
            BadgePill({ c, text: '11', width: 150, height: 70, fontSize: 40, tone: 'green' }),
            TextLabel({ c, text: 'one total', width: 500, fontSize: 31 }),
        ] }),
        Column({ gap: 15, children: [
            TextLabel({ c, text: 'EXCLUSIVE SCAN: every earlier subtotal', fontSize: 28, color: c.textPrimary }),
            values([0, 3, 2, 6, 7, 12, 3, 5], 'purple'),
        ] }),
        Row({ width: 1088, justify: 'space-between', children: [
            TextLabel({ c, text: 'Same inputs. Different dependencies.', fontSize: 26 }),
            TextLabel({ c, text: 'LeetLLM', fontSize: 26, fontWeight: 700, color: c.primaryLight }),
        ] }),
    ] })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme' })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    return result
}
export default create('dark')
