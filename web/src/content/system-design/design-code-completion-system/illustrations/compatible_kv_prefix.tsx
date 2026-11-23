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
    'A cached illustrative KV handle is keyed by server-derived acme/repo-a/policy-7, weights-3, tok-3, no-adapter, fp16-layout-1, and exact prefix IDs 10,20,30. A next tokenized prompt matching every field permits KV reuse. Separate changed-field cases, contoso scope, last token 31, adapter-2 and policy-8, take full prefill. Reuse and full-prefill paths join the same decode step. Response caching and editor freshness remain separate guarantees.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const keyTone = getReadableToneColor('blue', c, c.bg)
    const hitTone = getReadableToneColor('green', c, c.bg)
    const missTone = getReadableToneColor('critical', c, c.bg)
    const decodeTone = getReadableToneColor('purple', c, c.bg)

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

    const misses = [
        { name: 'Scope change', val: 'contoso/repo-a/p7' },
        { name: 'Token ID change', val: '[10, 20, 31]' },
        { name: 'LoRA adapter', val: 'adapter-2' },
        { name: 'Policy change', val: 'policy-8' },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left: Cached KV Key Tuple */}
                    <rect
                        x={24}
                        y={60}
                        width={380}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Key Attributes Box */}
                    <rect
                        x={36}
                        y={110}
                        width={356}
                        height={250}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={keyTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={48}
                        y={150}
                        width={332}
                        height={34}
                        rx={4}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={192}
                        width={332}
                        height={34}
                        rx={4}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={234}
                        width={332}
                        height={34}
                        rx={4}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={276}
                        width={332}
                        height={34}
                        rx={4}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={48}
                        y={318}
                        width={332}
                        height={34}
                        rx={4}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Key notes */}
                    <rect
                        x={36}
                        y={375}
                        width={356}
                        height={85}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Right: Match vs Miss Paths */}
                    <rect
                        x={430}
                        y={60}
                        width={406}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Cache HIT Block */}
                    <rect
                        x={442}
                        y={110}
                        width={382}
                        height={75}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={hitTone}
                        strokeWidth={2}
                    />

                    {/* Cache MISS Grid (4 Scenarios) */}
                    <rect
                        x={442}
                        y={198}
                        width={382}
                        height={170}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={missTone}
                        strokeWidth={1.5}
                    />
                    {misses.map((m, i) => {
                        const my = 238 + i * 30
                        return (
                            <rect
                                key={m.name}
                                x={454}
                                y={my}
                                width={358}
                                height={24}
                                rx={3}
                                fill={c.bgCard}
                                stroke={stroke}
                                strokeWidth={1}
                            />
                        )
                    })}

                    {/* Unified Decode Block */}
                    <rect
                        x={442}
                        y={382}
                        width={382}
                        height={78}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={decodeTone}
                        strokeWidth={2}
                    />

                    {/* Path connectors */}
                    <line x1={633} y1={185} x2={633} y2={382} stroke={hitTone} strokeWidth={2} />
                    <line
                        x1={780}
                        y1={368}
                        x2={780}
                        y2={382}
                        stroke={missTone}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'KV Cache Prefix Compatibility & Multi-Tenant Security Scope',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Header */}
            {label(36, 75, 356, 'Cached Prefix Key Tuple', 16, keyTone, 'left', 700)}

            {/* Key Fields */}
            {label(48, 120, 332, 'Prefix Cache Key Specification:', 13, keyTone, 'left', 650)}
            {label(58, 158, 312, '1. Scope: acme/repo-a/policy-7', 12, c.textPrimary, 'left', 600)}
            {label(58, 200, 312, '2. Model: weights-3 (v3 checkpoints)', 12, c.textMuted, 'left')}
            {label(58, 242, 312, '3. Tokenizer: tok-3 · Adapter: none', 12, c.textMuted, 'left')}
            {label(
                58,
                284,
                312,
                '4. Layout: fp16-layout-1 (paged KV blocks)',
                12,
                c.textMuted,
                'left',
            )}
            {label(
                58,
                326,
                312,
                '5. Token IDs: [10, 20, 30] (exact sequence)',
                12,
                keyTone,
                'left',
                600,
            )}

            {/* Left Notes */}
            {label(
                48,
                388,
                332,
                'Tenant security scope is derived by gateway.',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(48, 410, 332, 'Clients cannot inject arbitrary cache salts.', 11, c.textMuted)}
            {label(
                48,
                432,
                332,
                'Prevents cross-tenant attention state leakage.',
                11,
                keyTone,
                'left',
                600,
            )}

            {/* Right Header */}
            {label(442, 75, 382, 'Incoming Request Evaluation', 16, c.textPrimary, 'left', 700)}

            {/* Cache Hit Box */}
            {label(454, 120, 358, 'Cache HIT: 100% Tuple Match', 14, hitTone, 'left', 700)}
            {label(
                454,
                142,
                358,
                '• Reuse existing KV attention blocks directly in VMM/GPU',
                11,
                c.textMuted,
            )}
            {label(
                454,
                160,
                358,
                '• Skips prefill computation (saves 70%+ compute)',
                11,
                hitTone,
                'left',
                600,
            )}

            {/* Cache Miss Box */}
            {label(
                454,
                208,
                358,
                'Cache MISS: Any Field Discrepancy → Full Prefill',
                13,
                missTone,
                'left',
                700,
            )}
            {misses.map((m, i) => (
                <React.Fragment key={m.name}>
                    {label(464, 242 + i * 30, 160, `• ${m.name}:`, 11, c.textMuted, 'left')}
                    {label(620, 242 + i * 30, 180, m.val, 11, missTone, 'right', 600)}
                </React.Fragment>
            ))}

            {/* Decode Box */}
            {label(454, 392, 358, 'Autoregressive Decode Phase', 14, decodeTone, 'left', 700)}
            {label(
                454,
                415,
                358,
                'Both HIT and MISS paths converge on the same streaming token engine.',
                11,
                c.textMuted,
            )}
            {label(
                454,
                435,
                358,
                'Generates completion tokens one by one into the editor.',
                11,
                decodeTone,
                'left',
                600,
            )}
        </Board>
    )
}

export default create('dark')
