import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    getThemeColors,
    getReadableToneColor,
    getToneFill,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 860
export const height = 480
export const alt =
    'SM100 block-scaled GEMM stages operands and scales in shared memory. Scale factors copy to TMEM while operands stream from SMEM into Tensor Cores.'

interface StageNode {
    x: number
    y: number
    w: number
    h: number
    title: string
    sub: string
    desc: string
    tone: 'blue' | 'cyan' | 'purple' | 'warm'
}

export function create(mode: ThemeMode = 'dark') {
    const c = getThemeColors(mode)
    const tone = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getReadableToneColor(name, c)
    const fill = (name: 'blue' | 'purple' | 'green' | 'cyan' | 'warm' | 'critical') =>
        getToneFill(name, c)

    const nodes: StageNode[] = [
        // Column 1: Global Memory
        {
            x: 25,
            y: 105,
            w: 145,
            h: 125,
            title: 'Global Scales',
            sub: 'Packed UE8M0',
            desc: 'Per-tile scale factors',
            tone: 'cyan',
        },
        {
            x: 25,
            y: 275,
            w: 145,
            h: 125,
            title: 'Global Operands',
            sub: 'FP8 A / FP4 B',
            desc: 'Matrix weight & act tiles',
            tone: 'blue',
        },

        // Column 2: Shared Memory (SMEM)
        {
            x: 200,
            y: 105,
            w: 145,
            h: 125,
            title: 'SMEM Scales',
            sub: 'Scale Staging',
            desc: 'TMA multicast buffer',
            tone: 'cyan',
        },
        {
            x: 200,
            y: 275,
            w: 145,
            h: 125,
            title: 'SMEM Operands',
            sub: 'A + B Staging',
            desc: 'Double-buffered tiles',
            tone: 'blue',
        },

        // Column 3: TMEM Scales
        {
            x: 375,
            y: 105,
            w: 145,
            h: 125,
            title: 'TMEM Scales',
            sub: 'Scale Registers',
            desc: 'Allocated in TMEM',
            tone: 'cyan',
        },

        // Column 4: Tensor Cores
        {
            x: 550,
            y: 175,
            w: 145,
            h: 155,
            title: 'Tensor Cores',
            sub: 'tcgen05.mma',
            desc: 'SMEM ops + TMEM scales',
            tone: 'purple',
        },

        // Column 5: TMEM Accumulator & Epilogue
        {
            x: 720,
            y: 175,
            w: 120,
            h: 155,
            title: 'Epilogue & D',
            sub: 'TMEM Accums',
            desc: 'Store to Global D',
            tone: 'warm',
        },
    ]

    return Board({
        c,
        width,
        height,
        children: [
            // Background SVG elements & connector arrows
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Global Scales -> SMEM Scales */}
                        <VectorArrow
                            x1={170}
                            y1={165}
                            x2={198}
                            y2={165}
                            color={tone('cyan')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        {/* Global Operands -> SMEM Operands */}
                        <VectorArrow
                            x1={170}
                            y1={335}
                            x2={198}
                            y2={335}
                            color={tone('blue')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        {/* SMEM Scales -> TMEM Scales */}
                        <VectorArrow
                            x1={345}
                            y1={165}
                            x2={373}
                            y2={165}
                            color={tone('cyan')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        {/* TMEM Scales -> Tensor Cores */}
                        <VectorArrow
                            x1={520}
                            y1={165}
                            x2={548}
                            y2={215}
                            color={tone('cyan')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        {/* SMEM Operands -> Tensor Cores */}
                        <VectorArrow
                            x1={345}
                            y1={335}
                            x2={548}
                            y2={275}
                            color={tone('blue')}
                            strokeWidth={2}
                            arrowSize={4}
                        />
                        {/* Tensor Cores -> TMEM Epilogue */}
                        <VectorArrow
                            x1={695}
                            y1={250}
                            x2={718}
                            y2={250}
                            color={tone('warm')}
                            strokeWidth={2}
                            arrowSize={4}
                        />

                        {nodes.map((n) => (
                            <rect
                                key={n.title}
                                x={n.x}
                                y={n.y}
                                width={n.w}
                                height={n.h}
                                rx="8"
                                fill={fill(n.tone)}
                                stroke={tone(n.tone)}
                                strokeWidth="1.5"
                            />
                        ))}
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
                        text="SM100 Block-Scaled GEMM Execution Architecture"
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
                        text="Operands stream from SMEM while scale factors stage through TMEM to tcgen05 MMA"
                        width={810}
                        fontSize={14}
                        fontWeight={400}
                        color={c.textSecondary}
                    />
                ),
            }),

            // Text labels for each node card
            ...nodes.flatMap((n) => [
                CanvasItem({
                    x: n.x + 8,
                    y: n.y + 12,
                    width: n.w - 16,
                    height: 24,
                    children: (
                        <TextLabel
                            c={c}
                            text={n.title}
                            width={n.w - 16}
                            fontSize={15}
                            fontWeight={700}
                            color={tone(n.tone)}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: n.x + 8,
                    y: n.y + 42,
                    width: n.w - 16,
                    height: 20,
                    children: (
                        <TextLabel
                            c={c}
                            text={n.sub}
                            width={n.w - 16}
                            fontSize={13}
                            fontWeight={600}
                            color={c.textPrimary}
                            align="center"
                        />
                    ),
                }),
                CanvasItem({
                    x: n.x + 8,
                    y: n.y + 70,
                    width: n.w - 16,
                    height: 36,
                    children: (
                        <TextLabel
                            c={c}
                            text={n.desc}
                            width={n.w - 16}
                            fontSize={12}
                            fontWeight={400}
                            color={c.textSecondary}
                            align="center"
                        />
                    ),
                }),
            ]),
        ],
    })
}

export default create()
