import React from 'react'
import {
    Arrow,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableTextColor,
    getToneColor,
    getToneFill,
    type ThemeColors,
    type ToneName,
} from 'vizmatic'

export const width = 672
export const height = 900
export const autoSize = false
export const alt =
    'A sample ID, response, reference, and candidate-owned limits first pass a measurement-trust gate. A healthy worker and valid reference allow candidate checking: a verified pass receives reward 1; a wrong, malformed, ambiguous, or over-budget candidate receives 0. An unrelated host crash, prover outage, or broken reference is quarantined as unscored, retains its sample ID for bounded retry, and stays out of the rollout group.'

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    options: {
        color?: string
        align?: 'left' | 'center' | 'right'
        mono?: boolean
        weight?: number
    } = {},
) {
    return (
        <CanvasItem key={`label-${x}-${y}-${text}`} x={x} y={y} width={w} height={h}>
            <TextLabel
                c={c}
                text={text}
                width={w}
                fontSize={24}
                fontWeight={options.weight ?? 700}
                color={options.color ?? c.textPrimary}
                align={options.align ?? 'left'}
                mono={options.mono ?? false}
            />
        </CanvasItem>
    )
}

function block(
    c: ThemeColors,
    x: number,
    y: number,
    w: number,
    h: number,
    tone: ToneName,
    lines: string[],
    fontSize = 24,
) {
    const fill = getToneFill(tone, c)
    const ink = getReadableTextColor(fill, c, fill)
    return (
        <CanvasItem key={`block-${x}-${y}`} x={x} y={y} width={w} height={h}>
            <div
                style={{
                    boxSizing: 'border-box',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 5,
                    padding: 8,
                    border: `1px solid ${getToneColor(tone, c)}`,
                    borderRadius: 12,
                    backgroundColor: fill,
                }}
            >
                {lines.map((text, index) => (
                    <TextLabel
                        key={`${x}-${y}-${index}`}
                        c={c}
                        text={text}
                        width={w - 20}
                        fontSize={fontSize}
                        fontWeight={index === 0 ? 800 : 650}
                        color={ink}
                        align="center"
                    />
                ))}
            </div>
        </CanvasItem>
    )
}

function arrow(
    c: ThemeColors,
    x: number,
    y: number,
    direction: 'down' | 'right',
    length: number,
    tone: ToneName,
) {
    return (
        <CanvasItem
            key={`arrow-${x}-${y}-${direction}`}
            x={x}
            y={y}
            width={direction === 'right' ? length : 20}
            height={direction === 'down' ? length : 20}
        >
            <Arrow direction={direction} length={length} c={c} color={getToneColor(tone, c)} />
        </CanvasItem>
    )
}

function line(c: ThemeColors, x: number, y: number, w: number, h: number, color = c.borderSubtle) {
    return (
        <CanvasItem key={`line-${x}-${y}-${w}-${h}`} x={x} y={y} width={w} height={h}>
            <div style={{ width: '100%', height: '100%', backgroundColor: color }} />
        </CanvasItem>
    )
}

function createFigure(theme: ThemeColors) {
    const c = { ...theme, preset: 'engineering' as const, shadow: 'transparent' }
    const sampleFill = getToneFill('neutral', c)
    const sampleInk = getReadableTextColor(sampleFill, c, sampleFill)
    const children: React.ReactNode[] = [
        <CanvasItem key="title" x={28} y={18} width={616} height={42}>
            <TextLabel
                c={c}
                text="Trusted checks set candidate rewards"
                width={616}
                fontSize={30}
                fontWeight={850}
                color={c.textPrimary}
            />
        </CanvasItem>,
        <CanvasItem key="subtitle" x={28} y={66} width={616} height={34}>
            <TextLabel
                c={c}
                text="Check candidates; quarantine measurement faults."
                width={616}
                fontSize={24}
                fontWeight={600}
                color={c.textSecondary}
            />
        </CanvasItem>,
        <CanvasItem key="sample" x={28} y={122} width={616} height={92}>
            <div
                style={{
                    boxSizing: 'border-box',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '8px 16px',
                    border: `1px solid ${getToneColor('neutral', c)}`,
                    borderRadius: 12,
                    backgroundColor: sampleFill,
                }}
            >
                <TextLabel
                    c={c}
                    text="SAMPLE RECORD"
                    width={580}
                    fontSize={24}
                    fontWeight={850}
                    color={sampleInk}
                />
                <TextLabel
                    c={c}
                    text="ID · output y · gold x · candidate limits"
                    width={580}
                    fontSize={24}
                    fontWeight={650}
                    color={sampleInk}
                />
            </div>
        </CanvasItem>,
        arrow(c, 326, 220, 'down', 24, 'cyan'),
        block(c, 174, 252, 324, 78, 'cyan', ['Trusted measurement?']),
        line(c, 336, 330, 2, 24, getToneColor('cyan', c)),
        line(c, 212, 352, 324, 2, getToneColor('cyan', c)),
        line(c, 212, 352, 2, 18, getToneColor('cyan', c)),
        line(c, 534, 352, 2, 18, getToneColor('warm', c)),
        arrow(c, 204, 368, 'down', 20, 'green'),
        arrow(c, 526, 368, 'down', 20, 'warm'),

        block(c, 28, 392, 370, 74, 'green', ['TRUSTED CHECK']),
        block(c, 48, 484, 330, 100, 'cyan', [
            'Parse one declared field',
            'Run the candidate-owned check',
        ]),
        arrow(c, 203, 588, 'down', 22, 'cyan'),
        block(c, 48, 618, 330, 72, 'green', ['Declared check passes  →  r = 1']),
        block(c, 48, 704, 330, 140, 'warm', [
            'Wrong · malformed · ambiguous',
            'Over candidate limit → r=0',
        ]),

        block(c, 426, 392, 218, 74, 'warm', ['MEASUREMENT FAULT']),
        block(c, 444, 484, 182, 116, 'warm', ['Host down', 'Prover down', 'Gold invalid']),
        arrow(c, 525, 604, 'down', 22, 'warm'),
        block(c, 444, 634, 182, 78, 'critical', ['QUARANTINE', 'UNSCORED']),
        arrow(c, 525, 712, 'down', 14, 'warm'),
        block(c, 444, 728, 182, 116, 'neutral', ['Retain ID', 'Retry capped', 'Skip group']),

        line(c, 28, 850, 616, 1),
        label(c, 'Only measured outcomes enter the reward group.', 28, 860, 616, 32, {
            color: c.textPrimary,
            weight: 750,
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
