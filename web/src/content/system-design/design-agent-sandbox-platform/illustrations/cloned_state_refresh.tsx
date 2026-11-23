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
    'After restoring copied state, VMGenID notifies a supporting guest kernel, which reseeds its kernel random generator after an asynchronous handling window. Separate copied userspace PRNG state, cached tokens, and boot_id still require their application protocol. Restored wall time and monotonic deadlines have separate validation. Below, two integrator-prepared network namespaces each contain a TAP named tap0 and the repeated private guest address 192.168.241.2. Jailer joins the selected namespace. Distinct host routing and filtering paths remain necessary. A repeated private IP is not a unique global identity. Admission remains closed until the required state checks pass.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const kernelTone = getReadableToneColor('blue', c, c.bg)
    const userTone = getReadableToneColor('warm', c, c.bg)
    const netTone = getReadableToneColor('purple', c, c.bg)
    const okTone = getReadableToneColor('green', c, c.bg)

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
                    {/* Left: State & Entropy Refresh */}
                    <rect
                        x={24}
                        y={60}
                        width={384}
                        height={350}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={110}
                        width={360}
                        height={105}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={kernelTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={230}
                        width={360}
                        height={165}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={userTone}
                        strokeWidth={1.5}
                    />

                    {/* Right: Network Namespaces & Host Routing */}
                    <rect
                        x={432}
                        y={60}
                        width={404}
                        height={350}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={444}
                        y={110}
                        width={180}
                        height={200}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={netTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={644}
                        y={110}
                        width={180}
                        height={200}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={netTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={444}
                        y={325}
                        width={380}
                        height={70}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Bottom Gate */}
                    <rect
                        x={24}
                        y={426}
                        width={812}
                        height={54}
                        rx={8}
                        fill={c.bgCard}
                        stroke={okTone}
                        strokeWidth={2}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                24,
                20,
                812,
                'Snapshot State Refresh · Entropy, Clock & Network Independence',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Col */}
            {label(36, 75, 360, '1. Kernel & Entropy Refresh', 18, kernelTone, 'left', 700)}
            {label(48, 120, 336, 'VMGenID ACPI Notification', 16, kernelTone, 'left', 650)}
            {label(48, 145, 336, '• Signals guest kernel of snapshot restore', 14, c.textPrimary)}
            {label(48, 168, 336, '• Reseeds CSPRNG entropy pool (/dev/urandom)', 14, c.textMuted)}
            {label(48, 190, 336, '• Asynchronous window: block TLS until reseeded', 13, kernelTone)}

            {label(
                48,
                240,
                336,
                '2. Userspace State & Clock Invalidation',
                16,
                userTone,
                'left',
                650,
            )}
            {label(
                48,
                265,
                336,
                '• Regenerate userspace PRNG seeds (random, uuid)',
                14,
                c.textPrimary,
            )}
            {label(
                48,
                288,
                336,
                '• Purge cached bearer tokens & session tickets',
                14,
                c.textPrimary,
            )}
            {label(48, 310, 336, '• Invalidate boot_id & monotonic timer offsets', 14, c.textMuted)}
            {label(
                48,
                332,
                336,
                '• Re-sync wall clock via vsock ptp / host agent',
                14,
                c.textMuted,
            )}
            {label(
                48,
                362,
                336,
                'Prevents nonce reuse & stale credential replay',
                13,
                userTone,
                'left',
                600,
            )}

            {/* Right Col */}
            {label(444, 75, 380, '3. Network Namespace Isolation', 18, netTone, 'left', 700)}

            {/* Sandbox A */}
            {label(456, 120, 156, 'Sandbox A', 16, netTone, 'left', 650)}
            {label(456, 145, 156, '• Netns: ns-guest-a', 13, c.textPrimary)}
            {label(456, 170, 156, '• Device: tap0', 13, c.textPrimary)}
            {label(456, 195, 156, '• Guest: 192.168.241.2', 13, c.textMuted)}
            {label(456, 230, 156, 'Host Route A', 14, stroke, 'left', 600)}
            {label(456, 255, 156, 'iptables mark 0x1', 13, c.textMuted)}
            {label(456, 275, 156, 'Private egress table', 12, c.textMuted)}

            {/* Sandbox B */}
            {label(656, 120, 156, 'Sandbox B', 16, netTone, 'left', 650)}
            {label(656, 145, 156, '• Netns: ns-guest-b', 13, c.textPrimary)}
            {label(656, 170, 156, '• Device: tap0', 13, c.textPrimary)}
            {label(656, 195, 156, '• Guest: 192.168.241.2', 13, c.textMuted)}
            {label(656, 230, 156, 'Host Route B', 14, stroke, 'left', 600)}
            {label(656, 255, 156, 'iptables mark 0x2', 13, c.textMuted)}
            {label(656, 275, 156, 'Private egress table', 12, c.textMuted)}

            {label(
                456,
                335,
                360,
                'Identical internal IPs safe across isolated namespaces',
                14,
                c.textPrimary,
                'center',
                600,
            )}
            {label(
                456,
                360,
                360,
                'Host routing tables map each tap to distinct tenant policies',
                13,
                c.textMuted,
                'center',
            )}

            {/* Bottom Gate */}
            {label(
                40,
                442,
                780,
                'Readiness Gate: Entropy reseeded + Clocks synced + Netns verified → Admit Guest Work',
                16,
                okTone,
                'center',
                700,
            )}
        </Board>
    )
}

export default create('dark')
