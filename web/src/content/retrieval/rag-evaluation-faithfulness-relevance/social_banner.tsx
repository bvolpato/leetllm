import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/retrieval/rag-evaluation-faithfulness-relevance/social_banner.tsx'; renderBanner('./src/content/retrieval/rag-evaluation-faithfulness-relevance/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'RAG Evaluation for Reliable Answers. A complete answer has three supported claims; a partial answer has two supported claims and one omitted requirement. Both have perfect faithfulness, but only the complete answer covers all three required points.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const label = (text: string, left: number, top: number, w: number, size: number, color = c.textPrimary) => React.createElement('div', {
        key: text, style: { display: 'flex', position: 'absolute', left, top, width: w, fontSize: size, lineHeight: 1.15, fontWeight: 600, fontFamily: 'Inter', color },
    }, text)
    return Scene({ c, background: c.bg, padding: 48, gap: 0,
        children: React.createElement('div', { style: { display: 'flex', position: 'relative', width: 1104, height: 534 } },
            label('RAG Evaluation for Reliable Answers', 0, 0, 1080, 47),
            label('All extracted claims supported by context: is the answer complete?', 0, 123, 1080, 27, c.textSecondary),
            label('COMPLETE', 0, 236, 230, 24, cyan),
            label('PARTIAL', 0, 346, 230, 24, purple),
            ...[0, 1].flatMap(row => ['Scope', 'Approval', 'Rollback'].map((point, col) => React.createElement('div', {
                key: `${row}-${col}`, style: {
                    display: 'flex', position: 'absolute', left: 248 + col * 230, top: 211 + row * 110,
                    width: 210, height: 72, justifyContent: 'center', alignItems: 'center', fontSize: 24,
                    border: `2px ${row === 1 && col === 2 ? 'dashed' : 'solid'} ${row === 1 && col === 2 ? c.textMuted : cyan}`,
                    color: row === 1 && col === 2 ? c.textMuted : cyan,
                } }, row === 1 && col === 2 ? 'Omitted' : point))),
            label('3/3', 964, 234, 120, 32, cyan),
            label('2/3', 964, 344, 120, 32, purple),
            label('Completeness', 930, 179, 174, 20, c.textSecondary),
            label('Perfect faithfulness can still leave a task unfinished.', 0, 445, 1060, 25, c.textSecondary),
            label('LeetLLM', 956, 502, 148, 25, purple),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Incorrect banner dimensions')
    return result
}
export default create()
