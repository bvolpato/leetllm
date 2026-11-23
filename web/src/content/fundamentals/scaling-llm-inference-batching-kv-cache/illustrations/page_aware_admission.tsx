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
    'A zoom into each request’s final 16-token KV block shows prompt plus 512 reserved output positions. A 4,090-token prompt needs 4,602 positions, so 4,608 are allocated and six slots remain unused. A 4,096-token prompt lands exactly on 4,608. A 4,100-token prompt needs 4,612, so 4,624 are allocated and twelve slots remain unused. The three reservations total 13,840 slots with 18 unused; an exact budget equal to their summed bytes fits, while one byte less rejects the third request.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const used = getReadableToneColor('green', c, c.bg)
    const usedFill = getToneFill('green', c)
    const tones = [
        getReadableToneColor('blue', c, c.bg),
        getReadableToneColor('purple', c, c.bg),
        getReadableToneColor('warm', c, c.bg),
    ]
    const fills = [getToneFill('blue', c), getToneFill('purple', c), getToneFill('warm', c)]
    const cases = [
        { input: 'P4090 + 512', detail: '4602 → 4608 (6 free)', usedSlots: 10, page: '4592–4607' },
        { input: 'P4096 + 512', detail: '4608 → 4608 (0 free)', usedSlots: 16, page: '4592–4607' },
        { input: 'P4100 + 512', detail: '4612 → 4624 (12 free)', usedSlots: 4, page: '4608–4623' },
    ]
    const slotW = 24
    const gridX = 368
    const slotYs = [166, 266, 366]
    const allocations = [4608, 4608, 4624]
    const totalSlots = 13840
    const bytePerToken = 2 * 32 * 8 * 128 * 2
    const budgetBytes = totalSlots * bytePerToken
    const barX = 30
    const barW = width - 60

    let cursorX = barX
    const segs = allocations.map((slots, i) => {
        const w = (slots / totalSlots) * barW
        const out = { x: cursorX, w, label: `R${i + 1}: ${slots}`, tone: tones[i], fill: fills[i] }
        cursorX += w
        return out
    })

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={28} y={18} width={width - 56} height={100}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 38,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        KV blocks round each request separately
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 600,
                            color: c.textSecondary,
                        }}
                    >
                        Final 16-slot page · one cell per token slot
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={28} y={120} width={330} height={36}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 700,
                        color: c.textSecondary,
                    }}
                >
                    Prompt + 512
                </span>
            </CanvasItem>
            <CanvasItem x={gridX} y={120} width={16 * slotW} height={36}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textSecondary,
                        }}
                    >
                        Final 16-slot page
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={766} y={120} width={186} height={36}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textSecondary,
                        }}
                    >
                        Range
                    </span>
                </div>
            </CanvasItem>

            {cases.map((row, i) => (
                <React.Fragment key={row.input}>
                    <CanvasItem x={28} y={slotYs[i] - 4} width={330} height={82}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 31,
                                    fontWeight: 800,
                                    color: tones[i],
                                }}
                            >
                                {row.input}
                            </span>
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 650,
                                    color: c.textPrimary,
                                }}
                            >
                                {row.detail}
                            </span>
                        </div>
                    </CanvasItem>
                    <CanvasItem x={766} y={slotYs[i] + 10} width={186} height={44}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: c.textSecondary,
                                }}
                            >
                                {row.page}
                            </span>
                        </div>
                    </CanvasItem>
                </React.Fragment>
            ))}

            <CanvasItem x={28} y={462} width={width - 56} height={116}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div
                        style={{
                            display: 'flex',
                            gap: 28,
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                        }}
                    >
                        <span style={{ color: used }}>■ Required slots</span>
                        <span style={{ color: c.textSecondary }}>
                            □ Unused rounded slots (18 total)
                        </span>
                    </div>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }}
                    >
                        18 unused slots across 288 + 288 + 289 blocks
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }}
                    >
                        Exact-fit budget: {budgetBytes.toLocaleString('en-US')} bytes (13,840 slots)
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {cases.map((row, idx) =>
                        Array.from({ length: 16 }, (_, slot) => {
                            const filled = slot < row.usedSlots
                            return (
                                <SvgFrame
                                    key={`${idx}-${slot}`}
                                    c={c}
                                    x={gridX + slot * slotW}
                                    y={slotYs[idx] + 6}
                                    width={slotW - 2}
                                    height={52}
                                    rx={4}
                                    fill={filled ? usedFill : c.bgSubtle}
                                    stroke={filled ? used : c.borderLight}
                                />
                            )
                        }),
                    )}
                    {segs.map((s) => (
                        <SvgFrame
                            key={s.label}
                            c={c}
                            x={s.x + 2}
                            y={596}
                            width={s.w - 4}
                            height={54}
                            rx={8}
                            fill={s.fill}
                            stroke={s.tone}
                        />
                    ))}
                    <VectorSegment
                        x1={barX}
                        y1={666}
                        x2={barX + barW}
                        y2={666}
                        color={c.borderLight}
                        strokeWidth={2}
                        showEndDot={false}
                    />
                </svg>
            </CanvasItem>

            {segs.map((s) => (
                <CanvasItem key={s.label} x={s.x} y={602} width={s.w} height={42}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontSans,
                                fontSize: 30,
                                fontWeight: 800,
                                color: s.tone,
                            }}
                        >
                            {s.label}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            <CanvasItem x={28} y={682} width={width - 56} height={44}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 31,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }}
                    >
                        R1 + R2 + R3 = budget: all fit (budget − 1 byte rejects R3)
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create()
