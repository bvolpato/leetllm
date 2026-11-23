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
    'Content moderation queue overload backlog and recovery dynamics. A 20-second traffic surge of 900 requests per second exceeds the 600 requests per second cluster capacity, accumulating 6,000 backlogged items (+300 items/s). When arrival drops to 500 requests per second, the cluster drains the backlog at 100 items per second, taking 60 seconds (three times the burst duration) to recover normal latency.'

export const numericAnchors = {
    serviceCapacityRps: 600,
    surgeArrivalRps: 900,
    normalArrivalRps: 500,
    surgeDurationSeconds: 20,
    peakQueueItems: 6000,
    recoveryDrainSeconds: 60,
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

    return (
        <Board c={c} width={width} height={height} background="transparent">
            {/* SVG Visual Elements */}
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {/* Left Plot Box */}
                    <rect
                        x={40}
                        y={70}
                        width={390}
                        height={262}
                        rx={8}
                        fill={theme === 'dark' ? '#121824' : '#f0f9ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Rate Chart Area: x = 110..370, y = 100..185 */}
                    {/* 900 rps line (y=112) */}
                    <line x1={110} y1={112} x2={185} y2={112} stroke={redTone} strokeWidth={2.5} />
                    <line
                        x1={185}
                        y1={112}
                        x2={185}
                        y2={176}
                        stroke={redTone}
                        strokeWidth={2.5}
                        strokeDasharray="3 3"
                    />
                    {/* 500 rps line (y=176) */}
                    <line
                        x1={185}
                        y1={176}
                        x2={370}
                        y2={176}
                        stroke={greenTone}
                        strokeWidth={2.5}
                    />

                    {/* 600 rps capacity line (y=144) */}
                    <line
                        x1={110}
                        y1={144}
                        x2={370}
                        y2={144}
                        stroke={blueTone}
                        strokeWidth={2}
                        strokeDasharray="4 2"
                    />

                    {/* Axis line */}
                    <line x1={110} y1={188} x2={370} y2={188} stroke={stroke} strokeWidth={1} />
                    <line x1={185} y1={184} x2={185} y2={192} stroke={stroke} strokeWidth={1} />
                    <line x1={370} y1={184} x2={370} y2={192} stroke={stroke} strokeWidth={1} />

                    {/* Right Panel */}
                    <rect
                        x={445}
                        y={70}
                        width={375}
                        height={262}
                        rx={8}
                        fill={theme === 'dark' ? '#181224' : '#faf5ff'}
                        stroke={stroke}
                        strokeWidth={1}
                    />

                    {/* Bottom Invariant Panel */}
                    <rect
                        x={40}
                        y={344}
                        width={780}
                        height={124}
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
                'Queue Backlog Dynamics & Overload Recovery',
                20,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                40,
                48,
                780,
                'Why a brief 20-second surge creates a prolonged 60-second recovery tail under fixed serving capacity',
                13,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Left Plot Header */}
            {label(
                40,
                80,
                380,
                'FLUID QUEUE DYNAMICS: 20s SURGE → 60s DRAIN',
                11,
                blueTone,
                'left',
                700,
            )}

            {/* Plot Axis Labels */}
            {label(45, 108, 60, '900 rps', 10, redTone, 'right', 600)}
            {label(45, 140, 60, '600 rps', 10, blueTone, 'right', 600)}
            {label(45, 172, 60, '500 rps', 10, greenTone, 'right', 600)}
            {label(110, 192, 40, 't=0s', 10, c.textMuted, 'center', 500)}
            {label(180, 192, 50, 't=20s (Peak)', 10, warmTone, 'center', 600)}
            {label(350, 192, 50, 't=80s (Clear)', 10, greenTone, 'center', 600)}

            {/* Queue Depth Metric Callouts */}
            {label(40, 222, 380, 'Accumulation Phase (0s - 20s):', 11, redTone, 'left', 700)}
            {label(
                40,
                238,
                380,
                'Arrival (900) - Capacity (600) = +300 items/s → Peak: 6,000 items',
                10,
                c.textPrimary,
                'left',
                400,
            )}

            {label(40, 264, 380, 'Drain Recovery Phase (20s - 80s):', 11, greenTone, 'left', 700)}
            {label(
                40,
                280,
                380,
                'Capacity (600) - Normal (500) = 100 items/s drain → 60s to empty queue',
                10,
                c.textPrimary,
                'left',
                400,
            )}

            {/* Right Panel: Defense Strategy */}
            {label(
                452,
                80,
                360,
                'OVERLOAD MITIGATION & LOAD SHEDDING',
                11,
                purpleTone,
                'left',
                700,
            )}

            {label(
                452,
                106,
                360,
                '1. The Asymmetric Recovery Trap',
                12,
                c.textPrimary,
                'left',
                700,
            )}
            {label(
                452,
                124,
                360,
                'When offered load exceeds serving capacity, queue delay explodes non-linearly. Micro-batch tuning cannot fix a structural deficit; clearing the backlog takes 3× the surge duration.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(452, 174, 360, '2. Priority Load Shedding', 12, warmTone, 'left', 700)}
            {label(
                452,
                192,
                360,
                'When queue depth exceeds 2,000 items, the dispatcher sheds low-severity background tasks (historical scans, profile badge audits) to protect live chat throughput.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {label(
                452,
                246,
                360,
                '3. Dynamic Degradation (Cascade Bypassing)',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                452,
                264,
                360,
                'Under red-line load, Stage 2 borderline items bypass Stage 3 LLM inference, falling back to conservative threshold decisions or fast asynchronous quarantine.',
                10,
                c.textSecondary,
                'left',
                400,
            )}

            {/* Bottom Guardrail Panel */}
            {label(
                52,
                356,
                756,
                'System Reliability & Autoscaling Invariants',
                12,
                blueTone,
                'left',
                700,
            )}
            {label(
                52,
                380,
                756,
                '1. Expire queued chat items > 150 ms. · 2. Keep warm GPU headroom for 90-180s node boot lag. · 3. Shed excess load with HTTP 429.',
                11,
                c.textSecondary,
                'left',
                400,
            )}
        </Board>
    )
}

export default create()
