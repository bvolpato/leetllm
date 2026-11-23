import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    getThemeColors,
    getReadableToneColor,
    getToneFill,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'Light-PEFT score-to-mask map. Heads use a layer quantile of 0.425 and drop head 2. FFN coordinates share a global quantile of 0.246 and drop L0-n1 and L1-n1. Module M1 is removed, then ranks 2 and 4 survive in a remaining module. Green cells survive and red cells are removed.'

interface ScoreCell {
    label: string
    score: number
    keep: boolean
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme)
    const tone = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const fill = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getToneFill(name, c)

    const panels = [
        {
            x: 25,
            y: 100,
            w: 250,
            h: 320,
            title: 'Heads · Layer Threshold',
            tone: 'purple' as const,
        },
        {
            x: 305,
            y: 100,
            w: 250,
            h: 320,
            title: 'FFN Pool · Global Threshold',
            tone: 'blue' as const,
        },
        { x: 585, y: 100, w: 250, h: 320, title: 'PEFT · Module & Ranks', tone: 'warm' as const },
    ]

    const headCells: ScoreCell[] = [
        { label: 'h1', score: 0.91, keep: true },
        { label: 'h2', score: 0.08, keep: false },
        { label: 'h3', score: 0.72, keep: true },
        { label: 'h4', score: 0.54, keep: true },
    ]

    const ffnCells: ScoreCell[] = [
        { label: 'L0n1', score: 0.07, keep: false },
        { label: 'L0n2', score: 0.63, keep: true },
        { label: 'L0n3', score: 0.42, keep: true },
        { label: 'L1n1', score: 0.15, keep: false },
        { label: 'L1n2', score: 0.31, keep: true },
    ]

    const moduleCells: ScoreCell[] = [
        { label: 'M1', score: 0.04, keep: false },
        { label: 'M2', score: 0.31, keep: true },
        { label: 'M3', score: 0.11, keep: true },
    ]

    const rankCells: ScoreCell[] = [
        { label: 'r1', score: 0.02, keep: false },
        { label: 'r2', score: 0.17, keep: true },
        { label: 'r3', score: 0.03, keep: false },
        { label: 'r4', score: 0.22, keep: true },
    ]

    return Board({
        c,
        width,
        height,
        children: [
            // Background SVG elements and panel frames
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Connecting arrows between pruning stages */}
                        <VectorArrow
                            x1={275}
                            y1={260}
                            x2={305}
                            y2={260}
                            color={tone('blue')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        <VectorArrow
                            x1={555}
                            y1={260}
                            x2={585}
                            y2={260}
                            color={tone('warm')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {panels.map((p) => (
                            <rect
                                key={p.title}
                                x={p.x}
                                y={p.y}
                                width={p.w}
                                height={p.h}
                                rx="8"
                                fill={fill(p.tone)}
                                stroke={tone(p.tone)}
                                strokeWidth="1.5"
                            />
                        ))}

                        {/* Head cells */}
                        {headCells.map((hc, idx) => (
                            <rect
                                key={hc.label}
                                x={40 + idx * 55}
                                y={190}
                                width={48}
                                height={55}
                                rx="6"
                                fill={fill(hc.keep ? 'green' : 'critical')}
                                stroke={tone(hc.keep ? 'green' : 'critical')}
                                strokeWidth="1.5"
                            />
                        ))}

                        {/* FFN cells */}
                        {ffnCells.map((fc, idx) => (
                            <rect
                                key={fc.label}
                                x={315 + idx * 45}
                                y={190}
                                width={40}
                                height={55}
                                rx="6"
                                fill={fill(fc.keep ? 'green' : 'critical')}
                                stroke={tone(fc.keep ? 'green' : 'critical')}
                                strokeWidth="1.5"
                            />
                        ))}

                        {/* Module cells */}
                        {moduleCells.map((mc, idx) => (
                            <rect
                                key={mc.label}
                                x={605 + idx * 68}
                                y={160}
                                width={56}
                                height={45}
                                rx="6"
                                fill={fill(mc.keep ? 'green' : 'critical')}
                                stroke={tone(mc.keep ? 'green' : 'critical')}
                                strokeWidth="1.5"
                            />
                        ))}

                        {/* Rank cells */}
                        {rankCells.map((rc, idx) => (
                            <rect
                                key={rc.label}
                                x={600 + idx * 54}
                                y={230}
                                width={46}
                                height={45}
                                rx="6"
                                fill={fill(rc.keep ? 'green' : 'critical')}
                                stroke={tone(rc.keep ? 'green' : 'critical')}
                                strokeWidth="1.5"
                            />
                        ))}

                        {/* Legend items */}
                        <rect
                            x={260}
                            y={445}
                            width={18}
                            height={18}
                            rx="4"
                            fill={fill('green')}
                            stroke={tone('green')}
                            strokeWidth="1.5"
                        />
                        <rect
                            x={490}
                            y={445}
                            width={18}
                            height={18}
                            rx="4"
                            fill={fill('critical')}
                            stroke={tone('critical')}
                            strokeWidth="1.5"
                        />
                    </svg>
                ),
            }),

            // Header titles
            CanvasItem({
                x: 25,
                y: 20,
                width: 810,
                height: 32,
                children: (
                    <TextLabel
                        c={c}
                        text="Light-PEFT Structural Score-to-Mask Pruning Map"
                        width={810}
                        fontSize={22}
                        fontWeight={700}
                        color={c.textPrimary}
                    />
                ),
            }),
            CanvasItem({
                x: 25,
                y: 55,
                width: 810,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="Quantile thresholding applied across attention heads, FFN intermediate channels, and adapter ranks"
                        width={810}
                        fontSize={14}
                        fontWeight={400}
                        color={c.textSecondary}
                    />
                ),
            }),

            // Panel titles
            CanvasItem({
                x: 35,
                y: 115,
                width: 230,
                height: 26,
                children: (
                    <TextLabel
                        c={c}
                        text="Heads · Layer Threshold"
                        width={230}
                        fontSize={15}
                        fontWeight={700}
                        color={tone('purple')}
                    />
                ),
            }),
            CanvasItem({
                x: 35,
                y: 145,
                width: 230,
                height: 20,
                children: (
                    <TextLabel
                        c={c}
                        text="Per-layer quantile thresholding"
                        width={230}
                        fontSize={12}
                        color={c.textSecondary}
                    />
                ),
            }),

            // Head labels
            ...headCells.flatMap((hc, idx) => [
                CanvasItem({
                    x: 40 + idx * 55,
                    y: 195,
                    width: 48,
                    height: 20,
                    children: (
                        <TextLabel
                            c={c}
                            text={hc.label}
                            width={48}
                            fontSize={12}
                            fontWeight={700}
                            color={c.textPrimary}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: 40 + idx * 55,
                    y: 218,
                    width: 48,
                    height: 20,
                    children: (
                        <TextLabel
                            c={c}
                            text={hc.score.toFixed(2)}
                            width={48}
                            fontSize={11}
                            color={hc.keep ? tone('green') : tone('critical')}
                            align="center"
                        />
                    ),
                }),
            ]),

            CanvasItem({
                x: 35,
                y: 280,
                width: 230,
                height: 28,
                children: (
                    <TextLabel
                        c={c}
                        text="q = 0.425 · keep 3 / 4 heads"
                        width={230}
                        fontSize={13}
                        fontWeight={600}
                        color={tone('purple')}
                        align="center"
                    />
                ),
            }),
            CanvasItem({
                x: 35,
                y: 320,
                width: 230,
                height: 40,
                children: (
                    <TextLabel
                        c={c}
                        text="Head h2 (0.08) pruned; h1, h3, h4 retained"
                        width={230}
                        fontSize={11}
                        color={c.textSecondary}
                        align="center"
                    />
                ),
            }),

            // FFN panel
            CanvasItem({
                x: 315,
                y: 115,
                width: 230,
                height: 26,
                children: (
                    <TextLabel
                        c={c}
                        text="FFN Pool · Global Threshold"
                        width={230}
                        fontSize={15}
                        fontWeight={700}
                        color={tone('blue')}
                    />
                ),
            }),
            CanvasItem({
                x: 315,
                y: 145,
                width: 230,
                height: 20,
                children: (
                    <TextLabel
                        c={c}
                        text="Cross-layer shared quantile"
                        width={230}
                        fontSize={12}
                        color={c.textSecondary}
                    />
                ),
            }),

            // FFN labels
            ...ffnCells.flatMap((fc, idx) => [
                CanvasItem({
                    x: 315 + idx * 45,
                    y: 195,
                    width: 40,
                    height: 20,
                    children: (
                        <TextLabel
                            c={c}
                            text={fc.label}
                            width={40}
                            fontSize={10}
                            fontWeight={700}
                            color={c.textPrimary}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: 315 + idx * 45,
                    y: 218,
                    width: 40,
                    height: 20,
                    children: (
                        <TextLabel
                            c={c}
                            text={fc.score.toFixed(2)}
                            width={40}
                            fontSize={11}
                            color={fc.keep ? tone('green') : tone('critical')}
                            align="center"
                        />
                    ),
                }),
            ]),

            CanvasItem({
                x: 315,
                y: 280,
                width: 230,
                height: 28,
                children: (
                    <TextLabel
                        c={c}
                        text="q = 0.246 · keep 3 / 5 channels"
                        width={230}
                        fontSize={13}
                        fontWeight={600}
                        color={tone('blue')}
                        align="center"
                    />
                ),
            }),
            CanvasItem({
                x: 315,
                y: 320,
                width: 230,
                height: 40,
                children: (
                    <TextLabel
                        c={c}
                        text="Coordinates L0n1 and L1n1 pruned; 3 survive"
                        width={230}
                        fontSize={11}
                        color={c.textSecondary}
                        align="center"
                    />
                ),
            }),

            // PEFT panel
            CanvasItem({
                x: 595,
                y: 115,
                width: 230,
                height: 26,
                children: (
                    <TextLabel
                        c={c}
                        text="PEFT · Module & Ranks"
                        width={230}
                        fontSize={15}
                        fontWeight={700}
                        color={tone('warm')}
                    />
                ),
            }),
            CanvasItem({
                x: 595,
                y: 135,
                width: 230,
                height: 20,
                children: (
                    <TextLabel
                        c={c}
                        text="Prune module, then slice ranks"
                        width={230}
                        fontSize={12}
                        color={c.textSecondary}
                    />
                ),
            }),

            // Module labels
            ...moduleCells.flatMap((mc, idx) => [
                CanvasItem({
                    x: 605 + idx * 68,
                    y: 165,
                    width: 56,
                    height: 18,
                    children: (
                        <TextLabel
                            c={c}
                            text={mc.label}
                            width={56}
                            fontSize={11}
                            fontWeight={700}
                            color={c.textPrimary}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: 605 + idx * 68,
                    y: 183,
                    width: 56,
                    height: 18,
                    children: (
                        <TextLabel
                            c={c}
                            text={mc.score.toFixed(2)}
                            width={56}
                            fontSize={11}
                            color={mc.keep ? tone('green') : tone('critical')}
                            align="center"
                        />
                    ),
                }),
            ]),

            // Rank labels
            ...rankCells.flatMap((rc, idx) => [
                CanvasItem({
                    x: 600 + idx * 54,
                    y: 235,
                    width: 46,
                    height: 18,
                    children: (
                        <TextLabel
                            c={c}
                            text={rc.label}
                            width={46}
                            fontSize={11}
                            fontWeight={700}
                            color={c.textPrimary}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: 600 + idx * 54,
                    y: 253,
                    width: 46,
                    height: 18,
                    children: (
                        <TextLabel
                            c={c}
                            text={rc.score.toFixed(2)}
                            width={46}
                            fontSize={11}
                            color={rc.keep ? tone('green') : tone('critical')}
                            align="center"
                        />
                    ),
                }),
            ]),

            CanvasItem({
                x: 595,
                y: 290,
                width: 230,
                height: 28,
                children: (
                    <TextLabel
                        c={c}
                        text="Drop M1 · keep ranks r2 + r4"
                        width={230}
                        fontSize={13}
                        fontWeight={600}
                        color={tone('warm')}
                        align="center"
                    />
                ),
            }),
            CanvasItem({
                x: 595,
                y: 330,
                width: 230,
                height: 40,
                children: (
                    <TextLabel
                        c={c}
                        text="Module M1 eliminated; r1, r3 pruned in M2/M3"
                        width={230}
                        fontSize={11}
                        color={c.textSecondary}
                        align="center"
                    />
                ),
            }),

            // Legend labels
            CanvasItem({
                x: 290,
                y: 443,
                width: 180,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="Keep: Score > Threshold"
                        width={180}
                        fontSize={13}
                        fontWeight={600}
                        color={tone('green')}
                    />
                ),
            }),
            CanvasItem({
                x: 520,
                y: 443,
                width: 180,
                height: 24,
                children: (
                    <TextLabel
                        c={c}
                        text="Prune: Score ≤ Threshold"
                        width={180}
                        fontSize={13}
                        fontWeight={600}
                        color={tone('critical')}
                    />
                ),
            }),
        ],
    })
}

export default create('dark')
