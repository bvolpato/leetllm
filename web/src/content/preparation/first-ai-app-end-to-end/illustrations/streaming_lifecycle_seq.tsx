import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
} from 'vizmatic'
import type { ThemeColors, ThemeMode } from 'vizmatic'

export const width = 680
export const height = 640
export const alt =
    'A sequence diagram with browser, server, and SQLite lanes. Time moves downward. The browser posts a ticket; the server saves a running row before sending local_signal and token events. The server then saves the completed row before sending done to the browser. The saved state therefore survives a lost connection.'

function label(c: ThemeColors, text: string, x: number, y: number, w: number, size = 25) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: 40,
        children: <TextLabel c={c} text={text} width={w} fontSize={size} align="center" />,
    })
}

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const steps = [
        { x1: 80, x2: 330, y: 164, text: 'POST ticket', color: blue },
        { x1: 350, x2: 600, y: 242, text: 'save running', color: blue },
        { x1: 330, x2: 80, y: 324, text: 'local_signal', color: purple },
        { x1: 330, x2: 80, y: 406, text: 'token events', color: purple },
        { x1: 350, x2: 600, y: 488, text: 'save completed', color: green },
        { x1: 330, x2: 80, y: 570, text: 'done', color: green },
    ]
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
                        {[80, 340, 600].map((x) => (
                            <line
                                key={x}
                                x1={x}
                                y1="115"
                                x2={x}
                                y2="602"
                                stroke={c.textSecondary}
                                strokeWidth="2"
                                strokeDasharray="5 7"
                            />
                        ))}
                        <rect
                            x="330"
                            y="159"
                            width="20"
                            height="413"
                            rx="4"
                            fill={c.bg}
                            stroke={blue}
                            strokeWidth="2"
                        />
                        {steps.map(({ x1, x2, y, color }) =>
                            VectorArrow({
                                key: y,
                                x1,
                                y1: y,
                                x2,
                                y2: y,
                                color,
                                strokeWidth: 3,
                                arrowSize: 5,
                            }),
                        )}
                    </svg>
                ),
            }),
            label(c, 'Save the result before sending done', 10, 16, 660, 29),
            label(c, 'Browser', 10, 78, 140, 27),
            label(c, 'Server', 270, 78, 140, 27),
            label(c, 'SQLite', 530, 78, 140, 27),
            ...steps.map(({ x1, x2, y, text }) =>
                label(c, text, Math.min(x1, x2), y - 40, Math.abs(x2 - x1)),
            ),
        ],
    })
}

export default create()
