import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Context Engineering: Beyond Prompting. Separate a cacheable prefix (system instructions and tool schemas) from dynamic per-turn evidence, compacted state, and prompt-injection isolation.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const box = (heading: string, sub: string, detail: string) =>
        React.createElement(
            'div',
            {
                key: heading,
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    width: 524,
                    padding: 28,
                    border: `2px solid ${c.border}`,
                    background: c.bgCard,
                    borderRadius: 14,
                    gap: 16,
                },
            },
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 24, fontWeight: 700, color: c.textSecondary } },
                heading,
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 32, fontWeight: 700, color: c.textPrimary } },
                sub,
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 22, color: c.textSecondary, lineHeight: 1.35 } },
                detail,
            ),
        )

    return Scene({
        c,
        background: c.bg,
        padding: 54,
        gap: 0,
        contentWidth: 1092,
        children: React.createElement(
            'div',
            { style: { display: 'flex', flexDirection: 'column', width: 1092, height: 522, gap: 30 } },
            React.createElement(
                'div',
                {
                    style: {
                        display: 'flex',
                        fontSize: 46,
                        lineHeight: 1.15,
                        fontWeight: 750,
                        color: c.textPrimary,
                    },
                },
                'Context Engineering: Beyond Prompting',
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 25, color: c.textSecondary } },
                'Curate, cache, compact, and isolate every token entering inference.',
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', gap: 44 } },
                box(
                    'Stable Prefix Layer',
                    'Cacheable System + Tools',
                    'Keep system instructions and tool definitions fixed at byte zero so KV prefixes reuse across turns.',
                ),
                box(
                    'Dynamic Evidence Layer',
                    'Retrieval + Compaction',
                    'Rerank scoped chunks, place key facts at prompt edges, and mark retrieved text as untrusted data.',
                ),
            ),
            React.createElement(
                'div',
                {
                    style: {
                        display: 'flex',
                        justifyContent: 'flex-end',
                        color: c.textPrimary,
                        fontSize: 25,
                        fontWeight: 700,
                    },
                },
                'LeetLLM',
            ),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    return renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
}

export default create('dark')
