import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableColor,
    withColorAlpha,
} from 'vizmatic'

export const width = 740
export const height = 490
export const opaqueBackground = false

export const alt =
    'Quadrant chart plotting four inference tiers by p95 latency (seconds) versus solve accuracy, with a 4.5s latency SLO and 80% accuracy floor. Single-pass (0.2s, 56%) and Low Bo4 (1.4s, 74%) fall below quality; Deep PRM (11.5s, 93%) exceeds latency; Med Rev (3.8s, 87%) sits in the feasible Pareto region.'

const illustration = defineIllustration((base) => {
    const c = { ...base, shadow: 'transparent' }
    const positive = getReadableColor('positive', c)
    const warning = getReadableColor('warning', c)
    const critical = getReadableColor('critical', c)
    const info = getReadableColor('info', c)

    const plotX = 86
    const plotY = 44
    const plotW = 630
    const plotH = 356

    const xMin = 0
    const xMax = 13.5
    const yMin = 0.45
    const yMax = 1.04

    const sx = (x: number) => plotX + ((x - xMin) / (xMax - xMin)) * plotW
    const sy = (y: number) => plotY + ((yMax - y) / (yMax - yMin)) * plotH

    const midX = sx(4.5)
    const midY = sy(0.8)

    const xTicks = [0, 4.5, 9, 13.5]
    const yTicks = [0.5, 0.65, 0.8, 1.0]

    const points = [
        {
            x: 0.2,
            y: 0.56,
            label: '1-Pass (0.2s, 56%)',
            color: critical,
            dx: 14,
            dy: -11,
            align: 'left' as const,
            labelW: 168,
        },
        {
            x: 1.4,
            y: 0.74,
            label: 'Bo4 (1.4s, 74%)',
            color: info,
            dx: 14,
            dy: -11,
            align: 'left' as const,
            labelW: 150,
        },
        {
            x: 3.8,
            y: 0.87,
            label: 'Rev (3.8s, 87%)',
            color: positive,
            dx: -164,
            dy: -11,
            align: 'right' as const,
            labelW: 150,
        },
        {
            x: 11.5,
            y: 0.93,
            label: 'PRM (11.5s, 93%)',
            color: warning,
            dx: -180,
            dy: -11,
            align: 'right' as const,
            labelW: 166,
        },
    ]

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Four quadrant fills */}
                        <rect
                            x={plotX}
                            y={plotY}
                            width={midX - plotX}
                            height={midY - plotY}
                            fill={withColorAlpha(positive, 0.16)}
                            stroke={positive}
                            strokeWidth={2}
                        />
                        <rect
                            x={midX}
                            y={plotY}
                            width={plotX + plotW - midX}
                            height={midY - plotY}
                            fill={withColorAlpha(warning, 0.1)}
                        />
                        <rect
                            x={plotX}
                            y={midY}
                            width={midX - plotX}
                            height={plotY + plotH - midY}
                            fill={withColorAlpha(critical, 0.1)}
                        />
                        <rect
                            x={midX}
                            y={midY}
                            width={plotX + plotW - midX}
                            height={plotY + plotH - midY}
                            fill={withColorAlpha(c.border, 0.16)}
                        />

                        {/* Plot outer border */}
                        <rect
                            x={plotX}
                            y={plotY}
                            width={plotW}
                            height={plotH}
                            rx={6}
                            fill="none"
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />

                        {/* Threshold lines */}
                        <line
                            x1={midX}
                            y1={plotY}
                            x2={midX}
                            y2={plotY + plotH}
                            stroke={c.textMuted}
                            strokeWidth={1.5}
                            strokeDasharray="5 4"
                        />
                        <line
                            x1={plotX}
                            y1={midY}
                            x2={plotX + plotW}
                            y2={midY}
                            stroke={c.textMuted}
                            strokeWidth={1.5}
                            strokeDasharray="5 4"
                        />

                        {/* Axis ticks */}
                        {xTicks.map((t) => (
                            <line
                                key={`xt-${t}`}
                                x1={sx(t)}
                                y1={plotY + plotH}
                                x2={sx(t)}
                                y2={plotY + plotH + 6}
                                stroke={c.textMuted}
                                strokeWidth={1.25}
                            />
                        ))}
                        {yTicks.map((t) => (
                            <line
                                key={`yt-${t}`}
                                x1={plotX - 6}
                                y1={sy(t)}
                                x2={plotX}
                                y2={sy(t)}
                                stroke={c.textMuted}
                                strokeWidth={1.25}
                            />
                        ))}

                        {/* Data points */}
                        {points.map((p) => (
                            <circle
                                key={`pt-${p.label}`}
                                cx={sx(p.x)}
                                cy={sy(p.y)}
                                r={8}
                                fill={p.color}
                                stroke={c.bgCard}
                                strokeWidth={3}
                            />
                        ))}
                    </svg>
                </CanvasItem>

                {/* Horizontal Y-axis title at top left (avoids rotated bbox overlap) */}
                <CanvasItem x={12} y={12} width={150} height={24}>
                    <TextLabel
                        c={c}
                        text="Accuracy (%)"
                        width="100%"
                        fontSize={17}
                        fontWeight={700}
                        color={c.textPrimary}
                    />
                </CanvasItem>

                {/* Threshold callout at top right of SLO line */}
                <CanvasItem x={midX + 8} y={12} width={150} height={24}>
                    <TextLabel
                        c={c}
                        text="4.5s SLO cutoff"
                        width="100%"
                        fontSize={16}
                        fontWeight={700}
                        color={c.textSecondary}
                    />
                </CanvasItem>

                {/* Quadrant region labels */}
                <CanvasItem x={plotX + 8} y={plotY + 12} width={midX - plotX - 16} height={24}>
                    <TextLabel
                        c={c}
                        text="Feasible SLO"
                        width="100%"
                        fontSize={17}
                        fontWeight={800}
                        color={positive}
                        align="center"
                    />
                </CanvasItem>
                <CanvasItem x={midX + 12} y={plotY + 12} width={plotX + plotW - midX - 24} height={24}>
                    <TextLabel
                        c={c}
                        text="Over Latency"
                        width="100%"
                        fontSize={17}
                        fontWeight={800}
                        color={warning}
                        align="center"
                    />
                </CanvasItem>
                <CanvasItem x={plotX + 8} y={plotY + plotH - 36} width={midX - plotX - 16} height={24}>
                    <TextLabel
                        c={c}
                        text="Under Quality"
                        width="100%"
                        fontSize={17}
                        fontWeight={800}
                        color={critical}
                        align="center"
                    />
                </CanvasItem>
                <CanvasItem x={midX + 12} y={plotY + plotH - 36} width={plotX + plotW - midX - 24} height={24}>
                    <TextLabel
                        c={c}
                        text="Suboptimal"
                        width="100%"
                        fontSize={17}
                        fontWeight={800}
                        color={c.textMuted}
                        align="center"
                    />
                </CanvasItem>

                {/* 80% floor note on right edge */}
                <CanvasItem x={plotX + plotW - 126} y={midY + 8} width={116} height={24}>
                    <TextLabel
                        c={c}
                        text="80% floor"
                        width="100%"
                        fontSize={16}
                        fontWeight={700}
                        color={c.textSecondary}
                        align="right"
                    />
                </CanvasItem>

                {/* Point labels */}
                {points.map((p) => (
                    <CanvasItem
                        key={`plbl-${p.label}`}
                        x={sx(p.x) + p.dx}
                        y={sy(p.y) + p.dy}
                        width={p.labelW}
                        height={24}
                    >
                        <TextLabel
                            c={c}
                            text={p.label}
                            width="100%"
                            fontSize={16}
                            fontWeight={700}
                            color={p.color}
                            align={p.align}
                        />
                    </CanvasItem>
                ))}

                {/* Y-axis tick labels */}
                {yTicks.map((t) => (
                    <CanvasItem key={`ylbl-${t}`} x={12} y={sy(t) - 11} width={62} height={22}>
                        <TextLabel
                            c={c}
                            text={`${Math.round(t * 100)}%`}
                            width="100%"
                            fontSize={16}
                            mono
                            color={t === 0.8 ? c.textPrimary : c.textMuted}
                            fontWeight={t === 0.8 ? 700 : 500}
                            align="right"
                        />
                    </CanvasItem>
                ))}

                {/* X-axis tick labels */}
                {xTicks.map((t, i) => {
                    const align = i === 0 ? 'left' : i === xTicks.length - 1 ? 'right' : 'center'
                    const xPos = i === 0 ? sx(t) : i === xTicks.length - 1 ? sx(t) - 64 : sx(t) - 32
                    return (
                        <CanvasItem key={`xlbl-${t}`} x={xPos} y={plotY + plotH + 12} width={64} height={24}>
                            <TextLabel
                                c={c}
                                text={`${t}s`}
                                width="100%"
                                fontSize={16}
                                mono
                                color={t === 4.5 ? c.textPrimary : c.textMuted}
                                fontWeight={t === 4.5 ? 700 : 500}
                                align={align}
                            />
                        </CanvasItem>
                    )
                })}

                {/* X-axis title */}
                <CanvasItem x={plotX} y={plotY + plotH + 46} width={plotW} height={26}>
                    <TextLabel
                        c={c}
                        text="p95 Latency (s)"
                        width="100%"
                        fontSize={17}
                        fontWeight={700}
                        color={c.textPrimary}
                        align="center"
                    />
                </CanvasItem>
            </Board>
        </Scene>
    )
})

export const { create } = illustration
export default illustration.default
