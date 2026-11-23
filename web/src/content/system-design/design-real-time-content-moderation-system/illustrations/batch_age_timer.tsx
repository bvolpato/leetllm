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
    'Dynamic batch dispatcher dual-trigger mechanics under high and sparse traffic. In high-traffic bursts, requests a, b, and c arrive at 0ms, 1ms, and 2ms, filling the max batch size of 3 and triggering an immediate count flush at 2ms. In sparse traffic, request d arrives at 20ms with no companions; the age timer expires at 25ms (5ms max wait), flushing a partial batch of 1 to strictly enforce the latency deadline.'

export const numericAnchors = {
    maxBatchSize: 3,
    maxWaitAgeMs: 5,
    burstFlushMs: 2,
    timeoutFlushMs: 25,
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
                    {/* Left Panel */}
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

                    {/* Left Timeline Track */}
                    <line x1={52} y1={254} x2={390} y2={254} stroke={stroke} strokeWidth={2} />
                    <circle cx={62} cy={254} r={6} fill={blueTone} />
                    <circle cx={135} cy={254} r={6} fill={blueTone} />
                    <circle cx={208} cy={254} r={6} fill={greenTone} />
                    <rect
                        x={202}
                        y={244}
                        width={12}
                        height={20}
                        rx={2}
                        fill={greenTone}
                        opacity={0.3}
                    />

                    {/* Right Panel */}
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

                    {/* Right Timeline Track */}
                    <line x1={452} y1={254} x2={790} y2={254} stroke={stroke} strokeWidth={2} />
                    <circle cx={462} cy={254} r={6} fill={blueTone} />
                    {/* Timer span bar */}
                    <rect
                        x={462}
                        y={250}
                        width={310}
                        height={8}
                        rx={2}
                        fill={warmTone}
                        opacity={0.3}
                    />
                    <polygon points="782,246 792,254 782,262" fill={warmTone} />

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
                'Dynamic Batch Formation: Size vs Age Dispatch Triggers',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Balancing throughput during bursts while capping tail latency during sparse traffic via dual triggers',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Box: Burst Traffic / Size Trigger */}
            {label(
                52,
                82,
                350,
                'SCENARIO A: HIGH-TRAFFIC BURST (SIZE TRIGGER)',
                11,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                106,
                350,
                'Max Batch Size = 3 items · Max Age = 5 ms',
                11,
                c.textSecondary,
                'left',
                500,
            )}

            {label(
                52,
                134,
                350,
                'Arrivals: req_a at 0ms, req_b at 1ms, req_c at 2ms',
                11,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                52,
                154,
                350,
                'Trigger: Count == 3 reached at t = 2 ms',
                12,
                greenTone,
                'left',
                700,
            )}
            {label(
                52,
                172,
                350,
                'Action: Flush full batch [a, b, c] immediately to GPU worker',
                11,
                c.textSecondary,
                'left',
                400,
            )}
            {label(
                52,
                190,
                350,
                'Latency penalty for req_a: only 2.0 ms wait time',
                10,
                blueTone,
                'left',
                500,
            )}

            {/* Right Box: Sparse Traffic / Age Trigger */}
            {label(
                452,
                82,
                350,
                'SCENARIO B: SPARSE TRAFFIC (AGE TIMER TRIGGER)',
                11,
                warmTone,
                'left',
                700,
            )}
            {label(
                452,
                106,
                350,
                'Max Batch Size = 3 items · Max Age = 5 ms',
                11,
                c.textSecondary,
                'left',
                500,
            )}

            {label(
                452,
                134,
                350,
                'Arrival: req_d arrives at t = 20ms (queue previously idle)',
                11,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                452,
                154,
                350,
                'Trigger: Age Timer expires at t = 25 ms (20ms + 5ms)',
                12,
                warmTone,
                'left',
                700,
            )}
            {label(
                452,
                172,
                350,
                'Action: Flush partial batch [d] (size 1) to protect SLA',
                11,
                c.textSecondary,
                'left',
                400,
            )}
            {label(
                452,
                190,
                350,
                'Next arrival req_e at 27ms flushes at 32ms (timer reset)',
                10,
                purpleTone,
                'left',
                500,
            )}

            {/* Visual Timeline Bar Indicators */}
            {label(52, 230, 350, 't=0ms: a', 10, c.textMuted, 'left', 500)}
            {label(120, 230, 350, 't=1ms: b', 10, c.textMuted, 'left', 500)}
            {label(190, 230, 350, 't=2ms: c (FLUSH)', 10, greenTone, 'left', 600)}

            {label(452, 230, 350, 't=20ms: d arrives', 10, c.textMuted, 'left', 500)}
            {label(630, 230, 170, 't=25ms: TIMER FLUSH', 10, warmTone, 'right', 600)}

            {/* Bottom Guardrail Panel */}
            {label(
                52,
                342,
                756,
                'Dynamic Dispatcher Invariants & Timer Semantics',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                366,
                756,
                '1. Clock Start Invariant: The age deadline timer starts strictly upon the arrival of the FIRST request into an empty batch buffer. · 2. Non-Blocking Ingress: Adding requests to the buffer is atomic and lock-free; timer expiration executes in a background event-loop task. · 3. Cancellation Pruning: If a client terminates its HTTP/gRPC connection while sitting in the wait buffer, it is dropped from the batch before GPU dispatch.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
