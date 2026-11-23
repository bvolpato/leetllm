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
    'Streaming claim verification state machine. A pending draft claim is held in local memory until verified. An accepted verdict event transitions the claim to verified status and emits it once over the stream, ignoring duplicate deliveries. A rejection event permanently blocks publication, and stale or malformed verdicts are dropped.'

export const numericAnchors = {
    requestId: 'request-a',
    draftId: 'draft-2',
    sourceRevision: 2,
    acceptedEmittedCount: 1,
    rejectedEmittedCount: 0,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const redTone = getReadableToneColor('critical', c, c.bg)
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
                    <defs>
                        <marker
                            id="stream-arr"
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

                    {/* Ingress Banner */}
                    <rect
                        x={40}
                        y={74}
                        width={780}
                        height={58}
                        rx={8}
                        fill={theme === 'dark' ? '#141d2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />

                    {/* Column 1 Card (Accepted) */}
                    <rect
                        x={40}
                        y={150}
                        width={248}
                        height={196}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    {/* Column 2 Card (Rejected) */}
                    <rect
                        x={300}
                        y={150}
                        width={248}
                        height={196}
                        rx={8}
                        fill={theme === 'dark' ? '#241417' : '#fff5f5'}
                        stroke={redTone}
                        strokeWidth={1}
                    />
                    {/* Column 3 Card (Stale) */}
                    <rect
                        x={560}
                        y={150}
                        width={260}
                        height={196}
                        rx={8}
                        fill={theme === 'dark' ? '#221e14' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />

                    {/* Arrows from top banner down to 3 columns */}
                    <line
                        x1={164}
                        y1={132}
                        x2={164}
                        y2={150}
                        stroke={greenTone}
                        strokeWidth={1.5}
                        markerEnd="url(#stream-arr)"
                    />
                    <line
                        x1={424}
                        y1={132}
                        x2={424}
                        y2={150}
                        stroke={redTone}
                        strokeWidth={1.5}
                        markerEnd="url(#stream-arr)"
                    />
                    <line
                        x1={690}
                        y1={132}
                        x2={690}
                        y2={150}
                        stroke={warmTone}
                        strokeWidth={1.5}
                        markerEnd="url(#stream-arr)"
                    />

                    {/* Bottom Guardrail Box */}
                    <rect
                        x={40}
                        y={372}
                        width={780}
                        height={90}
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
                'Streaming Verification: Real-Time Claim Publication State Machine',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Draft claims are withheld until verification completes; decisions bind to exact request and revision keys',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Ingress Pending Claim Card */}
            {label(
                52,
                82,
                756,
                'INGRESS DRAFT CLAIM (HELD IN STREAM BUFFER · HIDDEN FROM USER)',
                11,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                102,
                756,
                'request-a · draft-2 · bound to source revision 2 | Status: PENDING VERIFICATION',
                13,
                c.textPrimary,
                'left',
                600,
            )}

            {/* Three Outcome Columns */}
            {/* Column 1: Acceptance */}
            {label(52, 160, 230, 'PATH 1: VERIFIED (ACCEPTED)', 11, greenTone, 'left', 700)}
            {label(52, 184, 230, 'Event: accepted = True', 13, c.textPrimary, 'left', 600)}
            {label(52, 204, 230, 'Transitions to CHECKED state', 11, greenTone, 'left', 500)}
            {label(
                52,
                224,
                230,
                'Action: Emits claim token to SSE',
                11,
                c.textSecondary,
                'left',
                400,
            )}
            {label(52, 260, 230, 'Duplicate Event Handling:', 11, c.textMuted, 'left', 500)}
            {label(
                52,
                278,
                230,
                'Duplicate delivery ignored (emits 0)',
                11,
                greenTone,
                'left',
                600,
            )}

            {/* Column 2: Rejection */}
            {label(312, 160, 230, 'PATH 2: REJECTED (CONTRADICTED)', 11, redTone, 'left', 700)}
            {label(312, 184, 230, 'Event: accepted = False', 13, c.textPrimary, 'left', 600)}
            {label(312, 204, 230, 'Transitions to BLOCKED state', 11, redTone, 'left', 500)}
            {label(
                312,
                224,
                230,
                'Action: Drops claim from output',
                11,
                c.textSecondary,
                'left',
                400,
            )}
            {label(312, 260, 230, 'Terminal Invariance:', 11, c.textMuted, 'left', 500)}
            {label(312, 278, 230, 'Subsequent accept events ignored', 11, redTone, 'left', 600)}

            {/* Column 3: Stale / Malformed */}
            {label(572, 160, 230, 'PATH 3: STALE / MALFORMED', 11, warmTone, 'left', 700)}
            {label(
                572,
                184,
                230,
                'Event: revision mismatch (rev 1)',
                13,
                c.textPrimary,
                'left',
                600,
            )}
            {label(572, 204, 230, 'Outdated draft check dropped', 11, warmTone, 'left', 500)}
            {label(
                572,
                224,
                230,
                'Action: Draft remains PENDING',
                11,
                c.textSecondary,
                'left',
                400,
            )}
            {label(572, 260, 230, 'Malformed Schemas:', 11, c.textMuted, 'left', 500)}
            {label(572, 278, 230, 'Non-boolean verdicts rejected', 11, warmTone, 'left', 600)}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                386,
                756,
                'Stream Reducer Invariants & Idempotency Rules',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                406,
                756,
                '1. Bind verdicts to (request_id, draft_id, revision). · 2. Keep rejections monotonic. · 3. Deduplicate published claims by event_id.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
