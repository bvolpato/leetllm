import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableColor,
} from 'vizmatic'

export const width = 720
export const height = 396
export const alt =
    'Three observed pass rates and 95 percent Wilson score intervals share a 0.4 to 1.0 axis. Three of three passes has a lower bound of 0.438 despite 1.00 observed accuracy. Forty-nine of fifty spans 0.895 to 0.996, and 990 of 1000 spans 0.982 to 0.995.'

const illustration = defineIllustration((base) => {
    const c = { ...base, shadow: 'transparent' }
    const plotX = 136
    const plotW = 540
    const plotTop = 24
    const plotBottom = 290
    const min = 0.4
    const max = 1.0
    const scaleX = (v: number) => plotX + ((v - min) / (max - min)) * plotW

    const ticks = [0.4, 0.55, 0.7, 0.85, 1.0]
    const rows = [
        {
            label: '3 / 3',
            low: 0.438,
            mid: 1.0,
            high: 1.0,
            midLabel: '1.00',
            rangeLabel: '0.438',
            rangeX: scaleX(0.438) - 4,
            rangeAlign: 'left' as const,
            rangeWidth: 88,
            color: getReadableColor('warning', c),
            y: 74,
        },
        {
            label: '49 / 50',
            low: 0.895,
            mid: 0.98,
            high: 0.996,
            midLabel: '0.98',
            rangeLabel: '0.895..0.996',
            rangeX: plotX + plotW - 156,
            rangeAlign: 'right' as const,
            rangeWidth: 164,
            color: getReadableColor('primary', c),
            y: 162,
        },
        {
            label: '990 / 1000',
            low: 0.982,
            mid: 0.99,
            high: 0.995,
            midLabel: '0.990',
            rangeLabel: '0.982..0.995',
            rangeX: plotX + plotW - 156,
            rangeAlign: 'right' as const,
            rangeWidth: 164,
            color: getReadableColor('positive', c),
            y: 250,
        },
    ]

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {ticks.map((tick) => {
                            const x = scaleX(tick)
                            return (
                                <line
                                    key={`tick-${tick}`}
                                    x1={x}
                                    y1={plotTop}
                                    x2={x}
                                    y2={plotBottom}
                                    stroke={c.borderSubtle}
                                    strokeWidth={1.2}
                                />
                            )
                        })}
                        <line
                            x1={plotX}
                            y1={plotBottom}
                            x2={plotX + plotW}
                            y2={plotBottom}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />
                        {rows.map((r) => (
                            <g key={`row-${r.label}`}>
                                <line
                                    x1={scaleX(r.low)}
                                    y1={r.y}
                                    x2={scaleX(r.high)}
                                    y2={r.y}
                                    stroke={r.color}
                                    strokeWidth={9}
                                    strokeLinecap="round"
                                    opacity={0.9}
                                />
                                <circle
                                    cx={scaleX(r.mid)}
                                    cy={r.y}
                                    r={10}
                                    fill={c.bgCard}
                                    stroke={r.color}
                                    strokeWidth={4}
                                />
                            </g>
                        ))}
                    </svg>
                </CanvasItem>

                {/* Row labels and numeric callouts */}
                {rows.map((r) => (
                    <React.Fragment key={`lbl-${r.label}`}>
                        <CanvasItem x={10} y={r.y - 13} width={114} height={26}>
                            <TextLabel
                                c={c}
                                text={r.label}
                                width="100%"
                                fontSize={18}
                                fontWeight={700}
                                color={c.textPrimary}
                                align="right"
                            />
                        </CanvasItem>
                        <CanvasItem x={plotX + plotW - 92} y={r.y - 36} width={96} height={24}>
                            <TextLabel
                                c={c}
                                text={r.midLabel}
                                width="100%"
                                fontSize={17}
                                fontWeight={700}
                                mono
                                color={c.textPrimary}
                                align="right"
                            />
                        </CanvasItem>
                        <CanvasItem x={r.rangeX} y={r.y + 18} width={r.rangeWidth} height={24}>
                            <TextLabel
                                c={c}
                                text={r.rangeLabel}
                                width="100%"
                                fontSize={16}
                                mono
                                color={c.textSecondary}
                                align={r.rangeAlign}
                            />
                        </CanvasItem>
                    </React.Fragment>
                ))}

                {/* X-axis tick labels */}
                {ticks.map((tick, idx) => {
                    const x = scaleX(tick)
                    const labelText = tick === 1 ? '1.00' : tick.toFixed(2)
                    const align =
                        idx === 0 ? 'left' : idx === ticks.length - 1 ? 'right' : 'center'
                    const xPos =
                        idx === 0 ? x : idx === ticks.length - 1 ? x - 64 : x - 32
                    return (
                        <CanvasItem key={`xtick-${tick}`} x={xPos} y={298} width={64} height={24}>
                            <TextLabel
                                c={c}
                                text={labelText}
                                width="100%"
                                fontSize={16}
                                mono
                                color={c.textMuted}
                                align={align}
                            />
                        </CanvasItem>
                    )
                })}

                {/* Axis title */}
                <CanvasItem x={plotX} y={330} width={plotW} height={26}>
                    <TextLabel
                        c={c}
                        text="95% Wilson interval (true pass rate)"
                        width="100%"
                        fontSize={17}
                        fontWeight={700}
                        color={c.textPrimary}
                        align="center"
                    />
                </CanvasItem>

                {/* Legend footer */}
                <CanvasItem x={plotX} y={362} width={plotW} height={24}>
                    <TextLabel
                        c={c}
                        text="Dot = observed rate; bar = 95% Wilson interval."
                        width="100%"
                        fontSize={16}
                        color={c.textSecondary}
                        align="center"
                    />
                </CanvasItem>
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
