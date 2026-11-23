import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Qwen3.5 Ollama Guide Is Retired. An archived local-run record lists a model tag, digest, context, and timings beside the replacement Qwen3.6 GGUF setup.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const muted = c.textSecondary
    const accent = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    return Scene({
        c, background: c.bg, padding: 52, gap: 30, contentWidth: 1096,
        children: React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column', gap: 28, width: 1096, height: 526, fontFamily: 'Inter' },
        },
        React.createElement('div', { style: { display: 'flex', color: accent, fontSize: 18, fontWeight: 700, letterSpacing: 2 } }, 'ARCHIVED LOCAL SETUP'),
        React.createElement('div', { style: { display: 'flex', color: c.textPrimary, fontSize: 48, lineHeight: 1.15, fontWeight: 750 } }, 'Qwen3.5 Ollama Guide Is Retired'),
        React.createElement('div', { style: { display: 'flex', gap: 42, marginTop: 12, alignItems: 'center' } },
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 19, width: 524, padding: 28, border: `2px solid ${c.border}`, borderRadius: 14, background: c.bgCard } },
                React.createElement('div', { style: { display: 'flex', fontSize: 19, color: muted, letterSpacing: 1 } }, 'KEEP THE BASELINE RECORD'),
                ...['qwen3.5:9b-q4_K_M', 'digest  /  context', 'placement  /  timings'].map((line, i) =>
                    React.createElement('div', { key: line, style: { display: 'flex', fontSize: i === 0 ? 27 : 24, color: i === 0 ? c.textPrimary : muted, fontFamily: 'JetBrains Mono' } }, line)),
            ),
            React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 18, width: 490 } },
                React.createElement('div', { style: { display: 'flex', fontSize: 18, color: accent, letterSpacing: 1.5, fontWeight: 700 } }, 'REPLACEMENT SETUP'),
                React.createElement('div', { style: { display: 'flex', fontSize: 39, color: c.textPrimary, fontWeight: 700 } }, 'Qwen3.6 + GGUF'),
                React.createElement('div', { style: { display: 'flex', fontSize: 24, lineHeight: 1.35, color: muted } }, 'Compare on the same tasks before migrating.'),
            ),
        ),
        React.createElement('div', { style: { display: 'flex', marginTop: 'auto', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('div', { style: { display: 'flex', color: muted, fontSize: 18 } }, 'LeetLLM retired this guide for editorial reasons; check Ollama for current support.'),
            React.createElement('div', { style: { display: 'flex', color: accent, fontSize: 26, fontWeight: 750 } }, 'LeetLLM'),
        )),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Banner dimensions changed')
    return result
}

export default create('dark')
