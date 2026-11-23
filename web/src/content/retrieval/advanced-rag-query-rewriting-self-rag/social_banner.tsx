import React from 'react'
import { Column, Flow, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Advanced RAG: HyDE and Self-RAG. HyDE turns a question into a search proxy and retrieves passages. Self-RAG retrieves, generates a segment, and critiques the segment. Retrieved passages supply answer evidence; proxies guide search and model judgments guide review.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = { ...getThemeColors(theme), preset: 'engineering' as const, shadow: 'transparent' }
    const lightInk = getThemeColors('light', 'engineering')
    const flowColors = { ...c, textPrimary: lightInk.textPrimary, textSecondary: lightInk.textSecondary, textMuted: lightInk.textSecondary }
    const label = (text: string, size: number, color = c.textPrimary) => React.createElement('div', {
        style: { display: 'flex', fontSize: size, fontWeight: 650, color, fontFamily: 'Inter', lineHeight: 1.2 },
    }, text)
    return Scene({ c, background: c.bg, padding: 48, contentWidth: 1104, gap: 0,
        children: Column({ gap: 60, children: [
            label('Advanced RAG: HyDE & Self-RAG', 45),
            Column({ gap: 12, children: [
                label('HyDE changes the search vector', 23, c.textSecondary),
                Flow({ c: flowColors, connectorTone: 'cyan', connectorLength: 46, gap: 10, stages: [
                    { title: 'Question', subtitle: 'Throughput increase?', tone: 'cyan', width: 310, minHeight: 88 },
                    { title: 'Search proxy', subtitle: 'Hypothetical policy', tone: 'purple', width: 310, minHeight: 88 },
                    { title: 'Real passages', subtitle: 'Retrieved source text', tone: 'green', width: 310, minHeight: 88 },
                ] }),
            ] }),
            Column({ gap: 12, children: [
                label('Self-RAG controls generation', 23, c.textSecondary),
                Flow({ c: flowColors, connectorTone: 'cyan', connectorLength: 46, gap: 10, stages: [
                    { title: 'Retrieve', subtitle: 'When evidence is needed', tone: 'cyan', width: 310, minHeight: 88 },
                    { title: 'Generate', subtitle: 'Passage-based segments', tone: 'purple', width: 310, minHeight: 88 },
                    { title: 'Critique', subtitle: 'Rank continuation branches', tone: 'green', width: 310, minHeight: 88 },
                ] }),
            ] }),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', width: 1104 } },
                label('Check claims against retrieved passages.', 22, c.textSecondary), label('LeetLLM', 25, c.primary)),
        ] }),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Incorrect banner dimensions')
    return result
}
export default create('dark')
