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
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 820
export const height = 590
export const preset = 'engineering'
export const alt =
    'A resume archive groups model tensors, optimizer buffers, scheduler and scaler state, RNG state, and loader progress. A direct overwrite can leave the live checkpoint partial. In a same-directory staging save, the live checkpoint file remains intact while the temporary staging file is written and synced, then atomic os.replace points the live path to the new file.'

const lbl = (
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    text: string,
    size = 24,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    fontWeight = 550,
) => (
    <CanvasItem x={x} y={y} width={w} height={size + 10}>
        <TextLabel
            c={c}
            text={text}
            width={w}
            fontSize={size}
            color={color}
            align={align}
            fontWeight={fontWeight}
        />
    </CanvasItem>
)

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? preset : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const red = getReadableToneColor('critical', c)
    const green = getReadableToneColor('green', c)

    const pills = [
        { x: 30, w: 174, label: 'W, b, buffers' },
        { x: 216, w: 184, label: 'optimizer state' },
        { x: 412, w: 192, label: 'lr / scaler / RNG' },
        { x: 616, w: 174, label: 'loader cursor' },
    ]

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board background="transparent" c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        <SvgFrame
                            c={c}
                            x={16}
                            y={94}
                            width={788}
                            height={118}
                            rx={12}
                            fill={c.bgCard}
                            stroke={blue}
                            strokeWidth={1.5}
                        />
                        {pills.map((p) => (
                            <SvgFrame
                                key={p.label}
                                c={c}
                                x={p.x}
                                y={146}
                                width={p.w}
                                height={50}
                                rx={8}
                                fill={c.bgSubtle}
                                stroke={blue}
                                strokeWidth={1.5}
                            />
                        ))}

                        <SvgFrame
                            c={c}
                            x={16}
                            y={228}
                            width={384}
                            height={346}
                            rx={12}
                            fill={c.bgCard}
                            stroke={red}
                            strokeWidth={1.8}
                        />
                        <SvgFrame
                            c={c}
                            x={32}
                            y={338}
                            width={352}
                            height={116}
                            rx={8}
                            fill={c.bgSubtle}
                            stroke={red}
                            strokeWidth={1.5}
                        />
                        {[0, 1, 2, 3].map((i) => (
                            <VectorSegment
                                key={i}
                                x1={48}
                                y1={392 + i * 16}
                                x2={i < 2 ? 364 : 184}
                                y2={392 + i * 16}
                                color={i < 2 ? red : c.borderLight}
                                strokeWidth={6}
                                showStartDot={false}
                                showEndDot={false}
                            />
                        ))}

                        <SvgFrame
                            c={c}
                            x={416}
                            y={228}
                            width={388}
                            height={346}
                            rx={12}
                            fill={c.bgCard}
                            stroke={green}
                            strokeWidth={1.8}
                        />
                        <SvgFrame
                            c={c}
                            x={432}
                            y={292}
                            width={356}
                            height={70}
                            rx={8}
                            fill={c.bgSubtle}
                            stroke={purple}
                            strokeWidth={1.5}
                        />
                        <VectorArrow
                            x1={610}
                            y1={366}
                            x2={610}
                            y2={402}
                            color={green}
                            strokeWidth={3}
                            arrowSize={5}
                        />
                        <SvgFrame
                            c={c}
                            x={432}
                            y={406}
                            width={356}
                            height={70}
                            rx={8}
                            fill={c.bgSubtle}
                            stroke={green}
                            strokeWidth={1.5}
                        />
                    </svg>
                </CanvasItem>
                {lbl(
                    c,
                    16,
                    10,
                    788,
                    'Checkpoint bundle and atomic staging',
                    29,
                    c.textPrimary,
                    'left',
                    750,
                )}
                {lbl(
                    c,
                    16,
                    48,
                    788,
                    'Stage, flush, fsync, then os.replace() at an optimizer update step.',
                    24,
                    c.textSecondary,
                )}
                {lbl(
                    c,
                    30,
                    106,
                    760,
                    'Resume archive saved at a clean optimizer update',
                    24,
                    blue,
                    'left',
                    700,
                )}
                {pills.map((p) => lbl(c, p.x, 155, p.w, p.label, 24, c.textPrimary, 'center', 650))}

                {lbl(c, 32, 242, 352, 'Direct overwrite · unsafe', 25, red, 'left', 720)}
                {lbl(c, 32, 286, 352, 'Writes straight to live path', 24, c.textSecondary)}
                {lbl(c, 48, 348, 320, 'model-ckpt.pt (partial)', 24, red, 'left', 700)}
                {lbl(c, 32, 474, 352, 'Crash truncates live file', 24, red, 'left', 650)}
                {lbl(c, 32, 514, 352, 'Reload fails on broken bytes', 24, c.textSecondary)}

                {lbl(c, 432, 242, 356, 'Same-dir staging · atomic', 25, green, 'left', 720)}
                {lbl(c, 444, 310, 332, '1. write + fsync(.tmp)', 24, purple, 'center', 700)}
                {lbl(c, 444, 424, 332, '2. os.replace(tmp, live)', 24, green, 'center', 700)}
                {lbl(c, 432, 492, 356, 'Step 1 crash: live stays intact', 24, c.textPrimary)}
                {lbl(c, 432, 528, 356, 'Linux: fsync(dir) for rename', 24, c.textSecondary)}
            </Board>
        </Scene>
    )
}

export default create('dark')
