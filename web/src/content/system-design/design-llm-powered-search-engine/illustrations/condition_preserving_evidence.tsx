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
    'Condition-preserving citation verification comparing truncated and full evidence spans. An exact substring from 0 to 72 matches the source document digest but drops the clause "only with security approval," failing the condition coverage gate. The complete 101-character span retains the qualifier, passing verification for publication.'

export const numericAnchors = {
    policyLength: 80,
    exceptionLength: 101,
    conditionStart: 73,
    conditionEnd: 100,
    truncatedEnd: 72,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const redTone = getReadableToneColor('critical', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const blueTone = getReadableToneColor('blue', c, c.bg)
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
            {/* SVG Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Canonical Source Banner */}
                    <rect
                        x={40}
                        y={74}
                        width={780}
                        height={60}
                        rx={8}
                        fill={theme === 'dark' ? '#141d2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <line
                        x1={515}
                        y1={74}
                        x2={515}
                        y2={134}
                        stroke={warmTone}
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                    />

                    {/* Left Truncated Card */}
                    <rect
                        x={40}
                        y={150}
                        width={370}
                        height={216}
                        rx={8}
                        fill={theme === 'dark' ? '#1c1214' : '#fff5f5'}
                        stroke={redTone}
                        strokeWidth={1}
                    />
                    {/* Span visualization bar Left */}
                    <rect
                        x={52}
                        y={326}
                        width={346}
                        height={18}
                        rx={3}
                        fill={theme === 'dark' ? '#241417' : '#f1f5f9'}
                    />
                    <rect
                        x={52}
                        y={326}
                        width={Math.round((72 / 101) * 346)}
                        height={18}
                        rx={3}
                        fill={blueTone}
                    />
                    <rect
                        x={52 + Math.round((72 / 101) * 346)}
                        y={326}
                        width={Math.round((29 / 101) * 346)}
                        height={18}
                        rx={3}
                        fill={redTone}
                        opacity={0.6}
                    />

                    {/* Right Preserved Card */}
                    <rect
                        x={450}
                        y={150}
                        width={370}
                        height={216}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />
                    {/* Span visualization bar Right */}
                    <rect
                        x={462}
                        y={326}
                        width={346}
                        height={18}
                        rx={3}
                        fill={theme === 'dark' ? '#162b1f' : '#f1f5f9'}
                    />
                    <rect
                        x={462}
                        y={326}
                        width={Math.round((72 / 101) * 346)}
                        height={18}
                        rx={3}
                        fill={blueTone}
                    />
                    <rect
                        x={462 + Math.round((72 / 101) * 346)}
                        y={326}
                        width={Math.round((29 / 101) * 346)}
                        height={18}
                        rx={3}
                        fill={warmTone}
                    />

                    {/* Bottom Guardrail Box */}
                    <rect
                        x={40}
                        y={382}
                        width={780}
                        height={78}
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
                'Evidence Span Integrity: Retaining Conditional Qualifiers',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Verbatim substring matches can invert policy if chunking or quotation drops conditional qualifiers',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Source Reference Header */}
            {label(
                52,
                82,
                756,
                'CANONICAL SOURCE: EXCEPTION REVISION 1 (TOTAL LENGTH: 101 CHARACTERS)',
                11,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                102,
                510,
                '"Service-account migrations may start within 60 days...',
                13,
                c.textPrimary,
                'left',
                500,
            )}
            {label(530, 102, 278, '...only with security approval."', 13, warmTone, 'left', 700)}

            {/* Left Card: Truncated Span (Failure) */}
            {label(
                52,
                160,
                350,
                'CASE A: TRUNCATED SPAN [0, 72) · DANGEROUS OMISSION',
                11,
                redTone,
                'left',
                700,
            )}
            {label(52, 182, 350, 'Quoted Text:', 11, c.textMuted, 'left', 500)}
            {label(
                52,
                200,
                350,
                '"...may start within 60 days after the notice"',
                12,
                c.textPrimary,
                'left',
                500,
            )}

            {label(
                52,
                236,
                350,
                'Digest Check: PASS (Valid substring of document hash)',
                11,
                greenTone,
                'left',
                500,
            )}
            {label(
                52,
                256,
                350,
                'Qualifier: MISSING ("only with security approval" omitted)',
                11,
                redTone,
                'left',
                700,
            )}
            {label(
                52,
                280,
                350,
                'Decision: HOLD (Blocked - Misleads user into unconditional 60 days)',
                12,
                redTone,
                'left',
                700,
            )}

            {/* Right Card: Full Condition-Preserving Span (Success) */}
            {label(
                462,
                160,
                350,
                'CASE B: FULL SPAN [0, 101) · QUALIFIER PRESERVED',
                11,
                greenTone,
                'left',
                700,
            )}
            {label(462, 182, 350, 'Quoted Text:', 11, c.textMuted, 'left', 500)}
            {label(
                462,
                200,
                350,
                '"...within 60 days... only with security approval."',
                12,
                c.textPrimary,
                'left',
                500,
            )}

            {label(
                462,
                236,
                350,
                'Digest Check: PASS (Full span verified against revision digest)',
                11,
                greenTone,
                'left',
                500,
            )}
            {label(
                462,
                256,
                350,
                'Qualifier: INTACT (Approval clause present in [73, 100))',
                11,
                greenTone,
                'left',
                700,
            )}
            {label(
                462,
                280,
                350,
                'Decision: PUBLISH (Authorized - Complete legal context)',
                12,
                greenTone,
                'left',
                700,
            )}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                396,
                756,
                'Architecture Principle: Clause Boundary Integrity Gates',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                416,
                756,
                'Span digests verify source identity, while clause-aware extraction preserves attached exceptions, qualifiers, and scope conditions.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
