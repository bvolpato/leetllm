import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableColor,
    getReadableTextColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const alt =
    'The client-visible output IDs 201 and 202 remain accepted through preemption. Before the pause, KV contains prompt positions 101, 102, and 103 plus generated position 201; sampled token 202 has no KV position yet. The pause releases those four cached positions. Resume replays 101, 102, 103, and 201 without sampling or emitting them again, then uses 202 as the next decode input.'

export const width = 820
export const height = 470

const colX = [20, 292, 564]
const colW = 228
const cellW = 50
const cellGap = 6
const tokens = [101, 102, 103, 201]

function label(
    c: ReturnType<typeof getThemeColors>,
    value: string,
    x: number,
    y: number,
    w: number,
    fontSize: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 500,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: Math.max(36, fontSize + 8),
        children: TextLabel({ c, text: value, fontSize, fontWeight, color, align, width: w }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const positive = getReadableColor('positive', c)
    const warning = getReadableColor('warning', c)
    const stages = [
        { title: 'Before pause', note: '4 held in KV', nextNote: 'no KV yet' },
        { title: 'Paused', note: 'all 4 released', nextNote: 'waits' },
        { title: 'Resumed', note: 'replay, no sample', nextNote: 'next decode' },
    ]

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {tokens.map((id, i) => {
                const fill = id < 200 ? c.primary : c.secondary
                return [
                    SvgFrame({
                        key: `a-${id}`,
                        c,
                        x: colX[0] + i * (cellW + cellGap),
                        y: 112,
                        width: cellW,
                        height: 48,
                        rx: 6,
                        fill,
                        stroke: fill,
                        strokeWidth: 2,
                    }),
                    <rect
                        key={`b-${id}`}
                        x={colX[1] + i * (cellW + cellGap)}
                        y={112}
                        width={cellW}
                        height={48}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={c.borderLight}
                        strokeWidth={2}
                        strokeDasharray="5 4"
                    />,
                    <rect
                        key={`c-${id}`}
                        x={colX[2] + i * (cellW + cellGap)}
                        y={112}
                        width={cellW}
                        height={48}
                        rx={6}
                        fill={c.bgCardAlt}
                        stroke={c.warning}
                        strokeWidth={2}
                        strokeDasharray="5 4"
                    />,
                ]
            })}
            {VectorArrow({
                x1: colX[0] + 224,
                y1: 136,
                x2: colX[1] - 6,
                y2: 136,
                color: c.warning,
                strokeWidth: 3,
            })}
            {VectorArrow({
                x1: colX[1] + 224,
                y1: 136,
                x2: colX[2] - 6,
                y2: 136,
                color: c.warning,
                strokeWidth: 3,
            })}
            {colX.map((x, idx) =>
                SvgFrame({
                    key: `n-${idx}`,
                    c,
                    x,
                    y: 242,
                    width: cellW + 10,
                    height: 42,
                    rx: 6,
                    fill: c.bgCardAlt,
                    stroke: c.secondary,
                    strokeWidth: 2,
                }),
            )}
            {SvgFrame({
                c,
                x: 20,
                y: 342,
                width: 780,
                height: 60,
                rx: 8,
                fill: c.bgCardAlt,
                stroke: c.positive,
                strokeWidth: 2,
            })}
            {[201, 202].map((id, idx) =>
                SvgFrame({
                    key: `out-${id}`,
                    c,
                    x: 162 + idx * 74,
                    y: 351,
                    width: 64,
                    height: 42,
                    rx: 6,
                    fill: c.positive,
                    stroke: c.positive,
                    strokeWidth: 2,
                }),
            )}
        </svg>
    )

    const outFg = getReadableTextColor(c.positive, c, c.bg)
    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(
            c,
            'Preemption preserves accepted client tokens',
            20,
            14,
            780,
            30,
            c.textPrimary,
            'left',
            700,
        ),
        ...stages.flatMap((s, idx) => [
            label(c, s.title, colX[idx], 68, colW, 27, c.textPrimary, 'left', 700),
            label(
                c,
                s.note,
                colX[idx],
                170,
                colW,
                25,
                idx === 0 ? c.textSecondary : warning,
                'left',
                600,
            ),
            label(c, '202', colX[idx], 247, cellW + 10, 25, c.textPrimary, 'center', 700),
            label(c, s.nextNote, colX[idx] + cellW + 20, 247, 165, 25, c.textSecondary),
        ]),
        ...tokens.flatMap((id, i) => {
            const fill = id < 200 ? c.primary : c.secondary
            return [
                label(
                    c,
                    String(id),
                    colX[0] + i * (cellW + cellGap),
                    120,
                    cellW,
                    25,
                    getReadableTextColor(fill, c, c.bg),
                    'center',
                    700,
                ),
                label(
                    c,
                    String(id),
                    colX[2] + i * (cellW + cellGap),
                    120,
                    cellW,
                    25,
                    warning,
                    'center',
                    700,
                ),
            ]
        }),
        label(c, 'Next decode input', 20, 206, 300, 25, c.textPrimary, 'left', 650),
        label(c, 'Accepted client output', 20, 304, 400, 26, positive, 'left', 700),
        label(c, 'Ledger:', 34, 356, 120, 25, c.textPrimary, 'left', 650),
        label(c, '201', 162, 356, 64, 25, outFg, 'center', 700),
        label(c, '202', 236, 356, 64, 25, outFg, 'center', 700),
        label(c, 'never sampled or emitted again', 316, 356, 470, 25, positive, 'left', 650),
        label(
            c,
            'Pausing drops 4 KV slots and pays replay compute on resume.',
            20,
            422,
            780,
            25,
            c.textSecondary,
        ),
    ]

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({ c, width, height, background: 'transparent', children }),
    })
}

export default create('dark')
