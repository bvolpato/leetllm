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
    'Content moderation classifier micro-batching performance scaling. Comparing single-item execution (batch size 1) with micro-batched execution (batch size 32). Single-item inference runs in 3.0 milliseconds, yielding 333 items per second. Batching 32 items increases service latency to 8.0 milliseconds but surges throughput to 4,000 items per second, delivering a 12-fold increase in serving capacity by amortizing GPU memory-bandwidth transfers.'

export const numericAnchors = {
    singleItemLatencyMs: 3.0,
    singleItemThroughput: 333.3,
    batch32LatencyMs: 8.0,
    batch32Throughput: 4000,
    throughputMultiplier: 12.0,
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

                    {/* Latency Bars Comparison */}
                    {/* Batch 1: 3ms (mapped to 75px) */}
                    <rect x={240} y={116} width={75} height={18} rx={3} fill={warmTone} />

                    {/* Batch 32: 8ms (mapped to 130px) */}
                    <rect x={240} y={190} width={130} height={18} rx={3} fill={blueTone} />

                    {/* Throughput Progress Bar (333 vs 4000) */}
                    <rect x={52} y={290} width={28} height={12} rx={2} fill={warmTone} />
                    <rect x={84} y={290} width={315} height={12} rx={2} fill={greenTone} />

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
                'Classifier Micro-Batching: Latency vs Throughput Scaling',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Amortizing GPU memory-bandwidth weight transfers across concurrent requests to achieve 12x throughput',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Box: Performance Comparison */}
            {label(
                52,
                82,
                350,
                'BENCHMARK METRICS: BATCH 1 VS BATCH 32',
                11,
                blueTone,
                'left',
                700,
            )}

            {/* Batch 1 Box */}
            {label(52, 106, 180, 'Single-Item (Batch = 1)', 12, c.textPrimary, 'left', 700)}
            {label(52, 124, 180, 'Latency: 3.0 ms', 11, warmTone, 'left', 600)}
            {label(52, 140, 180, 'Throughput: 333 items/s', 11, c.textSecondary, 'left', 400)}
            {label(325, 118, 50, '3 ms', 10, c.textSecondary, 'left', 500)}

            {/* Batch 32 Box */}
            {label(52, 180, 180, 'Micro-Batched (Batch = 32)', 12, c.textPrimary, 'left', 700)}
            {label(52, 198, 180, 'Latency: 8.0 ms (2.67×)', 11, blueTone, 'left', 600)}
            {label(52, 214, 180, 'Throughput: 4,000 items/s (12×)', 12, greenTone, 'left', 700)}
            {label(375, 192, 50, '8 ms', 10, c.textSecondary, 'left', 500)}

            {/* Bar comparison indicators */}
            {label(
                52,
                252,
                350,
                'Throughput Efficiency Gain: 12.0× Higher Capacity',
                11,
                greenTone,
                'left',
                600,
            )}
            {label(
                52,
                270,
                350,
                'Latency Cost: +5.0 ms trade-off well within 50ms chat SLA',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Right Box: GPU Mechanics & Adaptive Trigger */}
            {label(
                452,
                82,
                350,
                'GPU TENSOR CORE SATURATION MECHANICS',
                11,
                purpleTone,
                'left',
                700,
            )}

            {label(
                452,
                106,
                350,
                '1. Memory-Bound vs Compute-Bound GEMM',
                12,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                452,
                124,
                350,
                'Batch=1 stalls on HBM weight reads; Batch=32 reuses weights across requests to saturate Tensor Cores.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                452,
                180,
                350,
                '2. Dynamic Dual-Trigger Dispatch Rule',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                452,
                198,
                350,
                'Flush queue when batch size hits 32 items OR oldest item reaches 5 ms max wait.',
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
                'Production Micro-Batching Service Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                366,
                756,
                '1. Separate sync chat (batch 16, 3 ms) from async video (batch 64). · 2. Bucket sequence lengths. · 3. Drop cancelled sockets.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
