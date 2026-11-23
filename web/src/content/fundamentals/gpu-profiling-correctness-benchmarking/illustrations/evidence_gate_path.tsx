import React from 'react'
import { AxisPlot, Card, Scene, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 850
export const height = 800
export const alt =
    'A candidate kernel passes through five connected evidence gates: compare to a numerical reference, check memory and synchronization safety, measure completed work outside profilers, compare achieved throughput and memory traffic against hardware roofs, then log source revision, GPU clocks, commands, and Nsight counter outputs. A failure path from any gate rejects, repairs, and reruns before the speedup claim can continue.'

const W = 800

function label(
    c: ReturnType<typeof getThemeColors>,
    color = c.textPrimary,
    size = 30,
): React.CSSProperties {
    return { color, fontFamily: c.fontSans, fontSize: size, lineHeight: 1.15 }
}

function GateIcon({ kind, c }: { kind: number; c: ReturnType<typeof getThemeColors> }) {
    const box = (color: string, width: number, height: number, round = 5) => (
        <div
            style={{
                width,
                height,
                border: `2px solid ${color}`,
                borderRadius: round,
                boxSizing: 'border-box',
            }}
        />
    )
    if (kind === 0)
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 56 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[0, 1, 2].map((i) => (
                        <div key={i} style={{ display: 'flex', gap: 5 }}>
                            <div
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 8,
                                    background: c.info,
                                }}
                            />
                            <div
                                style={{
                                    width: 22,
                                    height: 10,
                                    borderRadius: 5,
                                    background: c.positive,
                                }}
                            />
                        </div>
                    ))}
                </div>
                <div
                    style={{
                        width: 8,
                        height: 44,
                        borderRadius: 5,
                        border: `2px solid ${c.info}`,
                        background: `${c.info}20`,
                    }}
                />
            </div>
        )
    if (kind === 1)
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 56 }}>
                {box(c.positive, 24, 37)}
                {box(c.positive, 24, 37)}
                <div style={{ width: 4, height: 48, background: c.critical, borderRadius: 3 }} />
                {box(c.critical, 24, 37)}
            </div>
        )
    if (kind === 2)
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 56 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div
                        style={{
                            width: 20,
                            height: 17,
                            border: `3px solid ${c.info}`,
                            borderRadius: '50%',
                        }}
                    />
                    <div
                        style={{
                            width: 20,
                            height: 17,
                            border: `3px solid ${c.positive}`,
                            borderRadius: '50%',
                        }}
                    />
                </div>
                <div style={{ width: 72, height: 14, background: c.primary, borderRadius: 8 }} />
                <div
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: c.positive,
                        border: `3px solid ${c.bg}`,
                    }}
                />
            </div>
        )
    if (kind === 3)
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'end',
                    justifyContent: 'center',
                    gap: 7,
                    height: 56,
                    paddingBottom: 4,
                }}
            >
                <div
                    style={{
                        width: 25,
                        height: 24,
                        borderBottom: `3px solid ${c.info}`,
                        borderRight: `3px solid ${c.info}`,
                    }}
                />
                <div
                    style={{
                        width: 25,
                        height: 31,
                        borderBottom: `3px solid ${c.primary}`,
                        borderRight: `3px solid ${c.primary}`,
                    }}
                />
                <div
                    style={{
                        width: 25,
                        height: 43,
                        borderBottom: `3px solid ${c.warning}`,
                        borderRight: `3px solid ${c.warning}`,
                    }}
                />
            </div>
        )
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                height: 56,
            }}
        >
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    style={{
                        width: 13,
                        height: 26 + (i % 2) * 12,
                        borderRadius: 4,
                        background: i % 2 ? c.primary : c.info,
                    }}
                />
            ))}
        </div>
    )
}

function GateCard({
    c,
    index,
    title,
    detail,
    tone,
}: {
    c: ReturnType<typeof getThemeColors>
    index: string
    title: string
    detail: string
    tone: string
}) {
    return (
        <Card c={c} width={136} padding={7} borderColor={tone}>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 5,
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        ...label(c, c.textPrimary, 28),
                        fontFamily: c.fontMono,
                        fontWeight: 850,
                    }}
                >
                    {index}
                </div>
                <GateIcon kind={Number(index) - 1} c={c} />
                <div style={{ ...label(c, c.textPrimary, 28), fontWeight: 800 }}>{title}</div>
                <div style={{ ...label(c, c.textSecondary, 28), fontWeight: 600 }}>{detail}</div>
            </div>
        </Card>
    )
}

function makeFigure(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const xPositions = [76, 238, 400, 562, 724]
    const returnPaths = [
        ...xPositions.map((x) => ({
            points: [
                { x, y: 8.5 },
                { x, y: 5.5 },
            ],
            color: c.critical,
            strokeWidth: 2.4,
            opacity: 0.9,
        })),
        {
            points: [
                { x: xPositions[0], y: 5.5 },
                { x: xPositions[4], y: 5.5 },
            ],
            color: c.critical,
            strokeWidth: 2.4,
        },
    ]
    const repairArrow = AxisPlot({
        c,
        width: W,
        height: 70,
        xMin: 0,
        xMax: 800,
        yMin: 0,
        yMax: 10,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        paths: returnPaths,
        vectors: [
            {
                x1: 400,
                y1: 5.4,
                x2: 400,
                y2: 1.1,
                tone: 'critical',
                strokeWidth: 2.6,
                arrow: true,
                arrowSize: 8,
            },
        ],
    })

    return Scene({
        c,
        padding: 22,
        gap: 7,
        contentWidth: W,
        align: 'stretch',
        children: (
            <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: W }}>
                    <div style={{ ...label(c, c.textPrimary, 36), fontWeight: 760 }}>
                        Five gates before a speedup means anything
                    </div>
                    <div style={{ ...label(c, c.textSecondary), fontWeight: 550 }}>
                        The claim advances only when each kind of evidence supports it.
                    </div>
                </div>
                <Card c={c} width={782} padding={8} borderColor={c.primary}>
                    <div
                        style={{
                            width: '100%',
                            textAlign: 'center',
                            ...label(c, c.textPrimary, 30),
                            fontFamily: c.fontMono,
                            fontWeight: 800,
                        }}
                    >
                        CANDIDATE KERNEL + FIXED WORKLOAD
                    </div>
                </Card>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '140px 20px 140px 20px 140px 20px 140px 20px 140px',
                        alignItems: 'center',
                        width: W,
                    }}
                >
                    <GateCard c={c} index="1" title="Compare" detail="values" tone={c.info} />
                    <span
                        style={{
                            ...label(c, c.textPrimary, 31),
                            textAlign: 'center',
                            fontWeight: 850,
                        }}
                    >
                        ›
                    </span>
                    <GateCard c={c} index="2" title="Sanitize" detail="safety" tone={c.warning} />
                    <span
                        style={{
                            ...label(c, c.textPrimary, 31),
                            textAlign: 'center',
                            fontWeight: 850,
                        }}
                    >
                        ›
                    </span>
                    <GateCard c={c} index="3" title="Timing" detail="events" tone={c.positive} />
                    <span
                        style={{
                            ...label(c, c.textPrimary, 31),
                            textAlign: 'center',
                            fontWeight: 850,
                        }}
                    >
                        ›
                    </span>
                    <GateCard c={c} index="4" title="Roofline" detail="traffic" tone={c.info} />
                    <span
                        style={{
                            ...label(c, c.textPrimary, 31),
                            textAlign: 'center',
                            fontWeight: 850,
                        }}
                    >
                        ›
                    </span>
                    <GateCard c={c} index="5" title="Run Log" detail="env+cmd" tone={c.primary} />
                </div>
                <div style={{ width: W, height: 70 }}>{repairArrow}</div>
                <Card c={c} width={782} padding={8} borderColor={c.critical}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 16,
                            width: '100%',
                        }}
                    >
                        <span style={{ ...label(c, c.textPrimary, 29), fontWeight: 850 }}>
                            FAILED GATE
                        </span>
                        <span style={{ ...label(c, c.textPrimary, 34), fontWeight: 900 }}>→</span>
                        <span style={{ ...label(c, c.textPrimary, 29), fontWeight: 750 }}>
                            reject · repair · rerun
                        </span>
                    </div>
                </Card>
            </>
        ),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeFigure(theme)
}

export default create('dark')
