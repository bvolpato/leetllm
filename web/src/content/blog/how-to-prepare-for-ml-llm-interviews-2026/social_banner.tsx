import React from 'react'
import { Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'How to Prepare for ML & LLM Engineering Interviews in 2026. Trace system failures across retrieval, context assembly, and generation, and verify Grouped-Query Attention KV-cache sizing (16.00 GiB MHA vs 4.00 GiB GQA-8 at 32K tokens) and retrieval metrics in code.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const card = (heading: string, metric: string, detail: string) =>
        React.createElement(
            'div',
            {
                key: heading,
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    width: 524,
                    padding: 28,
                    border: `2px solid ${c.border}`,
                    background: c.bgCard,
                    borderRadius: 14,
                    gap: 16,
                },
            },
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 24, fontWeight: 700, color: c.textSecondary } },
                heading,
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 34, fontWeight: 700, color: c.textPrimary } },
                metric,
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 22, color: c.textSecondary, lineHeight: 1.35 } },
                detail,
            ),
        )

    return Scene({
        c,
        background: c.bg,
        padding: 54,
        gap: 0,
        contentWidth: 1092,
        children: React.createElement(
            'div',
            { style: { display: 'flex', flexDirection: 'column', width: 1092, height: 522, gap: 30 } },
            React.createElement(
                'div',
                {
                    style: {
                        display: 'flex',
                        fontSize: 43,
                        lineHeight: 1.16,
                        fontWeight: 750,
                        color: c.textPrimary,
                    },
                },
                'How to Prepare for ML & LLM Engineering Interviews in 2026',
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 25, color: c.textSecondary } },
                'Isolate failure layers first. Verify attention, KV-cache math, and evals in runnable code.',
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', gap: 44 } },
                card(
                    'Architecture & Inference Math',
                    '16.00 GiB -> 4.00 GiB',
                    '32-layer decoder at 32K context (FP16): moving from 32-head MHA to 8-head GQA cuts KV memory 4x.',
                ),
                card(
                    'Systems & Evaluation Isolation',
                    'Index -> Context -> Model',
                    'Separate stale retrieval, prompt truncation, and model hallucinations before changing weights.',
                ),
            ),
            React.createElement(
                'div',
                {
                    style: {
                        display: 'flex',
                        justifyContent: 'flex-end',
                        color: c.textPrimary,
                        fontSize: 25,
                        fontWeight: 700,
                    },
                },
                'LeetLLM',
            ),
        ),
    })
}

export async function renderBanner(outputPath: string, theme: ThemeMode = 'dark') {
    return renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
}

export default create('dark')
