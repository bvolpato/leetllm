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
    'Multi-tenant runtime security boundaries comparison across four isolation tiers: in-process multiplexing, container and process separation, hardware GPU slicing via MIG, and dedicated node or VM clusters. Each tier balances memory density, multiplexing efficiency, and tenant blast radius.'

export const numericAnchors = {
    tiers: 4,
    processIsolation: 'address-space',
    hardwareIsolation: 'memory-slice',
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

    const cardWidth = 186
    const cardGap = 12
    const startX = 35
    const cardTop = 85
    const cardHeight = 345

    const tiers = [
        {
            title: '1. In-Process Engine',
            badge: 'High Density',
            color: blueTone,
            bgLight: '#eff6ff',
            bgDark: '#121824',
            target: 'Free & Shared Workloads',
            isolation: 'Logical Runtime',
            shared: 'Address space, heap, VRAM, driver',
            boundary: 'Tenant IDs & token stream router',
            tradeoff: 'Max throughput; memory corruption risk',
        },
        {
            title: '2. Process / Container',
            badge: 'OS Isolation',
            color: purpleTone,
            bgLight: '#faf5ff',
            bgDark: '#181224',
            target: 'Standard Paid Tenants',
            isolation: 'Process Memory',
            shared: 'Host OS kernel, GPU driver, system bus',
            boundary: 'cgroups, namespaces, OS page tables',
            tradeoff: 'Process isolation; GPU driver still shared',
        },
        {
            title: '3. GPU Hardware Slicing',
            badge: 'Silicon Partition',
            color: warmTone,
            bgLight: '#fffbeb',
            bgDark: '#221a10',
            target: 'Enterprise Tenants',
            isolation: 'VRAM & SM Cores',
            shared: 'Chassis, PCIe root complex, power rail',
            boundary: 'Hardware MIG / GPU instances',
            tradeoff: 'Strict hardware QoS; static slice sizes',
        },
        {
            title: '4. Dedicated Node / VM',
            badge: 'Physical Boundary',
            color: greenTone,
            bgLight: '#f0fdf4',
            bgDark: '#102216',
            target: 'Regulated / Healthcare',
            isolation: 'Host Kernel & Device',
            shared: 'VPC network fabric only',
            boundary: 'Hypervisor / bare-metal server',
            tradeoff: 'Zero blast radius; lowest utilization',
        },
    ]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Background Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {tiers.map((tier, idx) => {
                        const x = startX + idx * (cardWidth + cardGap)
                        return (
                            <g key={idx}>
                                <rect
                                    x={x}
                                    y={cardTop}
                                    width={cardWidth}
                                    height={cardHeight}
                                    rx={8}
                                    fill={theme === 'dark' ? tier.bgDark : tier.bgLight}
                                    stroke={stroke}
                                    strokeWidth={1}
                                />
                                <rect
                                    x={x}
                                    y={cardTop}
                                    width={cardWidth}
                                    height={5}
                                    rx={2}
                                    fill={tier.color}
                                />
                            </g>
                        )
                    })}

                    {/* Bottom Spectrum Container */}
                    <rect
                        x={35}
                        y={440}
                        width={790}
                        height={38}
                        rx={6}
                        fill={theme === 'dark' ? '#141720' : '#f8fafc'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                35,
                20,
                790,
                'Multi-Tenant Runtime Security & Isolation Boundaries',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                35,
                48,
                790,
                'Balancing resource multiplexing efficiency against blast radius, memory protection, and compliance',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Labels inside cards */}
            {tiers.map((tier, idx) => {
                const x = startX + idx * (cardWidth + cardGap)
                return (
                    <React.Fragment key={idx}>
                        {label(
                            x + 12,
                            cardTop + 14,
                            cardWidth - 24,
                            tier.title,
                            13,
                            c.textPrimary,
                            'left',
                            700,
                        )}
                        {label(
                            x + 12,
                            cardTop + 36,
                            cardWidth - 24,
                            tier.badge.toUpperCase(),
                            10,
                            tier.color,
                            'left',
                            700,
                        )}

                        {label(
                            x + 12,
                            cardTop + 68,
                            cardWidth - 24,
                            'ISOLATION LEVEL',
                            9,
                            c.textMuted,
                            'left',
                            700,
                        )}
                        {label(
                            x + 12,
                            cardTop + 84,
                            cardWidth - 24,
                            tier.isolation,
                            12,
                            tier.color,
                            'left',
                            600,
                        )}

                        {label(
                            x + 12,
                            cardTop + 114,
                            cardWidth - 24,
                            'ENFORCEMENT PERIMETER',
                            9,
                            c.textMuted,
                            'left',
                            700,
                        )}
                        {label(
                            x + 12,
                            cardTop + 130,
                            cardWidth - 24,
                            tier.boundary,
                            11,
                            c.textSecondary,
                            'left',
                            400,
                        )}

                        {label(
                            x + 12,
                            cardTop + 180,
                            cardWidth - 24,
                            'SHARED INFRASTRUCTURE',
                            9,
                            c.textMuted,
                            'left',
                            700,
                        )}
                        {label(
                            x + 12,
                            cardTop + 196,
                            cardWidth - 24,
                            tier.shared,
                            11,
                            c.textSecondary,
                            'left',
                            400,
                        )}

                        {label(
                            x + 12,
                            cardTop + 246,
                            cardWidth - 24,
                            'TENANT WORKLOAD',
                            9,
                            c.textMuted,
                            'left',
                            700,
                        )}
                        {label(
                            x + 12,
                            cardTop + 262,
                            cardWidth - 24,
                            tier.target,
                            11,
                            c.textPrimary,
                            'left',
                            600,
                        )}

                        {label(
                            x + 12,
                            cardTop + 292,
                            cardWidth - 24,
                            'PRIMARY TRADE-OFF',
                            9,
                            c.textMuted,
                            'left',
                            700,
                        )}
                        {label(
                            x + 12,
                            cardTop + 308,
                            cardWidth - 24,
                            tier.tradeoff,
                            10,
                            c.textMuted,
                            'left',
                            400,
                        )}
                    </React.Fragment>
                )
            })}

            {/* Bottom Spectrum Banner text */}
            {label(52, 452, 260, '← High Density & Multiplexing', 11, blueTone, 'left', 600)}
            {label(
                320,
                452,
                220,
                'Threat Model Trade-off Spectrum',
                11,
                c.textMuted,
                'center',
                500,
            )}
            {label(
                550,
                452,
                260,
                'Strict Isolation & Zero Blast Radius →',
                11,
                greenTone,
                'right',
                600,
            )}
        </Board>
    )
}

export default create()
