import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 900
export const height = 640
export const alt =
    'Two decode data paths show packed INT4 weights read from HBM into a fused unpack, rescale, and FP16 multiply, alongside a standalone dequantization path that writes a full FP16 matrix to HBM and reads it again. The simplified weight-read comparison is 2 bytes per BF16 weight versus 0.5 code bytes plus scale metadata. The H100 roofline values give a ridge of about 295 FLOPs per byte; intensity one reaches 0.34 percent of dense BF16 peak. KV-cache storage remains a separate budget.'

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    fontSize: number,
    color: string,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight: number = 600,
): React.ReactElement {
    return CanvasItem({
        x,
        y,
        width: w,
        height: Math.max(36, fontSize + 10),
        children: TextLabel({ c, text, fontSize, fontWeight, color, align, width: w }),
    })
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme, theme === 'dark' ? 'default' : 'engineering')
    const blue = getReadableToneColor('blue', c, c.bg, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg, c.bg)
    const green = getReadableToneColor('green', c, c.bg, c.bg)
    const shareW = 10

    const art = (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <line x1={20} y1={102} x2={880} y2={102} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: 20,
                y: 152,
                width: 224,
                height: 70,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: c.warning,
                strokeWidth: 2,
            })}
            {VectorArrow({
                x1: 250,
                y1: 198,
                x2: 424,
                y2: 198,
                color: c.warning,
                strokeWidth: 2.5,
            })}
            {SvgFrame({
                c,
                x: 430,
                y: 152,
                width: 338,
                height: 70,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: c.primary,
                strokeWidth: 2,
            })}
            {VectorArrow({ x1: 774, y1: 187, x2: 828, y2: 187, color: c.primary, strokeWidth: 3 })}
            <line x1={20} y1={240} x2={880} y2={240} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: 20,
                y: 294,
                width: 142,
                height: 70,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: c.warning,
                strokeWidth: 2,
            })}
            {VectorArrow({
                x1: 166,
                y1: 329,
                x2: 196,
                y2: 329,
                color: c.warning,
                strokeWidth: 2.5,
            })}
            {SvgFrame({
                c,
                x: 200,
                y: 294,
                width: 164,
                height: 70,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: c.primary,
                strokeWidth: 2,
            })}
            {VectorArrow({ x1: 368, y1: 329, x2: 412, y2: 329, color: c.warning, strokeWidth: 6 })}
            {SvgFrame({
                c,
                x: 416,
                y: 294,
                width: 160,
                height: 70,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: c.warning,
                strokeWidth: 2,
            })}
            {VectorArrow({ x1: 580, y1: 329, x2: 624, y2: 329, color: c.warning, strokeWidth: 6 })}
            {SvgFrame({
                c,
                x: 628,
                y: 294,
                width: 160,
                height: 70,
                rx: 6,
                fill: c.bgCardAlt,
                stroke: c.primary,
                strokeWidth: 2,
            })}
            {VectorArrow({ x1: 792, y1: 329, x2: 834, y2: 329, color: c.primary, strokeWidth: 3 })}
            <line x1={20} y1={418} x2={880} y2={418} stroke={c.borderLight} strokeWidth={2} />
            {SvgFrame({
                c,
                x: 20,
                y: 470,
                width: 860,
                height: 30,
                rx: 4,
                fill: c.bgCardAlt,
                stroke: c.primary,
                strokeWidth: 1.5,
            })}
            {SvgFrame({
                c,
                x: 20,
                y: 470,
                width: shareW,
                height: 30,
                rx: 4,
                fill: c.warning,
                stroke: c.warning,
                strokeWidth: 1,
            })}
        </svg>
    )

    const children = [
        CanvasItem({ x: 0, y: 0, width, height, children: art }),
        label(
            c,
            'Decode weight traffic: fused vs. standalone',
            20,
            14,
            860,
            34,
            c.textPrimary,
            'left',
            700,
        ),
        label(
            c,
            'HBM reads per weight · H100 BF16 roofline context',
            20,
            56,
            860,
            29,
            c.textSecondary,
        ),
        label(c, '1. Fused W4A16 kernel', 20, 114, 420, 30, green, 'left', 700),
        label(c, '0.5 B codes + scales', 450, 116, 430, 28, warm, 'right', 700),
        label(c, 'HBM', 20, 156, 224, 28, warm, 'center', 700),
        label(c, 'codes + scales', 20, 188, 224, 27, c.textSecondary, 'center', 600),
        label(c, '0.5 B/wt', 250, 158, 174, 27, warm, 'center', 700),
        label(c, 'Fused kernel', 430, 156, 338, 28, c.textPrimary, 'center', 700),
        label(c, 'unpack, scale, multiply', 430, 188, 338, 27, blue, 'center', 650),
        label(c, 'Y', 836, 168, 44, 30, c.textPrimary, 'left', 700),
        label(c, '2. Standalone dequantize path', 20, 252, 460, 30, warm, 'left', 700),
        label(c, '2 B/weight written + read', 490, 254, 390, 28, warm, 'right', 700),
        label(c, 'HBM', 20, 298, 142, 28, warm, 'center', 700),
        label(c, 'packed W', 20, 330, 142, 27, c.textSecondary, 'center', 600),
        label(c, 'Dequant', 200, 298, 164, 28, c.textPrimary, 'center', 700),
        label(c, 'to FP16', 200, 330, 164, 27, c.textSecondary, 'center', 600),
        label(c, 'HBM', 416, 298, 160, 28, warm, 'center', 700),
        label(c, 'FP16 W', 416, 330, 160, 27, c.textSecondary, 'center', 600),
        label(c, 'FP16', 628, 298, 160, 28, c.textPrimary, 'center', 700),
        label(c, 'multiply', 628, 330, 160, 27, c.textPrimary, 'center', 700),
        label(c, 'Y', 842, 310, 38, 30, c.textPrimary, 'left', 700),
        label(
            c,
            '2 bytes per weight written to HBM and read again',
            20,
            376,
            860,
            28,
            warm,
            'left',
            600,
        ),
        label(
            c,
            'H100 BF16: 989.5 TFLOP/s compute · 3.35 TB/s memory',
            20,
            430,
            860,
            28,
            c.textSecondary,
            'left',
            600,
        ),
        label(c, '1 FLOP/byte memory ceiling: 0.34% of peak', 20, 510, 670, 28, warm, 'left', 700),
        label(c, 'Compute', 700, 510, 180, 28, blue, 'right', 700),
        label(c, 'The ridge sits near 295 FLOPs per byte.', 20, 552, 860, 28, c.textSecondary),
        label(
            c,
            'KV-cache precision remains a separate memory budget.',
            20,
            588,
            860,
            28,
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
