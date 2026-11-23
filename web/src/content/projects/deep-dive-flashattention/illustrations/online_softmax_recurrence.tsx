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
    'Online softmax recurrence across two tiles of key-value blocks in SRAM. Tile 1 processes initial scores, storing running maximum m=2, normalizer ell=1.3679, and unnormalized output numerator u=[3.6788, 10.0]. Tile 2 introduces new maximum m=3, triggering an exponential rescaling factor alpha=exp(-1)=0.3679 on the prior normalizer and numerator before accumulating new values. Final output O=u/ell yields [4.380, 5.620].'

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
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const muted = c.textSecondary

    const panelW = 345
    const leftX = 35
    const rightX = 480

    return renderBoard(c, [
        label(
            c,
            'FlashAttention Online Softmax Recurrence',
            35,
            18,
            790,
            28,
            22,
            c.textPrimary,
            700,
        ),
        label(
            c,
            'Tiled SRAM accumulation without materializing the full N×N attention matrix in HBM',
            35,
            46,
            790,
            20,
            15,
            muted,
            400,
        ),

        // Left panel: Tile 1
        SvgFrame({
            c,
            x: leftX,
            y: 75,
            width: panelW,
            height: 315,
            rx: 8,
            stroke: blue,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.06)' : 'rgba(9, 105, 218, 0.04)',
        }),
        label(
            c,
            'Tile 1 · Scores S^(1) = [1.0, 2.0]',
            leftX + 16,
            88,
            panelW - 32,
            22,
            16,
            blue,
            700,
        ),

        SvgFrame({
            c,
            x: leftX + 16,
            y: 118,
            width: panelW - 32,
            height: 70,
            rx: 6,
            stroke: blue,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.12)' : 'rgba(9, 105, 218, 0.08)',
        }),
        label(
            c,
            'Tile Maximum & Normalizer',
            leftX + 26,
            126,
            panelW - 52,
            18,
            14,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'm^(1) = 2.0   |   ℓ^(1) = e^(-1) + e^0 = 1.3679',
            leftX + 26,
            148,
            panelW - 52,
            20,
            14,
            blue,
            700,
            'left',
            true,
        ),

        SvgFrame({
            c,
            x: leftX + 16,
            y: 198,
            width: panelW - 32,
            height: 70,
            rx: 6,
            stroke: blue,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(56, 139, 253, 0.12)' : 'rgba(9, 105, 218, 0.08)',
        }),
        label(
            c,
            'Unnormalized Accumulator u^(1)',
            leftX + 26,
            206,
            panelW - 52,
            18,
            14,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'u^(1) = Σ e^(S_i - m) V_i = [3.6788, 10.000]',
            leftX + 26,
            228,
            panelW - 52,
            20,
            14,
            c.textPrimary,
            700,
            'left',
            true,
        ),

        label(
            c,
            'Stored in fast GPU on-chip SRAM',
            leftX + 16,
            285,
            panelW - 32,
            18,
            13,
            muted,
            400,
        ),

        // Transition arrow and rescale indicator in center
        VectorArrow({
            x1: leftX + panelW + 8,
            y1: 220,
            x2: rightX - 8,
            y2: 220,
            color: purple,
            strokeWidth: 2,
            arrowSize: 4,
        }),
        label(c, 'α = e^(2 - 3)', 385, 175, 90, 20, 14, purple, 700, 'center', true),
        label(c, '≈ 0.3679', 385, 195, 90, 18, 13, purple, 600, 'center', true),
        label(c, 'Rescale', 385, 235, 90, 18, 13, muted, 600, 'center'),

        // Right panel: Tile 2
        SvgFrame({
            c,
            x: rightX,
            y: 75,
            width: panelW,
            height: 315,
            rx: 8,
            stroke: purple,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.06)' : 'rgba(130, 80, 223, 0.04)',
        }),
        label(
            c,
            'Tile 2 · Scores S^(2) = [3.0, 0.0]',
            rightX + 16,
            88,
            panelW - 32,
            22,
            16,
            purple,
            700,
        ),

        SvgFrame({
            c,
            x: rightX + 16,
            y: 118,
            width: panelW - 32,
            height: 70,
            rx: 6,
            stroke: purple,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.12)' : 'rgba(130, 80, 223, 0.08)',
        }),
        label(
            c,
            'Updated Maximum & Normalizer',
            rightX + 26,
            126,
            panelW - 52,
            18,
            14,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'm^(2) = 3.0   |   ℓ^(2) = α·ℓ^(1) + Σ e^(S_i - m) = 1.5530',
            rightX + 26,
            148,
            panelW - 52,
            20,
            13,
            purple,
            700,
            'left',
            true,
        ),

        SvgFrame({
            c,
            x: rightX + 16,
            y: 198,
            width: panelW - 32,
            height: 70,
            rx: 6,
            stroke: purple,
            strokeWidth: 1,
            fill: theme === 'dark' ? 'rgba(163, 113, 247, 0.12)' : 'rgba(130, 80, 223, 0.08)',
        }),
        label(
            c,
            'Rescaled + Accumulated Numerator',
            rightX + 26,
            206,
            panelW - 52,
            18,
            14,
            c.textPrimary,
            600,
        ),
        label(
            c,
            'u^(2) = α·u^(1) + Σ e^(S_i - m) V_i = [6.8014, 8.7286]',
            rightX + 26,
            228,
            panelW - 52,
            20,
            13,
            c.textPrimary,
            700,
            'left',
            true,
        ),

        label(
            c,
            'Accumulated without HBM roundtrip',
            rightX + 16,
            285,
            panelW - 32,
            18,
            13,
            muted,
            400,
        ),

        // Bottom panel: Final normalized output
        SvgFrame({
            c,
            x: 35,
            y: 405,
            width: 790,
            height: 72,
            rx: 8,
            stroke: green,
            strokeWidth: 1.5,
            fill: theme === 'dark' ? 'rgba(63, 185, 80, 0.08)' : 'rgba(26, 127, 55, 0.05)',
        }),
        label(
            c,
            'Final Normalized Output: O = u^(2) / ℓ^(2) ≈ [4.380, 5.620]',
            52,
            414,
            750,
            22,
            16,
            green,
            700,
            'left',
            true,
        ),
        label(
            c,
            'Mathematically identical to standard Softmax(Q K^T) V with O(N) memory complexity instead of O(N^2).',
            52,
            438,
            750,
            20,
            14,
            c.textPrimary,
            500,
        ),
    ])
}
