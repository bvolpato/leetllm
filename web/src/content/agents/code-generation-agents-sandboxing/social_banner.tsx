import React from 'react'
import { BadgePill, Column, Panel, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Code Generation & Sandboxing. A frozen patch runs in a restricted worker; its bounded output becomes evidence for a separate validator. Host secrets remain outside the worker.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    return Scene({ c, background: c.bg, padding: 48, gap: 25, contentWidth: 1104,
        children: [
            TextLabel({ c, text: 'Code Generation & Sandboxing', fontSize: 47, fontWeight: 750, color: c.textPrimary }),
            TextLabel({ c, text: 'Run the proposal. Keep host privileges outside.', fontSize: 29, color: c.textSecondary }),
            Row({ width: 1104, gap: 23, align: 'center', children: [
                Column({ width: 225, gap: 22, align: 'center', children: [
                    BadgePill({ c, text: 'PATCH C', width: 220, height: 66, fontSize: 31, tone: 'blue' }),
                    TextLabel({ c, text: 'frozen input', fontSize: 25, width: 220, align: 'center' }),
                ] }),
                TextLabel({ c, text: '→', fontSize: 44, width: 45, align: 'center' }),
                Panel({ c, title: 'Restricted worker', width: 460, height: 230, titleFontSize: 31, padding: 26, gap: 22, shadow: false, tone: 'warm', children: Column({ gap: 23, children: [
                    TextLabel({ c, text: 'execute → observe → stop', fontSize: 28, color: c.textPrimary }),
                    BadgePill({ c, text: 'No host secrets', width: 390, height: 52, fontSize: 27, tone: 'warm' }),
                ] }) }),
                TextLabel({ c, text: '→', fontSize: 44, width: 45, align: 'center' }),
                Column({ width: 230, gap: 22, align: 'center', children: [
                    BadgePill({ c, text: 'EVIDENCE', width: 220, height: 66, fontSize: 30, tone: 'green' }),
                    TextLabel({ c, text: 'external grading', fontSize: 25, width: 230, align: 'center' }),
                ] }),
            ] }),
            Row({ width: 1104, justify: 'space-between', children: [
                TextLabel({ c, text: 'Correctness and containment are separate checks.', fontSize: 26, color: c.textSecondary }),
                TextLabel({ c, text: 'LeetLLM', fontSize: 26, color: c.primaryLight, fontWeight: 700 }),
            ] }),
        ],
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    }
    return result
}
export default create('dark')
