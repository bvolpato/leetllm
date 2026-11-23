import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Model Versioning & Deployment. A production pointer moves from retained stable to candidate at promotion, then returns to stable at rollback. The immutable release records remain in place.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const production = c.primaryLight
    const candidate = c.secondaryLight
    const label = (text: string, left: number, top: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', {style: {position: 'absolute', left, top, display: 'flex', fontSize: size, color, fontWeight: weight, whiteSpace: 'nowrap'}}, text)
    return Scene({c, background: c.bg, padding: 48, children:
        React.createElement('div', {style: {width: 1104, height: 534, position: 'relative', display: 'flex'}},
            label('Model Versioning & Deployment', 0, 0, 48, c.textPrimary, 750),
            label('Move the pointer. Keep the release.', 0, 72, 28, c.textSecondary),
            React.createElement('svg', {width: 1104, height: 430, viewBox: '0 0 1104 430', style: {position: 'absolute', left: 0, top: 104}},
                React.createElement('line', {x1: 245, y1: 100, x2: 1060, y2: 100, stroke: c.borderLight, strokeWidth: 3, strokeDasharray: '6 8'}),
                React.createElement('line', {x1: 245, y1: 265, x2: 1060, y2: 265, stroke: c.borderLight, strokeWidth: 3, strokeDasharray: '6 8'}),
                React.createElement('path', {d: 'M 275 265 H 560 V 100 H 980 V 265 H 1060', stroke: production, strokeWidth: 8, fill: 'none', strokeLinejoin: 'round'}),
                React.createElement('path', {d: 'M 340 100 H 545', stroke: candidate, strokeWidth: 6, strokeDasharray: '10 8', fill: 'none'}),
                ...[[275, 265], [560, 100], [980, 265]].map(([cx, cy], index) => React.createElement('circle', {key: index, cx, cy, r: 10, stroke: production, strokeWidth: 5, fill: c.bg})),
            ),
            label('Candidate', 0, 185, 25, candidate),
            label('e31f2b6d7a2c…', 0, 223, 18, c.textSecondary),
            label('Retained stable', 0, 345, 25, c.textPrimary),
            label('32b8ed409b8e…', 0, 383, 18, c.textSecondary),
            label('canary', 363, 164, 22, candidate),
            label('production', 679, 164, 23, production),
            label('Register', 235, 422, 20, c.textSecondary),
            label('Promote', 517, 422, 20, c.textSecondary),
            label('Roll back', 930, 422, 20, c.textSecondary),
            label('LeetLLM', 947, 503, 25, production, 700),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width, height, outputPath, scale: 1, crop: false, watermark: false,
        background: 'theme', theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Unexpected banner dimensions')
    return result
}

export default create()
