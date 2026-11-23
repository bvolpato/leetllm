import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getThemeColors,
    getReadableToneColor,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 800
export const height = 564
export const alt =
    'Three rows of bit cells. FP32 has 32 cells: 1 sign, 8 exponent, and 23 fraction, with a largest value near 3.40e38 and a gap of 1.19e-7 above 1.0. BF16 has 16 cells: 1 sign, 8 exponent, and 7 fraction, and its cells line up with the first 16 cells of FP32. Its largest value is near 3.39e38 and its gap above 1.0 is 0.0078. FP16 has 16 cells: 1 sign, 5 exponent, and 10 fraction, with a largest value of 65,504 and a gap of 0.00098.'

const label = (
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    size = 24,
    color = c.textPrimary,
    weight = 500,
    align: 'left' | 'center' | 'right' = 'center',
) =>
    CanvasItem({
        x,
        y,
        width: w,
        height: size + 12,
        children: (
            <TextLabel
                c={c}
                text={text}
                width={w}
                fontSize={size}
                fontWeight={weight}
                color={color}
                align={align}
            />
        ),
    })

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tone = (name: 'blue' | 'warm') => getReadableToneColor(name, c)
    const rows = [
        { name: 'FP32 · 4 bytes', e: 8, f: 23, max: '3.40e38', gap: '1.19e−7' },
        { name: 'BF16 · 2 bytes', e: 8, f: 7, max: '3.39e38', gap: '0.0078' },
        { name: 'FP16 · 2 bytes', e: 5, f: 10, max: '65,504', gap: '0.00098' },
    ]
    const rowY = (i: number) => 116 + i * 134

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
                        <rect x="28" y="68" width="18" height="18" rx="3" fill={c.textMuted} />
                        <rect x="190" y="68" width="18" height="18" rx="3" fill={tone('blue')} />
                        <rect x="446" y="68" width="18" height="18" rx="3" fill={tone('warm')} />
                        {rows.map((r, i) =>
                            Array.from({ length: 1 + r.e + r.f }, (_, bit) => (
                                <rect
                                    key={`${i}-${bit}`}
                                    x={28 + bit * 23}
                                    y={rowY(i) + 38}
                                    width="20"
                                    height="34"
                                    rx="3"
                                    fill={
                                        bit === 0 ? c.textMuted : tone(bit <= r.e ? 'blue' : 'warm')
                                    }
                                />
                            )),
                        )}
                    </svg>
                ),
            }),
            label(
                c,
                'Range and precision use different bits',
                28,
                16,
                744,
                29,
                c.textPrimary,
                700,
                'left',
            ),
            label(c, '1 sign', 54, 62, 120, 24, c.textSecondary, 600, 'left'),
            label(c, 'Exponent · range', 216, 62, 220, 24, tone('blue'), 650, 'left'),
            label(c, 'Fraction · fine steps', 472, 62, 280, 24, tone('warm'), 650, 'left'),
            ...rows.flatMap((r, i) => {
                const y = rowY(i)
                return [
                    label(c, r.name, 28, y, 260, 26, c.textPrimary, 650, 'left'),
                    label(
                        c,
                        `1 sign + ${r.e} exp + ${r.f} frac`,
                        300,
                        y + 2,
                        464,
                        24,
                        c.textSecondary,
                        500,
                        'right',
                    ),
                    label(
                        c,
                        `Max ${r.max} · gap above 1: ${r.gap}`,
                        28,
                        y + 80,
                        744,
                        24,
                        c.textPrimary,
                        500,
                        'left',
                    ),
                ]
            }),
            label(
                c,
                'BF16 retains the first 16 bits of FP32',
                28,
                520,
                744,
                24,
                c.textSecondary,
                500,
                'center',
            ),
        ],
    })
}

export default create()
