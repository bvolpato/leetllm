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
    'Content moderation policy tree regression testing and hierarchical rule inheritance. Comparing production policy-v43 with draft policy-v44 on a benchmark suite. Broadening a matching rule from exact phrase to substring causes a false-positive regression by blocking legitimate classroom tutorial text. The automated regression gate blocks draft promotion until rule precision is restored.'

export const numericAnchors = {
    policiesCompared: 2,
    testCases: 3,
    regressionsDetected: 1,
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

    const testCases = [
        {
            text: '"official account private access"',
            v43: 'BLOCK',
            v44: 'BLOCK',
            status: 'Pass (Target Caught)',
            statusColor: greenTone,
        },
        {
            text: '"official tutorial mirror for classroom"',
            v43: 'ALLOW',
            v44: 'BLOCK',
            status: 'REGRESSION (False Positive)',
            statusColor: redTone,
        },
        {
            text: '"weekly study group notes"',
            v43: 'ALLOW',
            v44: 'ALLOW',
            status: 'Pass (Benign Allowed)',
            statusColor: greenTone,
        },
    ]

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

                    {/* Divider lines between test cases */}
                    <line
                        x1={52}
                        y1={162}
                        x2={402}
                        y2={162}
                        stroke={stroke}
                        strokeWidth={1}
                        strokeDasharray="2 2"
                    />
                    <line
                        x1={52}
                        y1={226}
                        x2={402}
                        y2={226}
                        stroke={stroke}
                        strokeWidth={1}
                        strokeDasharray="2 2"
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
                'Policy Trees: Hierarchical Inheritance & Regression Testing',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Detecting false-positive regressions during rule updates and enforcing immutable safety inheritance',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Panel: Regression Benchmark Comparison */}
            {label(
                52,
                82,
                350,
                'BENCHMARK SUITE: POLICY-V43 VS V44-DRAFT',
                11,
                blueTone,
                'left',
                700,
            )}

            {testCases.map((tc, idx) => {
                const y = 106 + idx * 64
                return (
                    <React.Fragment key={idx}>
                        {label(52, y, 350, tc.text, 11, c.textPrimary, 'left', 600)}
                        {label(
                            52,
                            y + 18,
                            160,
                            `v43: ${tc.v43}  →  v44: ${tc.v44}`,
                            10,
                            tc.v44 === 'BLOCK' && tc.v43 === 'ALLOW' ? redTone : c.textSecondary,
                            'left',
                            600,
                        )}
                        {label(220, y + 18, 180, tc.status, 10, tc.statusColor, 'right', 700)}
                    </React.Fragment>
                )
            })}

            {/* Regression Summary Alert */}
            {label(
                52,
                292,
                350,
                'Gating Result: v44-draft REJECTED due to false-positive regression',
                11,
                redTone,
                'left',
                700,
            )}

            {/* Right Panel: Policy Tree Hierarchy & Gates */}
            {label(452, 82, 350, 'POLICY HIERARCHY & RELEASE GATING', 11, purpleTone, 'left', 700)}

            {label(
                452,
                106,
                350,
                '1. Global Safety Root (Non-Overridable)',
                12,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                452,
                124,
                350,
                'Global safety baselines (CSAM, extremism, self-harm) lock at the root; child scopes can only tighten rules.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                452,
                174,
                350,
                '2. Scoped Regional / Surface Overrides',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                452,
                192,
                350,
                'Specific surfaces (e.g. gaming live streams) can configure specialized profanity filters and regional legal requirements without affecting global knowledge forums.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                452,
                246,
                350,
                '3. Automated Offline Evaluation Suite',
                12,
                greenTone,
                'left',
                700,
            )}
            {label(
                452,
                264,
                350,
                'Every proposed policy draft automatically runs against a 50,000-sample historical regression suite; zero regressions on gold negative samples are required before canary deployment.',
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
                'Policy Management & Version Control Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                366,
                756,
                '1. Version policy rules in Git with dual review. · 2. Shadow-test revisions for 48h. · 3. Roll back config pointers in < 2s.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
