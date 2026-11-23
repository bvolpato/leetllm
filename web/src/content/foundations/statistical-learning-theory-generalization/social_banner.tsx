import React from 'react'
import { Column, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Statistical Learning and Generalization. A 40-query evaluation with 10% observed error gives conservative upper endpoints of 31.5%, 37.4%, and 46.4% for one, ten, and one thousand prespecified candidates. None of these bounds certifies the 20% target limit.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const upper = (count: number) => 0.1 + Math.sqrt(Math.log((2 * count) / 0.05) / 80)
    return Scene({
        c,
        background: c.bg,
        padding: 40,
        contentWidth: 1120,
        gap: 16,
        children: [
            TextLabel({
                c,
                text: 'Statistical Learning and Generalization',
                fontSize: 43,
                fontWeight: 750,
                color: c.textPrimary,
                width: 1108,
            }),
            TextLabel({
                c,
                text: 'Same 10% observed error. How much search came before it?',
                fontSize: 25,
                color: c.textSecondary,
                width: 1108,
            }),
            TextLabel({
                c,
                text: '40 i.i.d. cases · bounded loss · 95% simultaneous confidence',
                fontSize: 22,
                color: c.textSecondary,
                width: 1120,
            }),
            Row({
                gap: 15,
                children: [
                    TextLabel({
                        c,
                        text: 'Candidate pool',
                        fontSize: 20,
                        color: c.textSecondary,
                        width: 240,
                        align: 'right',
                    }),
                    TextLabel({
                        c,
                        text: 'Population error risk, scale 0% to 50%',
                        fontSize: 20,
                        color: c.textSecondary,
                        width: 680,
                        align: 'center',
                    }),
                    TextLabel({
                        c,
                        text: 'Upper bound',
                        fontSize: 20,
                        color: c.textSecondary,
                        width: 120,
                        align: 'center',
                    }),
                ],
            }),
            Column({
                gap: 10,
                width: 1120,
                children: [1, 10, 1000].map((count) =>
                    Row({
                        gap: 15,
                        align: 'center',
                        children: [
                            TextLabel({
                                c,
                                text:
                                    count === 1
                                        ? '1 fixed predictor'
                                        : `${count.toLocaleString('en-US')} candidates`,
                                fontSize: 24,
                                color: c.textPrimary,
                                width: 240,
                                align: 'right',
                            }),
                            React.createElement(
                                'svg',
                                { width: 680, height: 60, viewBox: '0 0 680 60' },
                                React.createElement('line', {
                                    x1: 0,
                                    x2: 680,
                                    y1: 30,
                                    y2: 30,
                                    stroke: c.borderLight,
                                    strokeWidth: 2,
                                }),
                                React.createElement('line', {
                                    x1: 272,
                                    x2: 272,
                                    y1: 3,
                                    y2: 57,
                                    stroke: c.warning,
                                    strokeWidth: 2,
                                    strokeDasharray: '5 4',
                                }),
                                React.createElement('line', {
                                    x1: 4,
                                    x2: (upper(count) / 0.5) * 680,
                                    y1: 30,
                                    y2: 30,
                                    stroke: c.primary,
                                    strokeWidth: 10,
                                    strokeLinecap: 'round',
                                }),
                                React.createElement('circle', {
                                    cx: 136,
                                    cy: 30,
                                    r: 10,
                                    fill: c.bg,
                                    stroke: c.primary,
                                    strokeWidth: 4,
                                }),
                            ),
                            TextLabel({
                                c,
                                text: `${(100 * upper(count)).toFixed(1)}%`,
                                fontSize: 27,
                                fontWeight: 700,
                                color: c.textPrimary,
                                width: 120,
                                align: 'center',
                            }),
                        ],
                    }),
                ),
            }),
            TextLabel({
                c,
                text: 'Dots: 10% observed error. Yellow line: 20% target limit.',
                fontSize: 23,
                color: c.textSecondary,
                width: 1120,
            }),
            TextLabel({
                c,
                text: 'A wide bound calls for more evidence. It does not prove the model is bad.',
                fontSize: 23,
                color: c.textSecondary,
                width: 1108,
            }),
            TextLabel({
                c,
                text: 'LeetLLM',
                fontSize: 23,
                fontWeight: 700,
                color: c.textPrimary,
                width: 1108,
                align: 'right',
            }),
        ],
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
    if (result.pixelWidth !== width || result.pixelHeight !== height)
        throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
