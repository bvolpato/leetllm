import { Column, FlowArrow, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Accelerator Architecture Field Guide. One 86 MiB BF16 weight matrix serves either 32768 prefill rows or 8 decode rows. Same weights, different reuse. LeetLLM.'

export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering'), shadow: 'transparent' }
    return Scene({ c, background: c.bg, padding: 48, gap: 30, contentWidth: 1104, children: [
        TextLabel({ c, text: 'Accelerator Architecture Field Guide', fontSize: 51, fontWeight: 750, color: c.textPrimary }),
        TextLabel({ c, text: 'Same weights. Different reuse.', fontSize: 30, color: c.primaryLight }),
        Row({ gap: 24, align: 'center', children: [
            Panel({ c, title: 'One projection', width: 350, padding: 28, accentHeight: 0, children: Column({ gap: 18, children: [
                TextLabel({ c, text: '86 MiB', fontSize: 66, fontWeight: 750, color: c.textPrimary }),
                TextLabel({ c, text: 'BF16 weights', fontSize: 26 }),
            ] }) }),
            FlowArrow({ c, direction: 'right', length: 58, tone: 'purple' }),
            Column({ gap: 18, children: [
                Panel({ c, title: 'Prefill', width: 624, padding: 22, accentHeight: 0, children: TextLabel({ c, text: '32,768 token rows', fontSize: 35, fontWeight: 700, color: c.primaryLight }) }),
                Panel({ c, title: 'Decode', width: 624, padding: 22, accentHeight: 0, children: TextLabel({ c, text: '8 token rows', fontSize: 35, fontWeight: 700, color: c.warning }) }),
            ] }),
        ] }),
        Row({ width: '100%', justify: 'space-between', children: [
            TextLabel({ c, text: 'Execution · memory · interconnect', fontSize: 23 }),
            TextLabel({ c, text: 'LeetLLM', fontSize: 25, fontWeight: 700, color: c.primaryLight }),
        ] }),
    ] })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const output = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (output.pixelWidth !== width || output.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return output
}
export default create('dark')
