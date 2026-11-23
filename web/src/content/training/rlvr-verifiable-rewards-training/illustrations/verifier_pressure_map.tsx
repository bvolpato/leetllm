import React from 'react'
import {
    Arrow,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableTextColor,
    getReadableToneColor,
    getToneColor,
    getToneFill,
    type ThemeColors,
    type ToneName,
} from 'vizmatic'

export const width = 672
export const height = 700
export const autoSize = false
export const alt =
    'The same literal response text contains \\boxed{168} followed by \\boxed{148}, and both parser rules receive the whole response. A first-match rule selects 168 and returns reward 1 while missing 148; a single-box gate counts two markers, rejects ambiguity, and returns 0. A clean single \\boxed{168} passes bounded Fraction equality.'

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

function surface(c: ThemeColors, x: number, y: number, w: number, h: number, tone: ToneName) {
    const color = getToneColor(tone, c)
    return (
        <CanvasItem key={`surface-${x}-${y}`} x={x} y={y} width={w} height={h}>
            <div
                style={{
                    boxSizing: 'border-box',
                    width: '100%',
                    height: '100%',
                    backgroundColor: getToneFill(tone, c),
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
    const toneInk = (tone: ToneName, background: ToneName) => {
        const fill = getToneFill(background, c)
        return getReadableToneColor(tone, c, fill, fill)
    }
    const responseInk = fillInk('neutral')
    const warmInk = fillInk('warm')
    const greenInk = fillInk('green')
    const cyanInk = fillInk('cyan')
    const greenOnNeutral = toneInk('green', 'neutral')
    const warmOnNeutral = toneInk('warm', 'neutral')
    const warmOnWarm = toneInk('warm', 'warm')
    const greenOnGreen = toneInk('green', 'green')
    const greenOnCyan = toneInk('green', 'cyan')

    const children = [
        label(c, 'Two parser rules read the same output', 28, 24, 616, 42, 32, { weight: 850 }),
        label(c, 'The full response enters both independent rules.', 28, 72, 616, 36, 24, {
            color: c.textSecondary,
            weight: 600,
        }),

        surface(c, 28, 128, 616, 110, 'neutral'),
        label(c, 'LITERAL OUTPUT TEXT · GOLD = 168', 48, 140, 576, 32, 24, {
            color: responseInk,
            weight: 800,
            background: getToneFill('neutral', c),
        }),
        label(c, '\\boxed{168}', 48, 182, 180, 34, 24, {
            color: greenOnNeutral,
            mono: true,
            weight: 800,
            background: getToneFill('neutral', c),
        }),
        label(c, '... actually', 236, 182, 180, 34, 24, {
            color: responseInk,
            mono: true,
            align: 'center',
            weight: 650,
            background: getToneFill('neutral', c),
        }),
        label(c, '\\boxed{148}', 424, 182, 180, 34, 24, {
            color: warmOnNeutral,
            mono: true,
            align: 'right',
            weight: 800,
            background: getToneFill('neutral', c),
        }),

        arrow(c, 164, 242, 32, 'down', 'warm'),
        arrow(c, 484, 242, 32, 'down', 'green'),

        surface(c, 28, 282, 296, 218, 'warm'),
        label(c, 'FIRST-MATCH RULE', 46, 296, 260, 34, 24, {
            color: warmOnWarm,
            weight: 850,
            background: getToneFill('warm', c),
        }),
        label(c, 'first box → 168', 46, 346, 260, 34, 24, {
            color: warmInk,
            align: 'center',
            weight: 750,
            background: getToneFill('warm', c),
        }),
        label(c, 'returns r = 1', 46, 394, 260, 34, 24, {
            color: warmOnWarm,
            mono: true,
            align: 'center',
            weight: 850,
            background: getToneFill('warm', c),
        }),
        label(c, 'misses later 148', 46, 442, 260, 34, 24, {
            color: warmInk,
            align: 'center',
            weight: 700,
            background: getToneFill('warm', c),
        }),

        surface(c, 348, 282, 296, 218, 'green'),
        label(c, 'SINGLE-BOX GATE', 366, 296, 260, 34, 24, {
            color: greenOnGreen,
            weight: 850,
            background: getToneFill('green', c),
        }),
        label(c, 'count = 2', 366, 346, 260, 34, 24, {
            color: greenInk,
            mono: true,
            align: 'center',
            weight: 750,
            background: getToneFill('green', c),
        }),
        label(c, 'ambiguous → reject', 366, 394, 260, 34, 24, {
            color: greenInk,
            align: 'center',
            weight: 750,
            background: getToneFill('green', c),
        }),
        label(c, 'returns r = 0', 366, 442, 260, 34, 24, {
            color: greenOnGreen,
            mono: true,
            align: 'center',
            weight: 850,
            background: getToneFill('green', c),
        }),

        label(c, 'CLEAN PASS · one bounded output field', 28, 520, 616, 34, 24, {
            color: getReadableToneColor('cyan', c),
            weight: 850,
        }),
        surface(c, 28, 566, 616, 70, 'cyan'),
        label(c, '\\boxed{168}', 42, 584, 164, 34, 24, {
            color: greenOnCyan,
            mono: true,
            align: 'center',
            weight: 800,
            background: getToneFill('cyan', c),
        }),
        arrow(c, 210, 592, 22, 'right', 'cyan', 'cyan'),
        label(c, 'Fraction(168)', 238, 584, 188, 34, 24, {
            color: cyanInk,
            mono: true,
            align: 'center',
            weight: 750,
            background: getToneFill('cyan', c),
        }),
        arrow(c, 430, 592, 22, 'right', 'cyan', 'cyan'),
        label(c, '=gold', 458, 584, 80, 34, 24, {
            color: cyanInk,
            align: 'center',
            weight: 700,
            background: getToneFill('cyan', c),
        }),
        arrow(c, 542, 592, 22, 'right', 'green', 'cyan'),
        label(c, 'r=1', 570, 584, 58, 34, 24, {
            color: greenOnCyan,
            mono: true,
            align: 'center',
            weight: 850,
            background: getToneFill('cyan', c),
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
