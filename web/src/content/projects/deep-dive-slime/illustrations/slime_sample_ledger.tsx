import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneFill,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'Eight-token trajectory ledger: prompt tokens t0-t1, model action tokens t2-t3, tool observations t4-t5, and model answer tokens t6-t7. Response mask excludes observations (mask 0), leaving four trainable action tokens.'

const illustration = defineIllustration((c) => {
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)
    const greenFill = getToneFill('green', c)
    const warmFill = getToneFill('warm', c)
    const blueFill = getToneFill('blue', c)

    const labels: React.ReactNode[] = []
    const marks: React.ReactNode[] = []

    const text = (
        s: string,
        x: number,
        y: number,
        w: number,
        size = 18,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) =>
        labels.push(
            CanvasItem({
                x,
                y,
                width: w,
                height: size * 1.5,
                children: TextLabel({
                    c,
                    text: s,
                    width: w,
                    fontSize: size,
                    color,
                    align,
                    fontWeight: weight,
                }),
            }),
        )

    text(
        'Trajectory token ledger · response masks & log-probabilities',
        30,
        20,
        520,
        22,
        c.textPrimary,
        'left',
        700,
    )
    text('Rollout 7 · total reward = +1.0', 580, 22, 250, 18, green, 'right', 600)

    const cols = [
        { x: 30, w: 80, s: 'Position', align: 'left' as const },
        { x: 120, w: 90, s: 'Token ID', align: 'center' as const },
        { x: 220, w: 140, s: 'Source Type', align: 'center' as const },
        { x: 370, w: 100, s: 'Loss Mask', align: 'center' as const },
        { x: 480, w: 120, s: 'Log Prob', align: 'center' as const },
        { x: 610, w: 220, s: 'Gradient Status', align: 'left' as const },
    ]

    marks.push(
        <rect
            key="head"
            x={30}
            y={58}
            width={800}
            height={32}
            rx={6}
            fill={c.bgCard}
            stroke={c.border}
            strokeWidth={1}
        />,
    )
    cols.forEach((col) => text(col.s, col.x, 64, col.w, 15, c.textSecondary, col.align, 600))

    const rows = [
        {
            pos: 't0',
            id: '101',
            src: 'Prompt',
            mask: '-',
            lp: '-',
            status: 'Context only (frozen)',
            color: c.textMuted,
            fill: 'none',
        },
        {
            pos: 't1',
            id: '102',
            src: 'Prompt',
            mask: '-',
            lp: '-',
            status: 'Context only (frozen)',
            color: c.textMuted,
            fill: 'none',
        },
        {
            pos: 't2',
            id: '11',
            src: 'Model action',
            mask: '1',
            lp: '-0.20',
            status: 'Trainable action token',
            color: green,
            fill: greenFill,
        },
        {
            pos: 't3',
            id: '12',
            src: 'Model action',
            mask: '1',
            lp: '-0.30',
            status: 'Trainable action token',
            color: green,
            fill: greenFill,
        },
        {
            pos: 't4',
            id: '50',
            src: 'Tool output',
            mask: '0',
            lp: '0.00*',
            status: 'Observation context (masked)',
            color: warm,
            fill: warmFill,
        },
        {
            pos: 't5',
            id: '51',
            src: 'Tool output',
            mask: '0',
            lp: '0.00*',
            status: 'Observation context (masked)',
            color: warm,
            fill: warmFill,
        },
        {
            pos: 't6',
            id: '13',
            src: 'Model repair',
            mask: '1',
            lp: '-0.40',
            status: 'Trainable action token',
            color: green,
            fill: greenFill,
        },
        {
            pos: 't7',
            id: '14',
            src: 'Model repair',
            mask: '1',
            lp: '-0.50',
            status: 'Trainable action token',
            color: green,
            fill: greenFill,
        },
    ]

    rows.forEach((r, i) => {
        const y = 96 + i * 36
        marks.push(
            <rect
                key={`row-${i}`}
                x={30}
                y={y}
                width={800}
                height={32}
                rx={4}
                fill={r.fill}
                stroke={r.mask === '1' ? green : r.mask === '0' ? warm : c.border}
                strokeWidth={1}
                strokeOpacity={0.6}
            />,
        )
        text(r.pos, cols[0].x + 8, y + 6, cols[0].w, 15, c.textPrimary, cols[0].align, 600)
        text(r.id, cols[1].x, y + 6, cols[1].w, 15, c.textPrimary, cols[1].align, 500)
        text(r.src, cols[2].x, y + 6, cols[2].w, 15, r.color, cols[2].align, 600)
        text(r.mask, cols[3].x, y + 6, cols[3].w, 15, r.color, cols[3].align, 700)
        text(r.lp, cols[4].x, y + 6, cols[4].w, 15, c.textPrimary, cols[4].align, 500)
        text(r.status, cols[5].x + 8, y + 6, cols[5].w, 14, r.color, cols[5].align, 500)
    })

    const cards = [
        {
            title: 'Prompt (t0..t1)',
            desc: 'Outside response mask; feeds KV cache but never receives loss.',
            color: blue,
            fill: blueFill,
            x: 30,
            w: 255,
        },
        {
            title: 'Observations (t4..t5)',
            desc: 'Loss mask 0; observation context is preserved without policy loss.',
            color: warm,
            fill: warmFill,
            x: 302,
            w: 255,
        },
        {
            title: 'Model Actions (4 tokens)',
            desc: 'Loss mask 1; policy gradients update parameters at these positions.',
            color: green,
            fill: greenFill,
            x: 575,
            w: 255,
        },
    ]

    cards.forEach((card) => {
        marks.push(
            <rect
                key={card.title}
                x={card.x}
                y={395}
                width={card.w}
                height={85}
                rx={8}
                fill={card.fill}
                stroke={card.color}
                strokeWidth={1.5}
            />,
        )
        text(card.title, card.x + 14, 407, card.w - 28, 16, card.color, 'left', 700)
        text(card.desc, card.x + 14, 432, card.w - 28, 13, c.textSecondary, 'left', 400)
    })

    return Board({
        c,
        width,
        height,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {marks}
                    </svg>
                ),
            }),
            ...labels,
        ],
    })
})

export const create = illustration.create
export default illustration.default
