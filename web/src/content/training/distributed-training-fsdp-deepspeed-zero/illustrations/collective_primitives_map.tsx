import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    withColorAlpha,
    type ThemeMode,
} from 'vizmatic'

export const width = 760
export const height = 460
export const alt =
    'Three two-rank collective primitives: All-Reduce sums [1, 2] and [10, 20] and gives both ranks [11, 22] at 2(N-1)/N * S ring volume; Reduce-Scatter sums and partitions so rank 0 keeps [11] at index 0 and rank 1 keeps [22] at index 1 at (N-1)/N * S; All-Gather reconstructs [11, 22] on both ranks from those shards at (N-1)/N * S.'

type Colors = ReturnType<typeof getThemeColors>

function lbl(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 650,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align, mono }),
    })
}

function cell(
    c: Colors,
    x: number,
    y: number,
    color: string,
    dashed = false,
    w = 56,
    h = 34,
) {
    return createElement('rect', {
        key: `cell-${x}-${y}-${dashed}`,
        x,
        y,
        width: w,
        height: h,
        rx: 6,
        fill: dashed ? 'none' : withColorAlpha(color, 0.14),
        stroke: dashed ? c.borderSubtle : color,
        strokeWidth: dashed ? 1.5 : 1.75,
        strokeDasharray: dashed ? '4 3' : undefined,
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const muted = c.textSecondary

    const cols = [
        { x: 14, w: 236, title: 'All-Reduce', tone: blue, op: 'Sum & copy', vol: '2(N−1)/N · S', role: 'DDP, TP Row' },
        { x: 262, w: 236, title: 'Reduce-Scatter', tone: purple, op: 'Sum & shard', vol: '(N−1)/N · S', role: 'ZeRO-2/3 grads' },
        { x: 510, w: 236, title: 'All-Gather', tone: green, op: 'Concat shards', vol: '(N−1)/N · S', role: 'FSDP / ZeRO-3' },
    ]

    const inY = 58
    const outY = 238
    const row0Y = 92
    const row1Y = 136
    const out0Y = 272
    const out1Y = 316

    const geometry = cols.flatMap((col, idx) => {
        const c0x = col.x + 86
        const c1x = col.x + 154
        const items = [
            // Column frame
            SvgFrame({
                c,
                key: `col-${idx}`,
                x: col.x,
                y: 12,
                width: col.w,
                height: 436,
                rx: 10,
                fill: withColorAlpha(col.tone, 0.05),
                stroke: col.tone,
                strokeWidth: 1.5,
            }),
            // Input box
            SvgFrame({
                c,
                key: `in-${idx}`,
                x: col.x + 12,
                y: inY,
                width: col.w - 24,
                height: 122,
                rx: 8,
                fill: c.bgCard,
                stroke: c.borderSubtle,
                strokeWidth: 1.2,
            }),
            // Output box
            SvgFrame({
                c,
                key: `out-${idx}`,
                x: col.x + 12,
                y: outY,
                width: col.w - 24,
                height: 122,
                rx: 8,
                fill: withColorAlpha(col.tone, 0.1),
                stroke: col.tone,
                strokeWidth: 1.4,
            }),
            // Arrow between input and output
            VectorArrow({
                x1: col.x + 42,
                y1: inY + 128,
                x2: col.x + 42,
                y2: outY - 8,
                color: col.tone,
                strokeWidth: 2.2,
                arrowSize: 6,
            }),
            // Bottom traffic pill
            SvgFrame({
                c,
                key: `vol-${idx}`,
                x: col.x + 12,
                y: 372,
                width: col.w - 24,
                height: 64,
                rx: 8,
                fill: c.bgCard,
                stroke: c.borderSubtle,
                strokeWidth: 1,
            }),
        ]

        if (idx === 0) {
            // All-Reduce: [1,2], [10,20] -> [11,22], [11,22]
            items.push(
                cell(c, c0x, row0Y, blue),
                cell(c, c1x, row0Y, blue),
                cell(c, c0x, row1Y, purple),
                cell(c, c1x, row1Y, purple),
                cell(c, c0x, out0Y, green),
                cell(c, c1x, out0Y, green),
                cell(c, c0x, out1Y, green),
                cell(c, c1x, out1Y, green),
            )
        } else if (idx === 1) {
            // Reduce-Scatter: [1,2], [10,20] -> [11, _], [_, 22]
            items.push(
                cell(c, c0x, row0Y, blue),
                cell(c, c1x, row0Y, blue),
                cell(c, c0x, row1Y, purple),
                cell(c, c1x, row1Y, purple),
                cell(c, c0x, out0Y, green),
                cell(c, c1x, out0Y, green, true),
                cell(c, c0x, out1Y, green, true),
                cell(c, c1x, out1Y, green),
            )
        } else {
            // All-Gather: [11, _], [_, 22] -> [11,22], [11,22]
            items.push(
                cell(c, c0x, row0Y, blue),
                cell(c, c1x, row0Y, blue, true),
                cell(c, c0x, row1Y, purple, true),
                cell(c, c1x, row1Y, purple),
                cell(c, c0x, out0Y, green),
                cell(c, c1x, out0Y, green),
                cell(c, c0x, out1Y, green),
                cell(c, c1x, out1Y, green),
            )
        }
        return items
    })

    const labels = cols.flatMap((col, idx) => {
        const c0x = col.x + 86
        const c1x = col.x + 154
        const rX = col.x + 24
        const common = [
            lbl(c, col.title, col.x + 12, 24, col.w - 24, 24, 18, col.tone, 800, 'center'),
            lbl(c, 'Input', col.x + 24, inY + 8, 90, 22, 16, muted, 700),
            lbl(c, 'R0', rX, row0Y + 6, 48, 22, 16, blue, 700, 'left', true),
            lbl(c, 'R1', rX, row1Y + 6, 48, 22, 16, purple, 700, 'left', true),
            lbl(c, col.op, col.x + 62, inY + 140, 160, 24, 16, col.tone, 700, 'left'),
            lbl(c, 'Result', col.x + 24, outY + 8, 90, 22, 16, col.tone, 700),
            lbl(c, 'R0', rX, out0Y + 6, 48, 22, 16, green, 700, 'left', true),
            lbl(c, 'R1', rX, out1Y + 6, 48, 22, 16, green, 700, 'left', true),
            lbl(c, col.vol, col.x + 16, 380, col.w - 32, 24, 16, c.textPrimary, 700, 'center', true),
            lbl(c, col.role, col.x + 16, 406, col.w - 32, 22, 16, muted, 600, 'center'),
        ]

        if (idx === 0) {
            return [
                ...common,
                lbl(c, '1', c0x, row0Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
                lbl(c, '2', c1x, row0Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
                lbl(c, '10', c0x, row1Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
                lbl(c, '20', c1x, row1Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
                lbl(c, '11', c0x, out0Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
                lbl(c, '22', c1x, out0Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
                lbl(c, '11', c0x, out1Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
                lbl(c, '22', c1x, out1Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
            ]
        }
        if (idx === 1) {
            return [
                ...common,
                lbl(c, '1', c0x, row0Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
                lbl(c, '2', c1x, row0Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
                lbl(c, '10', c0x, row1Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
                lbl(c, '20', c1x, row1Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
                lbl(c, '11', c0x, out0Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
                lbl(c, '22', c1x, out1Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
            ]
        }
        return [
            ...common,
            lbl(c, '11', c0x, row0Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
            lbl(c, '22', c1x, row1Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
            lbl(c, '11', c0x, out0Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
            lbl(c, '22', c1x, out0Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
            lbl(c, '11', c0x, out1Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
            lbl(c, '22', c1x, out1Y + 6, 56, 22, 16, c.textPrimary, 700, 'center', true),
        ]
    })

    const svg = createElement(
        'svg',
        { width, height, viewBox: `0 0 ${width} ${height}`, role: 'presentation', 'aria-hidden': true },
        ...geometry,
    )
    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [CanvasItem({ x: 0, y: 0, width, height, children: svg }), ...labels],
    })
}

export default create('dark')
