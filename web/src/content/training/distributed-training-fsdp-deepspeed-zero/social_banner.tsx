import React from 'react'
import { Column, Panel, Row, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Distributed Training: FSDP and ZeRO. Four ranks each retain only their parameter, gradient, and optimizer shard. For computation, ranks gather one block and reduce-scatter its gradients. LeetLLM.'

export function create(theme: ThemeMode = 'dark') {
    const original = getThemeColors(theme)
    const c = { ...original, shadow: 'transparent' }
    const text = (value: string, fontSize: number, color = c.textPrimary, weight = 600) => React.createElement('div', {
        style: { display: 'flex', color, fontFamily: 'Inter', fontSize, fontWeight: weight, lineHeight: 1.18 },
    }, value)
    const colors = [c.primaryLight, c.infoLight, c.positiveLight, c.warningLight]
    return Scene({ c, background: c.bg, padding: 48, contentWidth: 1104, children:
        Column({ gap: 28, children: [
            Column({ gap: 4, children: [text('Distributed Training:', 49), text('FSDP & ZeRO', 49)] }),
            text('FULL SHARDING • FOUR RANKS • ONE DISTRIBUTED MODEL', 18, c.textSecondary),
            Row({ gap: 16, children: colors.map((color, rank) => Panel({
                c, width: 264, padding: 20, title: `Rank ${rank}`, shadow: false,
                children: Column({ gap: 10, children: [
                    ...['Parameters', 'Gradients', 'Optimizer'].map((name) => React.createElement('div', {
                        key: name, style: { display: 'flex', alignItems: 'center', gap: 10, width: 222 },
                    }, React.createElement('div', { style: { display: 'flex', width: 16, height: 26, backgroundColor: color } }),
                    text(`${name} shard ${rank}`, 17))),
                ] }),
            })) }),
            text('Gather one block for compute. Reduce-scatter its gradients.', 26),
            Row({ justify: 'space-between', width: 1104, children: [
                text('Peak memory also includes activations and buffers.', 21, c.textSecondary),
                text('LeetLLM', 25, c.primaryLight),
            ] }),
        ] }),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, theme, scale: 1, crop: false, watermark: false, background: 'theme',
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
