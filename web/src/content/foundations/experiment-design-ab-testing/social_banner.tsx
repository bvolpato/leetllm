import React from 'react'
import { Column, FlowArrow, Row, Scene, getThemeColors, renderToPngWithOutput } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Experiment Design and A/B Testing. Randomize queries to a raw-query control or rewritten-query treatment, holding generation fixed. A worked RAG example has 38% versus 42% resolution, a 4.0 percentage-point lift with an approximate 95% interval from 1.0 to 7.0 points. Hold: grounding uncertainty still exceeds its budget.'

export function create(theme: ThemeMode = 'dark') {
    const c = {
        ...getThemeColors(theme, theme === 'light' ? 'engineering' : 'default'),
        shadow: 'transparent',
    }
    const label = (text: string, size: number, color = c.textPrimary) =>
        React.createElement(
            'div',
            {
                style: {
                    display: 'flex',
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    fontSize: size,
                    color,
                },
            },
            text,
        )
    const arm = (name: string, query: string, rate: string, counts: string, color: string) =>
        React.createElement(
            'div',
            {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    width: 230,
                    padding: 20,
                    gap: 12,
                    background: c.bgCard,
                    border: `2px solid ${color}`,
                    borderRadius: 8,
                },
            },
            label(name, 23, color),
            label(query, 20),
            label(rate, 38),
            label(counts, 18, c.textSecondary),
        )
    const lift = 840 / 2000 - 760 / 2000
    const se = Math.sqrt((0.38 * 0.62 + 0.42 * 0.58) / 2000)
    const low = ((lift - 1.96 * se) * 100).toFixed(1)
    const high = ((lift + 1.96 * se) * 100).toFixed(1)
    return Scene({
        c,
        background: c.bg,
        padding: 42,
        gap: 24,
        contentWidth: 1116,
        children: [
            label('Experiment Design and A/B Testing', 41),
            label(
                'Randomize queries. Change the retrieval query; keep generation fixed.',
                23,
                c.textSecondary,
            ),
            Row({
                gap: 24,
                align: 'center',
                children: [
                    arm(
                        'CONTROL',
                        'Raw query',
                        '38% resolved',
                        '760 / 2,000 queries',
                        c.secondaryLight,
                    ),
                    arm(
                        'TREATMENT',
                        'Rewritten query',
                        '42% resolved',
                        '840 / 2,000 queries',
                        c.primaryLight,
                    ),
                    FlowArrow({ c, direction: 'right', length: 44, tone: 'neutral' }),
                    Column({
                        gap: 16,
                        align: 'start',
                        children: [
                            label(`+${(lift * 100).toFixed(1)} percentage points`, 29),
                            label('Approximate 95% interval', 22, c.textSecondary),
                            label(`+${low} to +${high} points`, 29),
                        ],
                    }),
                ],
            }),
            Column({
                gap: 10,
                align: 'start',
                children: [
                    label(
                        'Launch decisions use lift, uncertainty, safety, and cost guardrails.',
                        30,
                    ),
                    label(
                        'HOLD: the grounding-failure interval still crosses its +0.5-point budget.',
                        23,
                        c.warningLight,
                    ),
                ],
            }),
            Row({
                justify: 'space-between',
                children: [
                    label(
                        'Worked RAG example · independent queries · planned analysis',
                        18,
                        c.textSecondary,
                    ),
                    label('LeetLLM', 25, c.primaryLight),
                ],
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
    if (result.pixelWidth !== width || result.pixelHeight !== height) {
        throw new Error('Unexpected banner dimensions')
    }
    return result
}

export default create('dark')
