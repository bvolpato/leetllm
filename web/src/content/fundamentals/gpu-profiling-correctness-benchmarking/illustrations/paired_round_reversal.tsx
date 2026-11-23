import React from 'react'
import { AxisPlot, Card, Scene, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 850
export const height = 800
export const alt =
    'Two matched ABBA rounds retain implementation order and per-round medians. Round 1 has baseline 12 microseconds and candidate 10 microseconds, so its speedup is 1.2×. Round 2 has baseline 9 microseconds and candidate 10 microseconds, so its speedup is 0.9×. The connected round-level dot plot crosses the 1.0 reference. Clocks, temperature, power, and competing work are observations to compare, not assumed causes; raw samples and acquisition order remain preserved.'

const W = 800

function s(
    c: ReturnType<typeof getThemeColors>,
    color = c.textPrimary,
    size = 30,
): React.CSSProperties {
    return { color, fontFamily: c.fontSans, fontSize: size, lineHeight: 1.16 }
}

function makeFigure(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const plotWidth = 505
    const plotHeight = 210
    const gridY = [0.8, 0.9, 1.0, 1.1, 1.2]
    const plot = AxisPlot({
        c,
        width: plotWidth,
        height: plotHeight,
        xMin: 0.7,
        xMax: 2.3,
        yMin: 0.72,
        yMax: 1.28,
        padding: 2,
        showAxes: false,
        showGrid: false,
        showFrame: false,
        paths: [
            ...gridY.map((y) => ({
                points: [
                    { x: 0.72, y },
                    { x: 2.28, y },
                ],
                color: y === 1 ? c.primary : c.borderSubtle,
                strokeWidth: y === 1 ? 2.4 : 1.1,
                dashed: y === 1,
            })),
            {
                points: [
                    { x: 1, y: 1.2 },
                    { x: 2, y: 0.9 },
                ],
                color: c.warning,
                strokeWidth: 4,
            },
            {
                points: [
                    { x: 1, y: 0.72 },
                    { x: 1, y: 1.28 },
                ],
                color: c.borderLight,
                strokeWidth: 1.2,
                dashed: true,
            },
            {
                points: [
                    { x: 2, y: 0.72 },
                    { x: 2, y: 1.28 },
                ],
                color: c.borderLight,
                strokeWidth: 1.2,
                dashed: true,
            },
        ],
        points: [
            { x: 1, y: 1.2, r: 9, fill: c.positive, stroke: c.bg, strokeWidth: 2 },
            { x: 2, y: 0.9, r: 9, fill: c.critical, stroke: c.bg, strokeWidth: 2 },
        ],
    })
    const yTickRow = (value: number) => Math.round((1.28 - value) / 0.01)
    const xTickColumn = (value: number) => Math.round(((value - 0.7) / (2.3 - 0.7)) * 160)
    const yRailStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateRows: 'repeat(56, minmax(0, 1fr))',
        height: plotHeight,
        paddingTop: 2,
        paddingBottom: 2,
        boxSizing: 'border-box',
        alignItems: 'center',
        overflow: 'visible',
    }

    return Scene({
        c,
        padding: 22,
        gap: 8,
        contentWidth: W,
        align: 'stretch',
        children: (
            <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: W }}>
                    <div style={{ ...s(c, c.textPrimary, 36), fontWeight: 760 }}>
                        A benefit can reverse next round
                    </div>
                    <div style={{ ...s(c, c.textSecondary), fontWeight: 550 }}>
                        ABBA pairing keeps each round visible.
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: W }}>
                    <RoundCard
                        c={c}
                        name="ROUND 1"
                        baseline="12 µs"
                        candidate="10 µs"
                        ratio="1.2×"
                        color={c.positive}
                    />
                    <RoundCard
                        c={c}
                        name="ROUND 2"
                        baseline="9 µs"
                        candidate="10 µs"
                        ratio="0.9×"
                        color={c.critical}
                    />
                </div>
                <Card c={c} width={782} padding={7} borderColor={c.borderLight}>
                    <div
                        style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}
                    >
                        <span
                            style={{
                                ...s(c, c.textPrimary, 28),
                                textAlign: 'center',
                                fontWeight: 750,
                            }}
                        >
                            Observed state to compare per round
                        </span>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: 4,
                                textAlign: 'center',
                            }}
                        >
                            <span style={{ ...s(c, c.textPrimary, 28), fontWeight: 700 }}>
                                clocks
                            </span>
                            <span style={{ ...s(c, c.textPrimary, 28), fontWeight: 700 }}>
                                temperature
                            </span>
                            <span style={{ ...s(c, c.textPrimary, 28), fontWeight: 700 }}>
                                power
                            </span>
                            <span style={{ ...s(c, c.textSecondary, 28), fontWeight: 650 }}>
                                other work
                            </span>
                        </div>
                    </div>
                </Card>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: W,
                    }}
                >
                    <div style={{ ...s(c, c.textPrimary, 30), fontWeight: 750 }}>
                        Per-round speedup
                    </div>
                    <div style={{ ...s(c, c.textSecondary, 28), fontWeight: 650 }}>
                        baseline median ÷ candidate median
                    </div>
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '45px 505px 230px',
                        gap: 5,
                        alignItems: 'stretch',
                        width: 790,
                    }}
                >
                    <div
                        style={{
                            ...yRailStyle,
                            color: c.textPrimary,
                            fontFamily: c.fontMono,
                            fontSize: 28,
                            fontWeight: 650,
                            textAlign: 'right',
                        }}
                    >
                        {[1.2, 1, 0.8].map((y) => (
                            <span
                                key={y}
                                style={{
                                    gridRow: `${yTickRow(y)} / span 2`,
                                    justifySelf: 'end',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {y.toFixed(1)}
                            </span>
                        ))}
                    </div>
                    <div style={{ width: plotWidth, height: plotHeight }}>{plot}</div>
                    <div
                        style={{
                            ...yRailStyle,
                            paddingLeft: 4,
                            color: c.textPrimary,
                            fontFamily: c.fontSans,
                            fontSize: 28,
                            fontWeight: 750,
                        }}
                    >
                        {[
                            { y: 1.2, label: '> 1.0 · faster' },
                            { y: 1.0, label: '1.0 · even' },
                            { y: 0.8, label: '< 1.0 · slower' },
                        ].map(({ y, label }) => (
                            <span
                                key={y}
                                style={{ gridRow: `${yTickRow(y)} / span 2`, whiteSpace: 'nowrap' }}
                            >
                                {label}
                            </span>
                        ))}
                    </div>
                </div>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(160, minmax(0, 1fr))',
                        paddingInline: 2,
                        boxSizing: 'border-box',
                        marginLeft: 50,
                        width: plotWidth,
                        height: 34,
                        color: c.textPrimary,
                        fontFamily: c.fontMono,
                        fontSize: 28,
                        fontWeight: 700,
                    }}
                >
                    <span
                        style={{
                            gridColumn: `${xTickColumn(1)} / span 2`,
                            justifySelf: 'center',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        round 1
                    </span>
                    <span
                        style={{
                            gridColumn: `${xTickColumn(2)} / span 2`,
                            justifySelf: 'center',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        round 2
                    </span>
                </div>
                <div
                    style={{
                        width: W,
                        textAlign: 'center',
                        ...s(c, c.textSecondary, 28),
                        fontWeight: 600,
                    }}
                >
                    Preserve raw samples; launches are nested within rounds.
                </div>
            </>
        ),
    })
}

function RoundCard({
    c,
    name,
    baseline,
    candidate,
    ratio,
    color,
}: {
    c: ReturnType<typeof getThemeColors>
    name: string
    baseline: string
    candidate: string
    ratio: string
    color: string
}) {
    return (
        <Card c={c} width={374} padding={9} borderColor={color}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <span style={{ ...s(c, c.textPrimary, 28), fontWeight: 800 }}>
                        {name} · ABBA
                    </span>
                    <span
                        style={{
                            ...s(c, c.textPrimary, 31),
                            fontFamily: c.fontMono,
                            fontWeight: 850,
                        }}
                    >
                        {ratio}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {['A', 'B', 'B', 'A'].map((sample, index) => (
                        <span
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1,
                                height: 39,
                                borderRadius: 6,
                                background: sample === 'A' ? c.bgCardAlt : `${c.primary}20`,
                                border: `1px solid ${sample === 'A' ? c.borderLight : c.primary}`,
                                color: c.textPrimary,
                                fontFamily: c.fontMono,
                                fontSize: 28,
                                fontWeight: 800,
                            }}
                        >
                            {sample}
                        </span>
                    ))}
                </div>
                <div style={{ ...s(c, c.textSecondary, 28), fontWeight: 600 }}>
                    A {baseline} · B {candidate}
                </div>
            </div>
        </Card>
    )
}

export function create(theme: ThemeMode = 'dark') {
    return makeFigure(theme)
}

export default create('dark')
