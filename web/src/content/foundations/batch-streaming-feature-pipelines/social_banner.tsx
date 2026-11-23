import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt = 'Batch and Streaming Feature Pipelines. Event history feeds two execution paths under the same versioned job_sla_features_v1 definition. Batch replay uses each prediction row cutoff, admitting only information whose event and availability times are no later than that cutoff, and produces historical training rows. A stream updater processes arrivals to maintain online state, read at scoring time. Latest online state is not a historical replay.'

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
            label('Batch and Streaming Feature Pipelines', 0, 0, 1092, 45, c.textPrimary, 750),
            label('Shared feature meaning. A separate cutoff for every replay row.', 0, 79, 1092, 28, c.textSecondary),
            React.createElement('svg', { width: 1092, height: 475, viewBox: '0 0 1092 475', style: { position: 'absolute', left: 0, top: 0 } },
                React.createElement('rect', { x: 363, y: 142, width: 390, height: 332, rx: 12, fill: 'none', stroke: c.textSecondary, strokeWidth: 1.5, strokeDasharray: '7 6' }),
                React.createElement('rect', { x: 0, y: 255, width: 250, height: 109, rx: 10, fill: c.bgCard, stroke: c.textPrimary, strokeWidth: 1.5 }),
                React.createElement('rect', { x: 396, y: 198, width: 325, height: 128, rx: 10, fill: c.bgCard, stroke: cyan, strokeWidth: 2 }),
                React.createElement('rect', { x: 396, y: 359, width: 325, height: 104, rx: 10, fill: c.bgCard, stroke: purple, strokeWidth: 2 }),
                React.createElement('rect', { x: 846, y: 198, width: 246, height: 128, rx: 10, fill: c.bgCard, stroke: cyan, strokeWidth: 2 }),
                React.createElement('rect', { x: 846, y: 359, width: 246, height: 104, rx: 10, fill: c.bgCard, stroke: purple, strokeWidth: 2 }),
                React.createElement('path', { d: 'M 250 309 L 302 309 L 302 261 L 383 261 M 373 253 L 383 261 L 373 269', fill: 'none', stroke: cyan, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 250 309 L 302 309 L 302 411 L 383 411 M 373 403 L 383 411 L 373 419', fill: 'none', stroke: purple, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 733 261 L 833 261 M 823 253 L 833 261 L 823 269', fill: 'none', stroke: cyan, strokeWidth: 2.5 }),
                React.createElement('path', { d: 'M 733 411 L 833 411 M 823 403 L 833 411 L 823 419', fill: 'none', stroke: purple, strokeWidth: 2.5 }),
            ),
            label('job_sla_features_v1', 363, 156, 390, 26, c.textPrimary, 700, true),
            label('Event history', 0, 273, 250, 29, c.textPrimary, 750, true),
            label('events + availability', 0, 322, 250, 21, c.textSecondary, 600, true),
            label('Batch replay', 396, 211, 325, 30, cyan, 750, true),
            label('event time ≤ row cutoff', 396, 256, 325, 23, c.textPrimary, 600, true),
            label('available time ≤ cutoff', 396, 291, 325, 23, c.textPrimary, 600, true),
            label('Training rows', 846, 222, 246, 28, cyan, 750, true),
            label('historical snapshots', 846, 278, 246, 21, c.textPrimary, 600, true),
            label('Stream updater', 396, 376, 325, 30, purple, 750, true),
            label('process arriving events', 396, 422, 325, 23, c.textPrimary, 600, true),
            label('Online state', 846, 376, 246, 28, purple, 750, true),
            label('read at scoring time', 846, 422, 246, 21, c.textPrimary, 600, true),
            label('Latest online state is not a historical replay.', 0, 498, 920, 27, c.textSecondary),
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
