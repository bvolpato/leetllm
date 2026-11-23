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
    'With 16 concurrent streams and a 64-position budget, depth K asks for K+1 positions per stream. K=0 and K=2 request 16 and 48 positions and fit. K=4 and K=8 request 80 and 144, exceeding capacity. Their expected yields are 16, 39.04, 53.7856, and 69.26258 tokens under conditional acceptance .8; yield does not change the number of positions scheduled.'

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
const cases = [
    { depth: 0, positions: 16, yield: 16 },
    { depth: 2, positions: 48, yield: 39.04 },
    { depth: 4, positions: 80, yield: 53.7856 },
    { depth: 8, positions: 144, yield: 69.26258 },
]

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const fit = getReadableToneColor('green', c, c.bg)
    const excess = getReadableToneColor('critical', c, c.bg)
    const muted = c.textSecondary
    const x0 = 390
    const chartW = 570
    const xAt = (positions: number) => x0 + (positions / 144) * chartW
    const capX = xAt(64)
    const ys = [330, 425, 520, 615]
    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <VectorSegment
                        x1={x0}
                        y1={244}
                        x2={xAt(144)}
                        y2={244}
                        color={muted}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    {[0, 64, 144].map((v) => (
                        <React.Fragment key={v}>
                            <VectorSegment
                                x1={xAt(v)}
                                y1={236}
                                x2={xAt(v)}
                                y2={252}
                                color={v === 64 ? excess : muted}
                                strokeWidth={3}
                                showEndDot={false}
                            />
                        </React.Fragment>
                    ))}
                    <VectorSegment
                        x1={capX}
                        y1={310}
                        x2={capX}
                        y2={673}
                        color={excess}
                        strokeWidth={5}
                        showEndDot={false}
                    />
                </svg>
            </CanvasItem>
            {label(
                c,
                48,
                20,
                1330,
                'Verification capacity counts positions',
                60,
                c.textPrimary,
                800,
            )}
            {label(
                c,
                50,
                94,
                1320,
                'Sixteen streams share 64 slots; yield is a separate quantity.',
                48,
                muted,
                550,
            )}
            {label(c, 50, 170, 310, 'Draft depth K', 48, muted, 700)}
            {label(c, 390, 170, 570, 'Requested positions', 48, muted, 700)}
            {label(c, 970, 170, 190, 'Slots', 48, muted, 700)}
            {label(c, 1165, 170, 255, 'Yield', 48, muted, 700)}
            {center(c, x0 - 45, 255, 90, '0', 48, muted, 600)}
            {center(c, capX - 48, 255, 96, '64', 48, excess, 700)}
            {center(c, xAt(144) - 55, 255, 110, '144', 48, muted, 600)}
            {cases.map(({ depth, positions, yield: emitted }, i) => {
                const y = ys[i]
                const fitEnd = Math.min(positions, 64)
                const over = Math.max(positions - 64, 0)
                return (
                    <React.Fragment key={depth}>
                        {label(c, 50, y - 8, 300, `K = ${depth}`, 50, c.textPrimary, 700)}
                        <CanvasItem x={x0} y={y} width={xAt(fitEnd) - x0} height={38}>
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 19,
                                    backgroundColor: fit,
                                }}
                            />
                        </CanvasItem>
                        {over > 0 && (
                            <CanvasItem x={capX} y={y} width={xAt(positions) - capX} height={38}>
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 19,
                                        backgroundColor: excess,
                                    }}
                                />
                            </CanvasItem>
                        )}
                        {center(
                            c,
                            970,
                            y - 9,
                            190,
                            String(positions),
                            48,
                            positions <= 64 ? fit : excess,
                            750,
                        )}
                        {center(c, 1165, y - 9, 255, emitted.toString(), 48, c.textPrimary, 700)}
                    </React.Fragment>
                )
            })}
            {label(c, 970, 700, 440, 'Red = over cap.', 48, excess, 650)}
        </Board>
    )
}

export default create()
