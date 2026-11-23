import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const preset = 'engineering'
export const opaqueBackground = true

export const alt =
    'Query route serving economics across full synthesis (0.97 cents), semantic cache (0.03 cents), and structured API lookups (0.10 cents). For a 60/30/10 traffic mix, the weighted average cost is 0.601 cents per query, totaling $360.60 per minute at 1,000 queries per second.'

export const numericAnchors = {
    fullCostCents: 0.97,
    cacheCostCents: 0.03,
    apiCostCents: 0.1,
    fullShare: 0.6,
    cacheShare: 0.3,
    apiShare: 0.1,
    weightedMeanCents: 0.601,
    qps: 1000,
    costPerMinute: 360.6,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 12,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem
            x={x}
            y={y}
            width={w}
            height={Math.min(
                height - y,
                Math.ceil(
                    fontSize *
                        1.4 *
                        Math.max(1, Math.ceil((text.length * fontSize * 0.55) / Math.max(w, 1))),
                ),
            )}
        >
            <TextLabel
                c={c}
                text={text}
                fontSize={fontSize}
                color={color}
                width="100%"
                align={align}
                fontWeight={weight}
            />
        </CanvasItem>
    )

    // Stacked contribution width scale: total 0.601 cents mapped to 600px
    const totalW = 600
    const fullW = Math.round((0.582 / 0.601) * totalW) // 581
    const cacheW = Math.round((0.009 / 0.601) * totalW) // 9
    const apiW = totalW - fullW - cacheW // 10

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Top 3 Cards */}
                    <rect
                        x={40}
                        y={74}
                        width={248}
                        height={96}
                        rx={8}
                        fill={theme === 'dark' ? '#141d2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={300}
                        y={74}
                        width={248}
                        height={96}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={560}
                        y={74}
                        width={260}
                        height={96}
                        rx={8}
                        fill={theme === 'dark' ? '#241b12' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />

                    {/* Stacked Bar Track (y=236) */}
                    <rect
                        x={110}
                        y={236}
                        width={totalW}
                        height={28}
                        rx={4}
                        fill={theme === 'dark' ? '#181b22' : '#f1f5f9'}
                    />
                    <rect x={110} y={236} width={fullW} height={28} rx={4} fill={blueTone} />
                    <rect
                        x={110 + fullW}
                        y={236}
                        width={cacheW}
                        height={28}
                        rx={2}
                        fill={greenTone}
                    />
                    <rect
                        x={110 + fullW + cacheW}
                        y={236}
                        width={apiW}
                        height={28}
                        rx={4}
                        fill={warmTone}
                    />

                    {/* Legend Indicators */}
                    <circle cx={98} cy={282} r={5} fill={blueTone} />
                    <circle cx={338} cy={282} r={5} fill={greenTone} />
                    <circle cx={578} cy={282} r={5} fill={warmTone} />

                    {/* Spend Summary Box (y=320) */}
                    <rect
                        x={40}
                        y={320}
                        width={780}
                        height={76}
                        rx={8}
                        fill={theme === 'dark' ? '#141720' : '#f8fafc'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <line x1={295} y1={330} x2={295} y2={386} stroke={stroke} strokeWidth={1} />
                    <line x1={555} y1={330} x2={555} y2={386} stroke={stroke} strokeWidth={1} />

                    {/* Insight Card (y=412) */}
                    <rect
                        x={40}
                        y={412}
                        width={780}
                        height={66}
                        rx={8}
                        fill={theme === 'dark' ? '#111e2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Query Serving Economics: Multi-Tier Route Cost Blending',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Caching and direct API routing dramatically suppress unit costs while preserving revision freshness',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Top 3 Route Profile Cards */}
            {/* Card 1: Full Synthesis */}
            {label(52, 84, 230, 'ROUTE 1: FULL SYNTHESIS', 11, blueTone, 'left', 700)}
            {label(52, 106, 230, '0.97¢ / query (60% traffic)', 13, c.textPrimary, 'left', 600)}
            {label(
                52,
                126,
                230,
                '1,500 prompt + 400 output tokens · Weighted share: 0.582¢ / query',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Card 2: Valid Cache */}
            {label(312, 84, 230, 'ROUTE 2: SEMANTIC CACHE HIT', 11, greenTone, 'left', 700)}
            {label(312, 106, 230, '0.03¢ / query (30% traffic)', 13, greenTone, 'left', 600)}
            {label(
                312,
                126,
                230,
                'Re-validates access & revision · Weighted share: 0.009¢ (32x savings)',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Card 3: Structured API */}
            {label(572, 84, 230, 'ROUTE 3: STRUCTURED LIVE API', 11, warmTone, 'left', 700)}
            {label(572, 106, 230, '0.10¢ / query (10% traffic)', 13, warmTone, 'left', 600)}
            {label(
                572,
                126,
                230,
                'Direct microservice data query · Weighted share: 0.010¢ / query',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Middle Section: Weighted Blend Bar */}
            {label(
                40,
                186,
                780,
                'WEIGHTED UNIT COST CONTRIBUTIONS (TOTAL: 0.601¢ PER QUERY)',
                11,
                c.textMuted,
                'left',
                700,
            )}

            {/* Breakdown numbers above bar */}
            {label(110, 212, 200, 'Full Synthesis: 0.582¢ (96.8%)', 11, blueTone, 'left', 600)}
            {label(680, 212, 140, 'Cache + API: 0.019¢ (3.2%)', 11, greenTone, 'right', 600)}

            {/* Bar Legend */}
            {label(110, 276, 200, 'Synthesis Cost (0.582¢)', 11, blueTone, 'left', 500)}
            {label(350, 276, 200, 'Cache Hit Cost (0.009¢)', 11, greenTone, 'left', 500)}
            {label(590, 276, 200, 'Structured API Cost (0.010¢)', 11, warmTone, 'left', 500)}

            {/* Bottom Fleet Spend Metrics */}
            {label(52, 332, 240, 'Traffic Throughput', 11, c.textMuted, 'left', 500)}
            {label(52, 350, 240, '1,000 QPS (60,000 req/min)', 14, c.textPrimary, 'left', 700)}

            {label(312, 332, 240, 'Average Unit Cost', 11, c.textMuted, 'left', 500)}
            {label(312, 350, 240, '$0.00601 USD / query', 14, greenTone, 'left', 700)}

            {label(572, 332, 240, 'Total Operating Spend', 11, c.textMuted, 'left', 500)}
            {label(572, 350, 240, '$360.60 / min ($21.6k / hour)', 14, purpleTone, 'left', 700)}

            {/* Architecture Insight Note */}
            {label(52, 426, 756, 'Economic Impact of Tiered Routing', 12, blueTone, 'left', 700)}
            {label(
                52,
                446,
                756,
                'The 30% cache hit tier saves $132.84 per minute ($7,970/hr) compared to a pure synthesis fleet. Ensuring that cache hits perform lightweight revision checks guarantees correctness without paying the GPU generation penalty.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
