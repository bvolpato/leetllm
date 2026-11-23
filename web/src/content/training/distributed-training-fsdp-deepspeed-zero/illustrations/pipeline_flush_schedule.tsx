import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

type Colors = ReturnType<typeof getThemeColors>

export const width = 900
export const height = 520

export const alt =
    'For p=4 stages and m=8 micro-batches, per-stage warm-up forward counts are [3,2,1,0]. GPipe can retain eight outstanding forward activation sets per stage before backward begins; plain non-interleaved 1F1B has maximum outstanding counts [4,3,2,1]. For p=8, GPipe and plain 1F1B have the same ideal fill/drain bubble: at m=1, overhead relative to useful work is 700% and idle time is 87.50% of elapsed time; at m=32, these are 21.88% and 17.95%.'

function label(
    c: Colors,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    fontWeight = 650,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: w,
            fontSize,
            color,
            fontWeight,
            align,
            mono,
        }),
    })
}

function block(
    c: Colors,
    x: number,
    y: number,
    w: number,
    h: number,
    filled: boolean,
    color: string,
) {
    return SvgFrame({
        c,
        x,
        y,
        width: w,
        height: h,
        rx: 3,
        fill: filled ? color : c.bgCardAlt,
        stroke: filled ? color : c.borderSubtle,
        strokeWidth: 1,
    })
}

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const muted = c.textSecondary

    const oneFOneB = [4, 3, 2, 1]
    const stagesY = [125, 175, 225, 275]

    const stageElements = stagesY.flatMap((y, stage) => [
        // GPipe 8 blocks
        ...Array.from({ length: 8 }, (_, i) => block(c, 130 + i * 18, y, 15, 24, true, warm)),
        // 1F1B blocks
        ...Array.from({ length: 8 }, (_, i) =>
            block(c, 320 + i * 18, y, 15, 24, i < oneFOneB[stage], blue),
        ),
    ])

    const shapeSvg = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        // Left Panel (Activation Memory)
        SvgFrame({
            c,
            x: 20,
            y: 50,
            width: 470,
            height: 410,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-left',
        }),
        // Right Panel (Bubble Analysis)
        SvgFrame({
            c,
            x: 510,
            y: 50,
            width: 370,
            height: 410,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-right',
        }),
        ...stageElements,
        // Formula Card Right Panel
        SvgFrame({
            c,
            x: 530,
            y: 115,
            width: 330,
            height: 90,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'card-formula',
        }),
        // Table Card Right Panel
        SvgFrame({
            c,
            x: 530,
            y: 220,
            width: 330,
            height: 220,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: green,
            strokeWidth: 1.5,
            key: 'card-table',
        }),
    )

    const stageLabels = stagesY.flatMap((y, stage) => [
        label(c, `Stage ${stage}`, 35, y + 4, 80, 20, 13, c.textPrimary),
        label(c, '8 act', 276, y + 4, 38, 20, 11, warm, 650, 'right'),
        label(c, `${oneFOneB[stage]} act`, 466, y + 4, 38, 20, 11, blue, 650, 'right'),
    ])

    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [
            CanvasItem({ x: 0, y: 0, width, height, children: shapeSvg }),
            label(
                c,
                'Pipeline Parallelism: Activation Memory and Bubble Schedules',
                20,
                12,
                width - 40,
                30,
                22,
                c.textPrimary,
                700,
                'center',
            ),

            // Left Panel
            label(
                c,
                '1. Peak In-Flight Activations (p = 4, m = 8)',
                35,
                62,
                430,
                24,
                16,
                c.textPrimary,
            ),
            label(
                c,
                'GPipe queues all m microbatches; 1F1B bounds memory to p stages',
                35,
                86,
                430,
                20,
                12,
                muted,
            ),

            label(c, 'GPipe (Warm)', 130, 106, 140, 18, 12, warm, 650, 'center'),
            label(c, '1F1B (Blue)', 320, 106, 140, 18, 12, blue, 650, 'center'),
            ...stageLabels,

            label(c, 'Memory advantage of 1F1B schedule:', 35, 335, 430, 20, 13, c.textPrimary),
            label(
                c,
                '• GPipe holds 8 full activation sets per stage (peak = m = 8)',
                40,
                360,
                420,
                18,
                11,
                warm,
            ),
            label(
                c,
                '• 1F1B caps activations at p = 4 sets on Stage 0 (50% reduction)',
                40,
                382,
                420,
                18,
                11,
                blue,
            ),
            label(
                c,
                '• Stage 3 only ever holds 1 activation set before backward step',
                40,
                404,
                420,
                18,
                11,
                muted,
            ),
            label(
                c,
                '1F1B frees GPU memory to support longer sequence lengths.',
                40,
                428,
                420,
                18,
                11,
                green,
            ),

            // Right Panel
            label(c, '2. Pipeline Bubble Fraction', 525, 62, 340, 24, 16, c.textPrimary),
            label(
                c,
                'Idle time fraction during pipeline fill and drain phases',
                525,
                86,
                340,
                20,
                12,
                muted,
            ),

            label(c, 'Ideal Bubble Formula', 545, 123, 300, 20, 13, c.textPrimary),
            label(
                c,
                'F_bubble = (p − 1) / (m + p − 1)',
                545,
                148,
                300,
                22,
                14,
                green,
                650,
                'center',
            ),
            label(
                c,
                'Where p = pipeline stages, m = micro-batches per step',
                545,
                175,
                300,
                18,
                11,
                muted,
                650,
                'center',
            ),

            label(
                c,
                'Scaling Bubble with Micro-batches (p = 8)',
                545,
                228,
                300,
                20,
                13,
                c.textPrimary,
            ),
            label(
                c,
                'm = 1   →  Bubble = 87.5%  (Severe stall, 7× idle work)',
                545,
                255,
                300,
                18,
                11,
                warm,
            ),
            label(c, 'm = 4   →  Bubble = 63.6%  (In-flight ramp-up)', 545, 280, 300, 18, 11, warm),
            label(
                c,
                'm = 8   →  Bubble = 46.7%  (Half compute wasted)',
                545,
                305,
                300,
                18,
                11,
                muted,
            ),
            label(
                c,
                'm = 16  →  Bubble = 30.4%  (Moderate efficiency)',
                545,
                330,
                300,
                18,
                11,
                muted,
            ),
            label(
                c,
                'm = 32  →  Bubble = 17.9%  (Production operating point)',
                545,
                355,
                300,
                18,
                11,
                green,
            ),
            label(
                c,
                'm = 64  →  Bubble = 9.9%   (Diminishing return vs memory)',
                545,
                380,
                300,
                18,
                11,
                green,
            ),
            label(
                c,
                'Interleaved 1F1B reduces bubble by virtual stage factor v.',
                545,
                412,
                300,
                18,
                11,
                muted,
            ),

            label(
                c,
                'Pipeline parallelism efficiency · 1F1B caps activation memory while large m amortizes fill/drain bubbles',
                20,
                480,
                width - 40,
                24,
                14,
                muted,
                650,
                'center',
            ),
        ],
    })
}

export default create('dark')
