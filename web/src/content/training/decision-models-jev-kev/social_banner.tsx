import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput, type ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Decision Models: Jev and Kev. An illustrative state and question feed three scored options; the reviewed label B is highlighted as the training target.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const cyan = theme === 'dark' ? '#22d3ee' : '#087e99'
    const green = theme === 'dark' ? '#4ade80' : '#15803d'
    const muted = theme === 'dark' ? '#94a3b8' : '#475569'
    const options = [
        { letter: 'A', name: 'test regression', score: '0.665', color: c.critical, target: false },
        { letter: 'B', name: 'registry authentication', score: '0.245', color: green, target: true },
        { letter: 'C', name: 'insufficient evidence', score: '0.090', color: muted, target: false },
    ]
    const label = (value: string, top: number, size: number, color: string, weight = 600) =>
        React.createElement('div', { style: { position: 'absolute', left: 0, top, color, fontFamily: c.fontSans, fontSize: size, fontWeight: weight, lineHeight: 1.12 } }, value)
    return Scene({
        c,
        padding: 54,
        gap: 0,
        contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('DECISION MODELS', 0, 18, cyan, 750),
            label('Jev, Kev, and the scored choice', 48, 46, c.textPrimary, 750),
            label('From labeled state to an option distribution', 110, 24, muted, 500),
            React.createElement('div', { style: { position: 'absolute', display: 'flex', flexDirection: 'column', left: 0, top: 188, width: 335, padding: 22, borderRadius: 14, border: `2px solid ${cyan}`, backgroundColor: c.bgCard, fontFamily: c.fontSans } },
                React.createElement('div', { style: { color: cyan, fontSize: 17, fontWeight: 700 } }, 'STATE + QUESTION'),
                React.createElement('div', { style: { color: c.textPrimary, fontSize: 25, fontWeight: 700, marginTop: 14 } }, 'Telemetry: registry 401'),
                React.createElement('div', { style: { color: muted, fontSize: 18, marginTop: 10 } }, 'What should triage inspect?')),
            React.createElement('div', { style: { position: 'absolute', left: 362, top: 250, color: cyan, fontFamily: c.fontSans, fontSize: 40, fontWeight: 700 } }, '→'),
            React.createElement('div', { style: { position: 'absolute', display: 'flex', flexDirection: 'column', left: 438, top: 184, width: 654, fontFamily: c.fontSans } },
                ...options.map(({ letter, name, score, color, target }) => React.createElement('div', { key: letter, style: {
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    height: 76, padding: '0 21px', marginBottom: 11, borderRadius: 10,
                    border: `2px solid ${color}`, backgroundColor: c.bgCard,
                    color: c.textPrimary, fontSize: 20,
                } },
                React.createElement('span', { style: { fontWeight: 700 } }, `${letter}  ${name}`),
                React.createElement('span', { style: { color, fontWeight: 750 } }, `${score}${target ? '  TARGET' : ''}`))),
            ),
            label('Illustrative logits [2, 1, 0]  ·  train toward reviewed answer B', 462, 19, muted, 500),
            React.createElement('div', { style: { position: 'absolute', right: 0, top: 482, color: cyan, fontFamily: c.fontSans, fontSize: 23, fontWeight: 750 } }, 'LeetLLM'),
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
