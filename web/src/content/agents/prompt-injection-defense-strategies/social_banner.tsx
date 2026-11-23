import React from 'react'
import { Column, Flow, Row, Scene, TextLabel, getThemeColors, renderToPngWithOutput, withDensity } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Prompt Injection Defense. Untrusted external text enters a toolless quarantined reader, attaches a taint label, and must clear a deterministic capability monitor before reaching any tool sink.'

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = withDensity(getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'), 1.75)
    return Scene({
        c,
        background: c.bg,
        padding: 44,
        gap: 32,
        justify: 'space-between',
        contentWidth: 1112,
        title: 'Prompt Injection Defense',
        subtitle: 'Separate data from control. Enforce capabilities outside the model.',
        children: Column({
            gap: 40,
            width: 1112,
            children: [
                Flow({
                    c,
                    connectorLength: 26,
                    stages: [
                        {
                            eyebrow: 'UNTRUSTED INPUT',
                            title: 'Web / Email Bytes',
                            subtitle: 'hidden instructions possible',
                            tone: 'critical',
                            width: 300,
                        },
                        {
                            eyebrow: 'QUARANTINE',
                            title: 'Toolless Reader',
                            subtitle: 'schema-valid data only',
                            tone: 'warm',
                            width: 300,
                        },
                        {
                            eyebrow: 'HOST MONITOR',
                            title: 'Taint + Capability Gate',
                            subtitle: 'blocks tainted egress',
                            tone: 'green',
                            width: 300,
                        },
                    ],
                }),
                Row({
                    width: 1112,
                    justify: 'space-between',
                    align: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Break the lethal trifecta with provenance tracking and Dual-LLM isolation.',
                            fontSize: 23,
                            color: c.textSecondary,
                        }),
                        TextLabel({
                            c,
                            text: 'LeetLLM',
                            fontSize: 26,
                            color: c.primaryLight,
                            fontWeight: 700,
                        }),
                    ],
                }),
            ],
        }),
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
