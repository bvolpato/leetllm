import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
    getToneFill,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'Non-colocated weight synchronization pathways in Slime: Full NCCL, Full Disk, and Delta Disk. Full NCCL pauses during gather and broadcast. Disk methods prepare weights while inference remains live, pausing workers only for reload.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)
    const blueFill = getToneFill('blue', c)
    const warmFill = getToneFill('warm', c)
    const greenFill = getToneFill('green', c)

    const labels: React.ReactNode[] = []
    const marks: React.ReactNode[] = []

    const text = (
        s: string,
        x: number,
        y: number,
        w: number,
        size = 16,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'center',
        weight = 500,
    ) =>
        labels.push(
            CanvasItem({
                x,
                y,
                width: w,
                height: size * 1.5,
                children: TextLabel({
                    c,
                    text: s,
                    width: w,
                    fontSize: size,
                    color,
                    align,
                    fontWeight: weight,
                }),
            }),
        )

    text(
        'Slime weight synchronization pathways · non-colocated rollout workers',
        35,
        18,
        790,
        22,
        c.textPrimary,
        'center',
        700,
    )

    const lanes = [
        {
            title: 'Path A: Full NCCL',
            subtitle: 'Direct GPU-to-GPU broadcast',
            x: 35,
            steps: [
                { name: '1. Pause & flush requests', color: warm, fill: warmFill },
                { name: '2. Gather master shards', color: warm, fill: warmFill },
                { name: '3. Broadcast weights over NCCL', color: warm, fill: warmFill },
                { name: '4. Postprocess & format parameters', color: warm, fill: warmFill },
                { name: '5. Resume generation', color: green, fill: greenFill },
            ],
        },
        {
            title: 'Path B: Full Disk',
            subtitle: 'Staged filesystem checkpoint',
            x: 305,
            steps: [
                { name: '1. Publish full checkpoint', color: blue, fill: blueFill },
                { name: '2. Prefetch / pull to local disk', color: blue, fill: blueFill },
                { name: '3. Pause & flush requests', color: warm, fill: warmFill },
                { name: '4. Reload model weights from disk', color: warm, fill: warmFill },
                { name: '5. Resume generation', color: green, fill: greenFill },
            ],
        },
        {
            title: 'Path C: Delta Disk',
            subtitle: 'Incremental diff + checksum',
            x: 575,
            steps: [
                { name: '1. Publish weight deltas', color: blue, fill: blueFill },
                { name: '2. Patch files & verify checksum', color: blue, fill: blueFill },
                { name: '3. Pause & flush requests', color: warm, fill: warmFill },
                { name: '4. Hot-reload patched layers', color: warm, fill: warmFill },
                { name: '5. Resume generation', color: green, fill: greenFill },
            ],
        },
    ]

    lanes.forEach((lane) => {
        marks.push(
            <rect
                key={`lane-${lane.title}`}
                x={lane.x}
                y={52}
                width={250}
                height={40}
                rx={6}
                fill={c.bgCard}
                stroke={c.border}
                strokeWidth={1}
            />,
        )
        text(lane.title, lane.x, 58, 250, 16, c.textPrimary, 'center', 700)
        text(lane.subtitle, lane.x, 76, 250, 12, c.textSecondary, 'center', 400)

        lane.steps.forEach((step, j) => {
            const y = 104 + j * 62
            marks.push(
                <rect
                    key={`step-${lane.title}-${j}`}
                    x={lane.x}
                    y={y}
                    width={250}
                    height={46}
                    rx={6}
                    fill={step.fill}
                    stroke={step.color}
                    strokeWidth={1.5}
                />,
            )
            text(step.name, lane.x + 8, y + 13, 234, 14, step.color, 'center', 600)

            if (j < 4) {
                marks.push(
                    VectorArrow({
                        x1: lane.x + 125,
                        y1: y + 47,
                        x2: lane.x + 125,
                        y2: y + 61,
                        color: c.textMuted,
                        strokeWidth: 2,
                        arrowSize: 4,
                    }),
                )
            }
        })
    })

    const legends = [
        { label: 'File preparation (old weights live)', color: blue, fill: blueFill, x: 35 },
        { label: 'Worker paused (generation blocked)', color: warm, fill: warmFill, x: 305 },
        { label: 'Inference active on new weights', color: green, fill: greenFill, x: 575 },
    ]

    legends.forEach((leg) => {
        marks.push(
            <rect
                key={leg.label}
                x={leg.x}
                y={435}
                width={250}
                height={38}
                rx={6}
                fill={leg.fill}
                stroke={leg.color}
                strokeWidth={1}
            />,
        )
        text(leg.label, leg.x + 8, 444, 234, 13, leg.color, 'center', 600)
    })

    return Board({
        c,
        width,
        height,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {marks}
                    </svg>
                ),
            }),
            ...labels,
        ],
    })
})

export const create = illustration.create
export default illustration.default
