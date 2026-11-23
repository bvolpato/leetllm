import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 1440
export const height = 800
export const alt =
    'For query node 2, tree attention includes ancestor node 0 and itself while excluding off-branch node 1. Raising that off-branch value from 100 to 10000 leaves the correct tree-masked output at 1.731. A flattened causal mask leaks the value, moving its output from 97.598 to 9755.630 on the plotted logarithmic axis.'

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
const node = (c: Colors, x: number, y: number, text: string, color: string) => (
    <CanvasItem x={x} y={y} width={220} height={84}>
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                borderRadius: 42,
                border: `3px solid ${color}`,
                backgroundColor: c.bgCard,
            }}
        >
            <span
                style={{
                    color,
                    fontFamily: c.fontSans,
                    fontSize: 48,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                }}
            >
                {text}
            </span>
        </div>
    </CanvasItem>
)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const valid = getReadableToneColor('blue', c, c.bg)
    const sibling = getReadableToneColor('critical', c, c.bg)
    const flat = getReadableToneColor('warm', c, c.bg)
    const muted = c.textSecondary
    const axisX0 = 540
    const axisX1 = 1350
    const xAtLog10 = (value: number) => axisX0 + (Math.log10(value) / 4) * (axisX1 - axisX0)
    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <VectorArrow
                        x1={158}
                        y1={404}
                        x2={158}
                        y2={508}
                        color={valid}
                        strokeWidth={6}
                        arrowSize={8}
                    />
                    <VectorSegment
                        x1={axisX0}
                        y1={610}
                        x2={axisX1}
                        y2={610}
                        color={muted}
                        strokeWidth={3}
                        showEndDot={false}
                    />
                    {[1, 10, 100, 1000, 10000].map((v) => (
                        <React.Fragment key={v}>
                            <VectorSegment
                                x1={xAtLog10(v)}
                                y1={602}
                                x2={xAtLog10(v)}
                                y2={618}
                                color={muted}
                                strokeWidth={3}
                                showEndDot={false}
                            />
                        </React.Fragment>
                    ))}
                    <VectorSegment
                        x1={xAtLog10(97.598)}
                        y1={520}
                        x2={xAtLog10(9755.63)}
                        y2={520}
                        color={flat}
                        strokeWidth={6}
                        showEndDot={false}
                    />
                    <SvgFrame
                        c={c}
                        x={xAtLog10(97.598) - 10}
                        y={510}
                        width={20}
                        height={20}
                        rx={10}
                        fill={flat}
                        stroke={c.bg}
                        strokeWidth={2}
                    />
                    <SvgFrame
                        c={c}
                        x={xAtLog10(9755.63) - 10}
                        y={510}
                        width={20}
                        height={20}
                        rx={10}
                        fill={flat}
                        stroke={c.bg}
                        strokeWidth={2}
                    />
                </svg>
            </CanvasItem>
            {label(
                c,
                48,
                20,
                1330,
                'Off-branch values expose mask leakage',
                60,
                c.textPrimary,
                800,
            )}
            {label(
                c,
                50,
                94,
                1370,
                'Node 1 is off-branch; query 2 sees ancestor 0 and itself.',
                48,
                muted,
                550,
            )}

            {label(c, 54, 170, 390, 'Tree relation', 50, c.textPrimary, 750)}
            {node(c, 48, 320, 'node 0', valid)}
            {node(c, 288, 320, 'node 1', sibling)}
            {node(c, 48, 508, 'query 2', valid)}
            {center(c, 288, 220, 220, 'alternate', 48, sibling, 650)}
            {center(c, 48, 220, 220, 'ancestor', 48, valid, 650)}
            {label(c, 288, 520, 180, 'self', 48, valid, 650)}
            {label(c, 510, 170, 870, 'Off-branch node 1: 100 → 10k', 48, c.textPrimary, 700)}

            {label(c, 510, 260, 320, 'Tree mask output', 48, valid, 700)}
            {label(c, 510, 462, 320, 'Flat causal', 48, flat, 700)}
            {center(c, 700, 330, 500, '1.731 → 1.731', 48, valid, 700)}
            {center(c, xAtLog10(97.598) - 115, 530, 230, '97.598', 48, flat, 700)}
            {center(c, 1110, 530, 290, '9755.630', 48, flat, 700)}
            {[1, 10, 100, 1000, 10000].map((v, i) =>
                center(
                    c,
                    xAtLog10(v) - 55,
                    620,
                    110,
                    ['1', '10', '100', '1k', '10k'][i],
                    48,
                    muted,
                    600,
                ),
            )}
            {label(c, 630, 690, 700, 'Only the flat mask shifts.', 48, c.textPrimary, 650)}
        </Board>
    )
}

export default create()
