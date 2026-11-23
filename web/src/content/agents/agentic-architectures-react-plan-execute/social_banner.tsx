import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/agents/agentic-architectures-react-plan-execute/social_banner.tsx'; renderBanner('./src/content/agents/agentic-architectures-react-plan-execute/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'ReAct and Plan-and-Execute: one loop adapts after each result; an explicit plan joins independent numerical checks before a report. Actual results guide the next choice.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const purple = theme === 'dark' ? '#c4b5fd' : '#6d28d9'
    const cyan = theme === 'dark' ? '#67e8f9' : '#0e7490'
    const label = (
        text: string,
        left: number,
        top: number,
        boxWidth: number,
        size: number,
        color = c.textPrimary,
        weight = 600,
    ) =>
        React.createElement(
            'div',
            {
                key: text,
                style: {
                    position: 'absolute',
                    left,
                    top,
                    width: boxWidth,
                    display: 'flex',
                    color,
                    fontFamily: 'Inter',
                    fontSize: size,
                    fontWeight: weight,
                    lineHeight: 1.2,
                },
            },
            text,
        )
    const line = (d: string, color: string) =>
        React.createElement('path', {
            key: d,
            d,
            stroke: color,
            strokeWidth: 3,
            fill: 'none',
        })
    return Scene({
        c,
        background: c.bg,
        padding: 54,
        gap: 0,
        contentWidth: 1092,
        children: React.createElement(
            'div',
            {
                style: {
                    position: 'relative',
                    display: 'flex',
                    width: 1092,
                    height: 522,
                },
            },
            label('ReAct & Plan-and-Execute', 0, 0, 1092, 49, c.textPrimary, 750),
            label('Choose the next useful check.', 0, 72, 1092, 25, c.textSecondary),
            label('ReAct', 0, 146, 490, 31, purple, 700),
            label('request', 0, 218, 180, 28, purple),
            label('result', 296, 218, 180, 28, purple),
            label('choose again from the observation', 0, 308, 500, 21, c.textSecondary),
            label('Plan-and-Execute', 610, 146, 482, 31, cyan, 700),
            label('small', 610, 211, 100, 24, cyan),
            label('positive', 610, 258, 100, 24, cyan),
            label('negative', 610, 305, 110, 24, cyan),
            label('report', 908, 258, 180, 27, cyan),
            React.createElement(
                'svg',
                {
                    width: 1092,
                    height: 220,
                    viewBox: '0 0 1092 220',
                    style: { position: 'absolute', left: 0, top: 193 },
                },
                line('M 136 40 L 278 40 M 265 31 L 278 40 L 265 49', purple),
                line('M 340 68 L 340 92 L 60 92 L 60 68 M 51 80 L 60 68 L 69 80', purple),
                line(
                    'M 709 32 L 810 32 L 810 126 L 728 126 M 709 79 L 891 79 M 878 70 L 891 79 L 878 88',
                    cyan,
                ),
            ),
            label('INVESTIGATION', 0, 401, 250, 22, c.textSecondary),
            label(
                'Read source  →  run checks  →  choose from the result',
                0,
                443,
                1092,
                30,
                c.textPrimary,
                650,
            ),
            label(
                'A conclusion is stronger when a computed result supports it.',
                0,
                497,
                860,
                20,
                c.textSecondary,
            ),
            label('LeetLLM', 958, 491, 134, 25, purple, 700),
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
