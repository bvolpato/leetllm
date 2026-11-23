import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import { createElement } from 'react'
import type { ThemeMode } from 'vizmatic'

export const width = 860
export const height = 520
export const opaqueBackground = true
export const alt =
    'Eight GPUs form four data-parallel replicas when tensor parallelism is 2 and pipeline and context parallelism are each 1. Within every replica, two tensor-parallel ranks cooperate on the same microbatch; they do not add examples. Each of four independent replicas processes eight microbatches of two sequences, totaling 2 × 8 × 4 = 64 sequences per update. On a common 128-sequence scale, changing to eight replicas with four accumulation steps keeps 64, while eight replicas with eight steps reaches 128.'

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

function frame(
    c: Colors,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    fill: string,
    rx = 8,
    strokeWidth = 1.5,
) {
    return SvgFrame({ c, x, y, width: w, height: h, rx, fill, stroke: color, strokeWidth })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const muted = c.textSecondary

    const scaleLeft = 484
    const scaleWidth = 328
    const xAt = (seqs: number) => scaleLeft + (seqs / 128) * scaleWidth

    const geometry = [
        // Left Panel: Micro-batch Grid
        frame(c, 24, 76, 420, 416, blue, `${blue}08`, 10, 1.5),

        // 4 Replica Rows (y = 140, 196, 252, 308)
        ...[0, 1, 2, 3].flatMap((r) => {
            const y = 140 + r * 56
            const toneColor = [blue, purple, warm, green][r]
            return [
                frame(c, 36, y, 396, 48, toneColor, `${toneColor}12`, 6, 1.2),
                // 8 microbatch slots
                ...Array.from({ length: 8 }).map((_, m) =>
                    SvgFrame({
                        c,
                        x: 140 + m * 34,
                        y: y + 8,
                        width: 30,
                        height: 32,
                        rx: 4,
                        fill: c.bgCard,
                        stroke: toneColor,
                        strokeWidth: 1,
                    }),
                ),
            ]
        }),

        // Right Panel: Comparative Bars
        frame(c, 460, 76, 376, 416, green, `${green}08`, 10, 1.5),

        // Scale Axis line at y = 148
        SvgFrame({
            c,
            x: scaleLeft,
            y: 148,
            width: scaleWidth,
            height: 2,
            rx: 1,
            fill: c.border,
            stroke: c.border,
            strokeWidth: 0,
        }),

        // Bar 1 (y = 192, 64 seqs)
        SvgFrame({
            c,
            x: scaleLeft,
            y: 192,
            width: xAt(64) - scaleLeft,
            height: 28,
            rx: 5,
            fill: `${blue}50`,
            stroke: blue,
            strokeWidth: 1.5,
        }),

        // Bar 2 (y = 258, 64 seqs)
        SvgFrame({
            c,
            x: scaleLeft,
            y: 258,
            width: xAt(64) - scaleLeft,
            height: 28,
            rx: 5,
            fill: `${purple}50`,
            stroke: purple,
            strokeWidth: 1.5,
        }),

        // Bar 3 (y = 324, 128 seqs)
        SvgFrame({
            c,
            x: scaleLeft,
            y: 324,
            width: xAt(128) - scaleLeft,
            height: 28,
            rx: 5,
            fill: `${green}50`,
            stroke: green,
            strokeWidth: 1.5,
        }),

        // Vertical Scale Ticks
        ...[0, 32, 64, 96, 128].map((tick) =>
            SvgFrame({
                c,
                x: xAt(tick) - 1,
                y: 142,
                width: 2,
                height: 218,
                rx: 1,
                fill: c.borderSubtle,
                stroke: c.borderSubtle,
                strokeWidth: 0,
            }),
        ),

        // Bottom Formula Box
        frame(c, 474, 396, 348, 76, c.borderSubtle, c.bgCard, 6, 1),
    ]

    const labels = [
        // Main Header
        label(
            c,
            'Global Batch Composition Across Replicas & Accumulation',
            24,
            14,
            812,
            28,
            22,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Formula: B_global = B_micro × K × D_replica · Mapping tensor parallelism, micro-batches, and accumulation steps',
            24,
            44,
            812,
            20,
            13,
            muted,
            500,
        ),

        // Left Panel Header
        label(c, '1 · Micro-batch Processing Grid', 36, 88, 396, 20, 16, blue, 700),
        label(
            c,
            '4 DP Replicas × 8 Micro-batches (B_micro = 2 sequences per step)',
            36,
            110,
            396,
            16,
            11,
            muted,
            500,
        ),

        // Column headers for micro-batches
        ...Array.from({ length: 8 }).map((_, m) =>
            label(c, `m${m + 1}`, 140 + m * 34, 124, 30, 14, 10, muted, 600, 'center'),
        ),

        // 4 Replica Labels & Contents
        ...[0, 1, 2, 3].flatMap((r) => {
            const y = 140 + r * 56
            const toneColor = [blue, purple, warm, green][r]
            return [
                label(c, `Replica ${r}`, 44, y + 16, 88, 16, 12, toneColor, 700),
                ...Array.from({ length: 8 }).map((_, m) =>
                    label(
                        c,
                        '2',
                        140 + m * 34,
                        y + 16,
                        30,
                        16,
                        11,
                        c.textPrimary,
                        600,
                        'center',
                        true,
                    ),
                ),
            ]
        }),

        // Left Panel Footer Note
        label(
            c,
            'Each row: 8 micro-batches × 2 seqs = 16 seqs per replica',
            36,
            372,
            396,
            18,
            12,
            c.textPrimary,
            600,
            'center',
        ),
        label(
            c,
            'Global total: 4 replicas × 16 seqs = 64 sequences per optimizer update',
            36,
            392,
            396,
            18,
            12,
            blue,
            700,
            'center',
        ),
        label(
            c,
            'TP=2 ranks split layer weights within each replica; they do not add batch sequences.',
            36,
            420,
            396,
            40,
            11,
            muted,
            400,
            'center',
        ),

        // Right Panel Header
        label(c, '2 · Global Batch Size Comparisons', 474, 88, 348, 20, 16, green, 700),
        label(
            c,
            'Comparing configurations on a 128-sequence global scale',
            474,
            110,
            348,
            16,
            11,
            muted,
            500,
        ),

        // Scale Ticks
        label(c, '0', xAt(0) - 10, 126, 20, 14, 10, muted, 600, 'center'),
        label(c, '32', xAt(32) - 10, 126, 20, 14, 10, muted, 600, 'center'),
        label(c, '64', xAt(64) - 10, 126, 20, 14, 10, blue, 700, 'center'),
        label(c, '96', xAt(96) - 10, 126, 20, 14, 10, muted, 600, 'center'),
        label(c, '128 seqs', xAt(128) - 30, 126, 60, 14, 10, green, 700, 'center'),

        // Bar 1 Labels
        label(c, '4 Replicas × 8 Micro-batches', 474, 174, 250, 16, 11, c.textPrimary, 600),
        label(c, '64 Sequences (Baseline)', scaleLeft + 6, 198, 150, 16, 11, blue, 700),

        // Bar 2 Labels
        label(c, '8 Replicas × 4 Micro-batches', 474, 240, 250, 16, 11, c.textPrimary, 600),
        label(c, '64 Sequences (2× DP, 0.5× Accum)', scaleLeft + 6, 264, 150, 16, 11, purple, 700),

        // Bar 3 Labels
        label(c, '8 Replicas × 8 Micro-batches', 474, 306, 250, 16, 11, c.textPrimary, 600),
        label(c, '128 Sequences (2× DP, Full Accum)', scaleLeft + 6, 330, 150, 16, 11, green, 700),

        // Bottom Formula Box Labels
        label(
            c,
            'B_global = B_micro × K_accum × D_replica',
            484,
            404,
            328,
            18,
            13,
            green,
            700,
            'center',
            true,
        ),
        label(
            c,
            'Data parallelism (DP) multiplies independent sequence count.\nTensor (TP), pipeline (PP), and context (CP) divide model states.',
            484,
            428,
            328,
            36,
            11,
            muted,
            400,
            'center',
        ),
    ]

    const svg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
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
