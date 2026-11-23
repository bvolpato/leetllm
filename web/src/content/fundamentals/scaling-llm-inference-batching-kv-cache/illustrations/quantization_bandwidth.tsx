import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 980
export const height = 760
export const alt =
    'The top tensor stream packs the same 8B parameters into 2B-parameter groups: FP16 occupies 16 decimal GB, INT8 8 GB, and INT4 4 GB before scales or padding. The lower stream holds 8K KV requests in the same 51.6 GiB pool: 16-bit elements fit 51, 8-bit fit 103, and 4-bit fit 206. Cells group eight requests except each final partial group; exact request tails are shown in labels.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const weightTone = getReadableToneColor('purple', c, c.bg)
    const weightFill = getToneFill('purple', c)
    const kvTone = getReadableToneColor('green', c, c.bg)
    const kvFill = getToneFill('green', c)

    const weights = [
        { name: 'FP16 · 16 GB', gb: 16 },
        { name: 'INT8 · 8 GB', gb: 8 },
        { name: 'INT4 · 4 GB', gb: 4 },
    ]
    const kvRows = [
        { name: '16b · 1 GiB', perReq: 1, count: 51, free: '0.60' },
        { name: '8b · 0.5 GiB', perReq: 0.5, count: 103, free: '0.10' },
        { name: '4b · 0.25 GiB', perReq: 0.25, count: 206, free: '0.10' },
    ]
    const trackX = 286
    const trackW = 408
    const weightScale = 36

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={28} y={18} width={width - 56} height={106}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 38,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        Two independent precision controls
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 31,
                            fontWeight: 700,
                            color: weightTone,
                        }}
                    >
                        8B weights · four groups of 2B parameters
                    </span>
                </div>
            </CanvasItem>

            {weights.map((row, idx) => (
                <CanvasItem key={row.name} x={28} y={136 + idx * 54} width={246} height={42}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 31,
                            fontWeight: 750,
                            color: c.textPrimary,
                        }}
                    >
                        {row.name}
                    </span>
                </CanvasItem>
            ))}

            <CanvasItem x={28} y={322} width={width - 56} height={116}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 31,
                            fontWeight: 750,
                            color: kvTone,
                        }}
                    >
                        KV payload · 8K context · same 51.6 GiB pool
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 600,
                            color: c.textSecondary,
                        }}
                    >
                        Each cell = 8 requests; final cell shows remainder
                    </span>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: 6,
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textSecondary,
                        }}
                    >
                        <span style={{ width: 258 }}>KV / request</span>
                        <span style={{ width: trackW, textAlign: 'center' }}>51.6 GiB pool</span>
                        <span style={{ width: 112, textAlign: 'center' }}>Count</span>
                        <span style={{ flex: 1, textAlign: 'right' }}>Free GiB</span>
                    </div>
                </div>
            </CanvasItem>

            {kvRows.map((row, idx) => {
                const y = 468 + idx * 78
                return (
                    <React.Fragment key={row.name}>
                        <CanvasItem x={28} y={y + 4} width={246} height={44}>
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 750,
                                    color: c.textPrimary,
                                }}
                            >
                                {row.name}
                            </span>
                        </CanvasItem>
                        <CanvasItem x={706} y={y + 4} width={104} height={44}>
                            <div
                                style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
                            >
                                <span
                                    style={{
                                        fontFamily: c.fontSans,
                                        fontSize: 32,
                                        fontWeight: 800,
                                        color: kvTone,
                                    }}
                                >
                                    {row.count}
                                </span>
                            </div>
                        </CanvasItem>
                        <CanvasItem x={822} y={y + 4} width={130} height={44}>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    width: '100%',
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: c.fontSans,
                                        fontSize: 31,
                                        fontWeight: 750,
                                        color: c.textPrimary,
                                    }}
                                >
                                    {row.free}
                                </span>
                            </div>
                        </CanvasItem>
                    </React.Fragment>
                )
            })}

            <CanvasItem x={28} y={702} width={width - 56} height={40}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 600,
                        color: c.textSecondary,
                    }}
                >
                    Raw payload floors excluding scales and runtime overhead.
                </span>
            </CanvasItem>

            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <VectorSegment
                        x1={28}
                        y1={306}
                        x2={width - 28}
                        y2={306}
                        color={c.borderLight}
                        strokeWidth={2}
                        showEndDot={false}
                    />
                    {weights.map((row, idx) => {
                        const y = 136 + idx * 54
                        const gW = (row.gb * weightScale) / 4
                        return Array.from({ length: 4 }, (_, g) => (
                            <SvgFrame
                                key={`${idx}-${g}`}
                                c={c}
                                x={trackX + g * gW}
                                y={y}
                                width={gW - 3}
                                height={38}
                                rx={5}
                                fill={weightFill}
                                stroke={weightTone}
                            />
                        ))
                    })}
                    {kvRows.map((row, idx) => {
                        const y = 468 + idx * 78
                        const fullCells = Math.floor(row.count / 8)
                        const part = row.count % 8
                        const cellW = ((8 * row.perReq) / 51.6) * trackW
                        const usedW = ((row.count * row.perReq) / 51.6) * trackW
                        return (
                            <React.Fragment key={row.name}>
                                <SvgFrame
                                    c={c}
                                    x={trackX}
                                    y={y}
                                    width={trackW}
                                    height={44}
                                    rx={5}
                                    fill={c.bgSubtle}
                                    stroke={c.borderLight}
                                />
                                {Array.from({ length: fullCells }, (_, k) => (
                                    <SvgFrame
                                        key={`${idx}-c-${k}`}
                                        c={c}
                                        x={trackX + k * cellW}
                                        y={y}
                                        width={Math.max(2, cellW - 1)}
                                        height={44}
                                        rx={3}
                                        fill={kvFill}
                                        stroke={kvTone}
                                    />
                                ))}
                                {part > 0 && (
                                    <SvgFrame
                                        c={c}
                                        x={trackX + fullCells * cellW}
                                        y={y}
                                        width={usedW - fullCells * cellW}
                                        height={44}
                                        rx={3}
                                        fill={kvFill}
                                        stroke={kvTone}
                                    />
                                )}
                            </React.Fragment>
                        )
                    })}
                </svg>
            </CanvasItem>
        </Board>
    )
}

export default create()
