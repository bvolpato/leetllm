import React from 'react'
import {
    Board,
    CanvasItem,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 1440
export const height = 800
export const alt =
    'Two alternatives at tree depth one become nodes 0 and 1 at position ID 10. Their children 2 and 3 share position ID 11. With parents [None, None, 0, 1], candidate attention rows are 1000, 0100, 1010, and 0101: each node sees itself and its ancestors, so sibling branches stay hidden. Shared-prefix columns are omitted from this candidate-only matrix.'

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
const node = (c: Colors, x: number, y: number, name: string, pos: string, stroke: string) => (
    <CanvasItem x={x} y={y} width={208} height={140}>
        <div
            style={{
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 4,
                width: '100%',
                height: '100%',
                padding: 6,
                borderRadius: 16,
                border: `3px solid ${stroke}`,
                backgroundColor: c.bgCard,
            }}
        >
            <span
                style={{
                    color: stroke,
                    fontFamily: c.fontSans,
                    fontSize: 48,
                    fontWeight: 800,
                    lineHeight: 1,
                }}
            >
                {name}
            </span>
            <span
                style={{
                    color: c.textSecondary,
                    fontFamily: c.fontSans,
                    fontSize: 48,
                    fontWeight: 600,
                    lineHeight: 1.05,
                }}
            >
                {pos}
            </span>
        </div>
    </CanvasItem>
)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const branchA = getReadableToneColor('blue', c, c.bg)
    const branchB = getReadableToneColor('green', c, c.bg)
    const muted = c.textSecondary
    const x0 = 958
    const y0 = 285
    const cellW = 72
    const cellH = 58
    const gap = 10
    const mask = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [1, 0, 1, 0],
        [0, 1, 0, 1],
    ]
    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <VectorSegment
                        x1={325}
                        y1={237}
                        x2={325}
                        y2={274}
                        color={muted}
                        strokeWidth={4}
                        showEndDot={false}
                    />
                    <VectorSegment
                        x1={184}
                        y1={274}
                        x2={466}
                        y2={274}
                        color={muted}
                        strokeWidth={4}
                        showEndDot={false}
                    />
                    <VectorArrow
                        x1={184}
                        y1={274}
                        x2={184}
                        y2={332}
                        color={branchA}
                        strokeWidth={5}
                        arrowSize={8}
                    />
                    <VectorArrow
                        x1={466}
                        y1={274}
                        x2={466}
                        y2={332}
                        color={branchB}
                        strokeWidth={5}
                        arrowSize={8}
                    />
                    <VectorArrow
                        x1={184}
                        y1={472}
                        x2={184}
                        y2={491}
                        color={branchA}
                        strokeWidth={5}
                        arrowSize={8}
                    />
                    <VectorArrow
                        x1={466}
                        y1={472}
                        x2={466}
                        y2={491}
                        color={branchB}
                        strokeWidth={5}
                        arrowSize={8}
                    />
                </svg>
            </CanvasItem>
            {label(
                c,
                48,
                20,
                1335,
                'A tree mask follows ancestry and depth',
                60,
                c.textPrimary,
                800,
            )}
            {label(
                c,
                50,
                94,
                1320,
                'Depth sets IDs; logits predict one token ahead.',
                48,
                muted,
                550,
            )}
            <CanvasItem x={70} y={178} width={510} height={60}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        borderRadius: 14,
                        backgroundColor: c.bgSubtle,
                        border: `2px solid ${muted}`,
                    }}
                >
                    <span
                        style={{
                            color: c.textPrimary,
                            fontFamily: c.fontSans,
                            fontSize: 48,
                            fontWeight: 650,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        prefix length 10
                    </span>
                </div>
            </CanvasItem>
            {node(c, 80, 332, '0', 'pos 10', branchA)}
            {node(c, 362, 332, '1', 'pos 10', branchB)}
            {node(c, 80, 491, '2', 'pos 11', branchA)}
            {node(c, 362, 491, '3', 'pos 11', branchB)}

            {label(c, 820, 174, 590, 'Candidate mask', 50, c.textPrimary, 750)}
            {label(c, 820, 231, 126, 'query', 48, muted, 600)}
            {[0, 1, 2, 3].map((j) =>
                center(c, x0 + j * (cellW + gap), 221, cellW, String(j), 48, muted, 700),
            )}
            {mask.map((row, r) => (
                <React.Fragment key={r}>
                    {center(c, 861, y0 + r * (cellH + gap), 72, String(r), 48, muted, 700)}
                    {row.map((visible, col) => (
                        <CanvasItem
                            key={`${r}-${col}`}
                            x={x0 + col * (cellW + gap)}
                            y={y0 + r * (cellH + gap)}
                            width={cellW}
                            height={cellH}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 8,
                                    backgroundColor: visible
                                        ? r < 2
                                            ? branchA
                                            : branchB
                                        : c.bgSubtle,
                                    border: `2px solid ${visible ? (r < 2 ? branchA : branchB) : c.borderLight}`,
                                }}
                            />
                        </CanvasItem>
                    ))}
                </React.Fragment>
            ))}
            {label(
                c,
                820,
                588,
                580,
                'Rows: 1000 · 0100',
                48,
                getReadableToneColor('green', c, c.bg),
                700,
            )}
            {label(
                c,
                820,
                652,
                580,
                'Rows: 1010 · 0101',
                48,
                getReadableToneColor('green', c, c.bg),
                700,
            )}
            {label(c, 820, 716, 580, 'Prefix columns omitted.', 48, muted, 600)}
        </Board>
    )
}

export default create()
