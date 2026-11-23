import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Validation and Leakage. Chronological prompt-safety evaluation: January through June training data fits preprocessing and the model. July validation data reuses that fitted transform and selects the threshold. August test data reuses the fitted transform for a locked estimate after choices are frozen. Fitted parameters flow forward only. Each cross-validation training fold runs its own independent fit.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const amber = theme === 'dark' ? '#fbbf24' : '#a16207'
    const purple = theme === 'dark' ? '#c4b5fd' : '#7c3aed'
    const columns = [
        {
            x: 0,
            color: cyan,
            time: 'January-June',
            role: 'TRAIN',
            action: 'Fit transform',
            detail: '+ fit model',
        },
        {
            x: 390,
            color: amber,
            time: 'July',
            role: 'VALIDATION',
            action: 'Reuse transform',
            detail: 'choose threshold',
        },
        {
            x: 780,
            color: purple,
            time: 'August',
            role: 'LOCKED TEST',
            action: 'Reuse transform',
            detail: 'estimate after freeze',
        },
    ]
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
            label('Validation and Leakage', 0, 0, 1092, 54, c.textPrimary, 750),
            label(
                'Split first. Training rows alone fit the preprocessing.',
                0,
                82,
                1092,
                31,
                c.textSecondary,
            ),
            React.createElement(
                'svg',
                {
                    width: 1092,
                    height: 481,
                    viewBox: '0 0 1092 481',
                    style: { position: 'absolute', left: 0, top: 0 },
                },
                ...columns.flatMap((col) => [
                    React.createElement('rect', {
                        key: `data-${col.x}`,
                        x: col.x,
                        y: 172,
                        width: 312,
                        height: 106,
                        rx: 12,
                        fill: c.bgCard,
                        stroke: col.color,
                        strokeWidth: 2,
                    }),
                    React.createElement('rect', {
                        key: `action-${col.x}`,
                        x: col.x,
                        y: 337,
                        width: 312,
                        height: 99,
                        rx: 12,
                        fill: c.bgCard,
                        stroke: col.color,
                        strokeWidth: 2,
                    }),
                    React.createElement('path', {
                        key: `input-${col.x}`,
                        d: `M ${col.x + 156} 278 L ${col.x + 156} 323 M ${col.x + 149} 313 L ${col.x + 156} 323 L ${col.x + 163} 313`,
                        fill: 'none',
                        stroke: col.color,
                        strokeWidth: 2.5,
                    }),
                ]),
                React.createElement('path', {
                    d: 'M 156 436 L 156 478 L 936 478 L 936 450 M 929 460 L 936 450 L 943 460 M 546 478 L 546 450 M 539 460 L 546 450 L 553 460',
                    fill: 'none',
                    stroke: cyan,
                    strokeWidth: 2.5,
                }),
            ),
            ...columns.flatMap((col) => [
                label(col.role, col.x, 190, 312, 24, col.color, 750, true),
                label(col.time, col.x, 236, 312, 28, c.textPrimary, 700, true),
                label('rows', col.x + 175, 292, 118, 23, c.textSecondary),
                label(col.action, col.x, 354, 312, 29, col.color, 750, true),
                label(col.detail, col.x, 401, 312, 23, c.textPrimary, 600, true),
            ]),
            label('same fitted parameters', 177, 446, 357, 25, cyan, 650),
            label('no refitting', 613, 446, 280, 25, cyan, 650),
            label('Each CV training fold needs its own fit.', 0, 517, 920, 26, c.textSecondary),
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
