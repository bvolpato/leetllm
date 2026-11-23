import React from 'react'
import { Column, FlowArrow, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Recursive Language Models: the root model sends inspection code right to an external REPL holding the corpus and variables; observations return left. The REPL sends selected slices right to child model calls; results return left. Four separately labeled arrows distinguish requests from returns.'
export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const panelColors = getThemeColors('light', 'engineering')
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092,
        children: Column({ width: 1092, height: 522, justify: 'space-between', children: [
            Column({ gap: 14, children: [
                TextLabel({ c, text: 'Recursive Language Models (RLM)', fontSize: 46, fontWeight: 700, color: c.textPrimary }),
                TextLabel({ c, text: 'Keep the corpus external. Scope every recursive call.', fontSize: 27, color: c.textSecondary }),
            ] }),
            Row({ gap: 14, align: 'center', children: [
                Panel({ c: panelColors, title: 'Root model', titleFontSize: 22, tone: 'blue', width: 224, height: 170, padding: 20,
                    children: TextLabel({ c: panelColors, text: 'Compact prompt', fontSize: 20 }) }),
                Column({ width: 180, gap: 24, align: 'center', children: [
                    Column({ gap: 10, align: 'center', children: [
                        TextLabel({ c, text: 'Inspection code', fontSize: 18 }),
                        FlowArrow({ c, direction: 'right', length: 180, tone: 'blue' }),
                    ] }),
                    Column({ gap: 10, align: 'center', children: [
                        FlowArrow({ c, direction: 'left', length: 180, tone: 'green' }),
                        TextLabel({ c, text: 'Observations', fontSize: 18 }),
                    ] }),
                ] }),
                Panel({ c: panelColors, title: 'External REPL', titleFontSize: 22, tone: 'purple', width: 224, height: 170, padding: 20, accentWidth: 16,
                    children: TextLabel({ c: panelColors, text: 'Corpus + variables', fontSize: 20 }) }),
                Column({ width: 180, gap: 24, align: 'center', children: [
                    Column({ gap: 10, align: 'center', children: [
                        TextLabel({ c, text: 'Selected slices', fontSize: 18 }),
                        FlowArrow({ c, direction: 'right', length: 180, tone: 'blue' }),
                    ] }),
                    Column({ gap: 10, align: 'center', children: [
                        FlowArrow({ c, direction: 'left', length: 180, tone: 'green' }),
                        TextLabel({ c, text: 'Results', fontSize: 18 }),
                    ] }),
                ] }),
                Panel({ c: panelColors, title: 'Child (R)LMs', titleFontSize: 22, tone: 'cyan', width: 224, height: 170, padding: 20,
                    children: TextLabel({ c: panelColors, text: 'Scoped calls', fontSize: 20 }) }),
            ] }),
            TextLabel({ c, text: 'Inspect, decompose, and verify against source evidence.', fontSize: 25, color: c.textSecondary }),
            TextLabel({ c, text: 'LeetLLM', fontSize: 25, fontWeight: 700, color: theme === 'light' ? c.primaryDark : c.primaryLight, width: 1092, align: 'right' }),
        ] }),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Invalid banner dimensions')
    return result
}
export default create('dark')
