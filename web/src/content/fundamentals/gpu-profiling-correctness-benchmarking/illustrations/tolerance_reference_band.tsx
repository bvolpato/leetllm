import React from 'react'
import { AxisPlot, Card, MathText, Scene, getThemeColors } from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 850
export const height = 800
export const alt =
    'The exact tolerance rule is |yᵢ − rᵢ| ≤ 2×10⁻⁶ + 2×10⁻⁵|rᵢ|. On a logarithmic absolute-error axis, allowed error grows from 0.000002 at reference zero, to 0.000022 at reference one, to 200000.000002 at reference 10¹⁰. Half-limit example residuals are explicitly illustrative, not GPU results. The CPU path evaluates an FMA in double then casts to float; the GPU path uses a float FMA, so acceptance follows the declared precision rule rather than bitwise identity.'

const W = 800
const LOG_MIN = -6.25
const LOG_MAX = 6.25

function makeFigure(theme: ThemeMode) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const threshold = [2e-6, 22e-6, 200000.000002]
    const illustrative = [1e-6, 11e-6, 100000.000001]
    const toLog = (value: number) => Math.log10(value)
    const xPositions = [0, 1, 2]
    const plotWidth = 710
    const plotHeight = 180
    const grid = [-6, -3, 0, 3, 6].map((logValue) => ({
        points: [
            { x: -0.05, y: logValue },
            { x: 2.05, y: logValue },
        ],
        color: c.borderSubtle,
        strokeWidth: 1.2,
    }))
    const plot = AxisPlot({
        c,
        width: plotWidth,
        height: plotHeight,
        xMin: -0.5,
        xMax: 2.5,
        yMin: LOG_MIN,
        yMax: LOG_MAX,
        padding: 0,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        paths: [
            ...grid,
            {
                points: xPositions.map((x, i) => ({ x, y: toLog(threshold[i]) })),
                color: c.info,
                strokeWidth: 5,
            },
            {
                points: xPositions.map((x, i) => ({ x, y: toLog(illustrative[i]) })),
                color: c.positive,
                strokeWidth: 3,
                dashed: true,
            },
            ...xPositions.map((x) => ({
                points: [
                    { x, y: LOG_MIN },
                    { x, y: LOG_MAX },
                ],
                color: c.borderLight,
                strokeWidth: 1.2,
                dashed: true,
            })),
        ],
        points: [
            ...xPositions.map((x, i) => ({
                x,
                y: toLog(threshold[i]),
                r: 7,
                fill: c.info,
                stroke: c.bg,
                strokeWidth: 1.5,
            })),
            ...xPositions.map((x, i) => ({
                x,
                y: toLog(illustrative[i]),
                r: 7,
                fill: c.positive,
                stroke: c.bg,
                strokeWidth: 1.5,
            })),
        ],
    })
    const tickLabels = [
        { value: '10⁻⁶', y: -6 },
        { value: '10⁻³', y: -3 },
        { value: '10⁰', y: 0 },
        { value: '10³', y: 3 },
        { value: '10⁶', y: 6 },
    ]
    const tickGridRow = (value: number) =>
        Math.round(((LOG_MAX - value) / (LOG_MAX - LOG_MIN)) * plotHeight) + 1

    return Scene({
        c,
        padding: 22,
        gap: 8,
        contentWidth: W,
        align: 'stretch',
        children: (
            <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: W }}>
                    <div
                        style={{
                            color: c.textPrimary,
                            fontFamily: c.fontSans,
                            fontSize: 36,
                            fontWeight: 760,
                            lineHeight: 1.12,
                        }}
                    >
                        A tolerance band with two jobs
                    </div>
                    <div
                        style={{
                            color: c.textSecondary,
                            fontFamily: c.fontSans,
                            fontSize: 30,
                            fontWeight: 550,
                            lineHeight: 1.2,
                        }}
                    >
                        A fixed floor near zero · relative growth as values get large
                    </div>
                </div>
                <Card c={c} width={782} padding={8} borderColor={c.primary}>
                    <div
                        style={{
                            width: '100%',
                            textAlign: 'center',
                            color: c.textPrimary,
                            fontFamily: c.fontMono,
                            fontSize: 34,
                            fontWeight: 750,
                            lineHeight: 1.2,
                        }}
                    >
                        {MathText({ text: '|yᵢ − rᵢ| ≤ 2×10⁻⁶ + 2×10⁻⁵|rᵢ|' })}
                    </div>
                </Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: W }}>
                    <div
                        style={{
                            ...style(c, c.textSecondary),
                            fontWeight: 700,
                            marginLeft: 73,
                            width: plotWidth,
                        }}
                    >
                        allowed absolute error · log scale
                    </div>
                    <div style={{ display: 'flex', alignItems: 'stretch', gap: 8, width: W }}>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateRows: `repeat(${plotHeight}, minmax(0, 1fr))`,
                                width: 65,
                                height: plotHeight,
                                color: c.textPrimary,
                                fontFamily: c.fontMono,
                                fontSize: 28,
                                fontWeight: 650,
                                textAlign: 'right',
                                overflow: 'visible',
                            }}
                        >
                            {tickLabels.map(({ value, y }) => (
                                <div
                                    key={value}
                                    style={{
                                        gridRow: tickGridRow(y),
                                        justifySelf: 'end',
                                        alignSelf: 'center',
                                        whiteSpace: 'nowrap',
                                        lineHeight: 1,
                                    }}
                                >
                                    {value}
                                </div>
                            ))}
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                width: plotWidth,
                            }}
                        >
                            {plot}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    color: c.textPrimary,
                                    fontFamily: c.fontMono,
                                    fontSize: 28,
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    rowGap: 2,
                                }}
                            >
                                <span>rᵢ = 0</span>
                                <span>rᵢ = 1</span>
                                <span>
                                    rᵢ = 10
                                    <sup
                                        style={{
                                            display: 'inline-block',
                                            fontSize: '0.96em',
                                            lineHeight: 0,
                                            transform: 'translateY(-0.4em)',
                                        }}
                                    >
                                        10
                                    </sup>
                                </span>
                                <span>0.000002</span>
                                <span>0.000022</span>
                                <span>200000.000002</span>
                            </div>
                        </div>
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
                    <Key c={c} color={c.info} label="allowed bound" />
                    <Key c={c} color={c.positive} label="example residual · illustrative only" />
                    <div style={{ ...style(c, c.textSecondary, 28), fontWeight: 550 }}>
                        Anchor labels are exact; spacing is categorical, not to scale.
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: W }}>
                    <Card c={c} width={375} padding={7} borderColor={c.info}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-around',
                                width: '100%',
                                gap: 5,
                            }}
                        >
                            <span style={{ ...style(c, c.info, 28), fontWeight: 750 }}>
                                CPU · fma(double) → float
                            </span>
                        </div>
                    </Card>
                    <Card c={c} width={375} padding={7} borderColor={c.positive}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-around',
                                width: '100%',
                                gap: 5,
                            }}
                        >
                            <span style={{ ...style(c, c.positive, 28), fontWeight: 750 }}>
                                GPU · fmaf(float) → tolerance check
                            </span>
                        </div>
                    </Card>
                </div>
            </>
        ),
    })
}

function style(
    c: ReturnType<typeof getThemeColors>,
    color = c.textPrimary,
    size = 30,
): React.CSSProperties {
    return { color, fontFamily: c.fontSans, fontSize: size, lineHeight: 1.17 }
}

function Key({
    c,
    color,
    label,
}: {
    c: ReturnType<typeof getThemeColors>
    color: string
    label: string
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 21, height: 7, borderRadius: 4, background: color }} />
            <span style={{ ...style(c, c.textPrimary, 28), fontWeight: 650 }}>{label}</span>
        </div>
    )
}

export function create(theme: ThemeMode = 'dark') {
    return makeFigure(theme)
}

export default create('dark')
