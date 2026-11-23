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
    'Only authorized and upload-permitted files enter a symbol-membership matrix. A is active, S is scope_rules.py, P policy_graph.py, M metrics.py. Rows contain PolicyGraph, ScopeRule, TokenClaims, AuditEvent, Node, Counter and Histogram, with exact memberships. Active and S intersect in ScopeRule and TokenClaims, two of four union symbols, scoring 0.5. Active and P share PolicyGraph, one of four, scoring 0.25. Active and M share zero of five. A 0.25 threshold retains S and P. A model-context container reserves suffix and framing inside the 8,000-token prompt cap, then fits prefix and permitted retrieval. Output reserve is separate from the prompt within total model context; component sizes are symbolic.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const activeTone = getReadableToneColor('blue', c, c.bg)
    const scoreTone = getReadableToneColor('green', c, c.bg)
    const midTone = getReadableToneColor('purple', c, c.bg)
    const dropTone = getReadableToneColor('critical', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 18,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={Math.ceil(fontSize * 1.35)}>
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

    const symbols = [
        { name: 'PolicyGraph', a: true, s: false, p: true, m: false },
        { name: 'ScopeRule', a: true, s: true, p: false, m: false },
        { name: 'TokenClaims', a: true, s: true, p: false, m: false },
        { name: 'AuditEvent', a: false, s: true, p: false, m: false },
        { name: 'Node', a: false, s: false, p: true, m: false },
        { name: 'Counter', a: false, s: false, p: false, m: true },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left: Jaccard Symbol Overlap Matrix */}
                    <rect
                        x={24}
                        y={60}
                        width={430}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Matrix grid background */}
                    <rect
                        x={36}
                        y={105}
                        width={406}
                        height={190}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Matrix headers & dots */}
                    {symbols.map((sym, row) => {
                        const y = 145 + row * 24
                        return (
                            <g key={sym.name}>
                                {sym.a && <circle cx={250} cy={y + 5} r={5} fill={activeTone} />}
                                {sym.s && <circle cx={300} cy={y + 5} r={5} fill={scoreTone} />}
                                {sym.p && <circle cx={350} cy={y + 5} r={5} fill={midTone} />}
                                {sym.m && <circle cx={400} cy={y + 5} r={5} fill={dropTone} />}
                            </g>
                        )
                    })}

                    {/* Score Bars Box */}
                    <rect
                        x={36}
                        y={305}
                        width={406}
                        height={155}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* S bar (0.50) */}
                    <rect
                        x={160}
                        y={345}
                        width={180}
                        height={20}
                        rx={3}
                        fill={scoreTone}
                        opacity={0.85}
                    />
                    {/* P bar (0.25) */}
                    <rect
                        x={160}
                        y={380}
                        width={90}
                        height={20}
                        rx={3}
                        fill={midTone}
                        opacity={0.85}
                    />
                    {/* M bar (0.00) */}
                    <rect x={160} y={415} width={4} height={20} rx={2} fill={dropTone} />

                    {/* Threshold cutoff line (0.25 = x=250) */}
                    <line
                        x1={250}
                        y1={335}
                        x2={250}
                        y2={445}
                        stroke={stroke}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                    />

                    {/* Right: Token Budget Packing Hierarchy */}
                    <rect
                        x={474}
                        y={60}
                        width={362}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Total Context Box */}
                    <rect
                        x={486}
                        y={105}
                        width={338}
                        height={260}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={midTone}
                        strokeWidth={1.5}
                    />

                    {/* Suffix Reserve (Highest priority) */}
                    <rect
                        x={498}
                        y={145}
                        width={314}
                        height={48}
                        rx={4}
                        fill={c.bgCard}
                        stroke={midTone}
                        strokeWidth={1.2}
                    />

                    {/* Prefix Window */}
                    <rect
                        x={498}
                        y={202}
                        width={314}
                        height={68}
                        rx={4}
                        fill={c.bgCard}
                        stroke={activeTone}
                        strokeWidth={1.2}
                    />

                    {/* Retrieved S & P snippets */}
                    <rect
                        x={498}
                        y={278}
                        width={314}
                        height={75}
                        rx={4}
                        fill={c.bgCard}
                        stroke={scoreTone}
                        strokeWidth={1.2}
                    />

                    {/* Output Reserve */}
                    <rect
                        x={486}
                        y={380}
                        width={338}
                        height={80}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={scoreTone}
                        strokeWidth={1.5}
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Context Selection · Jaccard Symbol Relevance & Token Budget Hierarchy',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Header */}
            {label(36, 75, 406, '1. Jaccard Symbol Overlap Matrix', 16, activeTone, 'left', 700)}

            {/* Columns */}
            {label(48, 115, 180, 'Symbol Name', 12, c.textPrimary, 'left', 650)}
            {label(240, 115, 25, 'A', 12, activeTone, 'center', 700)}
            {label(290, 115, 25, 'S', 12, scoreTone, 'center', 700)}
            {label(340, 115, 25, 'P', 12, midTone, 'center', 700)}
            {label(390, 115, 25, 'M', 12, dropTone, 'center', 700)}

            {/* Symbols */}
            {symbols.map((sym, row) => (
                <React.Fragment key={sym.name}>
                    {label(48, 140 + row * 24, 180, sym.name, 11, c.textMuted, 'left')}
                </React.Fragment>
            ))}

            {/* Scores */}
            {label(
                48,
                315,
                382,
                'Jaccard: |A ∩ Candidate| / |A ∪ Candidate|',
                12,
                c.textPrimary,
                'left',
                600,
            )}

            {label(48, 345, 105, 'S: 2/4 (0.50)', 12, scoreTone, 'left', 650)}
            {label(350, 345, 80, 'RETAIN', 11, scoreTone, 'right', 700)}

            {label(48, 380, 105, 'P: 1/4 (0.25)', 12, midTone, 'left', 650)}
            {label(350, 380, 80, 'RETAIN', 11, midTone, 'right', 700)}

            {label(48, 415, 105, 'M: 0/5 (0.00)', 12, dropTone, 'left', 650)}
            {label(350, 415, 80, 'FILTER', 11, dropTone, 'right', 700)}

            {/* Right Header */}
            {label(
                486,
                75,
                338,
                '2. Strict Token Budget Allocator',
                16,
                c.textPrimary,
                'left',
                700,
            )}

            {label(498, 115, 314, 'Prompt Cap: 8,000 Tokens', 13, midTone, 'left', 700)}

            {label(508, 150, 294, '1. Suffix + FIM Framing (Protected)', 12, midTone, 'left', 650)}
            {label(508, 168, 294, 'Guarantees suffix context is never truncated.', 10, c.textMuted)}

            {label(
                508,
                208,
                294,
                '2. Active File Prefix (Caret Context)',
                12,
                activeTone,
                'left',
                650,
            )}
            {label(508, 226, 294, 'Enclosing function, class scope, and imports.', 10, c.textMuted)}

            {label(
                508,
                284,
                294,
                '3. Retrieved Context (S: 0.50, P: 0.25)',
                12,
                scoreTone,
                'left',
                650,
            )}
            {label(508, 302, 294, 'Fills remaining headroom up to 8,000 limit.', 10, c.textMuted)}
            {label(
                508,
                320,
                294,
                'Lowest ranked files evicted first on overflow.',
                10,
                c.textMuted,
            )}

            {/* Output Box */}
            {label(
                498,
                390,
                314,
                'Output Reserve (Outside Prompt Cap)',
                13,
                scoreTone,
                'left',
                700,
            )}
            {label(498, 415, 314, 'Reserved tokens for model generation stream.', 11, c.textMuted)}
            {label(
                498,
                435,
                314,
                'Prevents generation cut-off mid-expression.',
                11,
                scoreTone,
                'left',
                600,
            )}
        </Board>
    )
}

export default create('dark')
