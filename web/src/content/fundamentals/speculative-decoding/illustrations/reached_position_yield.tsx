import React from 'react'
import {
    Board,
    CanvasItem,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 1440
export const height = 800
export const alt =
    'Three depth-two rate schedules have the same arithmetic mean conditional acceptance, .50. Their ordered rates produce survival products .09, .25, and .09 after two proposals. Adding the guaranteed correction or bonus and each reached accepted proposal gives yields 1.99, 1.75, and 1.19 tokens per round.'

type Colors = ReturnType<typeof getThemeColors>
const label = (
    c: Colors,
    x: number,
    y: number,
    w: number,
    value: string,
    size = 48,
    color = c.textPrimary,
    weight = 650,
) => (
    <CanvasItem x={x} y={y} width={w} height={size + 12}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', height: '100%' }}>
            <span
                style={{
                    color,
                    fontFamily: c.fontSans,
                    fontSize: size,
                    fontWeight: weight,
                    lineHeight: 1.05,
                    whiteSpace: 'nowrap',
                }}
            >
                {value}
            </span>
        </div>
    </CanvasItem>
)
const center = (
    c: Colors,
    x: number,
    y: number,
    w: number,
    value: string,
    size = 48,
    color = c.textPrimary,
    weight = 650,
) => (
    <CanvasItem x={x} y={y} width={w} height={size + 12}>
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
            }}
        >
            <span
                style={{
                    color,
                    fontFamily: c.fontSans,
                    fontSize: size,
                    fontWeight: weight,
                    lineHeight: 1.05,
                    whiteSpace: 'nowrap',
                }}
            >
                {value}
            </span>
        </div>
    </CanvasItem>
)
const chip = (c: Colors, x: number, y: number, w: number, value: string, color: string) => (
    <CanvasItem x={x} y={y} width={w} height={62}>
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                borderRadius: 14,
                backgroundColor: c.bgCard,
                border: `3px solid ${color}`,
            }}
        >
            <span
                style={{
                    color,
                    fontFamily: c.fontSans,
                    fontSize: 48,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                }}
            >
                {value}
            </span>
        </div>
    </CanvasItem>
)
const cases = [
    { rates: [0.9, 0.1], label: '.90 → .10', survival: [0.9, 0.09], yield: 1.99 },
    { rates: [0.5, 0.5], label: '.50 → .50', survival: [0.5, 0.25], yield: 1.75 },
    { rates: [0.1, 0.9], label: '.10 → .90', survival: [0.1, 0.09], yield: 1.19 },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const first = getReadableToneColor('blue', c, c.bg)
    const second = getReadableToneColor('green', c, c.bg)
    const base = c.textSecondary
    const muted = c.textSecondary
    const chartX = 490
    const scale = 370
    const totalX = chartX + 2 * scale
    const ys = [260, 420, 580]
    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <VectorSegment
                        x1={chartX}
                        y1={700}
                        x2={totalX}
                        y2={700}
                        color={muted}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    {[0, 1, 2].map((value) => (
                        <React.Fragment key={value}>
                            <VectorSegment
                                x1={chartX + value * scale}
                                y1={692}
                                x2={chartX + value * scale}
                                y2={708}
                                color={muted}
                                strokeWidth={3}
                                showEndDot={false}
                            />
                        </React.Fragment>
                    ))}
                </svg>
            </CanvasItem>
            {label(c, 48, 20, 1330, 'Same mean, different token yield', 60, c.textPrimary, 800)}
            {label(
                c,
                50,
                94,
                1320,
                'Same mean α = .50; reached rates decide yield.',
                48,
                muted,
                550,
            )}
            {label(c, 55, 168, 400, 'RATE SEQUENCE', 48, muted, 750)}
            {label(c, 500, 168, 690, 'Yield = 1 + a₁ + a₁a₂', 48, muted, 750)}
            {cases.map(({ rates, survival, yield: amount }, i) => {
                const y = ys[i]
                const end1 = chartX + scale
                const end2 = end1 + survival[0] * scale
                const end3 = end2 + survival[1] * scale
                return (
                    <React.Fragment key={i}>
                        {chip(c, 56, y, 180, `a₁ ${rates[0].toFixed(2)}`, first)}
                        {chip(c, 254, y, 180, `a₂ ${rates[1].toFixed(2)}`, second)}
                        <CanvasItem x={chartX} y={y + 16} width={scale} height={32}>
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 16,
                                    backgroundColor: base,
                                }}
                            />
                        </CanvasItem>
                        <CanvasItem x={end1} y={y + 16} width={survival[0] * scale} height={32}>
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 16,
                                    backgroundColor: first,
                                }}
                            />
                        </CanvasItem>
                        <CanvasItem x={end2} y={y + 16} width={survival[1] * scale} height={32}>
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 16,
                                    backgroundColor: second,
                                }}
                            />
                        </CanvasItem>
                        {label(
                            c,
                            end3 + 10,
                            y + 1,
                            160,
                            `${amount.toFixed(2)}`,
                            48,
                            c.textPrimary,
                            750,
                        )}
                    </React.Fragment>
                )
            })}
            {label(c, 487, 714, 120, '0', 48, muted, 600)}
            {center(c, chartX + scale - 40, 714, 80, '1', 48, muted, 600)}
            {center(c, totalX - 40, 714, 80, '2', 48, muted, 600)}
        </Board>
    )
}

export default create()
