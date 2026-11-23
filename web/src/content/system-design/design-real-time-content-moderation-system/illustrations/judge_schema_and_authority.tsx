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
    'LLM policy judge structured schema validation and enforcement authority architecture. Untrusted user content and OCR text are strictly separated from trusted system policy to prevent prompt injection. The LLM produces a typed JSON recommendation with action, category, and confidence. An independent enforcement controller validates schema compliance, checks permissions and policy revisions, and executes the final moderation action.'

export const numericAnchors = {
    confidence: 0.72,
    policyRevision: 44,
    stages: 3,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)

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

                    {/* Policy and Data mini boxes */}
                    <rect
                        x={48}
                        y={100}
                        width={170}
                        height={46}
                        rx={4}
                        fill={theme === 'dark' ? '#182438' : '#e0f2fe'}
                        stroke={blueTone}
                        strokeWidth={1}
                    />
                    <rect
                        x={232}
                        y={100}
                        width={175}
                        height={46}
                        rx={4}
                        fill={theme === 'dark' ? '#2e1c12' : '#fef3c7'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />

                    {/* JSON Output Container */}
                    <rect
                        x={48}
                        y={178}
                        width={359}
                        height={126}
                        rx={6}
                        fill={theme === 'dark' ? '#1a1828' : '#faf5ff'}
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
                        fill={theme === 'dark' ? '#102216' : '#f0fdf4'}
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
                'LLM Policy Judge: Structured Schema & Execution Authority',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Enforcing boundary separation between untrusted inputs, structured LLM output, and execution permissions',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Panel: Input Isolation & LLM Judge */}
            {label(
                52,
                82,
                350,
                '1. INPUT SEPARATION & STRUCTURED JUDGE',
                11,
                blueTone,
                'left',
                700,
            )}

            {/* Trusted Policy Box */}
            {label(52, 106, 175, 'Trusted Policy Context', 11, blueTone, 'left', 700)}
            {label(
                52,
                122,
                175,
                'policy_rev: 44 (Impersonation)',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Untrusted Data Box */}
            {label(238, 106, 175, 'Untrusted Content Data', 11, warmTone, 'left', 700)}
            {label(238, 122, 175, 'User text, OCR, image tokens', 10, c.textSecondary, 'left', 400)}

            {/* Ingress Barrier */}
            {label(
                52,
                154,
                350,
                'Prompt Boundary: System instructions sealed against user injection',
                10,
                c.textMuted,
                'left',
                500,
            )}

            {/* Typed JSON Output Box */}
            {label(52, 184, 350, 'Emitted JSON Recommendation:', 11, purpleTone, 'left', 700)}
            {label(
                52,
                202,
                350,
                '{ ·   "action": "ESCALATE", ·   "category": "impersonation", ·   "confidence": 0.72, ·   "policy_revision": 44 · }',
                11,
                c.textPrimary,
                'left',
                600,
            )}

            {/* Right Panel: Schema Validation & Enforcement Controller */}
            {label(
                452,
                82,
                350,
                '2. SCHEMA VALIDATION & ENFORCEMENT GATE',
                11,
                greenTone,
                'left',
                700,
            )}

            {label(
                452,
                106,
                350,
                'Step 1: Strict JSON Schema Validation',
                12,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                452,
                124,
                350,
                'Rejects invalid actions (e.g. hallucinated "DELETE_USER"), non-finite floats, out-of-range confidence scores, or unregistered violation categories.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                452,
                174,
                350,
                'Step 2: Authority & Policy Check',
                12,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                452,
                192,
                350,
                'The LLM emits advisory assessments, not raw database mutations. The Enforcement Controller verifies policy scope, confirms account context, and executes the actual action.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                452,
                246,
                350,
                'Final Decision: Content Quarantined for Human Review',
                11,
                greenTone,
                'left',
                700,
            )}
            {label(
                452,
                264,
                350,
                'Immutable audit log written with judge prompt hash and token usage',
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
                'LLM Judge Serving & Security Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                366,
                756,
                '1. Pin temperature=0 for deterministic scoring. · 2. Isolate untrusted input delimiters. · 3. Route malformed JSON to human review.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
