import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 960
export const height = 740
export const alt =
    'The device-owned source buffer [1, 2, 3, 4] passes through a copy, affine transform, square, and reduction into total 164. The host returns after submitting the operations at tick 4; total.item() observes the result after stream completion at tick 10.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const tones = {
        blue: getReadableToneColor('blue', c, c.bg),
        purple: getReadableToneColor('purple', c, c.bg),
        green: getReadableToneColor('green', c, c.bg),
        critical: getReadableToneColor('critical', c, c.bg),
        warm: getReadableToneColor('warm', c, c.bg),
    }
    const fills = {
        blue: getToneFill('blue', c),
        purple: getToneFill('purple', c),
        green: getToneFill('green', c),
        critical: getToneFill('critical', c),
        warm: getToneFill('warm', c),
    }

    const stages = [
        { label: 'source [1, 2, 3, 4]', op: 'copy', k: 'blue' as const, y: 218 },
        { label: 'copied [1, 2, 3, 4]', op: '2x + 1', k: 'purple' as const, y: 294 },
        { label: 'affine [3, 5, 7, 9]', op: 'x²', k: 'green' as const, y: 370 },
        { label: 'squared [9, 25, 49, 81]', op: 'Σ', k: 'critical' as const, y: 446 },
        { label: 'total 164', op: '', k: 'warm' as const, y: 522 },
    ]
    const boxX = 110
    const boxW = 540
    const boxH = 48

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={60}
                        y={76}
                        width={width - 120}
                        height={54}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={28}
                        y={166}
                        width={width - 56}
                        height={422}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderLight}
                    />
                    <VectorArrow
                        x1={boxX + boxW / 2}
                        y1={130}
                        x2={boxX + boxW / 2}
                        y2={214}
                        color={c.textMuted}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    {stages.map((st, idx) => (
                        <React.Fragment key={st.label}>
                            <SvgFrame
                                c={c}
                                x={boxX}
                                y={st.y}
                                width={boxW}
                                height={boxH}
                                rx={10}
                                fill={fills[st.k]}
                                stroke={tones[st.k]}
                            />
                            {idx < stages.length - 1 && (
                                <VectorArrow
                                    x1={boxX + boxW / 2}
                                    y1={st.y + boxH}
                                    x2={boxX + boxW / 2}
                                    y2={stages[idx + 1].y - 2}
                                    color={c.textMuted}
                                    strokeWidth={3}
                                    arrowSize={6}
                                />
                            )}
                        </React.Fragment>
                    ))}
                    <VectorArrow
                        x1={boxX + boxW / 2}
                        y1={570}
                        x2={boxX + boxW / 2}
                        y2={608}
                        color={tones.green}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    <SvgFrame
                        c={c}
                        x={60}
                        y={612}
                        width={width - 120}
                        height={56}
                        rx={12}
                        fill={fills.green}
                        stroke={tones.green}
                    />
                </svg>
            </CanvasItem>

            <CanvasItem x={28} y={14} width={width - 56} height={50}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 36,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        One buffer chain turns four values into 164
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={60} y={76} width={width - 120} height={54}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 31,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }}
                    >
                        Host calls 1–4 → returns at tick 4
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={48} y={176} width={width - 96} height={36}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textSecondary,
                        }}
                    >
                        DEVICE BUFFERS
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 700,
                            color: c.textSecondary,
                        }}
                    >
                        ONE COMPUTE STREAM
                    </span>
                </div>
            </CanvasItem>

            {stages.map((st) => (
                <React.Fragment key={st.label}>
                    <CanvasItem x={boxX} y={st.y} width={boxW} height={boxH}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                height: '100%',
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: c.fontMono,
                                    fontSize: 31,
                                    fontWeight: 800,
                                    color: tones[st.k],
                                }}
                            >
                                {st.label}
                            </span>
                        </div>
                    </CanvasItem>
                    {st.op && (
                        <CanvasItem x={680} y={st.y + 42} width={160} height={42}>
                            <div
                                style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
                            >
                                <span
                                    style={{
                                        fontFamily: c.fontMono,
                                        fontSize: 31,
                                        fontWeight: 800,
                                        color: c.textPrimary,
                                    }}
                                >
                                    {st.op}
                                </span>
                            </div>
                        </CanvasItem>
                    )}
                </React.Fragment>
            ))}

            <CanvasItem x={60} y={612} width={width - 120} height={56}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 31,
                            fontWeight: 800,
                            color: tones.green,
                        }}
                    >
                        total.item() after completion → 164
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={28} y={682} width={width - 56} height={42}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }}
                    >
                        Synchronize the stream, then read the scalar on the CPU.
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create()
