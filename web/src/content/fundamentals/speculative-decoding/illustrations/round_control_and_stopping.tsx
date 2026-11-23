import React from 'react'
import {
    Board,
    CanvasItem,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 960
export const height = 740
export const alt =
    'A round drafts K tokens, scores the K proposal rows and one bonus position, then branches on the first rejection. Rejection emits the accepted prefix followed by a residual correction; full acceptance emits all K proposals followed by the target bonus. The scripted outcomes are dawn, noon dusk, and noon noon dawn. In the stopping example, the sequence uses noon as EOS, includes it, and drops the remaining block; a cap at two keeps x1 and x2 and drops x3.'

const chip = (label: string, color: string, fill: string, font: string, strike = false) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: 14,
            paddingRight: 14,
            height: 48,
            borderRadius: 10,
            backgroundColor: fill,
            border: `2px solid ${color}`,
        }}
    >
        <span
            style={{
                fontFamily: font,
                fontSize: 30,
                fontWeight: 700,
                color,
                textDecoration: strike ? 'line-through' : 'none',
            }}
        >
            {label}
        </span>
    </div>
)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const start = getReadableToneColor('neutral', c, c.bg)
    const target = getReadableToneColor('blue', c, c.bg)
    const accept = getReadableToneColor('green', c, c.bg)
    const reject = getReadableToneColor('critical', c, c.bg)
    const muted = c.textSecondary

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <VectorArrow
                        x1={194}
                        y1={222}
                        x2={236}
                        y2={222}
                        color={muted}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    <VectorArrow
                        x1={482}
                        y1={222}
                        x2={528}
                        y2={176}
                        color={reject}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    <VectorArrow
                        x1={482}
                        y1={222}
                        x2={528}
                        y2={268}
                        color={accept}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                </svg>
            </CanvasItem>

            <CanvasItem x={26} y={18} width={width - 52} height={height - 36}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 18,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span
                            style={{
                                fontFamily: c.fontSans,
                                fontSize: 38,
                                fontWeight: 800,
                                color: c.textPrimary,
                            }}
                        >
                            One round has two output paths
                        </span>
                        <span
                            style={{
                                fontFamily: c.fontSans,
                                fontSize: 30,
                                fontWeight: 550,
                                color: muted,
                            }}
                        >
                            Include EOS; stop at EOS or the token cap.
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 50 }}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 164,
                                height: 112,
                                borderRadius: 12,
                                backgroundColor: c.bgCard,
                                border: `3px solid ${start}`,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: start,
                                }}
                            >
                                Draft K
                            </span>
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: start,
                                }}
                            >
                                tokens
                            </span>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 240,
                                height: 112,
                                borderRadius: 12,
                                backgroundColor: c.bgCard,
                                border: `3px solid ${target}`,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: target,
                                }}
                            >
                                Target scores
                            </span>
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: target,
                                }}
                            >
                                K + bonus row
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 12,
                                    borderRadius: 10,
                                    backgroundColor: c.bgCard,
                                    border: `2px solid ${reject}`,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: c.fontSans,
                                        fontSize: 30,
                                        fontWeight: 800,
                                        color: reject,
                                    }}
                                >
                                    Reject: prefix + residual
                                </span>
                                <span
                                    style={{
                                        fontFamily: c.fontSans,
                                        fontSize: 30,
                                        fontWeight: 600,
                                        color: c.textPrimary,
                                    }}
                                >
                                    KV pending for correction
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: 12,
                                    borderRadius: 10,
                                    backgroundColor: c.bgCard,
                                    border: `2px solid ${accept}`,
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: c.fontSans,
                                        fontSize: 30,
                                        fontWeight: 800,
                                        color: accept,
                                    }}
                                >
                                    Keep all K: + bonus
                                </span>
                                <span
                                    style={{
                                        fontFamily: c.fontSans,
                                        fontSize: 30,
                                        fontWeight: 600,
                                        color: c.textPrimary,
                                    }}
                                >
                                    KV pending for bonus
                                </span>
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            padding: 16,
                            borderRadius: 12,
                            backgroundColor: c.bgCard,
                            border: `2px solid ${c.borderLight}`,
                        }}
                    >
                        <span
                            style={{
                                fontFamily: c.fontSans,
                                fontSize: 30,
                                fontWeight: 800,
                                color: c.textPrimary,
                            }}
                        >
                            Scripted round outputs
                        </span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <span
                                    style={{
                                        fontFamily: c.fontSans,
                                        fontSize: 30,
                                        fontWeight: 700,
                                        color: reject,
                                    }}
                                >
                                    Reject at 1
                                </span>
                                {chip('dawn', accept, getToneFill('green', c), c.fontSans)}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <span
                                    style={{
                                        fontFamily: c.fontSans,
                                        fontSize: 30,
                                        fontWeight: 700,
                                        color: reject,
                                    }}
                                >
                                    Reject at 2
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {chip('noon', target, getToneFill('blue', c), c.fontSans)}
                                    {chip('dusk', accept, getToneFill('green', c), c.fontSans)}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <span
                                    style={{
                                        fontFamily: c.fontSans,
                                        fontSize: 30,
                                        fontWeight: 700,
                                        color: accept,
                                    }}
                                >
                                    Full accept
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {chip('noon', target, getToneFill('blue', c), c.fontSans)}
                                    {chip('noon', target, getToneFill('blue', c), c.fontSans)}
                                    {chip('dawn', accept, getToneFill('green', c), c.fontSans)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                flex: 1,
                                padding: 14,
                                borderRadius: 10,
                                backgroundColor: c.bgCard,
                                border: `2px solid ${c.borderLight}`,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: muted,
                                }}
                            >
                                EOS = noon; keep EOS, stop.
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {chip('noon · EOS', reject, getToneFill('critical', c), c.fontSans)}
                                {chip('noon', muted, c.bgSubtle, c.fontSans, true)}
                                {chip('dawn', muted, c.bgSubtle, c.fontSans, true)}
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                flex: 1,
                                padding: 14,
                                borderRadius: 10,
                                backgroundColor: c.bgCard,
                                border: `2px solid ${c.borderLight}`,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: muted,
                                }}
                            >
                                Cap 2: keep x₁–x₂; drop x₃.
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {chip('x₁', target, getToneFill('blue', c), c.fontSans)}
                                {chip('x₂', target, getToneFill('blue', c), c.fontSans)}
                                {chip('x₃', muted, c.bgSubtle, c.fontSans, true)}
                            </div>
                        </div>
                    </div>
                </div>
            </CanvasItem>
        </Board>
    )
}

export default create()
