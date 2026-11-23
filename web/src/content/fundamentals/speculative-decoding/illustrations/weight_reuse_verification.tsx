import React from 'react'
import {
    Board,
    CanvasItem,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 1440
export const height = 800
export const alt =
    'A hypothetical 30B active BF16 weight set occupies 60 GB. One pending position or six positions reuse that same stream in separate passes. The memory time floor is 17.91 ms in both cases. Compute takes 0.061 or 0.364 ms, so memory remains the slower floor. Weight reuse raises arithmetic intensity from 1 to 6 FLOP per byte.'

type Colors = ReturnType<typeof getThemeColors>
const label = (
    c: Colors,
    x: number,
    y: number,
    w: number,
    value: string,
    size = 50,
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
    size = 50,
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
const block = (
    x: number,
    y: number,
    w: number,
    h: number,
    fill: string,
    border: string,
    radius = 12,
) => (
    <CanvasItem x={x} y={y} width={w} height={h}>
        <div
            style={{
                width: '100%',
                height: '100%',
                borderRadius: radius,
                backgroundColor: fill,
                border: `3px solid ${border}`,
            }}
        />
    </CanvasItem>
)
const bar = (x: number, y: number, w: number, h: number, fill: string) => (
    <CanvasItem x={x} y={y} width={w} height={h}>
        <div
            style={{ width: '100%', height: '100%', borderRadius: h / 2, backgroundColor: fill }}
        />
    </CanvasItem>
)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const weights = getReadableToneColor('blue', c, c.bg)
    const positions = getReadableToneColor('green', c, c.bg)
    const memory = getReadableToneColor('blue', c, c.bg)
    const compute = getReadableToneColor('warm', c, c.bg)
    const muted = c.textSecondary
    const memoryX0 = 220
    const memoryX1 = 650
    const memoryAt = (ms: number) => memoryX0 + (ms / 18) * (memoryX1 - memoryX0)
    const computeX0 = 920
    const computeX1 = 1200
    const computeAt = (ms: number) => computeX0 + (ms / 0.4) * (computeX1 - computeX0)
    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <VectorArrow
                        x1={506}
                        y1={225}
                        x2={610}
                        y2={225}
                        color={weights}
                        strokeWidth={7}
                        arrowSize={8}
                    />
                    <VectorArrow
                        x1={506}
                        y1={355}
                        x2={610}
                        y2={355}
                        color={weights}
                        strokeWidth={7}
                        arrowSize={8}
                    />
                    <VectorSegment
                        x1={memoryX0}
                        y1={550}
                        x2={memoryX1}
                        y2={550}
                        color={muted}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    <VectorSegment
                        x1={computeX0}
                        y1={550}
                        x2={computeX1}
                        y2={550}
                        color={muted}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    {[0, 6, 12, 18].map((value) => (
                        <React.Fragment key={`mem-${value}`}>
                            <VectorSegment
                                x1={memoryAt(value)}
                                y1={542}
                                x2={memoryAt(value)}
                                y2={558}
                                color={muted}
                                strokeWidth={3}
                                showEndDot={false}
                            />
                        </React.Fragment>
                    ))}
                    {[0, 0.2, 0.4].map((value) => (
                        <React.Fragment key={`comp-${value}`}>
                            <VectorSegment
                                x1={computeAt(value)}
                                y1={542}
                                x2={computeAt(value)}
                                y2={558}
                                color={muted}
                                strokeWidth={3}
                                showEndDot={false}
                            />
                        </React.Fragment>
                    ))}
                </svg>
            </CanvasItem>
            {label(c, 48, 20, 1330, 'One weight read, many positions', 62, c.textPrimary, 800)}
            {label(
                c,
                50,
                94,
                1320,
                'Verification reuses the model’s largest shared data stream.',
                48,
                muted,
                550,
            )}

            {label(c, 60, 202, 140, 'm = 1', 54, positions, 750)}
            {block(230, 179, 276, 92, c.bgCard, weights)}
            {center(c, 236, 194, 264, 'W · 60 GB', 50, weights, 750)}
            {block(618, 179, 156, 92, c.bgCard, positions)}
            {center(c, 624, 194, 144, 'u', 54, positions, 750)}
            {center(c, 810, 193, 370, 'I = 1 FLOP/byte', 50, positions, 700)}

            {label(c, 60, 332, 140, 'm = 6', 54, positions, 750)}
            {block(230, 309, 276, 92, c.bgCard, weights)}
            {center(c, 236, 324, 264, 'W · 60 GB', 50, weights, 750)}
            {['u', 'x₁', 'x₂', 'x₃', 'x₄', 'x₅'].map((token, i) => (
                <React.Fragment key={token}>
                    {block(618 + i * 77, 309, 68, 92, c.bgCard, positions, 10)}
                    {center(c, 621 + i * 77, 324, 62, token, 48, positions, 750)}
                </React.Fragment>
            ))}
            {center(c, 1090, 324, 340, '6 FLOP/byte', 48, positions, 700)}

            {label(c, 50, 410, 1330, 'T = max(memory, compute)', 52, c.textPrimary, 750)}
            {label(c, 48, 478, 650, 'Memory bound · ms', 48, memory, 700)}
            {label(c, 748, 478, 650, 'Compute bound · ms', 48, compute, 700)}
            {center(c, memoryX0 - 38, 554, 76, '0', 48, muted, 550)}
            {center(c, memoryAt(6) - 38, 554, 76, '6', 48, muted, 550)}
            {center(c, memoryAt(12) - 38, 554, 76, '12', 48, muted, 550)}
            {center(c, memoryX1 - 38, 554, 76, '18', 48, muted, 550)}
            {center(c, computeX0 - 38, 554, 76, '0', 48, muted, 550)}
            {center(c, computeAt(0.2) - 38, 554, 76, '.2', 48, muted, 550)}
            {center(c, computeX1 - 38, 554, 76, '.4', 48, muted, 550)}

            {label(c, 48, 626, 145, 'm = 1', 48, positions, 700)}
            {bar(memoryX0, 638, memoryAt(17.91) - memoryX0, 28, memory)}
            {label(c, 666, 620, 180, '17.91', 48, memory, 700)}
            {bar(computeX0, 638, computeAt(0.061) - computeX0, 28, compute)}
            {label(c, 988, 620, 180, '0.061 ms', 48, compute, 650)}

            {label(c, 48, 694, 145, 'm = 6', 48, positions, 700)}
            {bar(memoryX0, 706, memoryAt(17.91) - memoryX0, 28, memory)}
            {label(c, 666, 688, 180, '17.91', 48, memory, 700)}
            {bar(computeX0, 706, computeAt(0.364) - computeX0, 28, compute)}
            {label(c, 1185, 688, 180, '0.364 ms', 48, compute, 650)}
        </Board>
    )
}

export default create()
