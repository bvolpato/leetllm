import React from 'react'
import { AxisPlot, Card, Scene, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 850
export const height = 800
export const alt =
    'Two physical working-set patterns feed the same triad kernel. Repeated X₀, Z₀, and Y₀ addresses total 11.44 MiB and can fit in a nominal 50 MB H100 L2, while rotating triplets target an aggregate footprint above twice the selected L2 capacity. Warmup touches every slot twice, up to a minimum of 20 launches. A separate hypothetical chart shows possible normalized latency shapes; counters determine actual residency and traffic.'

const W = 800

function textStyle(
    c: ReturnType<typeof getThemeColors>,
    color = c.textPrimary,
    size = 30,
): React.CSSProperties {
    return { color, fontFamily: c.fontSans, fontSize: size, lineHeight: 1.15 }
}

function MemoryTile({
    c,
    label,
    color,
}: {
    c: ReturnType<typeof getThemeColors>
    label: string
    color: string
}) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 87,
                height: 38,
                borderRadius: 8,
                border: `2px solid ${color}`,
                background: c.bgCardAlt,
                color: c.textPrimary,
                fontFamily: c.fontMono,
                fontSize: 28,
                fontWeight: 750,
            }}
        >
            {label}
        </div>
    )
}

function Triplet({
    c,
    slot,
    colors,
}: {
    c: ReturnType<typeof getThemeColors>
    slot: string
    colors: string[]
}) {
    return (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <MemoryTile c={c} label={`X${slot}`} color={colors[0]} />
            <MemoryTile c={c} label={`Z${slot}`} color={colors[1]} />
            <MemoryTile c={c} label={`Y${slot}`} color={colors[2]} />
        </div>
    )
}

function makeFigure(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const input = c.info
    const input2 = c.warning
    const output = c.positive
    const chartWidth = 720
    const chartHeight = 105
    const chartPadding = 18
    const plot = AxisPlot({
        c,
        width: chartWidth,
        height: chartHeight,
        xMin: 1,
        xMax: 6,
        yMin: 0,
        yMax: 2,
        padding: chartPadding,
        showAxes: false,
        showGrid: false,
        showFrame: false,
        paths: [
            {
                points: [
                    { x: 1, y: 0 },
                    { x: 6, y: 0 },
                ],
                color: c.borderSubtle,
                strokeWidth: 1.2,
            },
            {
                points: [
                    { x: 1, y: 1 },
                    { x: 6, y: 1 },
                ],
                color: c.textSecondary,
                strokeWidth: 1.4,
                dashed: true,
                opacity: 0.9,
            },
            {
                points: [1.82, 1.46, 1.19, 1.05, 1.01, 1].map((y, index) => ({ x: index + 1, y })),
                color: input2,
                strokeWidth: 4,
            },
            {
                points: [0.78, 0.73, 0.72, 0.72, 0.71, 0.72].map((y, index) => ({
                    x: index + 1,
                    y,
                })),
                color: input,
                strokeWidth: 4,
            },
            {
                points: [1.04, 1.01, 1.03, 0.99, 1.02, 1.01].map((y, index) => ({
                    x: index + 1,
                    y,
                })),
                color: output,
                strokeWidth: 4,
            },
        ],
        points: [
            ...[1.82, 1.46, 1.19, 1.05, 1.01, 1].map((y, index) => ({
                x: index + 1,
                y,
                r: 4.5,
                fill: input2,
            })),
            ...[0.78, 0.73, 0.72, 0.72, 0.71, 0.72].map((y, index) => ({
                x: index + 1,
                y,
                r: 4.5,
                fill: input,
            })),
            ...[1.04, 1.01, 1.03, 0.99, 1.02, 1.01].map((y, index) => ({
                x: index + 1,
                y,
                r: 4.5,
                fill: output,
            })),
        ],
    })
    const colors = [input, input2, output]

    return Scene({
        c,
        padding: 22,
        gap: 7,
        contentWidth: W,
        align: 'stretch',
        children: (
            <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: W }}>
                    <div style={{ ...textStyle(c, c.textPrimary, 36), fontWeight: 760 }}>
                        The addresses are part of the experiment
                    </div>
                    <div style={{ ...textStyle(c, c.textSecondary), fontWeight: 550 }}>
                        Same triad kernel · different working-set ownership
                    </div>
                </div>
                <Card c={c} width={782} padding={7} borderColor={c.primary}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            width: '100%',
                        }}
                    >
                        <div
                            style={{
                                ...textStyle(c, c.textPrimary, 28),
                                fontFamily: c.fontMono,
                                fontWeight: 800,
                            }}
                        >
                            warmup = max(20, 2 × slots)
                        </div>
                        <div style={{ ...textStyle(c, c.textSecondary, 28), fontWeight: 600 }}>
                            touch every slot twice
                        </div>
                    </div>
                </Card>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: W }}>
                    <Card c={c} width={374} padding={8} borderColor={input}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 5,
                                width: '100%',
                            }}
                        >
                            <div style={{ ...textStyle(c, input, 30), fontWeight: 750 }}>
                                Repeat one triplet
                            </div>
                            <div style={{ ...textStyle(c, c.textSecondary, 28), fontWeight: 600 }}>
                                launch 1 · 2 · 3
                            </div>
                            {[0, 1, 2].map((n) => (
                                <div
                                    key={n}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                >
                                    <div
                                        style={{
                                            ...textStyle(c, c.textSecondary, 28),
                                            width: 48,
                                            fontFamily: c.fontMono,
                                        }}
                                    >
                                        #{n + 1}
                                    </div>
                                    <Triplet c={c} slot="₀" colors={colors} />
                                </div>
                            ))}
                            <div style={{ ...textStyle(c, c.textPrimary, 28), fontWeight: 650 }}>
                                11.44 MiB vs 50 MB L₂
                            </div>
                        </div>
                    </Card>
                    <Card c={c} width={374} padding={8} borderColor={input2}>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 7,
                                width: '100%',
                            }}
                        >
                            <div style={{ ...textStyle(c, c.textPrimary, 30), fontWeight: 750 }}>
                                Rotate buffer triplets
                            </div>
                            <div style={{ ...textStyle(c, c.textSecondary, 28), fontWeight: 600 }}>
                                11.44 MiB per slot
                            </div>
                            <Triplet c={c} slot="₀" colors={colors} />
                            <div style={{ ...textStyle(c, c.textSecondary, 28), fontWeight: 700 }}>
                                ··· rotate more slots ···
                            </div>
                            <Triplet c={c} slot="₁" colors={colors} />
                            <div style={{ ...textStyle(c, c.textPrimary, 28), fontWeight: 650 }}>
                                target &gt; 2× reported L₂
                            </div>
                        </div>
                    </Card>
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: W,
                    }}
                >
                    <div style={{ ...textStyle(c, c.textPrimary, 29), fontWeight: 750 }}>
                        Possible latency shapes
                    </div>
                    <div style={{ ...textStyle(c, c.textPrimary, 28), fontWeight: 750 }}>
                        ILLUSTRATIVE SHAPES
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        width: W,
                        alignItems: 'center',
                    }}
                >
                    {plot}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `${chartPadding}px 0 repeat(5, 1fr 0px) ${chartPadding}px`,
                            width: chartWidth,
                            height: 34,
                            color: c.textSecondary,
                            fontFamily: c.fontMono,
                            fontSize: 28,
                            fontWeight: 650,
                        }}
                    >
                        {[1, 2, 3, 4, 5, 6].map((x, index) => (
                            <span
                                key={x}
                                style={{
                                    display: 'block',
                                    gridColumn: 2 + index * 2,
                                    width: 0,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {x}
                            </span>
                        ))}
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 16,
                        width: W,
                    }}
                >
                    {[
                        ['no warmup', input2],
                        ['same addresses', input],
                        ['rotated set', output],
                    ].map(([label, color]) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div
                                style={{ width: 22, height: 7, borderRadius: 4, background: color }}
                            />
                            <span style={{ ...textStyle(c, c.textPrimary, 28), fontWeight: 650 }}>
                                {label}
                            </span>
                        </div>
                    ))}
                    <div style={{ ...textStyle(c, c.textSecondary, 28), fontWeight: 550 }}>
                        1.0 baseline · verify residency and traffic with counters.
                    </div>
                </div>
            </>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeFigure(theme)
}

export default create('dark')
