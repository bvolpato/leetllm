import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 1440
export const height = 800
export const alt =
    'Modeled speedup compares two verification-cost curves for alpha .8 and draft cost .1. Flat cost peaks at K=6 with 2.46964 times; rising cost peaks at K=5 with 2.10816 times. At K=5, a proportional bar splits 3.68928 expected emitted tokens into one correction or bonus and 2.68928 accepted-prefix tokens, the sum of 1, .8, .64, .512, .4096, and .32768.'

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

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const flat = getReadableToneColor('blue', c, c.bg)
    const growing = getReadableToneColor('warm', c, c.bg)
    const muted = c.textSecondary
    const x0 = 100
    const xAt = (k: number) => x0 + k * 60
    const y0 = 510
    const yAt = (value: number) => y0 - (value / 2.6) * 240
    const ks = Array.from({ length: 10 }, (_, i) => i + 1)
    const yieldAt = (k: number) =>
        Array.from({ length: k + 1 }, (_, i) => 0.8 ** i).reduce((sum, p) => sum + p, 0)
    const flatAt = (k: number) => yieldAt(k) / (1 + 0.1 * k)
    const growingAt = (k: number) => yieldAt(k) / (1 + 0.1 * k + 0.05 * k)
    const yieldK5 = yieldAt(5)
    const correctionWidth = (xAt(10) - x0) / yieldK5
    const acceptedPrefixWidth = xAt(10) - x0 - correctionWidth
    const values = (fn: (k: number) => number, color: string, prefix: string) => (
        <>
            {ks.slice(0, -1).map((k) => (
                <React.Fragment key={`${prefix}-${k}`}>
                    <VectorSegment
                        x1={xAt(k)}
                        y1={yAt(fn(k))}
                        x2={xAt(k + 1)}
                        y2={yAt(fn(k + 1))}
                        color={color}
                        strokeWidth={7}
                        showEndDot={false}
                    />
                </React.Fragment>
            ))}
            {ks.map((k) => (
                <React.Fragment key={`${prefix}-p${k}`}>
                    <SvgFrame
                        c={c}
                        x={xAt(k) - 9}
                        y={yAt(fn(k)) - 9}
                        width={18}
                        height={18}
                        rx={9}
                        fill={color}
                        stroke={c.bg}
                        strokeWidth={2}
                    />
                </React.Fragment>
            ))}
        </>
    )
    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <VectorSegment
                        x1={x0}
                        y1={y0}
                        x2={xAt(10)}
                        y2={y0}
                        color={muted}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    <VectorSegment
                        x1={x0}
                        y1={yAt(2.6)}
                        x2={x0}
                        y2={y0}
                        color={muted}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    <VectorSegment
                        x1={x0}
                        y1={yAt(1)}
                        x2={xAt(10)}
                        y2={yAt(1)}
                        color={muted}
                        strokeWidth={2}
                        showEndDot={false}
                    />
                    {[0, 2, 4, 6, 8, 10].map((k) => (
                        <React.Fragment key={`x${k}`}>
                            <VectorSegment
                                x1={xAt(k)}
                                y1={y0 - 8}
                                x2={xAt(k)}
                                y2={y0 + 8}
                                color={muted}
                                strokeWidth={3}
                                showEndDot={false}
                            />
                        </React.Fragment>
                    ))}
                    {[1, 2].map((value) => (
                        <React.Fragment key={`y${value}`}>
                            <VectorSegment
                                x1={x0 - 8}
                                y1={yAt(value)}
                                x2={x0 + 8}
                                y2={yAt(value)}
                                color={muted}
                                strokeWidth={3}
                                showEndDot={false}
                            />
                        </React.Fragment>
                    ))}
                    {values(flatAt, flat, 'flat')}
                    {values(growingAt, growing, 'growing')}
                </svg>
            </CanvasItem>
            {label(
                c,
                48,
                20,
                1330,
                'A deeper draft can lose its advantage',
                60,
                c.textPrimary,
                800,
            )}
            {label(
                c,
                50,
                94,
                1320,
                'Model: α = .8, draft cost c = .1, one target step as the unit.',
                48,
                muted,
                550,
            )}
            {[0, 2, 4, 6, 8, 10].map((k) =>
                center(c, xAt(k) - 40, 522, 80, String(k), 48, muted, 600),
            )}
            {[1, 2].map((value) =>
                center(c, 10, yAt(value) - 28, 80, String(value), 48, muted, 600),
            )}
            {label(c, 50, 170, 650, 'Modeled speedup versus K', 48, muted, 600)}
            <CanvasItem x={740} y={272} width={36} height={8}>
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 4,
                        backgroundColor: flat,
                    }}
                />
            </CanvasItem>
            {label(c, 790, 220, 600, 'v(K) = 1', 48, flat, 700)}
            {label(c, 740, 270, 650, 'Peak K6 · 2.47×', 48, flat, 650)}
            <CanvasItem x={740} y={372} width={36} height={8}>
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 4,
                        backgroundColor: growing,
                    }}
                />
            </CanvasItem>
            {label(c, 790, 320, 600, 'v(K) = 1 + .05K', 48, growing, 700)}
            {label(c, 740, 370, 650, 'Peak K5 · 2.11×', 48, growing, 650)}
            {label(c, 740, 425, 650, 'K=5 costs', 48, c.textPrimary, 700)}
            {label(c, 740, 475, 180, 'Flat', 48, flat, 650)}
            {label(c, 920, 475, 460, '1 + .5 = 1.5', 48, flat, 650)}
            {label(c, 740, 525, 180, 'Rising', 48, growing, 650)}
            {label(c, 920, 525, 460, '1.25 + .5 = 1.75', 48, growing, 650)}
            <CanvasItem x={x0} y={590} width={correctionWidth} height={42}>
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: growing,
                        borderTopLeftRadius: 21,
                        borderBottomLeftRadius: 21,
                    }}
                />
            </CanvasItem>
            <CanvasItem x={x0 + correctionWidth} y={590} width={acceptedPrefixWidth} height={42}>
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: flat,
                        borderTopRightRadius: 21,
                        borderBottomRightRadius: 21,
                    }}
                />
            </CanvasItem>
            {center(c, x0, 580, correctionWidth, '1', 48, c.bg, 750)}
            {center(c, x0 + correctionWidth, 580, acceptedPrefixWidth, '2.68928', 48, c.bg, 750)}
            {center(
                c,
                48,
                645,
                1340,
                'K=5: 1 correction/bonus + 2.68928 prefix',
                48,
                c.textPrimary,
                650,
            )}
            {center(c, 48, 710, 1340, 'Expected yield = 3.68928', 48, muted, 600)}
        </Board>
    )
}

export default create()
