import React from 'react'
import { Column, FlowArrow, Panel, Row, Scene, getReadableToneColor, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Human-in-the-Loop Agents. Review locks one exact proposal. A guarded worker requires deployment revision 41 before changing shadow traffic to a 25 percent canary. Verify that the authorized change took effect. LeetLLM.'

export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'), shadow: 'transparent' }
    const text = (value: string, size: number, color = c.textPrimary) => React.createElement('div', {
        style: { display: 'flex', fontFamily: 'Inter', fontSize: size, fontWeight: 600, lineHeight: 1.2, color },
    }, value)
    return Scene({ c, background: c.bg, padding: 50, contentWidth: 1100,
        children: Column({ gap: 34, children: [
            text('Human-in-the-Loop Agents', 48),
            text('Approve the exact proposal. Guard the eventual write.', 25, c.textSecondary),
            Row({ gap: 22, align: 'center', children: [
                Panel({ c, width: 490, padding: 28, title: 'Human review', shadow: false,
                    children: Column({ gap: 16, children: [
                        text('shadow → 25% canary', 28, getReadableToneColor('purple', c)),
                        text('Approval v3 • scoped reviewer', 20),
                        text('Exact arguments + expiry', 20, c.textSecondary),
                    ] }),
                }),
                FlowArrow({ c, direction: 'right', length: 52 }),
                Panel({ c, width: 490, padding: 28, title: 'Guarded execution', shadow: false,
                    children: Column({ gap: 16, children: [
                        text('write only if revision = 41', 26, getReadableToneColor('cyan', c)),
                        text('Same operation key on retry', 20),
                        text('Verify that the change took effect', 20, c.textSecondary),
                    ] }),
                }),
            ] }),
            text('Authorized ≠ executed', 35, getReadableToneColor('purple', c)),
            Row({ width: 1100, justify: 'space-between', children: [
                text('Durable state. Bounded authority.', 21, c.textSecondary),
                text('LeetLLM', 25, getReadableToneColor('purple', c)),
            ] }),
        ] }),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme',
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner size')
    return result
}
export default create('dark')
