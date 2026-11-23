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
    'Authentication and generation reservation precede placement on one trusted host. Its host agent and template manager restore two separate guest kernels through Firecracker VMMs and KVM with the host kernel. A and B share sealed template artifacts but own separate writable memory, scratch files, and generation-scoped command channels over vsock. Their Internet egress passes an externally enforced policy boundary. Approved scoped operations reach an authenticated broker and authorized upstream TLS. Metadata, host management, and other-tenant destinations take a separate deny-and-record branch.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const hostTone = getReadableToneColor('blue', c, c.bg)
    const guestTone = getReadableToneColor('purple', c, c.bg)
    const safeTone = getReadableToneColor('green', c, c.bg)
    const denyTone = getReadableToneColor('critical', c, c.bg)

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

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Column 1: Admission & Sealed Templates */}
                    <rect
                        x={24}
                        y={60}
                        width={250}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={150}
                        width={226}
                        height={120}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={hostTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={290}
                        width={226}
                        height={170}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                        strokeDasharray="4 4"
                    />

                    {/* Column 2: Isolated MicroVM Guests */}
                    <rect
                        x={298}
                        y={60}
                        width={280}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={310}
                        y={110}
                        width={256}
                        height={165}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={guestTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={310}
                        y={295}
                        width={256}
                        height={165}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={guestTone}
                        strokeWidth={1.5}
                    />

                    {/* Column 3: Egress & Security Perimeters */}
                    <rect
                        x={602}
                        y={60}
                        width={234}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={614}
                        y={150}
                        width={210}
                        height={140}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={safeTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={614}
                        y={310}
                        width={210}
                        height={140}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={denyTone}
                        strokeWidth={1.5}
                    />

                    {/* Connecting lines */}
                    <line
                        x1={274}
                        y1={190}
                        x2={298}
                        y2={190}
                        stroke={stroke}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                    />
                    <line
                        x1={274}
                        y1={370}
                        x2={298}
                        y2={370}
                        stroke={stroke}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                    />
                    <line x1={578} y1={190} x2={602} y2={190} stroke={stroke} strokeWidth={1.5} />
                    <line x1={578} y1={370} x2={602} y2={370} stroke={stroke} strokeWidth={1.5} />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                24,
                20,
                812,
                'Tenant MicroVM Isolation & Egress Perimeter',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Col 1 Content */}
            {label(36, 75, 226, 'Host Control Plane', 18, hostTone, 'left', 700)}
            {label(36, 100, 226, '1. Authenticate tenant & request', 15, c.textMuted)}
            {label(36, 122, 226, '2. Reserve slot & place host', 15, c.textMuted)}
            {label(48, 162, 202, 'Host Agent + KVM', 16, c.textPrimary, 'left', 650)}
            {label(48, 186, 202, 'Firecracker VMM supervisor', 14, c.textMuted)}
            {label(48, 208, 202, 'Kernel-level hardware virt', 14, c.textMuted)}
            {label(48, 230, 202, 'cgroup & quota enforcement', 14, c.textMuted)}
            {label(48, 302, 202, 'Sealed Templates (RO)', 16, hostTone, 'left', 650)}
            {label(48, 328, 202, '• Immutable memory base', 14, c.textMuted)}
            {label(48, 350, 202, '• Versioned vCPU state', 14, c.textMuted)}
            {label(48, 372, 202, '• Pristine root filesystem', 14, c.textMuted)}
            {label(48, 410, 202, 'Shared across warm restores', 13, c.textMuted, 'left', 600)}

            {/* Col 2 Content */}
            {label(310, 75, 256, 'Isolated Guest MicroVMs', 18, guestTone, 'left', 700)}
            {/* Guest A */}
            {label(322, 120, 232, 'Tenant A (Generation 1)', 16, guestTone, 'left', 650)}
            {label(322, 145, 232, 'Private kernel + vsock channel', 14, c.textPrimary)}
            {label(322, 168, 232, 'Private COW writable memory', 14, c.textMuted)}
            {label(322, 190, 232, 'Ephemeral overlay scratch disk', 14, c.textMuted)}
            {label(322, 225, 232, 'Independent PID & net namespaces', 13, c.textMuted)}
            {/* Guest B */}
            {label(322, 305, 232, 'Tenant B (Generation 1)', 16, guestTone, 'left', 650)}
            {label(322, 330, 232, 'Private kernel + vsock channel', 14, c.textPrimary)}
            {label(322, 353, 232, 'Private COW writable memory', 14, c.textMuted)}
            {label(322, 375, 232, 'Ephemeral overlay scratch disk', 14, c.textMuted)}
            {label(322, 410, 232, 'Zero cross-tenant memory visibility', 13, c.textMuted)}

            {/* Col 3 Content */}
            {label(614, 75, 210, 'Egress Policy & Gateway', 18, c.textPrimary, 'left', 700)}
            {/* Approved */}
            {label(626, 162, 186, 'Approved Egress', 16, safeTone, 'left', 650)}
            {label(626, 188, 186, 'Authenticated API Broker', 15, c.textPrimary)}
            {label(626, 212, 186, 'Credential vault injection', 14, c.textMuted)}
            {label(626, 234, 186, 'Verified upstream TLS', 14, c.textMuted)}
            {label(626, 258, 186, 'Strict domain allowlist', 13, safeTone)}
            {/* Denied */}
            {label(626, 322, 186, 'Blocked Destinations', 16, denyTone, 'left', 650)}
            {label(626, 348, 186, 'Instance metadata (169.254)', 14, c.textMuted)}
            {label(626, 372, 186, 'Internal host management IP', 14, c.textMuted)}
            {label(626, 396, 186, 'Other-tenant network space', 14, c.textMuted)}
            {label(626, 420, 186, 'Immediate deny + audit log', 13, denyTone)}
        </Board>
    )
}

export default create('dark')
