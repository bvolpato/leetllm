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
    'Client-to-server security boundary for code completion prompt dispatch. Local redaction substitutes detected API tokens with placeholders before egress, retaining secret-to-placeholder mappings strictly inside client memory. The completion server and inference fleet receive only sanitized tokens and log allowlisted telemetry fields, preventing secret leakage into shared caches or server logs.'

export const numericAnchors = {
    sourceSecret: 'demo_api_token_abc123',
    placeholder: '<API_KEY_1>',
    clientBoundaryX: 410,
    telemetryAllowlist: ['tenant_id', 'model_version', 'latency_ms'],
    telemetryExcluded: ['prompt', 'raw_secret'],
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const greenTone = getReadableToneColor('green', c, c.bg)
    const redTone = getReadableToneColor('critical', c, c.bg)
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)

    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        fontSize = 13,
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
            {/* SVG Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <defs>
                        <marker
                            id="redact-arr"
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="6"
                            markerHeight="6"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 1 L 8 5 L 0 9 z" fill={c.textMuted} />
                        </marker>
                    </defs>

                    {/* Left Client Container */}
                    <rect
                        x={40}
                        y={76}
                        width={340}
                        height={316}
                        rx={10}
                        fill={theme === 'dark' ? '#111827' : '#f0f9ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                        strokeDasharray="4 2"
                    />

                    {/* Right Server Container */}
                    <rect
                        x={450}
                        y={76}
                        width={370}
                        height={316}
                        rx={10}
                        fill={theme === 'dark' ? '#181324' : '#faf5ff'}
                        stroke={purpleTone}
                        strokeWidth={1}
                        strokeDasharray="4 2"
                    />

                    {/* Client Card 1 */}
                    <rect
                        x={48}
                        y={108}
                        width={324}
                        height={76}
                        rx={8}
                        fill={theme === 'dark' ? '#1d1924' : '#ffffff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    {/* Client Card 2 */}
                    <rect
                        x={48}
                        y={204}
                        width={324}
                        height={76}
                        rx={8}
                        fill={theme === 'dark' ? '#14231b' : '#ffffff'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    {/* Client Card 3 */}
                    <rect
                        x={48}
                        y={300}
                        width={324}
                        height={76}
                        rx={8}
                        fill={theme === 'dark' ? '#121e2e' : '#ffffff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />

                    {/* Client internal arrows */}
                    <line
                        x1={210}
                        y1={184}
                        x2={210}
                        y2={202}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                        markerEnd="url(#redact-arr)"
                    />
                    <line
                        x1={210}
                        y1={280}
                        x2={210}
                        y2={298}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                        markerEnd="url(#redact-arr)"
                    />

                    {/* Server Card 1 */}
                    <rect
                        x={458}
                        y={108}
                        width={354}
                        height={76}
                        rx={8}
                        fill={theme === 'dark' ? '#1e1629' : '#ffffff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    {/* Server Card 2 */}
                    <rect
                        x={458}
                        y={204}
                        width={354}
                        height={76}
                        rx={8}
                        fill={theme === 'dark' ? '#1e1629' : '#ffffff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    {/* Server Card 3 */}
                    <rect
                        x={458}
                        y={300}
                        width={354}
                        height={76}
                        rx={8}
                        fill={theme === 'dark' ? '#16241b' : '#ffffff'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />

                    {/* Server internal arrows */}
                    <line
                        x1={635}
                        y1={184}
                        x2={635}
                        y2={202}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                        markerEnd="url(#redact-arr)"
                    />
                    <line
                        x1={635}
                        y1={280}
                        x2={635}
                        y2={298}
                        stroke={c.textMuted}
                        strokeWidth={1.5}
                        markerEnd="url(#redact-arr)"
                    />

                    {/* Boundary Barrier Line */}
                    <line
                        x1={415}
                        y1={76}
                        x2={415}
                        y2={392}
                        stroke={c.textMuted}
                        strokeWidth={2}
                        strokeDasharray="6 4"
                    />

                    {/* Cross-boundary arrow from Client (Card 3) to Server (Card 1) */}
                    <path
                        d="M 372 338 L 415 338 L 415 146 L 456 146"
                        fill="none"
                        stroke={greenTone}
                        strokeWidth={2}
                        markerEnd="url(#redact-arr)"
                    />

                    {/* Bottom Guardrail Box */}
                    <rect
                        x={40}
                        y={410}
                        width={780}
                        height={64}
                        rx={8}
                        fill={theme === 'dark' ? '#111827' : '#f8fafc'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Client-Side Redaction & Trust Boundary Architecture',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Detected secrets are redacted before dispatch; raw credentials never enter network payloads or remote caches',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Zone Badges */}
            {label(
                40,
                84,
                340,
                'CLIENT ENVIRONMENT (IDE / LOCAL WORKSTATION)',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                450,
                84,
                370,
                'REMOTE SERVICE CLOUD (GATEWAY & INFERENCE FLEET)',
                12,
                purpleTone,
                'left',
                700,
            )}

            {/* Client Side Card 1: Local Buffer */}
            {label(
                56,
                118,
                308,
                '1. Active Editor Buffer (Raw Content)',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(56, 138, 308, 'client = API("sk-live-948194...")', 12, redTone, 'left', 500)}
            {label(
                56,
                158,
                308,
                'High-entropy secret token identified by AST detector',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Client Side Card 2: Local Redaction Engine */}
            {label(
                56,
                214,
                308,
                '2. In-Memory Redaction & Placeholder Map',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(56, 234, 308, '<API_KEY_1> -> sk-live-948194...', 12, greenTone, 'left', 500)}
            {label(
                56,
                254,
                308,
                'Mapping stays in client memory; discarded on session close',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Client Side Card 3: Outbound Request */}
            {label(56, 310, 308, '3. Sanitized Outbound Payload', 12, c.textPrimary, 'left', 600)}
            {label(56, 330, 308, 'client = API("<API_KEY_1>")', 12, blueTone, 'left', 500)}
            {label(
                56,
                350,
                308,
                'Zero plaintext credentials cross the network perimeter',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Boundary Label */}
            {label(380, 210, 60, 'TLS / mTLS', 10, c.textMuted, 'center', 600)}
            {label(380, 224, 60, 'Boundary', 10, c.textMuted, 'center', 600)}

            {/* Server Side Card 1: Gateway Ingress & Prefix Cache */}
            {label(
                466,
                118,
                338,
                '4. Gateway Ingress & KV-Cache Match',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                466,
                138,
                338,
                'Prompt hash computed on sanitized tokens only',
                12,
                purpleTone,
                'left',
                500,
            )}
            {label(
                466,
                158,
                338,
                'Cached KV states cannot expose original credentials to peers',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Server Side Card 2: Inference & Completion Generation */}
            {label(466, 214, 338, '5. LLM Completion Generation', 12, c.textPrimary, 'left', 600)}
            {label(
                466,
                234,
                338,
                'Model predicts syntax using placeholder as variable token',
                12,
                c.textPrimary,
                'left',
                500,
            )}
            {label(
                466,
                254,
                338,
                'Generated snippet preserves placeholder; no auto-substitution',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Server Side Card 3: Audit & Telemetry Policy */}
            {label(466, 310, 338, '6. Strict Telemetry Allowlist', 12, c.textPrimary, 'left', 600)}
            {label(
                466,
                330,
                338,
                'Logged: tenant_id, model_version, latency_ms',
                12,
                greenTone,
                'left',
                500,
            )}
            {label(
                466,
                350,
                338,
                'Explicitly excluded: prompt body, user code, credentials',
                10,
                redTone,
                'left',
                500,
            )}

            {/* Footer Summary Notice */}
            {label(
                52,
                420,
                756,
                'Security Guarantees & Enforcement Constraints',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                442,
                756,
                'Client-side placeholder substitution keeps secrets out of remote logs and prefix caches while preserving local restoration.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
