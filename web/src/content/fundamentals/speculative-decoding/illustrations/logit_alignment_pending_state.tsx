import React from 'react'
import {
    Board,
    CanvasItem,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 1440
export const height = 800
export const alt =
    'The pending input u produces p1, which scores x1; x1 produces p2 for x2, x2 produces p3 for x3, and x3 produces p4 for the bonus. When proposal 3 is rejected, proposals 1 and 2 stay in the output and valid target KV. Correction 4 is emitted with pending KV, then processed on the next pass to form 124.'

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
const token = (
    x: number,
    y: number,
    value: string,
    fill: string,
    border: string,
    color: string,
    c: Colors,
    w = 180,
) => (
    <>
        <CanvasItem x={x} y={y} width={w} height={78}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    borderRadius: 14,
                    border: `3px solid ${border}`,
                    backgroundColor: fill,
                }}
            >
                <span
                    style={{
                        color,
                        fontFamily: c.fontSans,
                        fontSize: 54,
                        fontWeight: 750,
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {value}
                </span>
            </div>
        </CanvasItem>
    </>
)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const green = getReadableToneColor('green', c, c.bg)
    const red = getReadableToneColor('critical', c, c.bg)
    const gold = getReadableToneColor('warm', c, c.bg)
    const blue = getReadableToneColor('blue', c, c.bg)
    const muted = c.textSecondary
    const x = [72, 390, 708, 1026]
    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {x.map((left, i) => (
                        <React.Fragment key={i}>
                            <VectorArrow
                                x1={left + 90}
                                y1={288}
                                x2={left + 90}
                                y2={350}
                                color={blue}
                                strokeWidth={5}
                                arrowSize={8}
                            />
                        </React.Fragment>
                    ))}
                </svg>
            </CanvasItem>
            {label(
                c,
                48,
                20,
                1320,
                'Each input position predicts the next token',
                60,
                c.textPrimary,
                800,
            )}
            {label(
                c,
                50,
                94,
                1320,
                'Each row scores the token after its input position.',
                48,
                muted,
                550,
            )}
            {center(c, 48, 145, 1340, 'Target input → next-token distribution', 48, muted, 750)}
            {['u', 'x₁', 'x₂', 'x₃'].map((name, i) => (
                <React.Fragment key={name}>
                    {token(x[i], 210, name, c.bgCard, blue, blue, c)}
                    {token(x[i], 350, `p${['₁', '₂', '₃', '₄'][i]}`, c.bgCard, blue, blue, c)}
                    {center(
                        c,
                        x[i] - 20,
                        431,
                        220,
                        ['scores x₁', 'scores x₂', 'scores x₃', 'bonus row'][i],
                        48,
                        i === 3 ? gold : muted,
                        650,
                    )}
                </React.Fragment>
            ))}

            {label(c, 48, 492, 500, 'Reject at proposal 3', 52, red, 750)}
            {label(c, 572, 500, 790, 'Draft path: 1 → 12 → 123', 48, muted, 650)}
            {token(74, 562, '1', c.bgCard, green, green, c, 118)}
            {token(225, 562, '2', c.bgCard, green, green, c, 118)}
            {token(376, 562, '3', c.bgCard, red, red, c, 118)}
            {center(c, 505, 571, 50, '→', 50, muted, 700)}
            {token(574, 562, '4', c.bgCard, gold, gold, c, 118)}
            {label(c, 714, 573, 610, 'emitted · KV pending', 48, gold, 650)}

            {label(c, 48, 671, 255, 'Valid KV', 48, muted, 650)}
            {token(254, 661, 'u', c.bgCard, green, green, c, 100)}
            {token(370, 661, '1', c.bgCard, green, green, c, 100)}
            {token(486, 661, '2', c.bgCard, green, green, c, 100)}
            {label(c, 956, 671, 405, 'Next pass adds 4', 48, green, 650)}
            {label(
                c,
                48,
                734,
                1330,
                'Output 124 = two accepted proposals + one correction',
                48,
                c.textPrimary,
                700,
            )}
        </Board>
    )
}

export default create()
