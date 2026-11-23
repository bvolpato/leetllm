import { createElement, type ReactNode } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'A replay mixture walkthrough uses 15 domain blocks with 6 scored targets each and 5 replay blocks with 2 each. Replay represents 25% of blocks but only 10% of the 100 scored targets. At logit z=0, equal block weighting produces gradient −0.25, while pooled target weighting produces −0.40.'

const domainBlocks = 15
const replayBlocks = 5
const domainTargetsPerBlock = 6
const replayTargetsPerBlock = 2
const domainTargets = domainBlocks * domainTargetsPerBlock
const replayTargets = replayBlocks * replayTargetsPerBlock

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 650,
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const domain = getReadableToneColor('cyan', c)
    const replay = getReadableToneColor('purple', c)
    const exact = getReadableToneColor('green', c)
    const muted = c.textSecondary

    const blockWidth = 20
    const blockGap = 3
    const blockX = 40
    const blockY = 120

    const blockShapes: ReactNode[] = []
    for (let i = 0; i < domainBlocks + replayBlocks; i++) {
        const isDomain = i < domainBlocks
        blockShapes.push(
            SvgFrame({
                c,
                x: blockX + i * (blockWidth + blockGap),
                y: blockY,
                width: blockWidth,
                height: 32,
                rx: 4,
                fill: isDomain ? domain : replay,
                stroke: c.borderSubtle,
                strokeWidth: 1,
                key: `blk-${i}`,
            }),
        )
    }

    const targetBarWidth = 360
    const domainBarWidth = (targetBarWidth * domainTargets) / (domainTargets + replayTargets)
    const replayBarWidth = targetBarWidth - domainBarWidth

    const shapeSvg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        // Panels
        SvgFrame({
            c,
            x: 20,
            y: 50,
            width: 400,
            height: 390,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-left',
        }),
        SvgFrame({
            c,
            x: 440,
            y: 50,
            width: 400,
            height: 390,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-right',
        }),
        ...blockShapes,
        // Target distribution bar
        SvgFrame({
            c,
            x: blockX,
            y: 220,
            width: domainBarWidth,
            height: 36,
            rx: 4,
            fill: domain,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'bar-dom',
        }),
        SvgFrame({
            c,
            x: blockX + domainBarWidth,
            y: 220,
            width: replayBarWidth,
            height: 36,
            rx: 4,
            fill: replay,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'bar-rep',
        }),
        // Arrows in panel left
        VectorArrow({
            x1: 120,
            y1: 300,
            x2: 120,
            y2: 330,
            color: domain,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        VectorArrow({
            x1: 320,
            y1: 300,
            x2: 320,
            y2: 330,
            color: replay,
            strokeWidth: 2,
            arrowSize: 6,
        }),
        // Formula cards in panel right
        SvgFrame({
            c,
            x: 460,
            y: 110,
            width: 360,
            height: 90,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'card-equal-block',
        }),
        SvgFrame({
            c,
            x: 460,
            y: 230,
            width: 360,
            height: 90,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: exact,
            strokeWidth: 1.5,
            key: 'card-target-weighted',
        }),
    )

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                CanvasItem({ x: 0, y: 0, width, height, children: shapeSvg }),
                label(
                    c,
                    'Count Targets Before Weighting Replay Streams',
                    20,
                    12,
                    width - 40,
                    30,
                    22,
                    c.textPrimary,
                    'center',
                ),

                // Left Panel: Blocks vs Targets
                label(c, 'Block Count vs Scored Target Count', 35, 62, 370, 24, 16, c.textPrimary),
                label(c, '20 Equal-length Packed Blocks', 35, 88, 370, 20, 13, muted),

                label(c, '15 Domain Blocks (6 targets/block = 90)', 35, 160, 260, 20, 12, domain),
                label(c, '5 Replay (2/block = 10)', 280, 160, 130, 20, 12, replay, 'right'),

                label(
                    c,
                    'Total Scored Targets Distribution (100 total)',
                    35,
                    195,
                    370,
                    20,
                    13,
                    muted,
                ),
                label(c, '90 Domain Targets (90%)', 40, 262, 200, 20, 13, domain),
                label(c, '10 Replay (10%)', 280, 262, 120, 20, 13, replay, 'right'),

                label(c, '25% Block Share', 50, 335, 140, 24, 15, muted, 'center'),
                label(c, 'vs', 200, 335, 40, 24, 14, muted, 'center'),
                label(c, '10% Target Share', 250, 335, 140, 24, 15, exact, 'center'),

                label(
                    c,
                    'Padded or conversational replay sequences yield fewer targets.',
                    35,
                    385,
                    370,
                    20,
                    12,
                    muted,
                ),
                label(
                    c,
                    'Equal block weighting over-weights sparse replay tokens.',
                    35,
                    405,
                    370,
                    20,
                    12,
                    muted,
                ),

                // Right Panel: Reduction Math & Gradient Impact
                label(
                    c,
                    'Gradient Impact on Shared Parameters',
                    455,
                    62,
                    370,
                    24,
                    16,
                    c.textPrimary,
                ),
                label(
                    c,
                    'One logit ∂L/∂z at z=0: Domain −0.5, Replay +0.5',
                    455,
                    88,
                    370,
                    20,
                    12,
                    muted,
                ),

                label(c, 'Equal Weight Per Block (Naive)', 475, 118, 330, 20, 14, c.textPrimary),
                label(c, '0.75 × (−0.5) + 0.25 × (+0.5) = −0.25', 475, 142, 330, 24, 15, replay),
                label(
                    c,
                    'Replay exerts 25% gradient influence despite 10% target mass',
                    475,
                    170,
                    330,
                    18,
                    11,
                    muted,
                ),

                label(c, 'Pooled Target Weighting (Correct)', 475, 238, 330, 20, 14, exact),
                label(c, '0.90 × (−0.5) + 0.10 × (+0.5) = −0.40', 475, 262, 330, 24, 15, exact),
                label(
                    c,
                    'Matches true target expectation without distortion',
                    475,
                    290,
                    330,
                    18,
                    11,
                    exact,
                ),

                label(
                    c,
                    'Weighting policy directly sets the effective data mixture.',
                    455,
                    350,
                    370,
                    20,
                    13,
                    c.textPrimary,
                ),
                label(
                    c,
                    'Track token counts explicitly when constructing training batches.',
                    455,
                    375,
                    370,
                    20,
                    12,
                    muted,
                ),

                // Footer
                label(
                    c,
                    'Loss reduction mechanics · Target weighting ensures gradient steps reflect true empirical token density',
                    20,
                    460,
                    width - 40,
                    24,
                    14,
                    muted,
                    'center',
                ),
            ],
        }),
    })
}

export default create('dark')
