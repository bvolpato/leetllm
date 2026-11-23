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
export const height = 760
export const alt =
    'Three states show copy-on-write for A and B. Both first map to partial block 7 containing p, q, r and an empty slot, with reference count two. B clones block 7 into block 12; each private block then has one reference. A appends a to block 7 and B appends b to block 12, preserving the shared prefix values.'

type SlotBlock = {
    x: number
    y: number
    id: string
    vals: string[]
    tone: string
    fill: string
    refs: string
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const shared = getReadableToneColor('green', c, c.bg)
    const a = getReadableToneColor('blue', c, c.bg)
    const b = getReadableToneColor('warm', c, c.bg)
    const sharedFill = getToneFill('green', c)
    const aFill = getToneFill('blue', c)
    const bFill = getToneFill('warm', c)

    const blocks: SlotBlock[] = [
        {
            x: 340,
            y: 128,
            id: 'block 7',
            vals: ['p', 'q', 'r', '·'],
            tone: shared,
            fill: sharedFill,
            refs: 'refs 2',
        },
        {
            x: 244,
            y: 348,
            id: 'block 7',
            vals: ['p', 'q', 'r', '·'],
            tone: a,
            fill: aFill,
            refs: 'refs 1',
        },
        {
            x: 644,
            y: 348,
            id: 'block 12',
            vals: ['p', 'q', 'r', '·'],
            tone: b,
            fill: bFill,
            refs: 'refs 1',
        },
        {
            x: 244,
            y: 558,
            id: 'block 7',
            vals: ['p', 'q', 'r', 'a'],
            tone: a,
            fill: aFill,
            refs: 'refs 1',
        },
        {
            x: 644,
            y: 558,
            id: 'block 12',
            vals: ['p', 'q', 'r', 'b'],
            tone: b,
            fill: bFill,
            refs: 'refs 1',
        },
    ]
    const slotW = 50
    const gap = 4
    const blockW = 4 * slotW + 3 * gap

    return (
        <Board c={c} width={width} height={height} background="transparent">
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    {blocks.map((blk, bi) =>
                        blk.vals.map((v, si) => (
                            <SvgFrame
                                key={`${bi}-${si}`}
                                c={c}
                                x={blk.x + si * (slotW + gap)}
                                y={blk.y}
                                width={slotW}
                                height={52}
                                rx={5}
                                fill={v === '·' ? c.bgSubtle : blk.fill}
                                stroke={v === '·' ? c.borderLight : blk.tone}
                            />
                        )),
                    )}
                    <VectorArrow
                        x1={120}
                        y1={138}
                        x2={332}
                        y2={138}
                        color={a}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    <VectorArrow
                        x1={120}
                        y1={178}
                        x2={332}
                        y2={178}
                        color={b}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    <VectorArrow
                        x1={164}
                        y1={356}
                        x2={236}
                        y2={356}
                        color={a}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    <VectorSegment
                        x1={164}
                        y1={414}
                        x2={610}
                        y2={414}
                        color={b}
                        strokeWidth={4}
                        showEndDot={false}
                    />
                    <VectorArrow
                        x1={610}
                        y1={414}
                        x2={636}
                        y2={382}
                        color={b}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    <VectorArrow
                        x1={462}
                        y1={342}
                        x2={636}
                        y2={346}
                        color={b}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    <VectorArrow
                        x1={164}
                        y1={566}
                        x2={236}
                        y2={566}
                        color={a}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                    <VectorSegment
                        x1={164}
                        y1={622}
                        x2={610}
                        y2={622}
                        color={b}
                        strokeWidth={4}
                        showEndDot={false}
                    />
                    <VectorArrow
                        x1={610}
                        y1={622}
                        x2={636}
                        y2={590}
                        color={b}
                        strokeWidth={4}
                        arrowSize={7}
                    />
                </svg>
            </CanvasItem>

            <CanvasItem x={28} y={16} width={width - 56} height={54}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 38,
                        fontWeight: 800,
                        color: c.textPrimary,
                    }}
                >
                    Copy a shared tail before a private write
                </span>
            </CanvasItem>

            <CanvasItem x={28} y={76} width={296} height={42}>
                <span
                    style={{ fontFamily: c.fontSans, fontSize: 31, fontWeight: 800, color: shared }}
                >
                    1 · Share block 7
                </span>
            </CanvasItem>
            <CanvasItem x={48} y={120} width={140} height={82}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        fontFamily: c.fontSans,
                        fontSize: 32,
                        fontWeight: 850,
                    }}
                >
                    <span style={{ color: a }}>A →</span>
                    <span style={{ color: b }}>B →</span>
                </div>
            </CanvasItem>

            <CanvasItem x={28} y={266} width={width - 56} height={42}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 32,
                        fontWeight: 800,
                        color: c.textPrimary,
                    }}
                >
                    2 · Clone B’s tail into block 12
                </span>
            </CanvasItem>
            <CanvasItem x={48} y={338} width={140} height={82}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        fontFamily: c.fontSans,
                        fontSize: 31,
                        fontWeight: 850,
                    }}
                >
                    <span style={{ color: a }}>A → 7</span>
                    <span style={{ color: b }}>B → 12</span>
                </div>
            </CanvasItem>
            <CanvasItem x={476} y={298} width={150} height={38}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <span
                        style={{ fontFamily: c.fontSans, fontSize: 30, fontWeight: 750, color: b }}
                    >
                        clone
                    </span>
                </div>
            </CanvasItem>

            <CanvasItem x={28} y={482} width={width - 56} height={42}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 32,
                        fontWeight: 800,
                        color: c.textPrimary,
                    }}
                >
                    3 · Each owner appends to its private tail
                </span>
            </CanvasItem>
            <CanvasItem x={48} y={548} width={140} height={82}>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        fontFamily: c.fontSans,
                        fontSize: 31,
                        fontWeight: 850,
                    }}
                >
                    <span style={{ color: a }}>A → 7</span>
                    <span style={{ color: b }}>B → 12</span>
                </div>
            </CanvasItem>

            {blocks.map((blk, bi) => (
                <React.Fragment key={bi}>
                    <CanvasItem x={blk.x} y={blk.y - 38} width={blockW} height={36}>
                        <span
                            style={{
                                fontFamily: c.fontSans,
                                fontSize: 30,
                                fontWeight: 800,
                                color: blk.tone,
                            }}
                        >
                            {blk.id}
                        </span>
                    </CanvasItem>
                    {blk.vals.map((v, si) => (
                        <CanvasItem
                            key={si}
                            x={blk.x + si * (slotW + gap)}
                            y={blk.y + 4}
                            width={slotW}
                            height={44}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%',
                                    height: '100%',
                                }}
                            >
                                <span
                                    style={{
                                        fontFamily: c.fontSans,
                                        fontSize: 34,
                                        fontWeight: 850,
                                        color: v === '·' ? c.textMuted : blk.tone,
                                    }}
                                >
                                    {v}
                                </span>
                            </div>
                        </CanvasItem>
                    ))}
                    <CanvasItem
                        x={blk.x + blockW + 12}
                        y={bi === 1 ? blk.y + 18 : blk.y + 6}
                        width={108}
                        height={42}
                    >
                        <span
                            style={{
                                fontFamily: c.fontSans,
                                fontSize: 30,
                                fontWeight: 750,
                                color: c.textSecondary,
                            }}
                        >
                            {blk.refs}
                        </span>
                    </CanvasItem>
                </React.Fragment>
            ))}

            <CanvasItem x={28} y={694} width={width - 56} height={42}>
                <span
                    style={{
                        fontFamily: c.fontSans,
                        fontSize: 30,
                        fontWeight: 650,
                        color: c.textSecondary,
                    }}
                >
                    Shared p · q · r prefix stays immutable across private writes.
                </span>
            </CanvasItem>
        </Board>
    )
}

export default create()
