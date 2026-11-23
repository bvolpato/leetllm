import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Build GPT from Scratch Lab. A four-position causal mask permits each query to read only its prefix. Highlighted query 2 reads Good, sir, and comma to predict the following newline. LeetLLM.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const text = (value: string, size: number, color = c.textPrimary) =>
        React.createElement('div', { style: { display: 'flex', fontSize: size, fontWeight: 650, color } }, value)
    const cell = (value: string, allowed: boolean, highlighted: boolean, key: string) =>
        React.createElement('div', { key, style: {
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 78, height: 52, fontSize: 23, fontFamily: 'JetBrains Mono',
            color: c.textPrimary, backgroundColor: allowed ? highlighted ? `${c.info}44` : `${c.primary}22` : c.bg,
            border: `2px solid ${highlighted && allowed ? c.info : c.border}`, borderRadius: 4,
        } }, value)
    return Scene({
        c, background: c.bg, padding: 50, contentWidth: 1100,
        children: React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 36, height: 530 } },
            text('Build GPT from Scratch Lab', 49),
            React.createElement('div', { style: { display: 'flex', gap: 64, alignItems: 'center' } },
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                    text('Keys in the input window', 20, c.textSecondary),
                    React.createElement('div', { style: { display: 'flex', gap: 8, marginLeft: 90 } },
                        ...['Good', ' sir', ',', '\\n'].map((token) => React.createElement('div', { key: token, style: { display: 'flex', justifyContent: 'center', width: 78, fontSize: 21, color: c.textPrimary } }, token))),
                    ...[0, 1, 2, 3].map((row) => React.createElement('div', { key: row, style: { display: 'flex', gap: 8, alignItems: 'center' } },
                        React.createElement('div', { style: { display: 'flex', width: 82, fontSize: 18, color: row === 2 ? c.info : c.textSecondary } }, `query ${row}`),
                        ...[0, 1, 2, 3].map((col) => cell(col <= row ? '1' : '0', col <= row, row === 2, `${row}-${col}`)),
                    )),
                ),
                React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 22, width: 530 } },
                    text('At query 2', 26, c.info),
                    text('Read: Good sir,', 34),
                    text('Predict: newline', 34),
                    text('The target stays hidden.', 25, c.textSecondary),
                ),
            ),
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 } },
                text('1 = visible key · 0 = masked future', 20, c.textSecondary),
                text('LeetLLM', 28, c.primary),
            ),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner size')
    return result
}

export default create('dark')
