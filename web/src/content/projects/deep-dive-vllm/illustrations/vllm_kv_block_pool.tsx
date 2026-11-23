import { createElement, type ReactElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const opaqueBackground = true
export const alt =
    'vLLM PagedAttention KV block pool and logical-to-physical block table mapping. Request R0 maps prefix block ABCD to physical block 12 and suffix EFGH to block 41. Request R1 shares prefix block 12 (reference count 2), while its diverge suffix EFXY maps to block 73 and partial block Z to block 90. Unreferenced physical blocks 88, 52, and 19 reside in the free allocation queue.'

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
    const green = getReadableToneColor('green', c)
    const purple = getReadableToneColor('purple', c)
    const blue = getReadableToneColor('blue', c)
    const muted = c.textSecondary

    const leftX = 35
    const panelW = 370
    const rightX = 455

    return renderBoard(c, [
        label(c, 'vLLM PagedAttention Block Manager', 35, 18, 790, 28, 22, c.textPrimary, 700),
        label(
            c,
            'Logical-to-physical block tables with prefix sharing, reference counting, and free queue',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Left panel: Logical Block Tables
        SvgFrame({
            c,
            x: leftX,
            y: 75,
            width: panelW,
            height: 310,
            rx: 8,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.05)' : 'rgba(9, 105, 218, 0.03)',
        }),
        label(
            c,
            'Logical Block Tables (Per Request)',
            leftX + 16,
            88,
            panelW - 32,
            22,
            16,
            blue,
            700,
        ),

        // R0 table
        label(c, 'Request R0 (8 tokens):', leftX + 16, 116, 160, 20, 14, c.textPrimary, 600),
        SvgFrame({
            c,
            x: leftX + 16,
            y: 140,
            width: 155,
            height: 44,
            rx: 5,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.15)' : 'rgba(26, 127, 55, 0.1)',
        }),
        label(c, 'L0: "ABCD" → #12', leftX + 24, 152, 140, 20, 13, green, 700, 'left', true),

        SvgFrame({
            c,
            x: leftX + 185,
            y: 140,
            width: 155,
            height: 44,
            rx: 5,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.15)' : 'rgba(130, 80, 223, 0.1)',
        }),
        label(c, 'L1: "EFGH" → #41', leftX + 193, 152, 140, 20, 13, purple, 700, 'left', true),

        // R1 table
        label(
            c,
            'Request R1 (9 tokens, shares prefix):',
            leftX + 16,
            200,
            300,
            20,
            14,
            c.textPrimary,
            600,
        ),
        SvgFrame({
            c,
            x: leftX + 16,
            y: 224,
            width: 105,
            height: 44,
            rx: 5,
            stroke: green,
            strokeWidth: 2,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.2)' : 'rgba(26, 127, 55, 0.15)',
        }),
        label(c, 'L0 → #12', leftX + 24, 236, 90, 20, 13, green, 700, 'left', true),

        SvgFrame({
            c,
            x: leftX + 130,
            y: 224,
            width: 105,
            height: 44,
            rx: 5,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.15)' : 'rgba(9, 105, 218, 0.1)',
        }),
        label(c, 'L1 → #73', leftX + 138, 236, 90, 20, 13, blue, 700, 'left', true),

        SvgFrame({
            c,
            x: leftX + 244,
            y: 224,
            width: 105,
            height: 44,
            rx: 5,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.15)' : 'rgba(9, 105, 218, 0.1)',
        }),
        label(c, 'L2 → #90', leftX + 252, 236, 90, 20, 13, blue, 700, 'left', true),

        label(
            c,
            'Prefix Block #12 shared via ref_count = 2',
            leftX + 16,
            290,
            panelW - 32,
            20,
            13,
            green,
            600,
        ),
        label(
            c,
            'Zero memory copy during prompt sharing',
            leftX + 16,
            312,
            panelW - 32,
            18,
            12,
            muted,
        ),

        // VectorArrow connecting shared block
        VectorArrow({
            x1: leftX + panelW - 10,
            y1: 162,
            x2: rightX + 10,
            y2: 135,
            color: green,
            strokeWidth: 1.5,
            arrowSize: 4,
        }),

        // Right panel: Physical Block Pool
        SvgFrame({
            c,
            x: rightX,
            y: 75,
            width: panelW,
            height: 310,
            rx: 8,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.05)' : 'rgba(130, 80, 223, 0.03)',
        }),
        label(c, 'Physical GPU KV Block Pool', rightX + 16, 88, panelW - 32, 22, 16, purple, 700),

        // Physical blocks
        SvgFrame({
            c,
            x: rightX + 16,
            y: 118,
            width: panelW - 32,
            height: 38,
            rx: 5,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.12)' : 'rgba(26, 127, 55, 0.08)',
        }),
        label(
            c,
            'Block #12: "ABCD" | ref_count = 2 (Shared)',
            rightX + 22,
            129,
            panelW - 44,
            18,
            12,
            green,
            700,
            'left',
            true,
        ),

        SvgFrame({
            c,
            x: rightX + 16,
            y: 162,
            width: panelW - 32,
            height: 38,
            rx: 5,
            stroke: purple,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.12)' : 'rgba(130, 80, 223, 0.08)',
        }),
        label(
            c,
            'Block #41: "EFGH"   |   ref_count = 1 (R0)',
            rightX + 26,
            172,
            panelW - 52,
            18,
            13,
            purple,
            600,
            'left',
            true,
        ),

        SvgFrame({
            c,
            x: rightX + 16,
            y: 206,
            width: panelW - 32,
            height: 38,
            rx: 5,
            stroke: blue,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.12)' : 'rgba(9, 105, 218, 0.08)',
        }),
        label(
            c,
            'Block #73: "EFXY"   |   ref_count = 1 (R1)',
            rightX + 26,
            216,
            panelW - 52,
            18,
            13,
            blue,
            600,
            'left',
            true,
        ),

        SvgFrame({
            c,
            x: rightX + 16,
            y: 250,
            width: panelW - 32,
            height: 38,
            rx: 5,
            stroke: blue,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.12)' : 'rgba(9, 105, 218, 0.08)',
        }),
        label(
            c,
            'Block #90: "Z..." | ref_count = 1 (R1 tail)',
            rightX + 22,
            261,
            panelW - 44,
            18,
            12,
            blue,
            600,
            'left',
            true,
        ),

        // Free queue
        SvgFrame({
            c,
            x: rightX + 16,
            y: 300,
            width: panelW - 32,
            height: 65,
            rx: 5,
            stroke: muted,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        }),
        label(
            c,
            'Free Allocation Queue (ref_count = 0):',
            rightX + 26,
            310,
            panelW - 52,
            18,
            13,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'Available Blocks: [#88, #52, #19, ...]',
            rightX + 26,
            334,
            panelW - 52,
            18,
            13,
            muted,
            500,
            'left',
            true,
        ),

        // Bottom panel: Takeaway
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
        label(
            c,
            'Copy-on-Write and Reference Counting Invariant',
            52,
            410,
            750,
            20,
            16,
            green,
            700,
        ),
        label(
            c,
            'PagedAttention maps logical blocks to physical pages; reference counts share prompt prefixes while diverged tokens draw free blocks.',
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
