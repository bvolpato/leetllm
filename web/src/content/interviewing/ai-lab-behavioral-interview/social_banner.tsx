import React from 'react'
import { GraphDiagram, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'AI Lab Behavioral Interview. Separate offline slice diagnosis and regression checks, teammate serving repair, and staged rollout verification against an untouched holdout.'
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
                { style: { display: 'flex', fontSize: 52, fontWeight: 750, color: c.textPrimary, lineHeight: 1.13 } },
                'AI Lab Behavioral Interview',
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 27, color: c.textSecondary, marginTop: 30, marginBottom: 28 } },
                'Explain your engineering judgment without claiming the whole team’s.',
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
                    { id: 'diag', label: 'My Diagnosis', detail: 'Isolate 32k slice drop; add eval check', x: 0.13, y: 0.5, tone: 'purple' },
                    { id: 'fix', label: 'Teammate Patch', detail: 'Update RoPE scaling; verify dev set', x: 0.5, y: 0.5, tone: 'cyan' },
                    { id: 'gate', label: 'Holdout Gate', detail: 'Confirm untouched parity; stage rollout', x: 0.87, y: 0.5, tone: 'green' },
                ],
                edges: [
                    { from: 'diag', to: 'fix' },
                    { from: 'fix', to: 'gate' },
                ],
            }),
            React.createElement(
                'div',
                { style: { display: 'flex', fontSize: 24, color: c.textSecondary, marginTop: 18 } },
                'What changed? What baseline proved it? What remained out of scope?',
            ),
            React.createElement(
                'div',
                { style: { display: 'flex', justifyContent: 'space-between', marginTop: 'auto', color: c.textSecondary, fontSize: 20 } },
                React.createElement('span', null, 'Worked study pattern · substitute verified projects from your own history'),
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
