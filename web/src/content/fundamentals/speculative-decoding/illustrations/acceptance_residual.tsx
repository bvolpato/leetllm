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

export const width = 960
export const height = 720
export const alt =
    'A three-token categorical example aligns draft q, target p, and their shared overlap on a common 0-to-0.6 scale. Noon has 0.2 excess draft mass, while dawn has 0.2 missing target mass. The rejection probability is 0.2 and the normalized residual is all dawn. Adding the 0.2 correction to the overlap reconstructs target probabilities 0.4, 0.5, 0.1.'
export const q = [0.6, 0.3, 0.1]
export const p = [0.4, 0.5, 0.1]
export const residual = p.map((value, i) => Math.max(0, value - q[i]))
const tokens = ['noon', 'dawn', 'dusk']

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const shared = getReadableToneColor('green', c, c.bg)
    const excess = getReadableToneColor('critical', c, c.bg)
    const missing = getReadableToneColor('blue', c, c.bg)
    const sharedFill = getToneFill('green', c)
    const excessFill = getToneFill('critical', c)
    const missingFill = getToneFill('blue', c)
    const x0 = 264
    const scale = 900
    const rowYs = [208, 326, 444]

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={28} y={20} width={width - 56} height={115}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 40,
                            fontWeight: 800,
                            color: c.textPrimary,
                        }}
                    >
                        Exact reconstruction: overlap + Z · r = p
                    </span>
                    <div
                        style={{
                            display: 'flex',
                            gap: 22,
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 650,
                        }}
                    >
                        <span style={{ color: shared }}>■ overlap min(q, p)</span>
                        <span style={{ color: excess }}>■ excess [q − p]₊</span>
                        <span style={{ color: missing }}>■ deficit [p − q]₊</span>
                    </div>
                </div>
            </CanvasItem>

            {[0, 0.2, 0.4, 0.6].map((v) => (
                <CanvasItem key={v} x={x0 + v * scale - 38} y={136} width={76} height={38}>
                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <span
                            style={{
                                fontFamily: c.fontSans,
                                fontSize: 30,
                                fontWeight: 650,
                                color: c.textSecondary,
                            }}
                        >
                            {v.toFixed(1)}
                        </span>
                    </div>
                </CanvasItem>
            ))}

            {tokens.map((tok, i) => {
                const y = rowYs[i]
                const tokColor = i === 0 ? excess : i === 1 ? missing : shared
                const diff = p[i] - q[i]
                return (
                    <React.Fragment key={tok}>
                        <CanvasItem x={28} y={y + 18} width={116} height={44}>
                            <span
                                style={{
                                    fontFamily: c.fontSans,
                                    fontSize: 36,
                                    fontWeight: 800,
                                    color: tokColor,
                                }}
                            >
                                {tok}
                            </span>
                        </CanvasItem>
                        <CanvasItem x={152} y={y - 4} width={104} height={82}>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                    fontFamily: c.fontSans,
                                    fontSize: 30,
                                    fontWeight: 700,
                                    color: c.textPrimary,
                                }}
                            >
                                <span>q {q[i].toFixed(1)}</span>
                                <span>p {p[i].toFixed(1)}</span>
                            </div>
                        </CanvasItem>
                        {diff !== 0 && (
                            <CanvasItem
                                x={x0 + scale * Math.max(q[i], p[i]) + 16}
                                y={diff < 0 ? y - 2 : y + 40}
                                width={110}
                                height={38}
                            >
                                <span
                                    style={{
                                        fontFamily: c.fontSans,
                                        fontSize: 30,
                                        fontWeight: 700,
                                        color: diff < 0 ? excess : missing,
                                    }}
                                >
                                    {diff < 0 ? `−${(-diff).toFixed(1)}` : `+${diff.toFixed(1)}`}
                                </span>
                            </CanvasItem>
                        )}
                    </React.Fragment>
                )
            })}

            <CanvasItem x={28} y={536} width={width - 56} height={164}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: c.bgCard,
                        border: `2px solid ${c.borderLight}`,
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: 20,
                            fontFamily: c.fontSans,
                            fontSize: 32,
                            fontWeight: 700,
                        }}
                    >
                        <span style={{ color: shared }}>shared = 0.80</span>
                        <span style={{ color: excess }}>Z = 0.20</span>
                        <span style={{ marginLeft: 104, color: missing }}>r = [0, 1, 0]</span>
                    </div>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 31,
                            fontWeight: 700,
                            color: c.textPrimary,
                        }}
                    >
                        [0.40, 0.30, 0.10] + 0.20 × r = p [0.40, 0.50, 0.10]
                    </span>
                    <span
                        style={{
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 600,
                            color: c.textSecondary,
                        }}
                    >
                        Raw target resample at rejection → [0.48, 0.40, 0.12]
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {[0, 0.2, 0.4, 0.6].map((v) => {
                        const x = x0 + v * scale
                        return (
                            <React.Fragment key={v}>
                                <VectorSegment
                                    x1={x}
                                    y1={180}
                                    x2={x}
                                    y2={522}
                                    color={c.borderLight}
                                    strokeWidth={2}
                                    showEndDot={false}
                                />
                            </React.Fragment>
                        )
                    })}
                    {tokens.map((_, i) => {
                        const y = rowYs[i]
                        const ov = Math.min(q[i], p[i])
                        const ex = Math.max(0, q[i] - p[i])
                        const df = Math.max(0, p[i] - q[i])
                        return (
                            <React.Fragment key={i}>
                                <SvgFrame
                                    c={c}
                                    x={x0}
                                    y={y}
                                    width={scale * ov}
                                    height={32}
                                    rx={5}
                                    fill={sharedFill}
                                    stroke={shared}
                                />
                                {ex > 0 && (
                                    <SvgFrame
                                        c={c}
                                        x={x0 + scale * ov}
                                        y={y}
                                        width={scale * ex}
                                        height={32}
                                        rx={5}
                                        fill={excessFill}
                                        stroke={excess}
                                    />
                                )}
                                <SvgFrame
                                    c={c}
                                    x={x0}
                                    y={y + 42}
                                    width={scale * ov}
                                    height={32}
                                    rx={5}
                                    fill={sharedFill}
                                    stroke={shared}
                                />
                                {df > 0 && (
                                    <SvgFrame
                                        c={c}
                                        x={x0 + scale * ov}
                                        y={y + 42}
                                        width={scale * df}
                                        height={32}
                                        rx={5}
                                        fill={missingFill}
                                        stroke={missing}
                                    />
                                )}
                            </React.Fragment>
                        )
                    })}
                    <VectorArrow
                        x1={432}
                        y1={571}
                        x2={488}
                        y2={571}
                        color={missing}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                </svg>
            </CanvasItem>
        </Board>
    )
}

export default create()
