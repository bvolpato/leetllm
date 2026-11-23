import React from 'react'
import { Scene, Row, TextLabel, getThemeColors, getToneColor, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/fundamentals/tokenization-bpe-wordpiece-sentencepiece/social_banner.tsx'; renderBanner('./src/content/fundamentals/tokenization-bpe-wordpiece-sentencepiece/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'BPE, WordPiece, and SentencePiece. The example text prompt cache failed unexpectedly is split into seven pieces, each aligned above its model-local token ID. Dots stand for spaces.'

const pieces = [
    { text: 'prompt', id: 10137, width: 145 },
    { text: '·cache', id: 12190, width: 145 },
    { text: '·failed', id: 3098, width: 150 },
    { text: '·un', id: 77, width: 105 },
    { text: 'expect', id: 6152, width: 140 },
    { text: 'ed', id: 302, width: 95 },
    { text: 'ly', id: 119, width: 95 },
]

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    return Scene({ c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092, children:
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', width: 1092, height: 522, gap: 26 } },
            React.createElement(TextLabel, { c, text: 'BPE, WordPiece, and SentencePiece', fontSize: 48, fontWeight: 750, color: c.textPrimary }),
            React.createElement(TextLabel, { c, text: 'prompt cache failed unexpectedly', mono: true, fontSize: 30, color: c.textPrimary }),
            React.createElement(TextLabel, { c, text: 'EXAMPLE SPLIT · DOTS REPRESENT SPACES', fontSize: 18, color: c.textSecondary }),
            Row({ width: '100%', justify: 'start', gap: 12, children: pieces.map((piece, index) =>
                React.createElement('div', { key: piece.id, style: { display: 'flex', flexDirection: 'column', width: piece.width, gap: 16 } },
                    React.createElement('div', { style: {
                        display: 'flex', justifyContent: 'center', alignItems: 'center', height: 72,
                        border: `2px solid ${getToneColor(index < 3 ? 'purple' : 'cyan', c)}`,
                        borderRadius: 6, backgroundColor: c.bgCard, color: c.textPrimary,
                        fontFamily: c.fontMono, fontSize: 27,
                    } }, piece.text),
                    React.createElement(TextLabel, { c, text: String(piece.id), mono: true, fontSize: 26, width: piece.width, align: 'center', color: c.textPrimary }),
                ),
            ) }),
            React.createElement(TextLabel, { c, text: 'Integer IDs. Each integer selects one learned embedding row.', fontSize: 23, color: c.textSecondary }),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' } },
                React.createElement(TextLabel, { c, text: 'LeetLLM', fontSize: 26, fontWeight: 700, color: getToneColor('purple', c) }),
            ),
        ),
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
