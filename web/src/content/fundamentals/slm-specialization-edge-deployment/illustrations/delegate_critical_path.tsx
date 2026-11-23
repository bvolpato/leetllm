import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 1280
export const height = 900
export const alt =
    'Three conceptual execution paths run the same operation order. A split delegate sends operation 1 to the NPU, operation 2 to CPU fallback, and operation 3 back to the NPU, with synchronization and layout or materialization boundaries where required. A supported partition keeps operations together on the NPU; a CPU path keeps them together on CPU. The diagram shows execution order and boundary types without timing data or a required private-memory copy.'

const label = (
    c: ReturnType<typeof getThemeColors>,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    fontSize = 42,
    fontWeight = 600,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'center',
) => (
    <CanvasItem x={x} y={y} width={w} height={h}>
        <TextLabel
            c={c}
            text={text}
            width="100%"
            fontSize={fontSize}
            fontWeight={fontWeight}
            color={color}
            align={align}
            math={false}
        />
    </CanvasItem>
)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const structural = getReadableToneColor('neutral', c, c.bg)
    const npu = getReadableToneColor('blue', c, c.bg)
    const cpu = getReadableToneColor('warm', c, c.bg)
    const overhead = getReadableToneColor('critical', c, c.bg)
    const npuCellText = getReadableToneColor('blue', c, getToneFill('blue', c))
    const cpuCellText = getReadableToneColor('warm', c, getToneFill('warm', c))

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox="0 0 1280 900">
                    <defs>
                        <marker
                            id="partition-arrow"
                            markerWidth="16"
                            markerHeight="16"
                            refX="13"
                            refY="8"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                        >
                            <path d="M1 1 L14 8 L1 15 Z" fill={structural} />
                        </marker>
                        <marker
                            id="npu-arrow"
                            markerWidth="16"
                            markerHeight="16"
                            refX="13"
                            refY="8"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                        >
                            <path d="M1 1 L14 8 L1 15 Z" fill={npuCellText} />
                        </marker>
                        <marker
                            id="cpu-arrow"
                            markerWidth="16"
                            markerHeight="16"
                            refX="13"
                            refY="8"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                        >
                            <path d="M1 1 L14 8 L1 15 Z" fill={cpuCellText} />
                        </marker>
                    </defs>
                    <rect
                        x="278"
                        y="206"
                        width="778"
                        height="172"
                        rx="28"
                        fill="none"
                        stroke={overhead}
                        strokeWidth="4"
                        strokeDasharray="12 9"
                    />
                    <rect
                        x="278"
                        y="418"
                        width="778"
                        height="126"
                        rx="28"
                        fill={getToneFill('blue', c)}
                        stroke={npu}
                        strokeWidth="4"
                    />
                    <rect
                        x="278"
                        y="630"
                        width="778"
                        height="126"
                        rx="28"
                        fill={getToneFill('warm', c)}
                        stroke={cpu}
                        strokeWidth="4"
                    />
                    <path
                        d="M414 269 H515"
                        stroke={structural}
                        strokeWidth="5"
                        markerEnd="url(#partition-arrow)"
                    />
                    <path
                        d="M630 269 H715"
                        stroke={structural}
                        strokeWidth="5"
                        markerEnd="url(#partition-arrow)"
                    />
                    <path
                        d="M478 481 H545"
                        stroke={npu}
                        strokeWidth="5"
                        markerEnd="url(#npu-arrow)"
                    />
                    <path
                        d="M700 481 H767"
                        stroke={npu}
                        strokeWidth="5"
                        markerEnd="url(#npu-arrow)"
                    />
                    <path
                        d="M478 693 H545"
                        stroke={cpu}
                        strokeWidth="5"
                        markerEnd="url(#cpu-arrow)"
                    />
                    <path
                        d="M700 693 H767"
                        stroke={cpu}
                        strokeWidth="5"
                        markerEnd="url(#cpu-arrow)"
                    />
                    <rect
                        x="302"
                        y="228"
                        width="110"
                        height="82"
                        rx="16"
                        fill={getToneFill('blue', c)}
                        stroke={npu}
                        strokeWidth="3"
                    />
                    <rect
                        x="518"
                        y="228"
                        width="110"
                        height="82"
                        rx="16"
                        fill={getToneFill('warm', c)}
                        stroke={cpu}
                        strokeWidth="3"
                    />
                    <rect
                        x="718"
                        y="228"
                        width="110"
                        height="82"
                        rx="16"
                        fill={getToneFill('blue', c)}
                        stroke={npu}
                        strokeWidth="3"
                    />
                    <path d="M488 215 V323 M698 215 V323" stroke={overhead} strokeWidth="6" />
                    <path
                        d="M482 206 L494 218 M694 206 L706 218"
                        stroke={overhead}
                        strokeWidth="6"
                    />
                    <rect
                        x="326"
                        y="440"
                        width="150"
                        height="82"
                        rx="16"
                        fill={getToneFill('blue', c)}
                        stroke={npu}
                        strokeWidth="3"
                    />
                    <rect
                        x="548"
                        y="440"
                        width="150"
                        height="82"
                        rx="16"
                        fill={getToneFill('blue', c)}
                        stroke={npu}
                        strokeWidth="3"
                    />
                    <rect
                        x="770"
                        y="440"
                        width="150"
                        height="82"
                        rx="16"
                        fill={getToneFill('blue', c)}
                        stroke={npu}
                        strokeWidth="3"
                    />
                    <rect
                        x="326"
                        y="652"
                        width="150"
                        height="82"
                        rx="16"
                        fill={getToneFill('warm', c)}
                        stroke={cpu}
                        strokeWidth="3"
                    />
                    <rect
                        x="548"
                        y="652"
                        width="150"
                        height="82"
                        rx="16"
                        fill={getToneFill('warm', c)}
                        stroke={cpu}
                        strokeWidth="3"
                    />
                    <rect
                        x="770"
                        y="652"
                        width="150"
                        height="82"
                        rx="16"
                        fill={getToneFill('warm', c)}
                        stroke={cpu}
                        strokeWidth="3"
                    />
                    <path d="M70 588 H1208" stroke={c.borderSubtle} strokeWidth="2" />
                </svg>
            </CanvasItem>
            {label(c, 40, 18, 1200, 58, 'Operator coverage leaves path latency unknown', 50, 780)}
            {label(
                c,
                50,
                88,
                1178,
                48,
                '98% mapped · measure the end-to-end critical path',
                42,
                650,
                c.textMuted,
            )}
            {label(c, 50, 205, 210, 48, 'SPLIT', 46, 760, overhead, 'left')}
            {label(c, 50, 257, 212, 48, 'NPU/CPU', 42, 650, c.textMuted, 'left')}
            {label(c, 302, 240, 110, 58, 'op 1', 44, 760, c.textPrimary)}
            {label(c, 518, 240, 110, 58, 'op 2', 44, 760, c.textPrimary)}
            {label(c, 718, 240, 110, 58, 'op 3', 44, 760, c.textPrimary)}
            {label(c, 300, 326, 170, 48, 'SYNC', 42, 700, overhead)}
            {label(c, 500, 326, 170, 48, 'LAYOUT', 42, 700, overhead)}
            {label(c, 710, 326, 320, 48, 'MATERIALIZE', 42, 700, overhead)}
            {label(c, 50, 432, 210, 48, 'NPU', 42, 760, npu, 'left')}
            {label(c, 50, 488, 212, 48, 'fused', 42, 620, c.textMuted, 'left')}
            {label(c, 326, 454, 150, 58, 'op 1', 44, 740, c.textPrimary)}
            {label(c, 548, 454, 150, 58, 'op 2', 44, 740, c.textPrimary)}
            {label(c, 770, 454, 150, 58, 'op 3', 44, 740, c.textPrimary)}
            {label(c, 50, 644, 210, 48, 'CPU', 44, 760, cpu, 'left')}
            {label(c, 50, 700, 212, 48, 'same', 42, 620, c.textMuted, 'left')}
            {label(c, 326, 666, 150, 58, 'op 1', 44, 740, c.textPrimary)}
            {label(c, 548, 666, 150, 58, 'op 2', 44, 740, c.textPrimary)}
            {label(c, 770, 666, 150, 58, 'op 3', 44, 740, c.textPrimary)}
            {label(
                c,
                50,
                772,
                1178,
                56,
                'Coverage counts ops; boundaries add critical-path work.',
                42,
                650,
                c.textMuted,
            )}
        </Board>
    )
}

export default create('dark')
