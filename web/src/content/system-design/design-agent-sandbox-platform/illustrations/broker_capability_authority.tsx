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
    'Untrusted A/generation 1 holds a short-lived capability for one tenant, repository, and read operation. An explicit application request reaches the trusted broker, which authenticates caller and generation, checks tenant, resource, operation, and expiry, then constructs an approved request. A credential vault supplies the real secret only inside the broker boundary. The broker inserts the credential and opens hostname-verified TLS to the approved API. Invalid capabilities are rejected without an upstream call. Direct metadata, host, other-tenant, and private routes are denied outside the guest, including relevant IPv4 and optional IPv6 metadata endpoints. The guest capability expires and is revoked at retirement; it still grants bounded authority.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const guestTone = getReadableToneColor('purple', c, c.bg)
    const brokerTone = getReadableToneColor('blue', c, c.bg)
    const vaultTone = getReadableToneColor('warm', c, c.bg)
    const okTone = getReadableToneColor('green', c, c.bg)
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
                    {/* Col 1: Untrusted Guest */}
                    <rect
                        x={24}
                        y={60}
                        width={240}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={110}
                        width={216}
                        height={170}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={guestTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={36}
                        y={300}
                        width={216}
                        height={156}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                        strokeDasharray="4 4"
                    />

                    {/* Col 2: Trusted API Broker & Vault */}
                    <rect
                        x={288}
                        y={60}
                        width={300}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={brokerTone}
                        strokeWidth={2}
                    />
                    <rect
                        x={300}
                        y={110}
                        width={276}
                        height={165}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={brokerTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={300}
                        y={290}
                        width={276}
                        height={80}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={vaultTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={300}
                        y={385}
                        width={276}
                        height={70}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Col 3: Upstream Egress Targets */}
                    <rect
                        x={612}
                        y={60}
                        width={224}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={624}
                        y={110}
                        width={200}
                        height={165}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={okTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={624}
                        y={300}
                        width={200}
                        height={156}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={denyTone}
                        strokeWidth={1.5}
                    />

                    {/* Connectors */}
                    <line x1={252} y1={195} x2={300} y2={195} stroke={guestTone} strokeWidth={2} />
                    <line x1={576} y1={195} x2={624} y2={195} stroke={okTone} strokeWidth={2} />
                    <line
                        x1={252}
                        y1={378}
                        x2={624}
                        y2={378}
                        stroke={denyTone}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Broker Capability Architecture · Secret Injection & Isolation',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Col 1 */}
            {label(36, 75, 216, 'Untrusted Guest', 18, guestTone, 'left', 700)}
            {label(48, 120, 192, 'Capability Token', 16, guestTone, 'left', 650)}
            {label(48, 144, 192, '• Tenant: T', 14, c.textPrimary)}
            {label(48, 166, 192, '• Repo: repo-1', 14, c.textPrimary)}
            {label(48, 188, 192, '• Op: read', 14, c.textPrimary)}
            {label(48, 210, 192, '• Expiry: 60s TTL', 14, c.textMuted)}
            {label(48, 240, 192, 'Zero raw secrets in guest', 13, guestTone, 'left', 600)}

            {label(48, 310, 192, 'Revocation Boundary', 16, c.textPrimary, 'left', 650)}
            {label(48, 336, 192, 'Generation-scoped ID', 14, c.textMuted)}
            {label(48, 360, 192, 'Auto-revoked on reset', 14, c.textMuted)}
            {label(48, 390, 192, 'No replay across runs', 13, c.textMuted)}

            {/* Col 2 */}
            {label(300, 75, 276, 'Trusted API Broker (Host)', 18, brokerTone, 'left', 700)}
            {label(312, 120, 252, 'Capability Verifier', 16, brokerTone, 'left', 650)}
            {label(312, 144, 252, '1. Check signature & sandbox gen', 14, c.textPrimary)}
            {label(312, 166, 252, '2. Enforce tenant & repo scope', 14, c.textPrimary)}
            {label(312, 188, 252, '3. Reject invalid (0 upstream)', 14, denyTone)}
            {label(312, 235, 252, 'Construct authorized HTTP request', 13, c.textMuted)}

            {label(312, 300, 252, 'Secure Vault (Isolated)', 16, vaultTone, 'left', 650)}
            {label(312, 324, 252, 'Injects real API secret / token', 14, c.textPrimary)}
            {label(312, 344, 252, 'Never exposed to guest memory', 13, vaultTone)}

            {label(312, 395, 252, 'mTLS / Verified TLS Session', 15, brokerTone, 'left', 600)}
            {label(312, 420, 252, 'Strict host certificate validation', 13, c.textMuted)}

            {/* Col 3 */}
            {label(624, 75, 200, 'Egress Target', 18, c.textPrimary, 'left', 700)}
            {label(636, 120, 176, 'Allowed Upstream', 16, okTone, 'left', 650)}
            {label(636, 150, 176, 'External Git / APIs', 15, c.textPrimary)}
            {label(636, 175, 176, 'Authenticated HTTPS', 14, c.textMuted)}
            {label(636, 200, 176, 'Tenant repo scope', 14, c.textMuted)}
            {label(636, 235, 176, 'Audit logged & metered', 13, okTone)}

            {label(636, 310, 176, 'Blocked Targets', 16, denyTone, 'left', 650)}
            {label(636, 336, 176, '• 169.254.169.254 (IMDS)', 14, c.textMuted)}
            {label(636, 360, 176, '• fd00:ec2::254 (IPv6)', 14, c.textMuted)}
            {label(636, 384, 176, '• Internal host IPs', 14, c.textMuted)}
            {label(636, 415, 176, 'Enforced host firewall DROP', 13, denyTone)}
        </Board>
    )
}

export default create('dark')
