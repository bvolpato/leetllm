import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

type Colors = ReturnType<typeof getThemeColors>

export const width = 900
export const height = 520

export const alt =
    'The stated 70B recipe totals 1,120 decimal GB of model states: parameters 140, gradients 140, FP32 master parameters 280, and Adam moments 560. A shared 0–560 GB component scale shows each amount. Below, equal sharding over 16, 32, 64, or 256 ranks uses 70, 35, 17.5, or 4.375 GB of an 80 GB capacity reference, leaving 10, 45, 62.5, or 75.625 GB as a budget for other live memory, not a fit guarantee.'

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
        children: TextLabel({ c, text, width: w, fontSize, color, fontWeight, align, mono }),
    })
}

export const create = (theme: ThemeMode = 'dark') => {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const muted = c.textSecondary

    const components = [
        { name: 'Weights (16-bit)', amount: 140, tone: blue, desc: '2 bytes × 70B' },
        { name: 'Gradients (16-bit)', amount: 140, tone: purple, desc: '2 bytes × 70B' },
        { name: 'FP32 Master Copy', amount: 280, tone: cyan, desc: '4 bytes × 70B' },
        { name: 'Adam Moments (m, v)', amount: 560, tone: warm, desc: '8 bytes × 70B' },
    ]
    const sharded = [
        { ranks: 16, state: 70, budget: 10 },
        { ranks: 32, state: 35, budget: 45 },
        { ranks: 64, state: 17.5, budget: 62.5 },
        { ranks: 256, state: 4.375, budget: 75.625 },
    ]

    const barW = 220
    const geometry = [
        // Left Panel Frame
        SvgFrame({
            c,
            x: 20,
            y: 50,
            width: 420,
            height: 410,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-left',
        }),
        // Right Panel Frame
        SvgFrame({
            c,
            x: 460,
            y: 50,
            width: 420,
            height: 410,
            rx: 8,
            fill: c.bgCard,
            stroke: c.borderSubtle,
            strokeWidth: 1,
            key: 'panel-right',
        }),
        // Left bars (components)
        ...components
            .map((item, index) => {
                const y = 120 + index * 65
                const w = (item.amount / 560) * barW
                return [
                    SvgFrame({
                        c,
                        x: 180,
                        y: y + 4,
                        width: barW,
                        height: 24,
                        rx: 4,
                        fill: c.bgCardAlt,
                        stroke: c.borderSubtle,
                        strokeWidth: 1,
                        key: `bg-c-${index}`,
                    }),
                    SvgFrame({
                        c,
                        x: 180,
                        y: y + 4,
                        width: w,
                        height: 24,
                        rx: 4,
                        fill: item.tone,
                        stroke: item.tone,
                        strokeWidth: 1,
                        key: `fg-c-${index}`,
                    }),
                ]
            })
            .flat(),
        // Right bars (sharded ranks)
        ...sharded
            .map((row, index) => {
                const y = 120 + index * 65
                const w = (row.state / 80) * barW
                return [
                    SvgFrame({
                        c,
                        x: 580,
                        y: y + 4,
                        width: barW,
                        height: 24,
                        rx: 4,
                        fill: c.bgCardAlt,
                        stroke: c.borderSubtle,
                        strokeWidth: 1,
                        key: `bg-s-${index}`,
                    }),
                    SvgFrame({
                        c,
                        x: 580,
                        y: y + 4,
                        width: w,
                        height: 24,
                        rx: 4,
                        fill: green,
                        stroke: green,
                        strokeWidth: 1,
                        key: `fg-s-${index}`,
                    }),
                ]
            })
            .flat(),
        // Right Callout Card
        SvgFrame({
            c,
            x: 480,
            y: 380,
            width: 380,
            height: 60,
            rx: 6,
            fill: c.bgCardAlt,
            stroke: green,
            strokeWidth: 1.5,
            key: 'card-fit',
        }),
    ]

    const compLabels = components
        .map((item, index) => {
            const y = 120 + index * 65
            return [
                label(c, item.name, 35, y, 140, 20, 13, item.tone),
                label(c, item.desc, 35, y + 20, 140, 18, 11, muted),
                label(c, `${item.amount} GB`, 405, y + 6, 30, 20, 12, item.tone, 650, 'right'),
            ]
        })
        .flat()

    const shardLabels = sharded
        .map((row, index) => {
            const y = 120 + index * 65
            return [
                label(c, `${row.ranks} Ranks`, 475, y, 100, 20, 13, c.textPrimary),
                label(c, `${row.budget} GB free`, 475, y + 20, 100, 18, 11, muted),
                label(c, `${row.state} GB`, 805, y + 6, 65, 20, 12, green, 650, 'right'),
            ]
        })
        .flat()

    return Board({
        c,
        width,
        height,
        background: 'transparent',
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: createElement(
                    'svg',
                    {
                        width,
                        height,
                        viewBox: `0 0 ${width} ${height}`,
                        role: 'presentation',
                        'aria-hidden': true,
                    },
                    ...geometry,
                ),
            }),
            label(
                c,
                '70B Dense Model Memory Wall: State Footprint vs Sharded Ranks',
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
                '1. Unsharded Model State: 1,120 GB Total',
                35,
                62,
                380,
                24,
                16,
                c.textPrimary,
            ),
            label(
                c,
                '16 bytes per parameter under standard FP16/BF16 AdamW',
                35,
                86,
                380,
                20,
                12,
                muted,
            ),
            ...compLabels,
            label(
                c,
                'Weights (140) + Grads (140) + Master (280) + Moments (560) = 1,120 GB',
                35,
                390,
                390,
                20,
                11,
                warm,
            ),
            label(
                c,
                'Cannot fit on any single 80 GB GPU without parameter sharding.',
                35,
                415,
                390,
                20,
                11,
                muted,
            ),

            // Right Panel
            label(
                c,
                '2. Sharded Footprint per Rank (80 GB GPU)',
                475,
                62,
                380,
                24,
                16,
                c.textPrimary,
            ),
            label(
                c,
                'ZeRO-3 / FSDP partitions states equally across all workers',
                475,
                86,
                380,
                20,
                12,
                muted,
            ),
            ...shardLabels,

            label(
                c,
                'Remaining GPU headroom funds activations and temporary buffers.',
                495,
                392,
                350,
                18,
                11,
                c.textPrimary,
            ),
            label(
                c,
                'At 64 ranks: 17.5 GB states leaves 62.5 GB for sequence activations.',
                495,
                414,
                350,
                18,
                11,
                green,
            ),

            label(
                c,
                'Model-state memory scaling · Distributed sharding across 64+ workers is mandatory to train 70B+ parameters',
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
