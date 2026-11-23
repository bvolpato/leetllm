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
    'Three recipe decisions compose a QLoRA SFT setup: response SFT supplies the learning signal, LoRA adapters are trainable while the base is frozen, and NF4 stores the base weights at four bits. On one shared 0–48 GiB scale, ideal storage for 70 billion four-bit weights is 32.6 GiB. This exceeds a hypothetical 24 GiB capacity by 8.6 GiB. A 48 GiB budget leaves 15.4 GiB after base weights for every omitted cost; that lower bound alone does not guarantee training fit.'

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
    const cyan = getReadableToneColor('cyan', c)
    const green = getReadableToneColor('green', c)
    const critical = getReadableToneColor('red', c)
    const muted = c.textSecondary

    const baseGib = (70e9 * 4) / 8 / 1024 ** 3 // ~32.596 GiB
    const scaleLeft = 460
    const scaleWidth = 340
    const xAt = (gib: number) => scaleLeft + (gib / 48) * scaleWidth

    const geometry = [
        // Left Panel: Architecture Choices
        frame(c, 24, 76, 386, 416, blue, `${blue}08`, 10, 1.5),
        frame(c, 38, 116, 358, 68, blue, `${blue}15`, 8, 1.2),
        frame(c, 38, 194, 358, 68, purple, `${purple}15`, 8, 1.2),
        frame(c, 38, 272, 358, 68, cyan, `${cyan}15`, 8, 1.2),
        frame(c, 38, 354, 358, 60, green, `${green}15`, 8, 1.2),

        // Right Panel: Memory Scale Comparison
        frame(c, 430, 76, 406, 416, green, `${green}08`, 10, 1.5),

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

        // 24 GiB Plan Bar (y = 190)
        // 0 to 24 GiB (usable base portion)
        SvgFrame({
            c,
            x: scaleLeft,
            y: 190,
            width: xAt(24) - scaleLeft,
            height: 32,
            rx: 5,
            fill: `${blue}50`,
            stroke: blue,
            strokeWidth: 1.5,
        }),
        // 24 to 32.6 GiB (deficit / overflow)
        SvgFrame({
            c,
            x: xAt(24),
            y: 190,
            width: xAt(baseGib) - xAt(24),
            height: 32,
            rx: 5,
            fill: `${critical}80`,
            stroke: critical,
            strokeWidth: 1.5,
        }),

        // 48 GiB Plan Bar (y = 286)
        // 0 to 32.6 GiB (base weights)
        SvgFrame({
            c,
            x: scaleLeft,
            y: 286,
            width: xAt(baseGib) - scaleLeft,
            height: 32,
            rx: 5,
            fill: `${green}50`,
            stroke: green,
            strokeWidth: 1.5,
        }),
        // 32.6 to 48 GiB (headroom for adapters & activations)
        SvgFrame({
            c,
            x: xAt(baseGib),
            y: 286,
            width: xAt(48) - xAt(baseGib),
            height: 32,
            rx: 5,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
        }),

        // Vertical threshold ticks
        ...[0, 24, baseGib, 48].map((tick) =>
            SvgFrame({
                c,
                x: xAt(tick) - (tick === baseGib ? 1.5 : 1),
                y: 140,
                width: tick === baseGib ? 3 : 2,
                height: 196,
                rx: 1,
                fill: tick === baseGib ? critical : c.borderSubtle,
                stroke: tick === baseGib ? critical : c.borderSubtle,
                strokeWidth: 0,
            }),
        ),
    ]

    const labels = [
        // Header
        label(
            c,
            'Three Choices Compose One Adaptation Recipe',
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
            'Objective · trainable parameters · base precision · evaluating 70B 4-bit memory floors',
            24,
            44,
            812,
            20,
            13,
            muted,
            500,
        ),

        // Left Panel: Architecture Decisions
        label(c, '1 · Adaptation Decisions', 38, 88, 358, 20, 16, blue, 700),

        label(c, 'OBJECTIVE: Response SFT', 48, 122, 338, 16, 12, blue, 700),
        label(
            c,
            'Supervised instruction fine-tuning.\nLoss calculated strictly on assistant response tokens.',
            48,
            140,
            338,
            34,
            11,
            c.textPrimary,
            400,
        ),

        label(c, 'PARAMETERS: LoRA A/B', 48, 200, 338, 16, 12, purple, 700),
        label(
            c,
            'Base model weights are frozen.\nOnly low-rank adapter matrices (A and B) are trained.',
            48,
            218,
            338,
            34,
            11,
            c.textPrimary,
            400,
        ),

        label(c, 'PRECISION: NF4 (4-bit)', 48, 278, 338, 16, 12, cyan, 700),
        label(
            c,
            'NormalFloat4 quantization on frozen base weights.\nCuts static parameter footprint by 75% vs FP16.',
            48,
            296,
            338,
            34,
            11,
            c.textPrimary,
            400,
        ),

        label(c, 'Combined Recipe: QLoRA SFT', 48, 362, 338, 18, 14, green, 700, 'center'),
        label(
            c,
            '70B parameters × 4 bits / 8 / 2³⁰ = 32.6 GiB base floor',
            48,
            384,
            338,
            16,
            12,
            c.textPrimary,
            600,
            'center',
        ),
        label(
            c,
            'Ideal minimum storage for base model parameters alone',
            38,
            434,
            358,
            18,
            11,
            muted,
            400,
            'center',
        ),

        // Right Panel: Memory Scale
        label(c, '2 · Memory Floor on 0–48 GiB Scale', 444, 88, 378, 20, 16, green, 700),
        label(
            c,
            'Comparing 32.6 GiB base floor against 24 and 48 GiB GPU budgets',
            444,
            110,
            378,
            16,
            11,
            muted,
            500,
        ),

        // Scale Ticks
        label(c, '0', xAt(0) - 10, 124, 20, 14, 10, muted, 600, 'center'),
        label(c, '24 GiB', xAt(24) - 25, 124, 50, 14, 10, blue, 700, 'center'),
        label(c, '32.6 GiB', xAt(baseGib) - 30, 124, 60, 14, 10, critical, 700, 'center'),
        label(c, '48 GiB', xAt(48) - 25, 124, 50, 14, 10, green, 700, 'center'),

        // 24 GiB Plan Labels
        label(c, '24 GiB GPU Budget', 444, 172, 200, 16, 12, c.textPrimary, 700),
        label(c, '24 GiB capacity', scaleLeft + 4, 198, 100, 16, 11, blue, 600),
        label(c, '+8.6 GiB Deficit', xAt(24) + 2, 198, 70, 16, 11, critical, 700),
        label(
            c,
            'Deficit: 24 GiB budget is 8.6 GiB short for base weights alone (OOM)',
            444,
            230,
            378,
            16,
            11,
            critical,
            600,
        ),

        // 48 GiB Plan Labels
        label(c, '48 GiB GPU Budget', 444, 268, 200, 16, 12, c.textPrimary, 700),
        label(c, '32.6 GiB Base Weights', scaleLeft + 4, 294, 150, 16, 11, green, 600),
        label(c, '15.4 GiB Room', xAt(baseGib) + 4, 294, 90, 16, 11, muted, 600),
        label(
            c,
            'Headroom: 15.4 GiB remains for adapters, optimizer, activations & CUDA',
            444,
            326,
            378,
            16,
            11,
            green,
            600,
        ),

        // Right Panel Footer
        label(c, 'Memory Reality Check', 444, 374, 378, 16, 12, c.textPrimary, 700),
        label(
            c,
            'The 32.6 GiB floor covers base weights only; activations, LoRA states, and CUDA workspace require extra VRAM headroom.',
            444,
            394,
            378,
            48,
            11,
            muted,
            400,
        ),
        label(
            c,
            'Always test full step allocation with max context length before launch.',
            444,
            452,
            378,
            16,
            11,
            c.textPrimary,
            500,
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
