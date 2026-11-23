import React from 'react'
import { Card, Flow, Scene, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 850
export const height = 800
export const alt =
    'One triad element reads xᵢ and zᵢ as two 4-byte FP32 values, computes αxᵢ + zᵢ with two FLOPs, and writes yᵢ as one 4-byte value: 12 algorithmic bytes and 2 FLOPs, or 1/6 FLOP per byte. Logical useful bytes are accounted separately from observed L2 and HBM traffic. For 1,000,003 elements, 12,000,036 useful bytes divided by an assumed 8 microseconds is about 1,500 GB/s; an assumed 3 microseconds is about 4,000 GB/s. Both are hypothetical useful-byte rates, not measured HBM bandwidth.'

const W = 800

function t(
    c: ReturnType<typeof getThemeColors>,
    color = c.textPrimary,
    size = 30,
): React.CSSProperties {
    return { color, fontFamily: c.fontSans, fontSize: size, lineHeight: 1.16 }
}

function stageTitle(c: ReturnType<typeof getThemeColors>, textValue: string) {
    return (
        <span
            style={{
                fontFamily: c.fontSans,
                fontSize: 30,
                lineHeight: 1.15,
                fontWeight: 800,
                color: c.textPrimary,
            }}
        >
            {textValue}
        </span>
    )
}

function stageDetail(c: ReturnType<typeof getThemeColors>, textValue: string) {
    return (
        <span
            style={{
                fontFamily: c.fontSans,
                fontSize: 28,
                lineHeight: 1.15,
                fontWeight: 650,
                color: c.textSecondary,
            }}
        >
            {textValue}
        </span>
    )
}

function makeFigure(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const flow = Flow({
        c,
        direction: 'horizontal',
        gap: 14,
        connectorLength: 22,
        connectorTone: 'cyan',
        align: 'stretch',
        stages: [
            {
                title: stageTitle(c, 'xᵢ, zᵢ loads'),
                subtitle: stageDetail(c, '8 B · FP32'),
                tone: 'cyan',
                width: 204,
                minHeight: 124,
                children: (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 12,
                            paddingTop: 7,
                        }}
                    >
                        <ValueTile c={c} value="xᵢ" detail="read" tone={c.info} />
                        <ValueTile c={c} value="zᵢ" detail="read" tone={c.warning} />
                    </div>
                ),
            },
            {
                title: stageTitle(c, 'fmaf'),
                subtitle: stageDetail(c, 'αxᵢ + zᵢ'),
                tone: 'purple',
                width: 204,
                minHeight: 124,
                children: (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 60,
                            color: c.textPrimary,
                            fontFamily: c.fontMono,
                            fontSize: 34,
                            fontWeight: 800,
                        }}
                    >
                        fmaf
                    </div>
                ),
            },
            {
                title: stageTitle(c, 'Store yᵢ'),
                subtitle: stageDetail(c, '4 B · FP32'),
                tone: 'green',
                width: 204,
                minHeight: 124,
                children: (
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 7 }}>
                        <ValueTile c={c} value="yᵢ" detail="store" tone={c.positive} />
                    </div>
                ),
            },
        ],
    })

    return Scene({
        c,
        padding: 22,
        gap: 8,
        contentWidth: W,
        align: 'stretch',
        children: (
            <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: W }}>
                    <div style={{ ...t(c, c.textPrimary, 36), fontWeight: 760 }}>
                        One triad, two traffic views
                    </div>
                    <div style={{ ...t(c, c.textSecondary), fontWeight: 550 }}>
                        Count useful bytes, then inspect physical traffic.
                    </div>
                </div>
                {flow}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        alignItems: 'center',
                        gap: 10,
                        width: W,
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            ...t(c, c.textPrimary, 30),
                            fontFamily: c.fontMono,
                            fontWeight: 800,
                        }}
                    >
                        12 B = 4 + 4 + 4
                    </div>
                    <div
                        style={{
                            ...t(c, c.textPrimary, 30),
                            fontFamily: c.fontMono,
                            fontWeight: 800,
                        }}
                    >
                        2 FLOPs / 12 B = ⅙
                    </div>
                </div>
                <Card c={c} width={778} padding={10} borderColor={c.borderLight}>
                    <div
                        style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%' }}
                    >
                        <div style={{ ...t(c, c.textPrimary, 29), fontWeight: 750 }}>
                            Useful bytes and observed memory traffic
                        </div>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 32px 1fr 32px 1fr',
                                alignItems: 'center',
                                gap: 4,
                                width: '100%',
                                textAlign: 'center',
                            }}
                        >
                            <div>
                                <div style={{ ...t(c, c.textPrimary, 29), fontWeight: 800 }}>
                                    12 useful B
                                </div>
                                <div style={{ ...t(c, c.textSecondary, 28), fontWeight: 550 }}>
                                    per element
                                </div>
                            </div>
                            <div style={{ ...t(c, c.textSecondary, 30), fontWeight: 800 }}>→</div>
                            <div>
                                <div style={{ ...t(c, c.textPrimary, 29), fontWeight: 800 }}>
                                    L₂ hits
                                </div>
                                <div style={{ ...t(c, c.textSecondary, 28), fontWeight: 550 }}>
                                    may serve reads
                                </div>
                            </div>
                            <div style={{ ...t(c, c.textSecondary, 30), fontWeight: 800 }}>→</div>
                            <div>
                                <div style={{ ...t(c, c.textPrimary, 29), fontWeight: 800 }}>
                                    HBM bytes
                                </div>
                                <div style={{ ...t(c, c.textSecondary, 28), fontWeight: 550 }}>
                                    read counters
                                </div>
                            </div>
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
                    <div style={{ ...t(c, c.textPrimary, 29), fontWeight: 750 }}>
                        Same useful bytes · assumed clean time
                    </div>
                    <div style={{ ...t(c, c.textPrimary, 28), fontWeight: 750 }}>
                        HYPOTHETICAL CALCULATION
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: W }}>
                    <RateCard c={c} time="8 µs" rate="≈ 1,500 GB/s" tone={c.info} />
                    <RateCard c={c} time="3 µs" rate="≈ 4,000 GB/s" tone={c.warning} />
                </div>
                <div
                    style={{
                        ...t(c, c.textSecondary, 28),
                        width: W,
                        textAlign: 'center',
                        fontWeight: 600,
                    }}
                >
                    12,000,036 useful B ÷ time · match cache regimes.
                </div>
            </>
        ),
    })
}

function ValueTile({
    c,
    value,
    detail,
    tone,
}: {
    c: ReturnType<typeof getThemeColors>
    value: string
    detail: string
    tone: string
}) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: 86,
                height: 62,
                borderRadius: 8,
                border: `2px solid ${tone}`,
                background: c.bgCardAlt,
                gap: 1,
            }}
        >
            <span style={{ ...t(c, c.textPrimary, 30), fontFamily: c.fontMono, fontWeight: 800 }}>
                {value}
            </span>
            <span style={{ ...t(c, c.textSecondary, 28), fontWeight: 600 }}>{detail}</span>
        </div>
    )
}

function RateCard({
    c,
    time,
    rate,
    tone,
}: {
    c: ReturnType<typeof getThemeColors>
    time: string
    rate: string
    tone: string
}) {
    return (
        <Card c={c} width={374} padding={9} borderColor={tone}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    width: '100%',
                    gap: 8,
                }}
            >
                <span style={{ ...t(c, c.textSecondary, 29), fontWeight: 650 }}>÷ {time}</span>
                <span
                    style={{ ...t(c, c.textPrimary, 34), fontFamily: c.fontMono, fontWeight: 800 }}
                >
                    {rate}
                </span>
            </div>
        </Card>
    )
}

export function create(theme: ThemeMode = 'dark') {
    return makeFigure(theme)
}

export default create('dark')
