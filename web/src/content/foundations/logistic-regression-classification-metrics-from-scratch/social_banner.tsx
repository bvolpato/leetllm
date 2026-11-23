import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Logistic Regression and Metrics. The same eight validation sigmoid scores are plotted in actual required-review and no-review lanes. Review is selected when p is at least the threshold. Moving the threshold from 0.50 to 0.20 catches V8, a required review at 0.244, but also adds unnecessary review V6 at 0.325. With a 120-dollar missed-error cost and 18-dollar unnecessary-review cost, total validation cost changes from 138 dollars to 36 dollars.'

const rows = [
    { p: 0.061, y: 0 },
    { p: 0.169, y: 0 },
    { p: 0.595, y: 1 },
    { p: 0.624, y: 0 },
    { p: 0.971, y: 1 },
    { p: 0.325, y: 0 },
    { p: 0.99, y: 1 },
    { p: 0.244, y: 1 },
]

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const amber = theme === 'dark' ? '#fbbf24' : '#a16207'
    const purple = theme === 'dark' ? '#c4b5fd' : '#7c3aed'
    const px = (p: number) => 182 + 591 * p
    const label = (
        text: string,
        left: number,
        top: number,
        boxWidth: number,
        size: number,
        color = c.textPrimary,
        weight = 600,
        center = false,
    ) =>
        React.createElement(
            'div',
            {
                key: `${text}-${left}-${top}`,
                style: {
                    position: 'absolute',
                    left,
                    top,
                    width: boxWidth,
                    display: 'flex',
                    justifyContent: center ? 'center' : 'flex-start',
                    fontFamily: 'Inter',
                    fontSize: size,
                    fontWeight: weight,
                    lineHeight: 1.15,
                    color,
                },
            },
            text,
        )
    return Scene({
        c,
        background: c.bg,
        padding: 54,
        gap: 0,
        contentWidth: 1092,
        children: React.createElement(
            'div',
            { style: { position: 'relative', display: 'flex', width: 1092, height: 522 } },
            label('Logistic Regression and Metrics', 0, 0, 1092, 49, c.textPrimary, 750),
            label(
                'Review when p ≥ t. A new threshold does not refit the model.',
                0,
                80,
                1092,
                28,
                c.textSecondary,
            ),
            label('Actual outcome', 0, 155, 250, 23, c.textSecondary),
            label('Validation cost', 828, 155, 264, 26, c.textPrimary, 700),
            React.createElement(
                'svg',
                {
                    width: 1092,
                    height: 438,
                    viewBox: '0 0 1092 438',
                    style: { position: 'absolute', left: 0, top: 0 },
                },
                React.createElement('rect', {
                    x: px(0.2),
                    y: 219,
                    width: px(0.5) - px(0.2),
                    height: 188,
                    fill: cyan,
                    fillOpacity: 0.1,
                }),
                ...[0, 0.2, 0.5, 0.8, 1].map((p) =>
                    React.createElement('line', {
                        key: `tick-${p}`,
                        x1: px(p),
                        x2: px(p),
                        y1: 219,
                        y2: 411,
                        stroke: c.border,
                        strokeWidth: 1,
                    }),
                ),
                ...[265, 365].map((y) =>
                    React.createElement('line', {
                        key: `lane-${y}`,
                        x1: px(0),
                        x2: px(1),
                        y1: y,
                        y2: y,
                        stroke: c.border,
                        strokeWidth: 1.5,
                    }),
                ),
                ...[0.2, 0.5].map((p) =>
                    React.createElement('line', {
                        key: `threshold-${p}`,
                        x1: px(p),
                        x2: px(p),
                        y1: 214,
                        y2: 413,
                        stroke: p === 0.2 ? cyan : purple,
                        strokeWidth: 2.5,
                        strokeDasharray: '7 5',
                    }),
                ),
                ...rows.map((row, i) =>
                    React.createElement('circle', {
                        key: `score-${i}`,
                        cx: px(row.p),
                        cy: row.y === 1 ? 265 : 365,
                        r: 5,
                        fill: row.y === 1 ? cyan : amber,
                    }),
                ),
            ),
            label('Needs', 0, 241, 174, 26, cyan, 700),
            label('review', 0, 272, 174, 26, cyan, 700),
            label('No review', 0, 341, 174, 25, amber, 700),
            label('needed', 0, 372, 174, 25, amber, 700),
            label('t = 0.20', px(0.2) - 63, 188, 126, 24, cyan, 700, true),
            label('t = 0.50', px(0.5) - 63, 188, 126, 24, purple, 700, true),
            label('V8', px(0.244) - 22, 280, 75, 23, cyan, 700),
            label('V6', px(0.325) - 22, 379, 75, 23, amber, 700),
            ...[0, 0.2, 0.5, 0.8, 1].map((p) =>
                label(p.toFixed(1), px(p) - 28, 422, 56, 21, c.textSecondary, 500, true),
            ),
            label('Sigmoid score p', 182, 451, 591, 22, c.textSecondary, 600, true),
            label('t = 0.50', 828, 214, 264, 25, purple, 700),
            label('$138', 828, 250, 264, 40, c.textPrimary, 750),
            label('1 miss + 1 extra review', 828, 300, 264, 21, c.textSecondary),
            label('t = 0.20', 828, 347, 264, 25, cyan, 700),
            label('$36', 828, 383, 264, 40, c.textPrimary, 750),
            label('0 misses + 2 extra reviews', 828, 433, 264, 20, c.textSecondary),
            label(
                'Missed review: $120 · Unnecessary review: $18',
                0,
                491,
                920,
                26,
                c.textPrimary,
                650,
            ),
            label(
                'One model. The cutoff changes which responses are selected.',
                0,
                526,
                920,
                22,
                c.textSecondary,
            ),
            label('LeetLLM', 932, 514, 160, 30, c.textPrimary, 750),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    const result = await renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error(`Unexpected banner size: ${result.pixelWidth}x${result.pixelHeight}`)
    }
    return result
}

export default create('dark')
