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
    'Capacity planning for search synthesis serving. Across a 2.50-second lifecycle, active KV cache residency lasts 1.93 seconds. At 600 requests per second, Little’s Law dictates 1,158 concurrent KV-resident sessions requiring 220.52 GiB of cache memory (19 GPUs at 12 GiB budget). Decode throughput requires 12 GPUs. The required fleet capacity is max(19, 12) = 19 GPUs, not their sum.'

export const numericAnchors = {
    totalDurationSec: 2.5,
    preAdmissionSec: 0.37,
    kvResidentSec: 1.93,
    postReleaseSec: 0.2,
    rps: 600,
    totalInFlight: 1500,
    kvResidentCount: 1158,
    bytesPerPosition: 131072,
    meanTokens: 1560,
    kvMemoryGiB: 220.52,
    usableGpuGiB: 12,
    memoryGpuBound: 19,
    outputTokensPerReq: 120,
    totalDecodeTps: 72000,
    gpuDecodeTps: 6000,
    computeGpuBound: 12,
    fleetBound: 19,
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

    // Lifecycle timeline scale: 0 to 2.5s mapped to 780px (X: 40 -> 820)
    const sx = (t: number) => 40 + Math.round((t / 2.5) * 780)
    const sw = (t1: number, t2: number) => Math.round(((t2 - t1) / 2.5) * 780)

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Lifecycle Segmented Bar */}
                    <rect
                        x={sx(0)}
                        y={102}
                        width={sw(0, 0.37)}
                        height={32}
                        rx={4}
                        fill={theme === 'dark' ? '#181b22' : '#f1f5f9'}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={sx(0.37)}
                        y={102}
                        width={sw(0.37, 2.3)}
                        height={32}
                        rx={4}
                        fill={theme === 'dark' ? '#143522' : '#dcfce7'}
                        stroke={greenTone}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={sx(2.3)}
                        y={102}
                        width={sw(2.3, 2.5)}
                        height={32}
                        rx={4}
                        fill={theme === 'dark' ? '#241b12' : '#fffbeb'}
                        stroke={warmTone}
                        strokeWidth={1}
                    />

                    {/* Left Card: Memory Constraint */}
                    <rect
                        x={40}
                        y={166}
                        width={370}
                        height={180}
                        rx={8}
                        fill={theme === 'dark' ? '#102218' : '#f0fdf4'}
                        stroke={greenTone}
                        strokeWidth={1.5}
                    />

                    {/* Right Card: Compute Constraint */}
                    <rect
                        x={450}
                        y={166}
                        width={370}
                        height={180}
                        rx={8}
                        fill={theme === 'dark' ? '#141d2e' : '#eff6ff'}
                        stroke={blueTone}
                        strokeWidth={1.5}
                    />

                    {/* Bottom Synthesis Box */}
                    <rect
                        x={40}
                        y={372}
                        width={780}
                        height={90}
                        rx={8}
                        fill={theme === 'dark' ? '#1c1528' : '#faf5ff'}
                        stroke={purpleTone}
                        strokeWidth={1.5}
                    />
                </svg>
            </CanvasItem>

            {/* Header */}
            {label(
                40,
                20,
                780,
                'Synthesis Fleet Sizing: KV Cache Residency vs Decode Compute',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                "Little's Law: N = lambda * W. Fleet size is max(Memory Bound, Compute Bound), not their sum",
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Lifecycle Timeline Bar */}
            {label(
                40,
                84,
                780,
                'LIFECYCLE RESIDENCY (TOTAL: 2.50s · 600 REQ/S)',
                11,
                blueTone,
                'left',
                700,
            )}

            {/* Timeline Segment Labels */}
            {label(
                sx(0),
                108,
                sw(0, 0.37),
                'Pre-admission (0.37s)',
                10,
                c.textMuted,
                'center',
                500,
            )}
            {label(
                sx(0.37),
                108,
                sw(0.37, 2.3),
                'Active KV Cache Residency: 1.93s (600 × 1.93s = 1,158 Active Residents)',
                11,
                greenTone,
                'center',
                700,
            )}
            {label(sx(2.3), 108, sw(2.3, 2.5), 'Post (0.2s)', 10, c.textMuted, 'center', 500)}

            {/* Dual Constraint Cards */}
            {/* Constraint 1: Memory Bound */}
            {label(
                52,
                178,
                350,
                'CONSTRAINT A: KV MEMORY CAPACITY (RAM)',
                11,
                greenTone,
                'left',
                700,
            )}
            {label(
                52,
                202,
                350,
                '1,158 Residents × 1,560 Tokens × 131 KB/token',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                52,
                222,
                350,
                'GQA Layout: 2 × 32 layers × 8 heads × 128 dim × fp16',
                11,
                c.textSecondary,
                'left',
                400,
            )}
            {label(52, 246, 350, 'Total KV Memory: 220.52 GiB', 13, greenTone, 'left', 700)}
            {label(
                52,
                268,
                350,
                'Usable budget per GPU: 12 GiB (after 14GB weights)',
                11,
                c.textSecondary,
                'left',
                400,
            )}
            {label(
                52,
                294,
                350,
                'Minimum Fleet: ceil(220.52 / 12) = 19 GPUs',
                13,
                greenTone,
                'left',
                700,
            )}

            {/* Constraint 2: Compute Bound */}
            {label(
                462,
                178,
                350,
                'CONSTRAINT B: DECODE COMPUTE (FLOPs/s)',
                11,
                blueTone,
                'left',
                700,
            )}
            {label(
                462,
                202,
                350,
                '600 req/s × 120 output tokens = 72,000 tokens/s',
                12,
                c.textPrimary,
                'left',
                600,
            )}
            {label(
                462,
                222,
                350,
                'Autoregressive token generation across batch',
                11,
                c.textSecondary,
                'left',
                400,
            )}
            {label(
                462,
                246,
                350,
                'Device Serving Capacity: 6,000 tokens/s',
                13,
                blueTone,
                'left',
                700,
            )}
            {label(
                462,
                268,
                350,
                'A10G continuous batching decode limit under latency SLO',
                11,
                c.textSecondary,
                'left',
                400,
            )}
            {label(
                462,
                294,
                350,
                'Minimum Fleet: ceil(72,000 / 6,000) = 12 GPUs',
                13,
                blueTone,
                'left',
                700,
            )}

            {/* Bottom Guardrail Box */}
            {label(
                52,
                386,
                756,
                'Fleet Sizing Synthesis: Envelope vs Double-Counting',
                12,
                purpleTone,
                'left',
                700,
            )}
            {label(
                52,
                406,
                756,
                'Fleet capacity = max(19 memory, 12 compute) = 19 GPUs; add 25% headroom (24 GPUs) rather than summing bounds.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
