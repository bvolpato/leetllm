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
    'Streaming timeline and Time Per Output Token (TPOT) calculation on a 0 to 240 millisecond scale. Request arrival is at 0 ms, first token at 100 ms (TTFT), a bundled four-token event at 220 ms, and terminal stream closure at 240 ms. Completion-based TPOT is (240 - 100) / (5 - 1) = 35 ms per token, showing how network buffering creates an observed 120 ms event gap.'

export const numericAnchors = {
    arrivalMs: 0,
    ttftMs: 100,
    bundleMs: 220,
    bundleTokens: 4,
    terminalMs: 240,
    totalTokens: 5,
    eventGapMs: 120,
    completionOverheadMs: 20,
    tpotMs: 35,
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const blueTone = getReadableToneColor('blue', c, c.bg)
    const greenTone = getReadableToneColor('green', c, c.bg)
    const warmTone = getReadableToneColor('warm', c, c.bg)
    const purpleTone = getReadableToneColor('purple', c, c.bg)

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

    // Scale 0 to 240 ms mapped to 680px (X: 110 -> 790)
    const sx = (ms: number) => 110 + Math.round((ms / 240) * 680)

    const ticks = [0, 50, 100, 150, 200, 240]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Timeline Axis Line */}
                    <line
                        x1={sx(0)}
                        y1={112}
                        x2={sx(240)}
                        y2={112}
                        stroke={c.textMuted}
                        strokeWidth={2}
                    />

                    {/* Stage Blocks */}
                    {/* Prefill Block (0 - 100) */}
                    <rect
                        x={sx(0)}
                        y={104}
                        width={sx(100) - sx(0)}
                        height={16}
                        rx={3}
                        fill={blueTone}
                        opacity={0.8}
                    />
                    {/* Buffer Block (100 - 220) */}
                    <rect
                        x={sx(100)}
                        y={104}
                        width={sx(220) - sx(100)}
                        height={16}
                        rx={3}
                        fill={warmTone}
                        opacity={0.6}
                    />
                    {/* Close Block (220 - 240) */}
                    <rect
                        x={sx(220)}
                        y={104}
                        width={sx(240) - sx(220)}
                        height={16}
                        rx={3}
                        fill={greenTone}
                        opacity={0.8}
                    />

                    {/* Milestone Dots */}
                    <circle cx={sx(0)} cy={112} r={6} fill={blueTone} />
                    <circle cx={sx(100)} cy={112} r={6} fill={blueTone} />
                    <circle cx={sx(220)} cy={112} r={6} fill={purpleTone} />
                    <circle cx={sx(240)} cy={112} r={6} fill={greenTone} />

                    {/* Tick Marks */}
                    {ticks.map((t) => (
                        <line
                            key={`tick-line-${t}`}
                            x1={sx(t)}
                            y1={120}
                            x2={sx(t)}
                            y2={128}
                            stroke={c.textMuted}
                            strokeWidth={1.5}
                        />
                    ))}

                    {/* Left Card */}
                    <rect
                        x={40}
                        y={214}
                        width={370}
                        height={146}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1}
                    />

                    {/* Right Card */}
                    <rect
                        x={450}
                        y={214}
                        width={370}
                        height={146}
                        rx={8}
                        fill={theme === 'dark' ? '#221c12' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
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
                'Streaming Telemetry: TTFT, TPOT, and Network Event Bundling',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Measuring time-to-first-token (TTFT) and time-per-output-token (TPOT) across buffered SSE transport',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Timeline Segment Labels */}
            {label(sx(0) - 20, 84, 80, 'Arrival', 11, c.textMuted, 'left', 500)}
            {label(sx(100) - 50, 84, 100, 'TTFT (100 ms)', 11, blueTone, 'center', 700)}
            {label(sx(220) - 60, 84, 120, '4-Token Bundle', 11, purpleTone, 'center', 700)}
            {label(sx(240) - 40, 84, 80, 'EOF (240 ms)', 11, greenTone, 'right', 600)}

            {/* Stage spans under timeline */}
            {label(sx(0), 146, sx(100) - sx(0), 'Prefill: 100 ms', 11, blueTone, 'center', 600)}
            {label(
                sx(100),
                146,
                sx(220) - sx(100),
                'Buffering Gap: 120 ms (4 tokens generated)',
                11,
                warmTone,
                'center',
                600,
            )}
            {label(sx(220), 146, sx(240) - sx(220), 'Close: 20ms', 10, c.textMuted, 'center', 400)}

            {/* Axis Ticks */}
            {ticks.map((t) => (
                <React.Fragment key={`tick-${t}`}>
                    {label(sx(t) - 25, 172, 50, `${t} ms`, 10, c.textMuted, 'center', 400)}
                </React.Fragment>
            ))}

            {/* Comparison Cards: Server Engine vs Client Browser Experience */}
            {/* Left Card: Engine Perspective */}
            {label(
                52,
                226,
                350,
                'SERVER ENGINE PERSPECTIVE (SMOOTH DECODE)',
                11,
                greenTone,
                'left',
                700,
            )}
            {label(
                52,
                250,
                350,
                'Continuous Batch Autoregressive Steps',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                52,
                270,
                350,
                '• Step 1: Token #1 emitted at t = 100 ms (TTFT) · • Step 2-5: Tokens #2, #3, #4, #5 generated at ~30 ms intervals · • Internal Engine TPOT = 30-35 ms per token (steady throughput)',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Right Card: Browser Perspective */}
            {label(
                462,
                226,
                350,
                'CLIENT BROWSER PERSPECTIVE (BUFFERED BUNDLE)',
                11,
                warmTone,
                'left',
                700,
            )}
            {label(
                462,
                250,
                350,
                'Reverse Proxy / HTTP/2 Transport Coalescing',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                462,
                270,
                350,
                '• Token #1 arrives at 100 ms · • Apparent 120 ms stall while intermediate frames buffer · • Instantaneous 4-token burst at 220 ms · • Observed client burstiness masks smooth GPU generation',
                11,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                386,
                756,
                'TPOT Formula and Telemetry Disambiguation',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                406,
                756,
                'True Completion TPOT = (T_terminal - T_first) / (N_tokens - 1) = (240 - 100) / 4 = 35 ms per token. · Observability platforms must report engine-level decode step timing alongside client-observed chunk delivery gaps to distinguish GPU scheduler starvation from TCP/proxy buffer delays.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
