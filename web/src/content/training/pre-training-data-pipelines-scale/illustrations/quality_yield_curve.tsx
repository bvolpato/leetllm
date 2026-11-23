import React, { createElement, type ReactNode } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    layoutAllocation,
    type ThemeMode,
    type ToneName,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 860
export const height = 520
export const alt =
    'The five authored documents contain 120 proof tokens scored 0.98, 160 API-documentation tokens scored 0.92, 200 forum tokens scored 0.79, 240 news tokens scored 0.63 and 280 scrape tokens scored 0.31. Stacked contributions share a 0-to-1000-token scale. Thresholds 0, 0.50, 0.70, 0.90 and 0.95 retain 1000, 720, 480, 280 and 120 tokens. Their token-weighted mean classifier scores round to 0.661, 0.797, 0.881, 0.946 and 0.980. Threshold 0.90 retains proof and API documentation only; classifier score remains a selection proxy.'

export const documents = [
    { id: 'proof', label: 'Proof', tokens: 120, score: 0.98, tone: 'purple' as ToneName },
    { id: 'api-doc', label: 'API-Doc', tokens: 160, score: 0.92, tone: 'cyan' as ToneName },
    { id: 'forum', label: 'Forum', tokens: 200, score: 0.79, tone: 'blue' as ToneName },
    { id: 'news', label: 'News', tokens: 240, score: 0.63, tone: 'warm' as ToneName },
    { id: 'scrape', label: 'Scrape', tokens: 280, score: 0.31, tone: 'neutral' as ToneName },
]
export const totalTokens = documents.reduce((sum, doc) => sum + doc.tokens, 0)
export const thresholds = [0, 0.5, 0.7, 0.9, 0.95]

const barX = 105
const barWidth = 330
const barStartY = 110
const barRowGap = 58

export const selections = thresholds.map((threshold, i) => {
    const kept = documents.filter((doc) => doc.score >= threshold)
    const tokens = kept.reduce((sum, doc) => sum + doc.tokens, 0)
    return {
        threshold,
        kept,
        tokens,
        yield: tokens / totalTokens,
        mean: kept.reduce((sum, doc) => sum + doc.tokens * doc.score, 0) / tokens,
        allocation: layoutAllocation({
            x: barX,
            y: barStartY + i * barRowGap + 6,
            width: barWidth,
            height: 24,
            capacity: totalTokens,
            parts: kept.map((doc) => ({ id: doc.id, label: doc.id, value: doc.tokens })),
        }),
    }
})

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 650,
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const muted = c.textSecondary

    const toneColors: Record<string, string> = {
        proof: getReadableToneColor('purple', c),
        'api-doc': getReadableToneColor('cyan', c),
        forum: getReadableToneColor('blue', c),
        news: getReadableToneColor('warm', c),
        scrape: c.borderLight,
    }

    const barElements: ReactNode[] = []
    selections.forEach((row, i) => {
        barElements.push(
            SvgFrame({
                c,
                ...row.allocation.bounds,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.borderSubtle,
                strokeWidth: 1,
                key: `bound-${i}`,
            }),
        )
        row.allocation.parts.forEach((part) => {
            barElements.push(
                SvgFrame({
                    c,
                    ...part.bounds,
                    rx: 3,
                    fill: toneColors[part.id] || c.borderLight,
                    key: `part-${i}-${part.id}`,
                }),
            )
        })
    })

    const shapeSvg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        // Left Panel (Threshold sweeps)
        SvgFrame({
            c,
            x: 20,
            y: 50,
            width: 480,
            height: 410,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-left',
        }),
        // Highlight 0.90 threshold
        SvgFrame({
            c,
            x: 26,
            y: barStartY + 3 * barRowGap - 2,
            width: 468,
            height: 44,
            rx: 6,
            fill: 'transparent',
            stroke: toneColors['api-doc'],
            strokeWidth: 1.5,
            key: 'highlight-09',
        }),
        // Right Panel (Source distributions and summary)
        SvgFrame({
            c,
            x: 520,
            y: 50,
            width: 320,
            height: 410,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-right',
        }),
        ...barElements,
        // Selected Threshold Callout Card
        SvgFrame({
            c,
            x: 540,
            y: 240,
            width: 280,
            height: 195,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: toneColors['api-doc'],
            strokeWidth: 1.5,
            key: 'card-selected',
        }),
    )

    const rowLabels: ReactNode[] = []
    selections.forEach((row, i) => {
        const y = barStartY + i * barRowGap + 6
        rowLabels.push(
            label(
                c,
                `≥ ${row.threshold.toFixed(2)}`,
                32,
                y,
                65,
                24,
                14,
                row.threshold === 0.9 ? toneColors['api-doc'] : c.textPrimary,
            ),
            label(
                c,
                `${row.tokens} tok (${Math.round(row.yield * 100)}%)`,
                barX + barWidth + 8,
                y - 6,
                85,
                20,
                11,
                c.textPrimary,
            ),
            label(
                c,
                `mean: ${row.mean.toFixed(3)}`,
                barX + barWidth + 8,
                y + 10,
                85,
                18,
                10,
                muted,
            ),
        )
    })

    const sourceRows: ReactNode[] = []
    documents.forEach((doc, i) => {
        const y = 92 + i * 26
        sourceRows.push(
            label(c, doc.label, 540, y, 90, 20, 12, toneColors[doc.id]),
            label(c, `${doc.tokens} tok`, 640, y, 70, 20, 12, muted, 'right'),
            label(
                c,
                `score ${doc.score.toFixed(2)}`,
                720,
                y,
                95,
                20,
                12,
                toneColors[doc.id],
                'right',
            ),
        )
    })

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                {shapeSvg}
            </CanvasItem>
            {label(
                c,
                'Quality Filtering: Token Yield vs Classifier Score Threshold',
                20,
                12,
                width - 40,
                30,
                22,
                c.textPrimary,
                'center',
            )}

            {/* Left Panel */}
            {label(
                c,
                'Retained Tokens by Score Threshold (1000 Total Tokens)',
                35,
                62,
                450,
                24,
                16,
                c.textPrimary,
            )}
            {label(
                c,
                'Colors represent surviving document slices on common scale',
                35,
                84,
                450,
                20,
                12,
                muted,
            )}
            {rowLabels}

            {/* Right Panel */}
            {label(c, 'Source Document Inventory', 535, 62, 290, 24, 16, c.textPrimary)}
            {sourceRows}

            {/* Callout Card */}
            {label(
                c,
                'Operating Point: Cutoff ≥ 0.90',
                555,
                250,
                250,
                22,
                14,
                toneColors['api-doc'],
            )}
            {label(
                c,
                '• Kept: Proof (120 tok) & API-Doc (160 tok)',
                555,
                276,
                250,
                18,
                11,
                c.textPrimary,
            )}
            {label(
                c,
                '• Yield: 280 / 1000 tokens (28% retained)',
                555,
                300,
                250,
                18,
                11,
                toneColors['api-doc'],
            )}
            {label(
                c,
                '• Mean score rises: 0.661 → 0.946 (+43%)',
                555,
                324,
                250,
                18,
                11,
                getReadableToneColor('purple', c),
            )}
            {label(c, '• Discards: Forum, News, and Scrape (72%)', 555, 348, 250, 18, 11, muted)}
            {label(
                c,
                'Aggressive thresholds increase quality density but require larger raw crawls to hit target token volume.',
                555,
                376,
                250,
                48,
                10,
                muted,
            )}

            {label(
                c,
                'Threshold selection trade-offs · Token yield decreases monotonically with classifier strictness',
                20,
                470,
                width - 40,
                24,
                14,
                muted,
                'center',
            )}
        </Board>
    )
}

export default create('dark')
