import { createElement, type ReactElement } from 'react'
// Visual primitive: Matrix representation of attention masks
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const opaqueBackground = true
export const alt =
    'Two 2-by-5 causal attention masks comparing FlashAttention 2.0 top-left alignment against FlashAttention 2.1+ bottom-right alignment for two query rows and five cached keys. FlashAttention 2.0 top-left alignment keeps query 0 seeing key 0 only, corrupting prefix KV caches. FlashAttention 2.1+ bottom-right alignment preserves causal history across cached keys, allowing query 0 to attend to keys 0 through 3 and query 1 to attend to all 5 keys.'

type Colors = ReturnType<typeof getThemeColors>

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 600,
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

function renderBoard(c: Colors, items: (ReactElement | ReactElement[])[]) {
    const flat = items.flat() as ReactElement[]
    const svg = flat.filter((el) => el?.type !== 'div')
    const html = flat.filter((el) => el?.type === 'div')
    return Board({
        c,
        width,
        height,
        background: c.bg,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: createElement(
                    'svg',
                    { width, height, viewBox: `0 0 ${width} ${height}` },
                    ...svg,
                ),
            }),
            ...html,
        ],
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const red = getReadableToneColor('red', c)
    const green = getReadableToneColor('green', c)
    const muted = c.textSecondary

    const panelW = 385
    const leftX = 35
    const rightX = 440

    const cellW = 54
    const cellH = 44
    const gridStartX = 65
    const gridStartY = 160

    const maskLeft = [
        [1, 0, 0, 0, 0],
        [1, 1, 0, 0, 0],
    ]

    const maskRight = [
        [1, 1, 1, 1, 0],
        [1, 1, 1, 1, 1],
    ]

    return renderBoard(c, [
        label(c, 'Causal Attention Mask Alignment', 35, 18, 790, 28, 22, c.textPrimary, 700),
        label(
            c,
            'Top-left vs bottom-right alignment with 2 query rows (q0, q1) and 5 cached keys (k0..k4)',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Left panel: FA 2.0 (Top-Left)
        SvgFrame({
            c,
            x: leftX,
            y: 75,
            width: panelW,
            height: 310,
            rx: 8,
            stroke: red,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(248, 81, 73, 0.05)' : 'rgba(207, 34, 46, 0.03)',
        }),
        label(c, 'FlashAttention 2.0 (Top-Left)', leftX + 16, 88, panelW - 32, 22, 16, red, 700),
        label(
            c,
            'Assumes prompt prefill; invalid with KV cache',
            leftX + 16,
            110,
            panelW - 32,
            18,
            13,
            muted,
        ),

        // Column headers (k0..k4)
        ...[0, 1, 2, 3, 4].map((col) =>
            label(
                c,
                `k${col}`,
                leftX + gridStartX + col * (cellW + 6),
                gridStartY - 24,
                cellW,
                20,
                13,
                muted,
                600,
                'center',
                true,
            ),
        ),

        // Grid cells Left
        ...maskLeft.flatMap((row, r) => [
            label(
                c,
                `q${r}`,
                leftX + 22,
                gridStartY + r * (cellH + 8) + 12,
                36,
                20,
                14,
                c.textPrimary,
                700,
                'right',
                true,
            ),
            ...row.map((val, col) => {
                const cx = leftX + gridStartX + col * (cellW + 6)
                const cy = gridStartY + r * (cellH + 8)
                const active = val === 1
                return SvgFrame({
                    c,
                    x: cx,
                    y: cy,
                    width: cellW,
                    height: cellH,
                    rx: 4,
                    stroke: active ? red : 'transparent',
                    strokeWidth: 1.5,
                    fill: active
                        ? theme === 'dark'
                            ? 'rgba(248, 81, 73, 0.25)'
                            : 'rgba(207, 34, 46, 0.18)'
                        : theme === 'dark'
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(0, 0, 0, 0.03)',
                })
            }),
            ...row.map((val, col) => {
                const cx = leftX + gridStartX + col * (cellW + 6)
                const cy = gridStartY + r * (cellH + 8)
                const active = val === 1
                return label(
                    c,
                    String(val),
                    cx,
                    cy + 12,
                    cellW,
                    20,
                    15,
                    active ? red : muted,
                    active ? 700 : 400,
                    'center',
                    true,
                )
            }),
        ]),

        label(
            c,
            'q0 only attends to k0; ignores cached prefix k1..k3!',
            leftX + 16,
            290,
            panelW - 32,
            18,
            13,
            red,
            600,
        ),

        // Right panel: FA 2.1+ (Bottom-Right)
        SvgFrame({
            c,
            x: rightX,
            y: 75,
            width: panelW,
            height: 310,
            rx: 8,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.05)' : 'rgba(26, 127, 55, 0.03)',
        }),
        label(
            c,
            'FlashAttention 2.1+ (Bottom-Right)',
            rightX + 16,
            88,
            panelW - 32,
            22,
            16,
            green,
            700,
        ),
        label(
            c,
            'Aligns to end of KV sequence for cached decoding',
            rightX + 16,
            110,
            panelW - 32,
            18,
            13,
            muted,
        ),

        // Column headers (k0..k4)
        ...[0, 1, 2, 3, 4].map((col) =>
            label(
                c,
                `k${col}`,
                rightX + gridStartX + col * (cellW + 6),
                gridStartY - 24,
                cellW,
                20,
                13,
                muted,
                600,
                'center',
                true,
            ),
        ),

        // Grid cells Right
        ...maskRight.flatMap((row, r) => [
            label(
                c,
                `q${r}`,
                rightX + 22,
                gridStartY + r * (cellH + 8) + 12,
                36,
                20,
                14,
                c.textPrimary,
                700,
                'right',
                true,
            ),
            ...row.map((val, col) => {
                const cx = rightX + gridStartX + col * (cellW + 6)
                const cy = gridStartY + r * (cellH + 8)
                const active = val === 1
                return SvgFrame({
                    c,
                    x: cx,
                    y: cy,
                    width: cellW,
                    height: cellH,
                    rx: 4,
                    stroke: active ? green : 'transparent',
                    strokeWidth: 1.5,
                    fill: active
                        ? theme === 'dark'
                            ? 'rgba(63, 185, 80, 0.25)'
                            : 'rgba(26, 127, 55, 0.18)'
                        : theme === 'dark'
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(0, 0, 0, 0.03)',
                })
            }),
            ...row.map((val, col) => {
                const cx = rightX + gridStartX + col * (cellW + 6)
                const cy = gridStartY + r * (cellH + 8)
                const active = val === 1
                return label(
                    c,
                    String(val),
                    cx,
                    cy + 12,
                    cellW,
                    20,
                    15,
                    active ? green : muted,
                    active ? 700 : 400,
                    'center',
                    true,
                )
            }),
        ]),

        label(
            c,
            'q0 attends to k0..k3; q1 attends to all keys k0..k4.',
            rightX + 16,
            290,
            panelW - 32,
            18,
            13,
            green,
            600,
        ),

        // Bottom panel: Summary
        SvgFrame({
            c,
            x: 35,
            y: 400,
            width: 790,
            height: 75,
            rx: 8,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.08)' : 'rgba(26, 127, 55, 0.04)',
        }),
        label(c, 'Autoregressive Generation Mask Invariant', 52, 410, 750, 20, 16, green, 700),
        label(
            c,
            'Bottom-right alignment offsets the diagonal condition by (seqlen_k - seqlen_q), ensuring newly generated tokens can attend across the complete historical KV cache.',
            52,
            434,
            750,
            32,
            14,
            c.textPrimary,
            400,
        ),
    ])
}
