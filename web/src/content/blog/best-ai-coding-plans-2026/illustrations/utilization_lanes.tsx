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
export const height = 510
export const alt =
    'Remaining allowance comparison: short-window balance 1500 credits, weekly balance 600 credits. Only 600 credits fit within both limits before a reset. An 800-credit workload exceeds the weekly balance.'

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const blue = getReadableToneColor('cyan', c),
        purple = getReadableToneColor('purple', c),
        amber = getReadableToneColor('warm', c)
    const x = (credits: number) => 55 + (credits * 580) / 1800
    const label = (
        text: string,
        px: number,
        py: number,
        w: number,
        size = 24,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        weight = 500,
    ) =>
        CanvasItem({
            x: px,
            y: py,
            width: w,
            height: size * 1.6,
            children: TextLabel({
                c,
                text,
                width: w,
                fontSize: size,
                color,
                align,
                fontWeight: weight,
            }),
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
                        <rect
                            x="55"
                            y="155"
                            width={x(1500) - x(0)}
                            height="40"
                            rx="3"
                            fill={blue}
                        />
                        <rect
                            x="55"
                            y="285"
                            width={x(600) - x(0)}
                            height="40"
                            rx="3"
                            fill={purple}
                        />
                        <line
                            x1={x(800)}
                            x2={x(800)}
                            y1="140"
                            y2="345"
                            stroke={amber}
                            strokeWidth="3"
                            strokeDasharray="5 5"
                        />
                        <line x1="55" x2="635" y1="370" y2="370" stroke={c.borderLight} />
                        {[0, 600, 1200, 1800].map((v) => (
                            <line
                                key={v}
                                x1={x(v)}
                                x2={x(v)}
                                y1="364"
                                y2="376"
                                stroke={c.borderLight}
                            />
                        ))}
                    </svg>
                ),
            }),
            label('Only 600 credits fit both windows', 30, 16, 640, 30, c.textPrimary, 'left', 650),
            label('Remaining balances before either reset', 30, 64, 640, 23, c.textSecondary),
            label('Short window', 55, 110, 280, 26, blue, 'left', 600),
            label('1,500', 550, 155, 120, 26, blue, 'left', 650),
            label('Weekly window', 55, 240, 360, 26, purple, 'left', 600),
            label('600', 160, 285, 80, 26, c.bg, 'right', 650),
            ...[0, 600, 1200, 1800].map((v) =>
                label(v.toLocaleString('en-US'), x(v) - 45, 383, 90, 24, c.textSecondary, 'center'),
            ),
            label(
                '800-credit request exceeds the weekly balance',
                30,
                443,
                640,
                25,
                amber,
                'left',
                600,
            ),
        ],
    })
}
export default create()
