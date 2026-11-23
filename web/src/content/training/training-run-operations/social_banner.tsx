import { BadgePill, Column, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Training Run Operations. A durable checkpoint after update 1840 preserves weights, optimizer moments, scheduler and data position for the next intended update 1841.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({ c, background: c.bg, padding: 50, contentWidth: 1100, gap: 0,
        children: Column({ width: 1100, height: 530, justify: 'space-between', children: [
            TextLabel({ c, text: 'Training Run Operations', fontSize: 57, fontWeight: 750, color: c.textPrimary }),
            TextLabel({ c, text: 'Restore every state needed for the next update.', fontSize: 29 }),
            Row({ width: 1100, gap: 25, align: 'center', children: [
                Panel({ c, title: 'DURABLE CHECKPOINT · 1840', titleFontSize: 25, width: 555, padding: 22, tone: 'purple', shadow: false,
                    children: Column({ gap: 15, children: [
                        Row({ gap: 15, children: [
                            BadgePill({ c, text: 'Weights', width: 245, height: 57, fontSize: 28, tone: 'blue' }),
                            BadgePill({ c, text: 'Moments', width: 245, height: 57, fontSize: 28, tone: 'purple' }),
                        ] }),
                        Row({ gap: 15, children: [
                            BadgePill({ c, text: 'Scheduler', width: 245, height: 57, fontSize: 28, tone: 'cyan' }),
                            BadgePill({ c, text: 'Data position', width: 245, height: 57, fontSize: 26, tone: 'green' }),
                        ] }),
                    ] }),
                }),
                TextLabel({ c, text: '→', width: 85, align: 'center', fontSize: 65, color: c.primaryLight }),
                Column({ width: 410, gap: 15, align: 'center', children: [
                    TextLabel({ c, text: 'NEXT INTENDED UPDATE', fontSize: 22 }),
                    TextLabel({ c, text: '1841', fontSize: 92, fontWeight: 750, color: c.positiveLight }),
                    TextLabel({ c, text: 'Restore state. Verify continuity.', fontSize: 23 }),
                ] }),
            ] }),
            Row({ width: 1100, justify: 'space-between', children: [
                TextLabel({ c, text: 'Illustrative run · save at completed-update boundaries', fontSize: 22 }),
                TextLabel({ c, text: 'LeetLLM', fontSize: 27, fontWeight: 700, color: c.primaryLight }),
            ] }),
        ] }),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme',
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Banner must be 1200×630')
    return result
}
export default create('dark')
