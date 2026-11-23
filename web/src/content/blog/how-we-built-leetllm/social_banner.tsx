import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'How We Built LeetLLM. Two source-of-truth paths meet in the Next.js application. Canonical content comes from Git bundles containing Markdown and figure source, through the build and loader to pages and theme PNGs. Personal study state comes from Supabase progress and notes through queries scoped to the authenticated user. Shared content artifacts contain canonical content; user study state stays in scoped Supabase queries.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const purple = theme === 'dark' ? '#c4b5fd' : '#7c3aed'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600, center = false) =>
        React.createElement('div', { key: `${text}-${left}-${top}`, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            justifyContent: center ? 'center' : 'flex-start', fontFamily: 'Inter',
            fontSize: size, fontWeight: weight, lineHeight: 1.15, color,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('How We Built LeetLLM', 0, 0, 1092, 54, c.textPrimary, 750),
            label('One application. Two sources of truth.', 0, 82, 1092, 31, c.textSecondary),
            label('CANONICAL CONTENT', 0, 145, 740, 23, cyan, 700),
            label('PERSONAL STUDY STATE', 0, 325, 740, 23, purple, 700),
            React.createElement('svg', { width: 1092, height: 464, viewBox: '0 0 1092 464', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 0, y: 184, width: 315, height: 109, rx: 10, fill: c.bgCard, stroke: cyan, strokeWidth: 2 }),
                React.createElement('rect', { x: 423, y: 184, width: 309, height: 109, rx: 10, fill: c.bgCard, stroke: cyan, strokeWidth: 2 }),
                React.createElement('rect', { x: 0, y: 364, width: 315, height: 99, rx: 10, fill: c.bgCard, stroke: purple, strokeWidth: 2 }),
                React.createElement('rect', { x: 423, y: 364, width: 309, height: 99, rx: 10, fill: c.bgCard, stroke: purple, strokeWidth: 2 }),
                React.createElement('rect', { x: 867, y: 251, width: 225, height: 145, rx: 12, fill: c.bgCard, stroke: c.textPrimary, strokeWidth: 2 }),
                React.createElement('path', { d: 'M 331 239 L 407 239 M 397 231 L 407 239 L 397 247 M 748 239 L 795 239 L 795 288 L 851 288 M 841 280 L 851 288 L 841 296', fill: 'none', stroke: cyan, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 331 414 L 407 414 M 397 406 L 407 414 L 397 422 M 748 414 L 795 414 L 795 358 L 851 358 M 841 350 L 851 358 L 841 366', fill: 'none', stroke: purple, strokeWidth: 2.5 }),
            ),
            label('Git bundles', 0, 204, 315, 31, cyan, 750, true),
            label('Markdown · figure source', 0, 253, 315, 22, c.textPrimary, 600, true),
            label('Build + loader', 423, 204, 309, 31, cyan, 750, true),
            label('pages + theme PNGs', 423, 253, 309, 23, c.textPrimary, 600, true),
            label('Supabase', 0, 382, 315, 31, purple, 750, true),
            label('progress · notes', 0, 427, 315, 23, c.textPrimary, 600, true),
            label('Scoped queries', 423, 382, 309, 30, purple, 750, true),
            label('authenticated user', 423, 427, 309, 23, c.textPrimary, 600, true),
            label('Next.js', 867, 270, 225, 35, c.textPrimary, 750, true),
            label('reading +', 867, 322, 225, 25, c.textPrimary, 600, true),
            label('account UI', 867, 356, 225, 25, c.textPrimary, 600, true),
            label('User state stays out of the shared content artifact.', 0, 498, 920, 26, c.textSecondary),
            label('LeetLLM', 932, 490, 160, 30, c.textPrimary, 750),
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
