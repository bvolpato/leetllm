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
    'Multi-tenant LLM serving architecture sharing a single 70-billion parameter base model (140 GB) across tenants while enforcing strict state isolation. Per-tenant execution lanes maintain separate KV cache page tables, dynamic LoRA adapters, and metered token quotas, preventing cross-tenant memory leakage.'

export const numericAnchors = {
    baseParameters: 70000000000,
    bytesPerParam: 2,
    baseModelSizeGB: 140,
    naiveTenantCopies: 100,
    naiveVramTB: 14.0,
    tenants: ['Tenant Alpha', 'Tenant Beta'],
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)

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

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Top Shared Base Card */}
                    <rect
                        x={40}
                        y={74}
                        width={780}
                        height={60}
                        rx={8}
                        fill={theme === 'dark' ? '#141d2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1.5}
                    />

                    {/* Left Tenant Alpha Card */}
                    <rect
                        x={40}
                        y={150}
                        width={370}
                        height={230}
                        rx={8}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />

                    {/* Right Tenant Beta Card */}
                    <rect
                        x={450}
                        y={150}
                        width={370}
                        height={230}
                        rx={8}
                        fill={theme === 'dark' ? '#1a1324' : '#faf5ff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                    />

                    {/* Connector lines from shared base down to tenants */}
                    <line x1={225} y1={134} x2={225} y2={150} stroke={blueTone} strokeWidth={1.5} />
                    <line
                        x1={635}
                        y1={134}
                        x2={635}
                        y2={150}
                        stroke={purpleTone}
                        strokeWidth={1.5}
                    />

                    {/* Bottom Guardrail Box */}
                    <rect
                        x={40}
                        y={394}
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
                'Multi-Tenant LLM Serving: Shared Foundation vs Isolated State',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Sharing base model weights saves 99% VRAM; runtime boundaries enforce strict per-tenant isolation',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Top Banner: Shared Base Foundation Model */}
            {label(
                52,
                82,
                756,
                'SHARED FOUNDATION MODEL (FROZEN BASE WEIGHTS · 70B FP16 = 140 GB VRAM)',
                11,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                102,
                520,
                '1 Shared Instance: 140 GB | Naive Dedicated Copies (100 tenants): 14,000 GB (14 TB)',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(580, 102, 230, 'VRAM Savings: 99.0%', 12, greenTone, 'right', 700)}

            {/* Two Isolated Tenant Lanes */}
            {/* Lane 1: Tenant Alpha */}
            {label(52, 160, 350, 'TENANT ALPHA ISOLATED STATE', 11, blueTone, 'left', 700)}
            {label(
                52,
                184,
                350,
                '1. Authenticated Identity & Workspace Context',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                52,
                202,
                350,
                'Bearer token claims tenant_id = "tenant-alpha"',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(52, 232, 350, '2. Private Paged KV Cache Blocks', 12, blueTone, 'left', 600)}
            {label(
                52,
                250,
                350,
                'Virtual block table mapped to private physical pages',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                52,
                280,
                350,
                '3. Dynamic LoRA Adapter (Support Desk v2)',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                52,
                298,
                350,
                'Rank-16 weights loaded on-demand; ref_count = 1',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(52, 328, 350, '4. Token Quota & Metering Ledger', 12, greenTone, 'left', 600)}
            {label(
                52,
                346,
                350,
                'Tier 1 SLA: 10,000 TPM limit · 842 tokens consumed',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Lane 2: Tenant Beta */}
            {label(462, 160, 350, 'TENANT BETA ISOLATED STATE', 11, purpleTone, 'left', 700)}
            {label(
                462,
                184,
                350,
                '1. Authenticated Identity & Workspace Context',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                462,
                202,
                350,
                'Bearer token claims tenant_id = "tenant-beta"',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(462, 232, 350, '2. Private Paged KV Cache Blocks', 12, purpleTone, 'left', 600)}
            {label(
                462,
                250,
                350,
                'Strict logical isolation; zero cross-tenant page reads',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                462,
                280,
                350,
                '3. Dynamic LoRA Adapter (Legal Summarizer)',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                462,
                298,
                350,
                'Rank-32 weights loaded on-demand; ref_count = 1',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {label(462, 328, 350, '4. Token Quota & Metering Ledger', 12, greenTone, 'left', 600)}
            {label(
                462,
                346,
                350,
                'Tier 2 SLA: 50,000 TPM limit · 3,120 tokens consumed',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                406,
                756,
                'Runtime Security Invariant: Zero Cross-Tenant Contamination',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                426,
                756,
                'Authenticated gateway routing and per-sequence paged attention masks isolate each tenant strictly to its own KV blocks.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
