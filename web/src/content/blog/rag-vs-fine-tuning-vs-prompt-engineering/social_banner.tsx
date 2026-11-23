import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'RAG vs Fine-Tuning vs Prompting. Complementary intervention points that combine cleanly in one inference stack: prompting shapes rules and schema, RAG delivers versioned external docs, and supervised fine-tuning adapts generator weights with LoRA.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const cyan = theme === 'dark' ? '#22d3ee' : '#0e7490'
    const purple = theme === 'dark' ? '#c4b5fd' : '#7c3aed'
    const amber = theme === 'dark' ? '#fbbf24' : '#a16207'
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
            label('RAG vs Fine-Tuning vs Prompting', 0, 0, 1092, 49, c.textPrimary, 750),
            label(
                'Different intervention points. Compatible in one system.',
                0,
                80,
                1092,
                29,
                c.textSecondary,
            ),
            React.createElement(
                'svg',
                {
                    width: 1092,
                    height: 459,
                    viewBox: '0 0 1092 459',
                    style: { position: 'absolute', left: 0, top: 0 },
                },
                React.createElement('rect', {
                    x: 0,
                    y: 169,
                    width: 338,
                    height: 98,
                    rx: 10,
                    fill: c.bgCard,
                    stroke: cyan,
                    strokeWidth: 2,
                }),
                React.createElement('rect', {
                    x: 0,
                    y: 330,
                    width: 338,
                    height: 98,
                    rx: 10,
                    fill: c.bgCard,
                    stroke: purple,
                    strokeWidth: 2,
                }),
                React.createElement('rect', {
                    x: 451,
                    y: 264,
                    width: 260,
                    height: 109,
                    rx: 10,
                    fill: c.bgCard,
                    stroke: c.textPrimary,
                    strokeWidth: 1.5,
                }),
                React.createElement('rect', {
                    x: 841,
                    y: 264,
                    width: 251,
                    height: 109,
                    rx: 10,
                    fill: c.bgCard,
                    stroke: amber,
                    strokeWidth: 2,
                }),
                React.createElement('rect', {
                    x: 793,
                    y: 135,
                    width: 299,
                    height: 79,
                    rx: 10,
                    fill: c.bgCard,
                    stroke: amber,
                    strokeWidth: 1.5,
                }),
                React.createElement('path', {
                    d: 'M 353 218 L 391 218 L 391 294 L 436 294 M 426 286 L 436 294 L 426 302',
                    fill: 'none',
                    stroke: cyan,
                    strokeWidth: 2.5,
                }),
                React.createElement('path', {
                    d: 'M 353 379 L 391 379 L 391 342 L 436 342 M 426 334 L 436 342 L 426 350',
                    fill: 'none',
                    stroke: purple,
                    strokeWidth: 2.5,
                }),
                React.createElement('path', {
                    d: 'M 727 319 L 825 319 M 815 311 L 825 319 L 815 327',
                    fill: 'none',
                    stroke: c.textSecondary,
                    strokeWidth: 2.5,
                }),
                React.createElement('path', {
                    d: 'M 967 214 L 967 250 M 960 240 L 967 250 L 974 240',
                    fill: 'none',
                    stroke: amber,
                    strokeWidth: 2.5,
                }),
                React.createElement('path', {
                    d: 'M 967 373 L 967 413 M 960 403 L 967 413 L 974 403',
                    fill: 'none',
                    stroke: c.textSecondary,
                    strokeWidth: 2.5,
                }),
            ),
            label('Prompting', 0, 185, 338, 31, cyan, 750, true),
            label('rules + few-shot schema', 0, 235, 338, 23, c.textPrimary, 600, true),
            label('Retrieval (RAG)', 0, 346, 338, 31, purple, 750, true),
            label('versioned runtime docs', 0, 396, 338, 23, c.textPrimary, 600, true),
            label('Input Context', 451, 285, 260, 31, c.textPrimary, 750, true),
            label('question + evidence', 451, 335, 260, 23, c.textPrimary, 600, true),
            label('Generator', 841, 285, 251, 31, amber, 750, true),
            label('model / LoRA adapter', 841, 335, 251, 23, c.textPrimary, 600, true),
            label('Fine-Tuning (SFT)', 793, 144, 299, 29, amber, 750, true),
            label('train on behavior pairs', 793, 184, 299, 23, c.textPrimary, 600, true),
            label('update parameters', 666, 228, 290, 23, amber, 650),
            label('Answer', 841, 427, 251, 28, c.textPrimary, 700, true),
            label('Isolate evidence vs model bottlenecks with 2x2 ablations.', 0, 490, 920, 27, c.textSecondary),
            label('LeetLLM', 932, 490, 160, 30, c.textPrimary, 750),
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
