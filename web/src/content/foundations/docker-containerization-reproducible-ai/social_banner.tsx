import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/docker-containerization-reproducible-ai/social_banner.tsx'; renderBanner('./src/content/foundations/docker-containerization-reproducible-ai/social_banner.png').then(console.log)"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Docker for Reproducible AI. A reusable image packages Python, dependencies, the scorer, and a tiny fixture. Docker run creates a container that runs the scorer as appuser. A read-only host eval mount enters the container at /app/eval, not the image. The --rm option removes the exited container, not the image.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#a78bfa' : '#6d28d9'
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const green = theme === 'dark' ? '#34d399' : '#047857'
    const label = (text: string, left: number, top: number, boxWidth: number, size: number, color = c.textPrimary, weight = 600) =>
        React.createElement('div', { key: text, style: {
            position: 'absolute', left, top, width: boxWidth, display: 'flex',
            fontFamily: 'Inter', fontSize: size, fontWeight: weight,
            lineHeight: 1.2, color,
        } }, text)
    return Scene({
        c, background: c.bg, padding: 54, gap: 0, contentWidth: 1092,
        children: React.createElement('div', { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Docker for Reproducible AI', 0, 0, 1092, 52, c.textPrimary, 750),
            label('Package the runtime. Supply changing data at run time.', 0, 77, 1092, 26, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 500, viewBox: '0 0 1092 500', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 0, y: 160, width: 364, height: 238, rx: 18, fill: c.bgCard, stroke: purple, strokeWidth: 2 }),
                React.createElement('line', { x1: 28, y1: 220, x2: 336, y2: 220, stroke: purple, strokeOpacity: 0.45 }),
                React.createElement('line', { x1: 389, y1: 279, x2: 566, y2: 279, stroke: cyan, strokeWidth: 3 }),
                React.createElement('path', { d: 'M 557 272 L 570 279 L 557 286', fill: 'none', stroke: cyan, strokeWidth: 3 }),
                React.createElement('rect', { x: 596, y: 160, width: 496, height: 238, rx: 18, fill: c.bgCard, stroke: cyan, strokeWidth: 2 }),
                React.createElement('rect', { x: 624, y: 325, width: 440, height: 49, rx: 8, fill: c.bg, stroke: green, strokeWidth: 1.5 }),
                React.createElement('rect', { x: 624, y: 451, width: 440, height: 49, rx: 8, fill: c.bgCard, stroke: green, strokeWidth: 1.5 }),
                React.createElement('line', { x1: 658, y1: 448, x2: 658, y2: 407, stroke: green, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 651 416 L 658 403 L 665 416', fill: 'none', stroke: green, strokeWidth: 2.5 }),
            ),
            label('REUSABLE IMAGE', 28, 181, 308, 20, purple, 750),
            label('Python + dependencies', 28, 242, 310, 25),
            label('scorer + tiny fixture', 28, 296, 310, 25),
            label('access-rag:local', 28, 354, 310, 19, c.textSecondary),
            label('docker run', 402, 237, 170, 22, cyan),
            label('--rm', 445, 295, 100, 20, c.textSecondary),
            label('CONTAINER · ONE RUN', 624, 181, 440, 20, cyan, 750),
            label('appuser runs the scorer', 624, 243, 440, 28),
            label('/app/eval', 650, 335, 390, 24, green),
            label('read-only bind mount', 686, 414, 360, 21, green),
            label('host eval data', 650, 461, 390, 24),
            label('--rm removes the container,', 0, 432, 590, 24, c.textSecondary),
            label('not the image.', 0, 465, 530, 24, c.textSecondary),
            label('LeetLLM', 968, 18, 124, 24, purple, 700),
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
