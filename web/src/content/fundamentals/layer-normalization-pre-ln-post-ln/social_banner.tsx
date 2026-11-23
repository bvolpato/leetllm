import React from 'react'
import { ArrowMarkerDef, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Layer Normalization: Pre-LN vs Post-LN. Two labeled computational paths show Pre-LN normalizing before the sublayer while the skip bypasses it, and Post-LN normalizing after the residual addition.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const preColor = theme === 'light' ? c.positiveDark : c.positiveLight
    const postColor = theme === 'light' ? c.primaryDark : c.primaryLight
    const label = (text: string, left: number, top: number, w: number, size: number, color = c.textPrimary) => React.createElement('div', {
        key: `${text}-${top}`, style: { position: 'absolute', display: 'flex', left, top, width: w, color, fontSize: size, fontFamily: 'Inter', fontWeight: 650, lineHeight: 1.2 },
    }, text)
    const lane = (pre: boolean, top: number) => {
        const color = pre ? preColor : postColor
        const boxes = pre ? ['x', 'LN', 'F', '+', 'output'] : ['x', 'F', '+', 'LN', 'output']
        const centers = [260, 440, 620, 800, 990]
        const add = pre ? 800 : 620
        const marker = pre ? 'banner-pre' : 'banner-post'
        return React.createElement('div', { key: marker, style: { position: 'absolute', display: 'flex', left: 0, top, width: 1092, height: 142 } },
            label(pre ? 'Pre-LN' : 'Post-LN', 0, 16, 180, 30, color),
            React.createElement('svg', { width: 1092, height: 142, viewBox: '0 0 1092 142', style: { position: 'absolute', inset: 0 } },
                React.createElement('defs', null,
                    ArrowMarkerDef({ id: marker, color, size: 4 }),
                    React.cloneElement(ArrowMarkerDef({ id: `${marker}-up`, color, size: 4 }) as React.ReactElement<React.SVGProps<SVGMarkerElement>>, { orient: 270 }),
                ),
                ...centers.slice(0, -1).map((x, i) => React.createElement('line', { key: `line-${i}`, x1: x + 55, y1: 40, x2: centers[i + 1] - 60, y2: 40, stroke: color, strokeWidth: 3, markerEnd: `url(#${marker})` })),
                React.createElement('path', { d: `M 260 70 L 260 116 L ${add} 116 L ${add} 76`, fill: 'none', stroke: color, strokeWidth: 3, markerEnd: `url(#${marker}-up)` }),
            ),
            ...boxes.map((text, i) => React.createElement('div', { key: text, style: { position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', left: centers[i] - 55, top: 10, width: 110, height: 60, border: `2px solid ${color}`, borderRadius: 12, background: c.bgCard, color, fontSize: text === '+' ? 38 : 25, fontWeight: 700 } }, text)),
            label('skip', 280, 82, 100, 18, color),
        )
    }
    return Scene({ c, background: c.bg, padding: 54, contentWidth: 1092, gap: 0,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('TRANSFORMER ARCHITECTURE', 0, 0, 1092, 18, c.textSecondary),
            label('Layer Normalization', 0, 38, 1092, 55),
            label('Same operation. Different residual path.', 0, 109, 1092, 29, c.textSecondary),
            lane(true, 193), lane(false, 350),
            label('LN = LayerNorm · F = attention or feed-forward sublayer', 0, 500, 865, 17, c.textSecondary),
            label('LeetLLM', 948, 495, 144, 25, postColor),
        ),
    })
}
export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), { width, height, outputPath, scale: 1, crop: false, watermark: false, background: 'theme', theme })
    if (result.pixelWidth !== width || result.pixelHeight !== height) throw new Error('Banner must be 1200×630')
    return result
}
export default create()
