import React from 'react'
import {
    Arrow,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getReadableTextColor,
    getToneColor,
    getToneFill,
    type ThemeColors,
    type ToneName,
} from 'vizmatic'

export const width = 672
export const height = 720
export const autoSize = false
export const alt =
    'The task is 14 workers × 12 slots = 168. Two authored policy completions end with literal output text \\boxed{168}, so the final-answer verifier returns reward 1 for each. A separate trace review calls the calculation sound and the shortcut invalid.'

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    options: {
        color?: string
        align?: 'left' | 'center' | 'right'
        mono?: boolean
        weight?: number
        background?: string
    } = {},
) {
    return (
        <CanvasItem key={`label-${x}-${y}-${text}`} x={x} y={y} width={w} height={h}>
            {options.background ? (
                <div style={{ width: '100%', height: '100%', backgroundColor: options.background }}>
                    <TextLabel
                        c={c}
                        text={text}
                        width={w}
                        fontSize={fontSize}
                        fontWeight={options.weight ?? 700}
                        color={options.color ?? c.textPrimary}
                        align={options.align ?? 'left'}
                        mono={options.mono ?? false}
                    />
                </div>
            ) : (
                <TextLabel
                    c={c}
                    text={text}
                    width={w}
                    fontSize={fontSize}
                    fontWeight={options.weight ?? 700}
                    color={options.color ?? c.textPrimary}
                    align={options.align ?? 'left'}
                    mono={options.mono ?? false}
                />
            )}
        </CanvasItem>
    )
}

function surface(
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    h: number,
    tone: ToneName,
    strong = false,
) {
    const color = getToneColor(tone, c)
    return (
        <CanvasItem key={`surface-${x}-${y}`} x={x} y={y} width={w} height={h}>
            <div
                style={{
                    boxSizing: 'border-box',
                    width: '100%',
                    height: '100%',
                    backgroundColor: strong ? color : getToneFill(tone, c),
                    border: `1px solid ${color}`,
                    borderRadius: 12,
                }}
            />
        </CanvasItem>
    )
}

function arrow(
    c: ThemeColors,
    x: number,
    y: number,
    length: number,
    direction: 'down' | 'right',
    tone: ToneName,
    backgroundTone?: ToneName,
) {
    const background = backgroundTone ? getToneFill(backgroundTone, c) : undefined
    const color = background
        ? getReadableToneColor(tone, c, background, background)
        : getToneColor(tone, c)
    return (
        <CanvasItem
            key={`arrow-${x}-${y}-${direction}`}
            x={x}
            y={y}
            width={direction === 'right' ? length : 18}
            height={direction === 'down' ? length : 18}
        >
            <Arrow c={c} direction={direction} length={length} color={color} />
        </CanvasItem>
    )
}

function createFigure(theme: ThemeColors) {
    const c = { ...theme, preset: 'engineering' as const, shadow: 'transparent' }
    const fillInk = (tone: ToneName) => {
        const fill = getToneFill(tone, c)
        return getReadableTextColor(fill, c, fill)
    }
    const toneInk = (tone: ToneName) => {
        const fill = getToneFill(tone, c)
        return getReadableToneColor(tone, c, fill, fill)
    }
    const cyan = toneInk('cyan')
    const green = toneInk('green')
    const warm = toneInk('warm')
    const greenOnCyan = getReadableToneColor(
        'green',
        c,
        getToneFill('cyan', c),
        getToneFill('cyan', c),
    )
    const taskInk = fillInk('cyan')
    const greenRowInk = fillInk('green')
    const warmRowInk = fillInk('warm')
    const purple = getReadableToneColor('purple', c)

    const children = [
        label(c, 'One score can reward two traces', 28, 24, 616, 42, 32, { weight: 850 }),
        label(c, 'Verifier scores output; review judges reasoning.', 28, 72, 616, 38, 24, {
            color: c.textSecondary,
            weight: 600,
        }),

        surface(c, 28, 132, 616, 72, 'cyan'),
        label(c, 'TASK · 14 workers × 12 slots = 168', 48, 150, 576, 36, 24, {
            color: taskInk,
            mono: true,
            align: 'center',
            weight: 750,
            background: getToneFill('cyan', c),
        }),

        arrow(c, 327, 208, 26, 'down', 'cyan'),
        label(c, 'Two authored policy completions', 28, 238, 616, 34, 24, {
            color: c.textSecondary,
            align: 'center',
            weight: 700,
        }),

        label(c, 'REASONING', 104, 275, 182, 34, 24, {
            color: c.textMuted,
            align: 'center',
            weight: 750,
        }),
        label(c, 'OUTPUT TEXT', 298, 275, 200, 34, 24, {
            color: c.textMuted,
            align: 'center',
            weight: 750,
        }),
        label(c, 'REVIEW', 506, 275, 138, 34, 24, {
            color: c.textMuted,
            align: 'center',
            weight: 750,
        }),

        surface(c, 28, 312, 616, 78, 'green'),
        label(c, 'A', 46, 330, 50, 38, 30, {
            color: green,
            align: 'center',
            weight: 850,
            background: getToneFill('green', c),
        }),
        label(c, '14×12=168', 104, 332, 182, 34, 24, {
            color: greenRowInk,
            align: 'center',
            weight: 700,
            background: getToneFill('green', c),
        }),
        arrow(c, 288, 339, 28, 'right', 'green', 'green'),
        label(c, '\\boxed{168}', 320, 332, 170, 34, 24, {
            color: green,
            mono: true,
            align: 'center',
            weight: 800,
            background: getToneFill('green', c),
        }),
        label(c, '✓ sound', 506, 332, 128, 34, 24, {
            color: green,
            align: 'center',
            weight: 800,
            background: getToneFill('green', c),
        }),

        surface(c, 28, 404, 616, 78, 'warm'),
        label(c, 'B', 46, 422, 50, 38, 30, {
            color: warm,
            align: 'center',
            weight: 850,
            background: getToneFill('warm', c),
        }),
        label(c, '“ends in 8”', 104, 424, 182, 34, 24, {
            color: warmRowInk,
            align: 'center',
            weight: 700,
            background: getToneFill('warm', c),
        }),
        arrow(c, 288, 431, 28, 'right', 'warm', 'warm'),
        label(c, '\\boxed{168}', 320, 424, 170, 34, 24, {
            color: warm,
            mono: true,
            align: 'center',
            weight: 800,
            background: getToneFill('warm', c),
        }),
        label(c, '✕ invalid', 506, 424, 128, 34, 24, {
            color: warm,
            align: 'center',
            weight: 800,
            background: getToneFill('warm', c),
        }),

        label(c, 'Both literal output fields match the gold value', 28, 500, 616, 34, 24, {
            color: c.textSecondary,
            align: 'center',
            weight: 700,
        }),
        surface(c, 72, 544, 528, 60, 'cyan'),
        label(c, 'extract 168', 92, 557, 146, 34, 24, {
            color: cyan,
            align: 'center',
            weight: 750,
            background: getToneFill('cyan', c),
        }),
        arrow(c, 240, 565, 32, 'right', 'cyan', 'cyan'),
        label(c, '168 = 168', 275, 557, 190, 34, 24, {
            color: fillInk('cyan'),
            mono: true,
            align: 'center',
            weight: 750,
            background: getToneFill('cyan', c),
        }),
        arrow(c, 468, 565, 28, 'right', 'green', 'cyan'),
        label(c, 'r = 1', 500, 557, 84, 34, 26, {
            color: greenOnCyan,
            mono: true,
            align: 'center',
            weight: 850,
            background: getToneFill('cyan', c),
        }),

        arrow(c, 327, 609, 26, 'down', 'purple'),
        label(c, 'An optimizer can use the reward signal', 28, 642, 616, 34, 24, {
            color: purple,
            align: 'center',
            weight: 750,
        }),
        label(c, 'GRPO is one choice for using the reward signal.', 28, 680, 616, 34, 24, {
            color: c.textMuted,
            align: 'center',
            weight: 600,
        }),
    ]

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({ c, width, height, background: 'transparent', children }),
    })
}

const illustration = defineIllustration(createFigure)
export const create = illustration.create
export default illustration.default
