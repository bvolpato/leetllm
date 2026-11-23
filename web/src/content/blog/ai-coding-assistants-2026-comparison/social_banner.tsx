import React from 'react'
import { Column, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/blog/ai-coding-assistants-2026-comparison/social_banner.tsx'; renderBanner('./src/content/blog/ai-coding-assistants-2026-comparison/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'AI Coding Assistants in 2026. An expired admin permission should return 403, but a timestamp-unit bug returns 200. Compare the evidence behind the patch.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const label = (text: string, size: number, color = c.textPrimary, mono = false) =>
        TextLabel({ c, text, fontSize: size, color, mono })
    return Scene({
        c, background: c.bg, padding: 48, contentWidth: 1104, gap: 0,
        children: Column({ gap: 0, children: [
            label('AI Coding Assistants in 2026', 48),
            React.createElement('div', { style: { display: 'flex', height: 30 } }),
            label('Cursor · Codex · Copilot · Claude Code', 24, c.textSecondary),
            React.createElement('div', { style: { display: 'flex', height: 50 } }),
            label('REQUEST: EXPIRED ADMIN PERMISSION', 19, c.textSecondary, true),
            React.createElement('div', { style: { display: 'flex', height: 22 } }),
            Row({ gap: 60, children: [
                Column({ gap: 6, children: [
                    label('EXPECTED', 18, c.textSecondary, true),
                    label('403', 104, c.positiveLight),
                    label('Access denied', 27),
                ] }),
                React.createElement('div', { style: { display: 'flex', width: 2, height: 177, background: c.border, marginLeft: 70, marginRight: 20 } }),
                Column({ gap: 6, children: [
                    label('UNIT-MISMATCH BUG', 18, c.textSecondary, true),
                    label('200', 104, c.warningLight),
                    label('Access granted', 27),
                ] }),
            ] }),
            React.createElement('div', { style: { display: 'flex', height: 40 } }),
            Row({ justify: 'space-between', width: 1104, children: [
                label('Compare the evidence behind the patch.', 25, c.textSecondary),
                label('LeetLLM', 25, c.primaryLight),
            ] }),
        ] }),
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
