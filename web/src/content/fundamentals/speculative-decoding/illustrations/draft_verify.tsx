import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'
export { createFilm } from './_parts/speculative-decoding-film'

export const width = 960
export const height = 700
export const alt =
    'The train arrives at noon is assembled from a committed prefix and three draft tokens. Arrives and at have q no greater than p and are kept. Noon has acceptance probability two-thirds; draw 0.90 rejects it, and one residual draw supplies dawn. The target cache retains the prefix through at. Dawn is emitted before its key and value are computed.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const keep = getReadableToneColor('green', c, c.bg)
    const reject = getReadableToneColor('critical', c, c.bg)
    const warn = getReadableToneColor('warm', c, c.bg)
    const keepFill = getToneFill('green', c)
    const rejectFill = getToneFill('critical', c)
    const warnFill = getToneFill('warm', c)

    const drafts = [
        { token: 'arrives', q: 'q₁ 0.40', p: 'p₁ 0.60', alpha: 'α₁ = 1', ok: true, w: 174 },
        { token: 'at', q: 'q₂ 0.35', p: 'p₂ 0.40', alpha: 'α₂ = 1', ok: true, w: 120 },
        { token: 'noon', q: 'q₃ 0.60', p: 'p₃ 0.40', alpha: 'α₃ = 2/3', ok: false, w: 174 },
    ]
    const barX = 48
    const barW = 864
    const barY = 392
    const splitX = barX + (2 / 3) * barW
    const uX = barX + 0.9 * barW

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={28} y={18} width={width - 56} height={295}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 40,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        Verify batch and sample rejection branch
                    </span>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: c.textSecondary,
                                }}
                            >
                                PREFIX
                            </span>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 210,
                                    height: 64,
                                    borderRadius: 12,
                                    backgroundColor: c.bgCard,
                                    border: `3px solid ${c.borderLight}`,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: c.fontSans,
                                        fontSize: 34,
                                        fontWeight: 700,
                                        color: c.textPrimary,
                                    }}
                                >
                                    The train
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: c.textSecondary,
                                }}
                            >
                                DRAFT PROPOSALS
                            </span>
                            <div style={{ display: 'flex', gap: 18 }}>
                                {drafts.map((d) => {
                                    const col = d.ok ? keep : reject
                                    const fill = d.ok ? keepFill : rejectFill
                                    return (
                                        <div
                                            key={d.token}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 4,
                                                width: d.w,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '100%',
                                                    height: 64,
                                                    borderRadius: 12,
                                                    backgroundColor: fill,
                                                    border: `3px solid ${col}`,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontFamily: c.fontSans,
                                                        fontSize: 34,
                                                        fontWeight: 700,
                                                        color: col,
                                                    }}
                                                >
                                                    {d.token}
                                                </span>
                                            </div>
                                            <span
                                                style={{
                                                    fontFamily: c.fontSans,
                                                    fontSize: 30,
                                                    fontWeight: 700,
                                                    color: col,
                                                }}
                                            >
                                                {d.q}
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily: c.fontSans,
                                                    fontSize: 30,
                                                    fontWeight: 700,
                                                    color: col,
                                                }}
                                            >
                                                {d.p}
                                            </span>
                                            <span
                                                style={{
                                                    fontFamily: c.fontSans,
                                                    fontSize: 30,
                                                    fontWeight: 800,
                                                    color: col,
                                                }}
                                            >
                                                {d.alpha}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </CanvasItem>

            <CanvasItem x={28} y={328} width={width - 56} height={162}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: c.bgCard,
                        border: `2px solid ${c.borderLight}`,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 32,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }}
                    >
                        Acceptance draw on “noon”
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
                        <span style={{ color: keep }}>accept if u &lt; 2/3 (0.0–0.67)</span>
                        <span style={{ color: reject }}>reject: u = 0.90 &gt; 2/3</span>
                    </div>
                </div>
            </CanvasItem>

            <CanvasItem x={28} y={514} width={width - 56} height={166}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span
                            style={{
                                width: 132,
                                fontFamily: c.fontSans,
                                fontSize: 30,
                                fontWeight: 700,
                                color: c.textSecondary,
                            }}
                        >
                            OUTPUT
                        </span>
                        <span
                            style={{
                                fontFamily: c.fontSans,
                                fontSize: 36,
                                fontWeight: 800,
                                color: keep,
                            }}
                        >
                            The train arrives at
                        </span>
                        <div style={{ width: 72 }} />
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                paddingLeft: 18,
                                paddingRight: 18,
                                height: 54,
                                borderRadius: 10,
                                backgroundColor: warnFill,
                                border: `3px solid ${warn}`,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 34,
                                    fontWeight: 800,
                                    color: warn,
                                }}
                            >
                                dawn
                            </span>
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            paddingTop: 12,
                            borderTop: `2px solid ${c.borderLight}`,
                        }}
                    >
                        <span
                            style={{
                                width: 132,
                                fontFamily: c.fontSans,
                                fontSize: 30,
                                fontWeight: 700,
                                color: c.textSecondary,
                            }}
                        >
                            KV CACHE
                        </span>
                        <span
                            style={{
                                fontFamily: c.fontSans,
                                fontSize: 30,
                                fontWeight: 700,
                                color: keep,
                            }}
                        >
                            retained through “at”
                        </span>
                        <span
                            style={{
                                fontFamily: c.fontSans,
                                fontSize: 30,
                                fontWeight: 700,
                                color: warn,
                            }}
                        >
                            • dawn KV pending next step
                        </span>
                    </div>
                </div>
            </CanvasItem>

            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={barX}
                        y={barY}
                        width={(2 / 3) * barW}
                        height={26}
                        rx={8}
                        fill={keepFill}
                        stroke={keep}
                    />
                    <SvgFrame
                        c={c}
                        x={splitX}
                        y={barY}
                        width={(1 / 3) * barW}
                        height={26}
                        rx={8}
                        fill={rejectFill}
                        stroke={reject}
                    />
                    <VectorSegment
                        x1={splitX}
                        y1={barY - 8}
                        x2={splitX}
                        y2={barY + 34}
                        color={keep}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    <SvgFrame
                        c={c}
                        x={uX - 11}
                        y={barY + 2}
                        width={22}
                        height={22}
                        rx={11}
                        fill={reject}
                        stroke="none"
                    />
                    <VectorArrow
                        x1={528}
                        y1={541}
                        x2={588}
                        y2={541}
                        color={warn}
                        strokeWidth={5}
                        arrowSize={8}
                    />
                </svg>
            </CanvasItem>
        </Board>
    )
}

export default create()
