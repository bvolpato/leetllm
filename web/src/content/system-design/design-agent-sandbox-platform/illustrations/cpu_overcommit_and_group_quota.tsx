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
    'The declared worksheet has 128 physical cores and 30 one-vCPU sessions per core, giving 3840 configured vCPUs. On one zero-to-3840 core-equivalent demand scale, physical capacity is 128, assumed mean demand at 3 percent duty is 115.2, and synchronized runnable demand is 3840. The mean does not determine queueing or p99. Separately, one VMM fair-class cgroup with cpu.max 100000 100000 receives an aggregate 100000 microseconds per 100000-microsecond period. An illustrative split has thread 1 consume 60000 and thread 2 consume 40000 from that one shared budget, separated at the exact 60000 point. Guest process limits and host pids.max are separate controls.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const stroke = c.border
    const overcommitTone = getReadableToneColor('blue', c, c.bg)
    const quotaTone = getReadableToneColor('warm', c, c.bg)
    const alertTone = getReadableToneColor('critical', c, c.bg)
    const safeTone = getReadableToneColor('green', c, c.bg)

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
                    {/* Left: Overcommit Analysis */}
                    <rect
                        x={24}
                        y={60}
                        width={384}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />

                    {/* Bar 1: Physical Cores */}
                    <rect
                        x={44}
                        y={150}
                        width={344}
                        height={32}
                        rx={4}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={44}
                        y={150}
                        width={80}
                        height={32}
                        rx={4}
                        fill={safeTone}
                        opacity={0.8}
                    />

                    {/* Bar 2: Mean 3% Duty */}
                    <rect
                        x={44}
                        y={240}
                        width={344}
                        height={32}
                        rx={4}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={44}
                        y={240}
                        width={72}
                        height={32}
                        rx={4}
                        fill={overcommitTone}
                        opacity={0.8}
                    />

                    {/* Bar 3: Peak Synchronized */}
                    <rect
                        x={44}
                        y={330}
                        width={344}
                        height={32}
                        rx={4}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                    <rect
                        x={44}
                        y={330}
                        width={344}
                        height={32}
                        rx={4}
                        fill={alertTone}
                        opacity={0.8}
                    />

                    {/* Right: cgroup Quota Enforcement */}
                    <rect
                        x={432}
                        y={60}
                        width={404}
                        height={416}
                        rx={8}
                        fill={c.bgCard}
                        stroke={stroke}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={452}
                        y={150}
                        width={364}
                        height={70}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={quotaTone}
                        strokeWidth={1.5}
                    />

                    {/* Period Budget Split: 60ms T1 + 40ms T2 */}
                    <rect
                        x={462}
                        y={170}
                        width={206}
                        height={36}
                        rx={4}
                        fill={overcommitTone}
                        opacity={0.85}
                    />
                    <rect
                        x={672}
                        y={170}
                        width={134}
                        height={36}
                        rx={4}
                        fill={quotaTone}
                        opacity={0.85}
                    />

                    {/* Lower cgroup rules panel */}
                    <rect
                        x={452}
                        y={250}
                        width={364}
                        height={206}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={stroke}
                        strokeWidth={1}
                    />
                </svg>
            </CanvasItem>

            {/* Title */}
            {label(
                24,
                20,
                812,
                'CPU Overcommit Mechanics & CFS cgroup Quotas',
                22,
                c.textPrimary,
                'left',
                700,
            )}

            {/* Left Header */}
            {label(
                36,
                75,
                360,
                '128 Cores · 3,840 vCPUs (30× Overcommit)',
                17,
                overcommitTone,
                'left',
                700,
            )}
            {label(
                36,
                100,
                360,
                '128 physical host cores hosting 3,840 single-vCPU guests',
                13,
                c.textMuted,
            )}

            {/* Bar 1 Labels */}
            {label(44, 128, 200, 'Physical Host Cores', 14, safeTone, 'left', 650)}
            {label(280, 128, 108, '128 cores', 14, safeTone, 'right', 650)}

            {/* Bar 2 Labels */}
            {label(44, 218, 200, 'Assumed Mean Demand (3% duty)', 14, overcommitTone, 'left', 650)}
            {label(280, 218, 108, '115.2 cores', 14, overcommitTone, 'right', 650)}

            {/* Bar 3 Labels */}
            {label(44, 308, 200, 'Worst-Case Synchronized Burst', 14, alertTone, 'left', 650)}
            {label(280, 308, 108, '3,840 cores', 14, alertTone, 'right', 650)}

            {/* Overcommit Footer Callout */}
            {label(
                44,
                390,
                344,
                'Mean load fits in 128 cores, but synchronized bursts trigger severe queueing.',
                13,
                c.textPrimary,
                'left',
                500,
            )}
            {label(
                44,
                430,
                344,
                'Mean duty cannot predict tail p99 scheduling latency.',
                12,
                alertTone,
                'left',
                600,
            )}

            {/* Right Header */}
            {label(
                452,
                75,
                364,
                'CFS Hard Limits: cpu.max = 100000 100000',
                17,
                quotaTone,
                'left',
                700,
            )}
            {label(
                452,
                100,
                364,
                '100,000 µs (100ms) aggregate execution per 100ms period',
                13,
                c.textMuted,
            )}

            {/* Budget Bar Labels */}
            {label(472, 178, 186, 'Thread 1: 60,000 µs (60ms)', 13, c.textPrimary, 'center', 600)}
            {label(676, 178, 126, 'Thread 2: 40ms', 13, c.textPrimary, 'center', 600)}
            {label(
                452,
                226,
                364,
                'Total: 100,000 µs used → throttled until next CFS period',
                12,
                quotaTone,
                'center',
            )}

            {/* CFS Rules List */}
            {label(
                468,
                265,
                332,
                'Host vs Guest Enforcement Boundaries',
                15,
                c.textPrimary,
                'left',
                650,
            )}
            {label(
                468,
                295,
                332,
                '• cpu.max throttles microVM hypervisor vCPU threads',
                13,
                c.textMuted,
            )}
            {label(
                468,
                320,
                332,
                '• Prevents noisy neighbour CPU starvation on host cores',
                13,
                c.textMuted,
            )}
            {label(
                468,
                345,
                332,
                '• Host pids.max caps total thread count per sandbox',
                13,
                c.textMuted,
            )}
            {label(
                468,
                370,
                332,
                '• Guest ulimit caps inside VM; host cgroup caps externally',
                13,
                c.textMuted,
            )}
            {label(
                468,
                410,
                332,
                'Dual-layer limits prevent fork bombs and runaway spinloops',
                13,
                safeTone,
                'left',
                600,
            )}
        </Board>
    )
}

export default create('dark')
