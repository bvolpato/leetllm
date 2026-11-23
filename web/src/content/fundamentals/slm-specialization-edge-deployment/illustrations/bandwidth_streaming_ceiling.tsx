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
export const height = 820
export const alt =
    'The same 3.8 billion active matrix weights stream over a hypothetical 50 GB/s bus. One full read occupies 3.8 GB at 8 bits and 1.9 GB at 4 bits, producing conditional ceilings of 13.2 and 26.3 tokens per second on one shared scale. The 18-token-per-second target falls between them. Packet widths use the byte counts and the rate markers use the displayed calculations.'

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

const activeWeightsB = 3.8
const bandwidthGBps = 50
const rateTarget = 18
const candidates = [
    {
        bits: 8,
        bytesGB: activeWeightsB,
        rate: bandwidthGBps / activeWeightsB,
        tone: 'warm' as const,
    },
    {
        bits: 4,
        bytesGB: (activeWeightsB * 4) / 8,
        rate: bandwidthGBps / ((activeWeightsB * 4) / 8),
        tone: 'green' as const,
    },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const structural = getReadableToneColor('neutral', c, c.bg)
    const amber = getReadableToneColor('warm', c, c.bg)
    const teal = getReadableToneColor('cyan', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const axisX = 180
    const axisWidth = 960
    const rateX = (rate: number) => axisX + (rate / 30) * axisWidth
    const targetX = rateX(rateTarget)
    const packetX = 840
    const packetScale = 92

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox="0 0 1280 820">
                    <defs>
                        <marker
                            id="bus-arrow"
                            markerWidth="18"
                            markerHeight="18"
                            refX="15"
                            refY="9"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                        >
                            <path d="M2 2 L16 9 L2 16 Z" fill={teal} />
                        </marker>
                    </defs>
                    <rect
                        x="64"
                        y="160"
                        width="340"
                        height="232"
                        rx="24"
                        fill={c.bgSubtle}
                        stroke={c.borderLight}
                        strokeWidth="3"
                    />
                    {Array.from({ length: 48 }, (_, i) => {
                        const col = i % 8
                        const row = Math.floor(i / 8)
                        const x = 92 + col * 35
                        const y = 196 + row * 24
                        return (
                            <rect
                                key={'weight-' + i}
                                x={x}
                                y={y}
                                width="25"
                                height="14"
                                rx="4"
                                fill={getToneFill('blue', c)}
                                stroke={getReadableToneColor('blue', c, c.bg)}
                                strokeWidth="1.5"
                            />
                        )
                    })}
                    <path
                        d="M406 276 H507"
                        fill="none"
                        stroke={teal}
                        strokeWidth="8"
                        strokeLinecap="round"
                        markerEnd="url(#bus-arrow)"
                    />
                    <rect
                        x="510"
                        y="160"
                        width="276"
                        height="232"
                        rx="26"
                        fill={getToneFill('cyan', c)}
                        stroke={teal}
                        strokeWidth="4"
                    />
                    <path
                        d="M550 228 H746 M550 320 H746"
                        stroke={teal}
                        strokeWidth="5"
                        strokeLinecap="round"
                        opacity="0.58"
                    />
                    {candidates.map((item, index) => {
                        const y = index === 0 ? 202 : 372
                        const w = item.bytesGB * packetScale
                        const fill =
                            item.bits === 8 ? getToneFill('warm', c) : getToneFill('green', c)
                        const stroke = item.bits === 8 ? amber : green
                        return (
                            <g key={'packet-' + item.bits}>
                                <rect
                                    x={packetX}
                                    y={y}
                                    width={w}
                                    height="62"
                                    rx="14"
                                    fill={fill}
                                    stroke={stroke}
                                    strokeWidth="4"
                                />
                                {Array.from({ length: item.bits === 8 ? 11 : 6 }, (_, j) => {
                                    const partW = w / (item.bits === 8 ? 11 : 6)
                                    return (
                                        <path
                                            key={'packet-part-' + j}
                                            d={
                                                'M' +
                                                (packetX + partW * j) +
                                                ' ' +
                                                (y + 8) +
                                                ' V' +
                                                (y + 54)
                                            }
                                            stroke={stroke}
                                            strokeWidth="2"
                                            opacity="0.45"
                                        />
                                    )
                                })}
                            </g>
                        )
                    })}
                    <path
                        d={'M' + axisX + ' 675 H' + (axisX + axisWidth)}
                        fill="none"
                        stroke={structural}
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                    {[0, 10, 18, 20, 30].map((tick) => {
                        const x = rateX(tick)
                        return (
                            <g key={'tick-' + tick}>
                                <path
                                    d={'M' + x + ' 665 V687'}
                                    stroke={tick === rateTarget ? amber : c.textMuted}
                                    strokeWidth={tick === rateTarget ? 4 : 3}
                                />
                                <path d={'M' + x + ' 672 V679'} stroke={c.bg} strokeWidth="1" />
                            </g>
                        )
                    })}
                    <path
                        d={'M' + targetX + ' 585 V691'}
                        stroke={amber}
                        strokeWidth="5"
                        strokeDasharray="12 10"
                    />
                    <path
                        d={'M' + rateX(candidates[0].rate) + ' 630 V675'}
                        stroke={amber}
                        strokeWidth="4"
                    />
                    <path
                        d={'M' + rateX(candidates[1].rate) + ' 630 V675'}
                        stroke={green}
                        strokeWidth="4"
                    />
                    <circle
                        cx={rateX(candidates[0].rate)}
                        cy="630"
                        r="13"
                        fill={amber}
                        stroke={c.bg}
                        strokeWidth="4"
                    />
                    <circle
                        cx={rateX(candidates[1].rate)}
                        cy="630"
                        r="13"
                        fill={green}
                        stroke={c.bg}
                        strokeWidth="4"
                    />
                    <path d="M64 494 H1216" stroke={c.borderSubtle} strokeWidth="2" />
                </svg>
            </CanvasItem>
            {label(c, 52, 22, 1176, 58, 'Two weight formats, two streaming ceilings', 50, 760)}
            {label(c, 80, 98, 308, 52, '3.8B weights', 44, 760)}
            {label(c, 84, 336, 320, 50, '1 read / token', 42, 600, c.textMuted)}
            {label(c, 514, 174, 268, 46, 'MEMORY', 44, 760)}
            {label(c, 514, 238, 268, 56, '50 GB/s', 50, 800, teal)}
            {label(c, 514, 332, 268, 48, 'assumed', 42, 600, c.textMuted)}
            {label(c, 802, 142, 420, 50, '8-bit stream', 44, 760, amber, 'left')}
            {label(c, 802, 268, 430, 46, '3.8 GB / read', 42, 650, c.textPrimary, 'left')}
            {label(c, 802, 322, 430, 50, '4-bit stream', 44, 760, green, 'left')}
            {label(c, 802, 438, 430, 42, '1.9 GB / read', 42, 650, c.textPrimary, 'left')}
            {label(
                c,
                72,
                502,
                1090,
                46,
                '50 GB/s · one read · common 0–30 t/s scale',
                42,
                650,
                c.textMuted,
            )}
            {label(c, axisX - 20, 697, 46, 46, '0', 42, 650)}
            {label(c, rateX(10) - 30, 697, 60, 46, '10', 42, 650)}
            {label(c, rateX(20) - 30, 697, 60, 46, '20', 42, 650)}
            {label(c, rateX(30) - 38, 697, 76, 46, '30', 42, 650)}
            {label(c, rateX(candidates[0].rate) - 90, 560, 180, 46, '13.2 t/s', 44, 800, amber)}
            {label(c, rateX(candidates[1].rate) - 90, 560, 180, 46, '26.3 t/s', 44, 800, green)}
            {label(c, targetX - 120, 760, 240, 46, '18 t/s gate', 42, 720, amber)}
        </Board>
    )
}

export default create('dark')
