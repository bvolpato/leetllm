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
export const height = 680
export const alt =
    'During capture, the Python name x and the graph input argument both refer to allocation A. Rebinding x to allocation B changes the Python name, while the captured graph argument still points to A. Copying new values into A in place changes what a later replay reads.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c, c.bg)
    const purple = getReadableToneColor('purple', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const fills = {
        blue: getToneFill('blue', c),
        purple: getToneFill('purple', c),
        green: getToneFill('green', c),
        warm: getToneFill('warm', c),
    }

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={76}
                        width={438}
                        height={518}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />
                    <SvgFrame
                        c={c}
                        x={494}
                        y={76}
                        width={438}
                        height={518}
                        rx={16}
                        fill={c.bgSubtle}
                        stroke={c.borderSubtle}
                    />

                    <SvgFrame
                        c={c}
                        x={44}
                        y={180}
                        width={166}
                        height={64}
                        rx={10}
                        fill={fills.blue}
                        stroke={blue}
                    />
                    <SvgFrame
                        c={c}
                        x={44}
                        y={292}
                        width={166}
                        height={64}
                        rx={10}
                        fill={fills.purple}
                        stroke={purple}
                    />
                    <SvgFrame
                        c={c}
                        x={248}
                        y={176}
                        width={202}
                        height={190}
                        rx={14}
                        fill={fills.green}
                        stroke={green}
                    />
                    <VectorArrow
                        x1={210}
                        y1={212}
                        x2={244}
                        y2={212}
                        color={c.textPrimary}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    <VectorArrow
                        x1={210}
                        y1={324}
                        x2={244}
                        y2={324}
                        color={c.textPrimary}
                        strokeWidth={4}
                        arrowSize={7}
                    />

                    <SvgFrame
                        c={c}
                        x={510}
                        y={176}
                        width={166}
                        height={64}
                        rx={10}
                        fill={fills.blue}
                        stroke={blue}
                    />
                    <SvgFrame
                        c={c}
                        x={510}
                        y={394}
                        width={166}
                        height={64}
                        rx={10}
                        fill={fills.purple}
                        stroke={purple}
                    />
                    <SvgFrame
                        c={c}
                        x={714}
                        y={150}
                        width={202}
                        height={126}
                        rx={14}
                        fill={fills.warm}
                        stroke={warm}
                    />
                    <SvgFrame
                        c={c}
                        x={714}
                        y={336}
                        width={202}
                        height={184}
                        rx={14}
                        fill={fills.green}
                        stroke={green}
                    />
                    <VectorArrow
                        x1={676}
                        y1={208}
                        x2={710}
                        y2={208}
                        color={c.textPrimary}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    <VectorArrow
                        x1={676}
                        y1={426}
                        x2={710}
                        y2={426}
                        color={c.textPrimary}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                </svg>
            </CanvasItem>

            <CanvasItem x={28} y={14} width={width - 56} height={48}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 36,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        A captured graph keeps the address it received
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={40} y={92} width={414} height={42}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 31,
                            fontWeight: 750,
                            color: c.textPrimary,
                        }}
                    >
                        AT CAPTURE
                    </span>
                </div>
            </CanvasItem>
            <CanvasItem x={506} y={92} width={414} height={42}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 31,
                            fontWeight: 750,
                            color: c.textPrimary,
                        }}
                    >
                        AFTER REBINDING x
                    </span>
                </div>
            </CanvasItem>

            {[
                { x: 44, y: 180, text: 'Python x', tone: blue },
                { x: 44, y: 292, text: 'graph arg', tone: purple },
                { x: 510, y: 176, text: 'Python x', tone: blue },
                { x: 510, y: 394, text: 'graph arg', tone: purple },
            ].map((b, i) => (
                <CanvasItem key={i} x={b.x} y={b.y} width={166} height={64}>
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
                                fontSize: 30,
                                fontWeight: 800,
                                color: b.tone,
                            }}
                        >
                            {b.text}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            <CanvasItem x={248} y={176} width={202} height={190}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 38,
                            fontWeight: 850,
                            color: green,
                        }}
                    >
                        A
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 750,
                            color: green,
                        }}
                    >
                        [1,2,3,4]
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={714} y={150} width={202} height={126}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 38,
                            fontWeight: 850,
                            color: warm,
                        }}
                    >
                        B
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 750,
                            color: warm,
                        }}
                    >
                        [8,8,8,8]
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={714} y={336} width={202} height={184}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 38,
                            fontWeight: 850,
                            color: green,
                        }}
                    >
                        A
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 700,
                            color: green,
                        }}
                    >
                        in place
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontMono,
                            fontSize: 30,
                            fontWeight: 750,
                            color: green,
                        }}
                    >
                        [9,9,9,9]
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={28} y={618} width={width - 56} height={42}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                            color: c.textSecondary,
                        }}
                    >
                        A later replay reads A after the ordered in-place copy.
                    </span>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create()
