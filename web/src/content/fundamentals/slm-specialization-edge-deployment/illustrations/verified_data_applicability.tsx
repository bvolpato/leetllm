import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 1280
export const height = 720
export const alt =
    'A query asks about pump-A. Manual M-7 gives pump-A and 12 Nm, so its citation, number, and equipment checks pass. Manual M-8 gives pump-B and 30 Nm; its citation and number match their source, but its equipment check fails and the example is rejected. This worked example demonstrates source applicability and gives no maintenance instruction.'

const label = (
    c: ReturnType<typeof getThemeColors>,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    fontSize = 42,
    fontWeight = 600,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'center',
) => (
    <CanvasItem x={x} y={y} width={w} height={h}>
        <TextLabel
            c={c}
            text={text}
            width="100%"
            fontSize={fontSize}
            fontWeight={fontWeight}
            color={color}
            align={align}
            math={false}
        />
    </CanvasItem>
)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const structural = getReadableToneColor('neutral', c, c.bg)
    const blue = getReadableToneColor('blue', c, c.bg)
    const green = getReadableToneColor('green', c, c.bg)
    const red = getReadableToneColor('critical', c, c.bg)
    const warm = getReadableToneColor('warm', c, c.bg)
    const greenFill = getToneFill('green', c)
    const redFill = getToneFill('critical', c)

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox="0 0 1280 720">
                    <defs>
                        <marker
                            id="source-arrow"
                            markerWidth="18"
                            markerHeight="18"
                            refX="15"
                            refY="9"
                            orient="auto"
                            markerUnits="userSpaceOnUse"
                        >
                            <path d="M2 2 L16 9 L2 16 Z" fill={blue} />
                        </marker>
                    </defs>
                    <rect
                        x="355"
                        y="180"
                        width="300"
                        height="174"
                        rx="20"
                        fill={c.bgSubtle}
                        stroke={green}
                        strokeWidth="4"
                    />
                    <path d="M600 180 V222 H655" fill="none" stroke={green} strokeWidth="4" />
                    <rect
                        x="355"
                        y="390"
                        width="300"
                        height="174"
                        rx="20"
                        fill={c.bgSubtle}
                        stroke={warm}
                        strokeWidth="4"
                    />
                    <path d="M600 390 V432 H655" fill="none" stroke={warm} strokeWidth="4" />
                    <rect
                        x="708"
                        y="206"
                        width="198"
                        height="116"
                        rx="18"
                        fill={greenFill}
                        stroke={green}
                        strokeWidth="3"
                    />
                    <rect
                        x="708"
                        y="416"
                        width="198"
                        height="116"
                        rx="18"
                        fill={greenFill}
                        stroke={green}
                        strokeWidth="3"
                    />
                    <rect
                        x="927"
                        y="206"
                        width="194"
                        height="116"
                        rx="18"
                        fill={greenFill}
                        stroke={green}
                        strokeWidth="3"
                    />
                    <rect
                        x="927"
                        y="416"
                        width="194"
                        height="116"
                        rx="18"
                        fill={redFill}
                        stroke={red}
                        strokeWidth="3"
                    />
                    <path d="M1122 263 H1130 M1122 473 H1130" stroke={structural} strokeWidth="5" />
                    <circle
                        cx="170"
                        cy="350"
                        r="90"
                        fill={getToneFill('blue', c)}
                        stroke={blue}
                        strokeWidth="4"
                    />
                    <path
                        d="M84 350 H128 M212 350 H254 M128 350 C128 315 164 315 164 350 C164 385 200 385 200 350"
                        fill="none"
                        stroke={blue}
                        strokeWidth="9"
                        strokeLinecap="round"
                    />
                    <path
                        d="M123 271 V248 H211 V271 M132 429 V450 H203 V429"
                        fill="none"
                        stroke={blue}
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M260 340 C305 340 308 268 352 268"
                        fill="none"
                        stroke={blue}
                        strokeWidth="6"
                        markerEnd="url(#source-arrow)"
                    />
                    <path
                        d="M260 365 C305 365 308 470 352 470"
                        fill="none"
                        stroke={blue}
                        strokeWidth="6"
                        markerEnd="url(#source-arrow)"
                    />
                    <path
                        d="M682 220 L694 232 L715 208"
                        fill="none"
                        stroke={green}
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M682 430 L694 442 L715 418"
                        fill="none"
                        stroke={green}
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M940 241 L951 252 L969 232"
                        fill="none"
                        stroke={green}
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M940 446 L966 472 M966 446 L940 472"
                        fill="none"
                        stroke={red}
                        strokeWidth="7"
                        strokeLinecap="round"
                    />
                    <path
                        d="M1128 206 H1266 V322 H1128 Z M1128 416 H1266 V532 H1128 Z"
                        fill={c.bgSubtle}
                        stroke={structural}
                        strokeWidth="3"
                    />
                </svg>
            </CanvasItem>
            {label(c, 42, 22, 1196, 58, 'A cited value must match its source', 50, 780)}
            {label(c, 68, 126, 230, 50, 'QUESTION', 44, 760, blue)}
            {label(c, 342, 126, 326, 50, 'SOURCE', 42, 730)}
            {label(c, 704, 126, 208, 50, 'ID / #', 44, 730)}
            {label(c, 922, 126, 204, 50, 'MATCH', 44, 730)}
            {label(c, 1128, 126, 138, 50, 'RESULT', 42, 730)}
            {label(c, 42, 470, 256, 54, 'pump-A', 42, 800, blue)}
            {label(c, 42, 526, 256, 48, 'TARGET', 42, 650, c.textMuted)}
            {label(c, 374, 194, 248, 48, 'M-7', 46, 760, green, 'left')}
            {label(c, 374, 246, 250, 48, 'pump-A', 42, 680)}
            {label(c, 374, 294, 250, 48, '12 N·m', 42, 680)}
            {label(c, 374, 404, 248, 48, 'M-8', 46, 760, warm, 'left')}
            {label(c, 374, 456, 250, 48, 'pump-B', 42, 680)}
            {label(c, 374, 504, 250, 48, '30 N·m', 42, 680)}
            {label(c, 710, 220, 194, 50, 'PASS', 46, 800, c.textPrimary)}
            {label(c, 710, 270, 194, 48, 'cite + #', 42, 620, c.textPrimary)}
            {label(c, 710, 430, 194, 50, 'PASS', 46, 800, c.textPrimary)}
            {label(c, 710, 480, 194, 48, 'cite + #', 42, 620, c.textPrimary)}
            {label(c, 978, 220, 136, 50, 'PASS', 42, 800, c.textPrimary, 'left')}
            {label(c, 930, 270, 188, 48, 'pump-A', 40, 620, c.textPrimary)}
            {label(c, 978, 430, 136, 50, 'FAIL', 42, 800, c.textPrimary, 'left')}
            {label(c, 930, 480, 188, 48, 'pump-B', 40, 620, c.textPrimary)}
            {label(c, 1128, 220, 138, 50, 'PASS', 44, 800, c.textPrimary)}
            {label(c, 1128, 270, 138, 48, 'M-7', 42, 760, c.textPrimary)}
            {label(c, 1128, 430, 138, 50, 'NO', 44, 800, c.textPrimary)}
            {label(c, 1128, 480, 138, 48, 'M-8', 42, 760, c.textPrimary)}
            {label(
                c,
                70,
                632,
                1140,
                50,
                'Only M-7 matches pump-A; both IDs and values match.',
                42,
                650,
                c.textMuted,
            )}
        </Board>
    )
}

export default create('dark')
