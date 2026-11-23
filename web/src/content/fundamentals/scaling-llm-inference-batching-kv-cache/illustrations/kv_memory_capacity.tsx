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

export const alt =
    'Five equal 51.60 GiB tracks divide into one cell per unshared KV history. The rows show 103 requests of 0.50 GiB at 4K, 25 of 2 GiB at 16K, 12 of 4 GiB at 32K, 6 of 8 GiB at 64K, and 3 of 16 GiB at 128K. Unused tails show free space. A fourth 128K history needs 16 GiB when only 3.60 GiB remains.'
export const width = 960
export const height = 760

const poolGiB = 51.6
const chartX = 32
const chartW = 896
const rows = [
    { context: '4K', payloadGiB: 0.5 },
    { context: '16K', payloadGiB: 2 },
    { context: '32K', payloadGiB: 4 },
    { context: '64K', payloadGiB: 8 },
    { context: '128K', payloadGiB: 16 },
].map((row) => {
    const count = Math.floor(poolGiB / row.payloadGiB)
    const usedGiB = count * row.payloadGiB
    return { ...row, count, usedGiB, freeGiB: poolGiB - usedGiB }
})

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bg)
    const blueFill = getToneFill('blue', c)
    const request = getReadableToneColor('critical', c, c.bg)
    const reqFill = getToneFill('critical', c)
    const startY = 108
    const rowStep = 88

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={28} y={14} width={width - 56} height={84}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 38,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        KV request cells (51.60 GiB pool)
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 600,
                            color: c.textSecondary,
                        }}
                    >
                        Equal track scale · one divider per unshared request history
                    </span>
                </div>
            </CanvasItem>

            {rows.map((row, idx) => {
                const y = startY + idx * rowStep
                return (
                    <CanvasItem key={row.context} x={chartX} y={y} width={chartW} height={38}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                width: '100%',
                                fontFamily: c.fontSans,
                                fontSize: 31,
                                fontWeight: 750,
                            }}
                        >
                            <span style={{ color: c.textPrimary }}>
                                {`${row.context} · ${row.count} × ${row.payloadGiB === 0.5 ? '0.50' : row.payloadGiB} GiB`}
                            </span>
                            <span style={{ color: c.textSecondary }}>
                                {`${row.usedGiB.toFixed(2)} used · ${row.freeGiB.toFixed(2)} free`}
                            </span>
                        </div>
                    </CanvasItem>
                )
            })}

            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {rows.map((row, idx) => {
                        const barY = startY + idx * rowStep + 40
                        const usedW = (chartW * row.usedGiB) / poolGiB
                        const cellW = (chartW * row.payloadGiB) / poolGiB
                        return (
                            <React.Fragment key={row.context}>
                                <SvgFrame
                                    c={c}
                                    x={chartX}
                                    y={barY}
                                    width={chartW}
                                    height={32}
                                    rx={4}
                                    fill={c.bgSubtle}
                                    stroke={c.borderLight}
                                />
                                <SvgFrame
                                    c={c}
                                    x={chartX}
                                    y={barY}
                                    width={usedW}
                                    height={32}
                                    rx={4}
                                    fill={blueFill}
                                    stroke={blue}
                                />
                                {Array.from({ length: row.count - 1 }, (_, k) => {
                                    const x = chartX + (k + 1) * cellW
                                    return (
                                        <React.Fragment key={`${row.context}-${k}`}>
                                            <VectorSegment
                                                x1={x}
                                                y1={barY}
                                                x2={x}
                                                y2={barY + 32}
                                                color={blue}
                                                strokeWidth={row.count > 40 ? 1 : 2}
                                                showEndDot={false}
                                            />
                                        </React.Fragment>
                                    )
                                })}
                            </React.Fragment>
                        )
                    })}
                    <SvgFrame
                        c={c}
                        x={28}
                        y={556}
                        width={width - 56}
                        height={190}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.borderLight}
                    />
                    <SvgFrame
                        c={c}
                        x={chartX + 16}
                        y={622}
                        width={(chartW - 32) * (16 / poolGiB)}
                        height={20}
                        rx={4}
                        fill={reqFill}
                        stroke={request}
                    />
                    <SvgFrame
                        c={c}
                        x={chartX + 16}
                        y={652}
                        width={(chartW - 32) * (3.6 / poolGiB)}
                        height={20}
                        rx={4}
                        fill={blueFill}
                        stroke={blue}
                    />
                </svg>
            </CanvasItem>

            <CanvasItem x={28} y={556} width={width - 56} height={190}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: 16,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 31,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        {'128K check · 16 GiB needed > 3.60 GiB free'}
                    </span>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 700,
                        }}
                    >
                        <span style={{ color: request }}>Fourth payload: 16.00 GiB</span>
                        <span style={{ color: blue }}>Free tail remaining: 3.60 GiB</span>
                    </div>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create()
