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
    'Client routing first keeps dot or opening-parenthesis member completion local when semantic type information is available, with a scenario p95 objective of 60 ms. Other input or unavailable types reaches a literal remote_permitted is True gate. Unknown values string False, None and integer 1 route to local fallback 60 ms. Actual True allows remote routing: after a signature chooses multiline 500 ms, otherwise inline 200 ms. The gateway independently enforces authenticated access and upload policy; client classification is not authorization. Results still pass editor freshness before paint and Tab.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const localTone = getReadableToneColor('blue', c, c.bg)
    const remoteTone = getReadableToneColor('green', c, c.bg)
    const gateTone = getReadableToneColor('purple', c, c.bg)
    const failTone = getReadableToneColor('critical', c, c.bg)

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
                    {/* Left: Client Triage Tree */}
                    <rect
                        x={24}
                        y={60}
                        width={400}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Branch 1: Local Semantic (LSP) */}
                    <rect
                        x={36}
                        y={110}
                        width={376}
                        height={90}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={localTone}
                        strokeWidth={1.5}
                    />

                    {/* Branch 2: Strict Boolean Gate */}
                    <rect
                        x={36}
                        y={220}
                        width={376}
                        height={110}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={gateTone}
                        strokeWidth={1.5}
                    />

                    {/* Local Fallback */}
                    <rect
                        x={36}
                        y={350}
                        width={376}
                        height={105}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={failTone}
                        strokeWidth={1.5}
                    />

                    {/* Right: Remote Routing & Gateway Verification */}
                    <rect
                        x={444}
                        y={60}
                        width={392}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Remote Branches */}
                    <rect
                        x={456}
                        y={110}
                        width={175}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={remoteTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={645}
                        y={110}
                        width={175}
                        height={100}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={remoteTone}
                        strokeWidth={1.5}
                    />

                    {/* Gateway Security Enforcement */}
                    <rect
                        x={456}
                        y={230}
                        width={368}
                        height={110}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={gateTone}
                        strokeWidth={1.5}
                    />

                    {/* Freshness Gate */}
                    <rect
                        x={456}
                        y={360}
                        width={368}
                        height={95}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Route connector */}
                    <line x1={412} y1={275} x2={456} y2={160} stroke={remoteTone} strokeWidth={2} />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'Client Completion Triage · Semantic LSP, Policy Gates & Remote FIM',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Header */}
            {label(
                36,
                75,
                376,
                '1. Client-Side Triage Decision Tree',
                16,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Branch 1 */}
            {label(48, 120, 352, 'Trigger: "." or "(" + Types Known', 13, localTone, 'left', 700)}
            {label(48, 142, 352, '• Route: LOCAL_SEMANTIC (LSP / AST)', 12, c.textPrimary)}
            {label(
                48,
                162,
                352,
                '• 60 ms objective · Zero network traffic',
                11,
                localTone,
                'left',
                600,
            )}

            {/* Branch 2 */}
            {label(
                48,
                230,
                352,
                'Strict Boolean Gate: remote_permitted is True',
                13,
                gateTone,
                'left',
                700,
            )}
            {label(48, 255, 352, '• Requires literal Python boolean True', 12, c.textMuted)}
            {label(
                48,
                275,
                352,
                '• Values like "False", None, 1 FAIL gate immediately',
                11,
                failTone,
            )}
            {label(
                48,
                295,
                352,
                '• Prevents type-coercion bypass on security flags',
                11,
                c.textMuted,
            )}

            {/* Fallback */}
            {label(48, 360, 352, 'Policy Fail → LOCAL_FALLBACK', 13, failTone, 'left', 700)}
            {label(
                48,
                385,
                352,
                '• Falls back to local text buffer ngram matching',
                11,
                c.textMuted,
            )}
            {label(48, 405, 352, '• 60 ms objective · Code never leaves machine', 11, c.textMuted)}
            {label(
                48,
                425,
                352,
                '• Protects confidential repositories without permission',
                11,
                failTone,
                'left',
                600,
            )}

            {/* Right Header */}
            {label(
                456,
                75,
                368,
                '2. Remote Dispatch & Security Enforcement',
                16,
                remoteTone,
                'left',
                700,
            )}

            {/* Multiline vs Inline */}
            {label(468, 120, 155, 'REMOTE_MULTILINE', 12, remoteTone, 'left', 700)}
            {label(468, 142, 155, 'After def / class :', 11, c.textPrimary)}
            {label(468, 162, 155, '500 ms budget', 11, c.textMuted)}
            {label(468, 180, 155, 'Generates full block', 10, c.textMuted)}

            {label(657, 120, 155, 'REMOTE_INLINE', 12, remoteTone, 'left', 700)}
            {label(657, 142, 155, 'Mid-line expression', 11, c.textPrimary)}
            {label(657, 162, 155, '200 ms budget', 11, c.textMuted)}
            {label(657, 180, 155, 'Single line snippet', 10, c.textMuted)}

            {/* Gateway */}
            {label(468, 240, 344, 'Independent Gateway Enforcement', 13, gateTone, 'left', 700)}
            {label(
                468,
                265,
                344,
                '• Gateway independently validates tenant auth & telemetry policy',
                11,
                c.textMuted,
            )}
            {label(
                468,
                285,
                344,
                '• Client classifier output is not trusted authorization',
                11,
                failTone,
            )}
            {label(
                468,
                305,
                344,
                '• Drops unauthenticated requests before GPU prefill',
                11,
                c.textMuted,
            )}

            {/* Freshness */}
            {label(468, 370, 344, 'Unified Freshness Check', 13, c.textPrimary, 'left', 700)}
            {label(
                468,
                395,
                344,
                'All results (local, remote inline, remote multiline) pass through editor snapshot gate before ghost text rendering.',
                11,
                c.textMuted,
            )}
        </Board>
    )
}

export default create('dark')
