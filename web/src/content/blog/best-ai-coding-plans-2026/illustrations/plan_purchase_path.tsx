import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 700
export const height = 460
export const alt =
    'Modeled monthly cost breakdown: 200 dollars for seats, 80 dollars for extra usage, and 600 dollars for review and correction. Vendor charges total 280 dollars; economic cost totals 880 dollars. Forty accepted changes yields 7 dollars vendor cost or 22 dollars including labor per change.'

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tones = ['cyan', 'purple', 'warm'] as const
    const colors = tones.map((tone) => getReadableToneColor(tone, c))
    const label = (
        text: string,
        x: number,
        y: number,
        w: number,
        size = 24,
        color = c.textPrimary,
        weight = 500,
    ) =>
        CanvasItem({
            x,
            y,
            width: w,
            height: size * 1.6,
            children: TextLabel({ c, text, width: w, fontSize: size, color, fontWeight: weight }),
        })
    const scale = 610 / 880
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
                        {[170, 325].map((y, row) =>
                            [200, 80, ...(row ? [600] : [])].map((v, i, values) => (
                                <rect
                                    key={`${row}-${i}`}
                                    x={40 + values.slice(0, i).reduce((a, b) => a + b, 0) * scale}
                                    y={y}
                                    width={v * scale}
                                    height="40"
                                    fill={colors[i]}
                                />
                            )),
                        )}
                        {colors.map((color, i) => (
                            <rect
                                key={color}
                                x={40 + i * 210}
                                y="98"
                                width="14"
                                height="14"
                                rx="2"
                                fill={color}
                            />
                        ))}
                    </svg>
                ),
            }),
            label('Count review work in the budget', 32, 16, 640, 30, c.textPrimary, 650),
            label('40 accepted changes · modeled month · USD', 32, 62, 640, 23, c.textSecondary),
            ...['Seats $200', 'Extra usage $80', 'Review $600'].map((text, i) =>
                label(text, 64 + i * 210, 88, 190, 22, colors[i], 550),
            ),
            label('Vendor charges', 40, 130, 300, 25, c.textPrimary, 600),
            label('$280 ÷ 40 = $7 / change', 280, 169, 375, 26, c.textPrimary, 600),
            label('With review and correction', 40, 270, 610, 25, c.textPrimary, 600),
            label('$880 ÷ 40 = $22 / change', 40, 388, 610, 28, colors[2], 650),
        ],
    })
}
export default create()
