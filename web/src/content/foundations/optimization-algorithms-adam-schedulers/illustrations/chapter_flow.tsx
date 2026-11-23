import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 800
export const height = 472
export const preset = 'engineering'
export const alt =
    'A buffer rack after coordinate a receives gradients 100 and minus 80. SGD retains no moment; EMA momentum retains m2 = 1; RMSProp with rho 0.9 retains s2 = 1540; Adam and AdamW retain m2 = 1 and v2 = 16.39 with beta2 0.999. Float32 moment costs are zero, four, four, eight, and eight bytes per parameter. A separate zero-state AdamW example sends weight 10 directly to 9.99 by subtracting decay 0.01, while both moments stay zero.'

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const red = getReadableToneColor('critical', c)
    const green = getReadableToneColor('green', c)
    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        size = 24,
        color = c.textPrimary,
        math = false,
    ) => (
        <CanvasItem x={x} y={y} width={w} height={size + 12}>
            <TextLabel c={c} text={text} fontSize={size} color={color} math={math} />
        </CanvasItem>
    )
    const rows = [
        { name: 'SGD', y: 158, signed: '', squared: '', bytes: '0 B' },
        { name: 'Momentum', y: 214, signed: 'm_2 = 1', squared: '', bytes: '4 B' },
        { name: 'RMSProp', y: 270, signed: '', squared: 's_2 = 1540', bytes: '4 B' },
        { name: 'Adam', y: 326, signed: 'm_2 = 1', squared: 'v_2 = 16.39', bytes: '8 B' },
        { name: 'AdamW', y: 382, signed: 'm_2 = 1', squared: 'v_2 = 16.39', bytes: '8 B' },
    ]
    return (
        <Scene c={c} padding={16} gap={0} contentWidth={768} background={c.bgSubtle}>
            <Board c={c} width={768} height={440} background={c.bgSubtle}>
                <CanvasItem x={0} y={0} width={768} height={440}>
                    <svg width={768} height={440} viewBox="0 0 768 440">
                        <SvgFrame
                            c={c}
                            x={150}
                            y={48}
                            width={132}
                            height={42}
                            fill={c.bg}
                            stroke={blue}
                            strokeWidth={2}
                        />
                        <SvgFrame
                            c={c}
                            x={318}
                            y={48}
                            width={132}
                            height={42}
                            fill={c.bg}
                            stroke={red}
                            strokeWidth={2}
                        />
                        <VectorArrow
                            x1={286}
                            y1={69}
                            x2={314}
                            y2={69}
                            color={c.textSecondary}
                            strokeWidth={2}
                            arrowSize={5}
                        />
                        {rows.flatMap((row) => [
                            row.signed && (
                                <React.Fragment key={row.name + 'm'}>
                                    <SvgFrame
                                        c={c}
                                        x={144}
                                        y={row.y}
                                        width={120}
                                        height={44}
                                        fill={c.bg}
                                        stroke={blue}
                                        strokeWidth={2}
                                    />
                                </React.Fragment>
                            ),
                            row.squared && (
                                <React.Fragment key={row.name + 'v'}>
                                    <SvgFrame
                                        c={c}
                                        x={274}
                                        y={row.y}
                                        width={144}
                                        height={44}
                                        fill={c.bg}
                                        stroke={purple}
                                        strokeWidth={2}
                                    />
                                </React.Fragment>
                            ),
                        ])}
                        <VectorSegment
                            x1={484}
                            y1={14}
                            x2={484}
                            y2={426}
                            color={c.borderLight}
                            strokeWidth={2}
                            showStartDot={false}
                            showEndDot={false}
                        />
                        <SvgFrame
                            c={c}
                            x={502}
                            y={248}
                            width={104}
                            height={54}
                            fill={c.bg}
                            stroke={green}
                            strokeWidth={2}
                        />
                        <SvgFrame
                            c={c}
                            x={652}
                            y={248}
                            width={104}
                            height={54}
                            fill={c.bg}
                            stroke={green}
                            strokeWidth={2}
                        />
                        <VectorArrow
                            x1={610}
                            y1={275}
                            x2={648}
                            y2={275}
                            color={green}
                            strokeWidth={2.5}
                            arrowSize={5}
                        />
                    </svg>
                </CanvasItem>
                {label(12, 8, 456, 'Buffer state · coordinate a', 26)}
                {label(12, 54, 132, 'zero start:', 24, c.textSecondary)}
                {label(162, 53, 114, 'g₁ = +100', 24, blue)}
                {label(330, 53, 114, 'g₂ = −80', 24, red)}
                {label(144, 118, 120, 'signed', 24, blue)}
                {label(274, 118, 144, 'squared', 24, purple)}
                {label(426, 118, 52, 'B', 24, c.textSecondary)}
                {rows.map((row) => (
                    <React.Fragment key={row.name}>
                        {label(12, row.y + 8, 128, row.name, 24)}
                        {row.signed && label(150, row.y + 7, 108, row.signed, 24, blue, true)}
                        {row.squared && label(280, row.y + 7, 132, row.squared, 24, purple, true)}
                        {label(424, row.y + 8, 56, row.bytes, 24, c.textSecondary)}
                    </React.Fragment>
                ))}
                {label(150, 165, 250, 'no moment buffers', 24, c.textSecondary)}
                {label(502, 12, 258, 'AdamW decay', 26, green)}
                {label(502, 50, 258, 'bypasses moments', 24, green)}
                {label(502, 108, 258, 'Separate check:', 24)}
                {label(502, 144, 258, 'g = 0, m = v = 0', 24, c.textSecondary)}
                {label(502, 180, 258, 'lr = 0.1 · λ = 0.01', 24, c.textSecondary)}
                {label(514, 260, 82, 'w = 10', 24, green)}
                {label(660, 260, 90, '9.99', 24, green)}
                {label(602, 214, 96, '−0.01', 24, green)}
                {label(502, 344, 258, 'Filled float32 cell', 24, c.textSecondary)}
                {label(502, 380, 258, '= 4 bytes per param', 24, c.textSecondary)}
            </Board>
        </Scene>
    )
}

export default create('dark')
