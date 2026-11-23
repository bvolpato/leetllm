import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'AI Lab Coding Interview: Python Systems. Concurrent sequence workers check and pop free KV-cache blocks inside a lock before running attention, while Copy-on-Write prefix blocks stay immutable.'

export function create(theme: ThemeMode = 'dark') {
    const c = { ...getThemeColors(theme), shadow: 'transparent' }
    return Scene({
        c,
        background: c.bg,
        padding: 54,
        contentWidth: 1092,
        gap: 0,
        children: React.createElement(
            'div',
            { style: { display: 'flex', flexDirection: 'column', height: 522 } },
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 48, fontWeight: 750, color: c.textPrimary, lineHeight: 1.13 } },
                'AI Lab Coding Interview: Python Systems',
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 27, color: c.textSecondary, marginTop: 26, marginBottom: 28 } },
                'Paged KV blocks, masked attention, nucleus sampling, and async batching.',
            ),
            GraphDiagram({
                c,
                width: 1092,
                height: 245,
                layout: 'manual',
                padding: 12,
                nodeWidth: 272,
                nodeHeight: 156,
                labelFontSize: 27,
                detailFontSize: 21,
                arrowSize: 7,
                nodes: [
                    { id: 'lock', label: 'Atomic Block Claim', detail: 'Pop physical ID; bump ref', x: 0.13, y: 0.5, tone: 'purple' },
                    { id: 'attn', label: 'Masked Attention', detail: 'Causal + pad log-sum-exp', x: 0.5, y: 0.5, tone: 'cyan' },
                    { id: 'sample', label: 'Nucleus Sampling', detail: 'Shifted top-p & token budget', x: 0.87, y: 0.5, tone: 'green' },
                ],
                edges: [
                    { from: 'lock', to: 'attn' },
                    { from: 'attn', to: 'sample' },
                ],
            }),
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 24, color: c.textSecondary, marginTop: 18 } },
                'Keep state invariants intact as concurrency and edge-case follow-ups arrive.',
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', justifyContent: 'space-between', marginTop: 'auto', color: c.textSecondary, fontSize: 20 } },
                React.createElement('span', null, 'Python ML Systems Coding Guide'),
                React.createElement('span', { style: { color: c.textPrimary, fontWeight: 700 } }, 'LeetLLM'),
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
