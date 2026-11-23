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
    'Content moderation regional policy routing and jurisdiction scoping. Multiple contextual signals (network IP, account market, and content availability surface) are evaluated by a trusted resolver to bind an immutable enforcement scope. Severe global violations trigger worldwide takedowns, whereas local legal infractions enforce geo-targeted blocking with region-specific appeal pathways.'

export const numericAnchors = {
    signalsEvaluated: 3,
    enforcementTiers: 2,
    appealRouteMapped: true,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const redTone = getReadableToneColor('red', c, c.bg)

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
                    {/* Left Box */}
                    <rect
                        x={40}
                        y={70}
                        width={375}
                        height={245}
                        rx={8}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* 3 mini signal cards */}
                    <rect
                        x={48}
                        y={100}
                        width={115}
                        height={44}
                        rx={4}
                        fill={theme === 'dark' ? '#1c1712' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={168}
                        y={100}
                        width={115}
                        height={44}
                        rx={4}
                        fill={theme === 'dark' ? '#182438' : '#e0f2fe'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={288}
                        y={100}
                        width={115}
                        height={44}
                        rx={4}
                        fill={theme === 'dark' ? '#1e1428' : '#faf5ff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                    />

                    {/* Right Box */}
                    <rect
                        x={440}
                        y={70}
                        width={375}
                        height={245}
                        rx={8}
                        fill={theme === 'dark' ? '#181224' : '#faf5ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Bottom Invariant Panel */}
                    <rect
                        x={40}
                        y={330}
                        width={775}
                        height={138}
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
                'Regional Policy Routing & Geo-Compliance Scoping',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Resolving jurisdictional compliance, localized legal statutes, and targeted enforcement perimeters',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Panel: Signal Synthesis */}
            {label(52, 82, 350, '1. JURISDICTION SIGNAL SYNTHESIS', 11, blueTone, 'left', 700)}

            {/* 3 Signals */}
            {label(52, 106, 110, 'Network IP', 11, c.textPrimary, 'left', 700)}
            {label(52, 122, 110, 'US Egress (VPN)', 10, warmTone, 'left', 500)}

            {label(172, 106, 110, 'Account Market', 11, c.textPrimary, 'left', 700)}
            {label(172, 122, 110, 'India KYC / Phone', 10, blueTone, 'left', 500)}

            {label(292, 106, 110, 'Audience Surface', 11, c.textPrimary, 'left', 700)}
            {label(292, 122, 110, 'EU Public Forum', 10, purpleTone, 'left', 500)}

            {label(52, 154, 350, 'Trusted Resolution Outcome:', 11, greenTone, 'left', 700)}
            {label(
                52,
                172,
                350,
                'Bound Scope: EU-DSA-v17 (Applicable Law)',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                52,
                194,
                350,
                'Raw IP addresses are spoofable; the resolver synthesizes audience market, creator account residency, and distribution target into an auditable compliance scope.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Right Panel: Enforcement Perimeters */}
            {label(452, 82, 350, '2. TARGETED ENFORCEMENT PERIMETERS', 11, purpleTone, 'left', 700)}

            {label(452, 106, 350, 'A. Global Root Safety Violation', 12, redTone, 'left', 700)}
            {label(
                452,
                124,
                350,
                'Severe harms (child exploitation, violent terror) invoke the Global Safety Root. Result: Worldwide permanent removal and account suspension across all datacenters.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(452, 174, 350, 'B. Local Statutory Geo-Blocking', 12, warmTone, 'left', 700)}
            {label(
                452,
                192,
                350,
                'Regional infractions (e.g. local defamation or licensing orders) apply geo-restricted suppression: content is hidden from regional viewers while remaining live globally.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(452, 246, 350, 'C. Legally Mandated Appeal Routes', 12, blueTone, 'left', 700)}
            {label(
                452,
                264,
                350,
                'EU users receive certified DSA out-of-court dispute notices; Indian users receive Grievance Officer escalation pathways with strict statutory SLA timers.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Panel */}
            {label(
                52,
                342,
                756,
                'Jurisdictional Routing & Data Sovereignty Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                366,
                756,
                '1. Bind resolved jurisdiction to each audit log. · 2. Escalate conflicting legal orders. · 3. Keep regional records in-region.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
