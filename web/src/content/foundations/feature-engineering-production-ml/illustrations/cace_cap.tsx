import React from 'react'
import {
    Board,
    CanvasItem,
    Panel,
    Row,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    VectorSegment,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 860
export const height = 540
export const alt =
    'For the same job with raw heartbeat age 200 hours, a 180-hour cap yields 180 hours while a 360-hour cap yields 200. Two bars show the changed input. On the fixed logistic score curve with backlog 18, the two input points give scores 0.445 and 0.545 on opposite sides of the chosen 0.5 alert threshold. A fresh 0.5-hour input stays unchanged; setting the heartbeat coefficient to zero removes this dependence.'

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
const score = (age: number) => sigmoid(0.02 * age + 0.01 * 18 - 4)

function leftCapBoard(c: ThemeColors) {
    const w = 390
    const h = 420
    const blue = getReadableToneColor('cyan', c)
    const green = getReadableToneColor('green', c)
    const inputX = (age: number) => 60 + (age / 360) * 280

    const label = (
        x: number,
        y: number,
        width: number,
        text: string,
        fontSize = 15,
        color = c.textPrimary,
    ) => (
        <CanvasItem x={x} y={y} width={width} height={26}>
            <TextLabel c={c} text={text} width={width} fontSize={fontSize} color={color} mono />
        </CanvasItem>
    )

    return (
        <Board c={c} width={w} height={h}>
            <CanvasItem x={0} y={0} width={w} height={h}>
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
                    {/* Two cap comparison bars */}
                    {[180, 360].map((cap, i) => {
                        const y = 100 + i * 110
                        return (
                            <React.Fragment key={cap}>
                                <VectorSegment
                                    x1={60}
                                    y1={y}
                                    x2={340}
                                    y2={y}
                                    color={c.borderLight}
                                    strokeWidth={2}
                                    showStartDot={false}
                                    showEndDot={false}
                                />
                                <SvgFrame
                                    c={c}
                                    x={60}
                                    y={y - 12}
                                    width={inputX(Math.min(200, cap)) - 60}
                                    height={24}
                                    fill={i ? green : blue}
                                    stroke={i ? green : blue}
                                    rx={2}
                                />
                                <VectorSegment
                                    x1={inputX(cap)}
                                    y1={y - 18}
                                    x2={inputX(cap)}
                                    y2={y + 18}
                                    color={i ? green : blue}
                                    strokeWidth={2.5}
                                    showStartDot={false}
                                    showEndDot={false}
                                />
                            </React.Fragment>
                        )
                    })}
                    {/* Uncapped 200h raw input marker */}
                    <line
                        x1={inputX(200)}
                        y1={70}
                        x2={inputX(200)}
                        y2={330}
                        stroke={c.textSecondary}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                    />
                    {/* Clipping arrow on 180h cap */}
                    <VectorArrow
                        x1={inputX(200) - 2}
                        y1={135}
                        x2={inputX(180) + 2}
                        y2={135}
                        color={blue}
                        strokeWidth={2}
                        arrowSize={5}
                    />
                </svg>
            </CanvasItem>
            {label(20, 20, 350, 'Raw Heartbeat Age: 200 hours', 16, c.textPrimary)}
            {label(60, 68, 140, '180h Cap: Clamped', 14, blue)}
            {label(inputX(180) - 40, 114, 80, '180h', 14, c.bgCard)}
            {label(60, 178, 140, '360h Cap: Preserved', 14, green)}
            {label(inputX(200) - 40, 224, 80, '200h', 14, c.bgCard)}
            {label(inputX(200) - 40, 336, 80, 'Raw 200h', 13, c.textSecondary)}
            <CanvasItem x={20} y={370} width={350} height={40}>
                <TextLabel
                    c={c}
                    text="Feature transforms alter input representations and directly shift model score outputs."
                    width={350}
                    fontSize={14}
                    color={c.textSecondary}
                    align="center"
                />
            </CanvasItem>
        </Board>
    )
}

function rightScoreBoard(c: ThemeColors) {
    const w = 390
    const h = 420
    const blue = getReadableToneColor('cyan', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)

    const sx = (age: number) => 50 + ((age - 150) / 80) * 300
    const sy = (p: number) => 320 - (p - 0.3) * 380

    const curve = Array.from({ length: 81 }, (_, i) => ({
        age: 150 + i,
        p: score(150 + i),
    }))

    const pathPoints = curve.map((pt) => ({ x: sx(pt.age), y: sy(pt.p) }))

    const label = (
        x: number,
        y: number,
        width: number,
        text: string,
        fontSize = 15,
        color = c.textPrimary,
    ) => (
        <CanvasItem x={x} y={y} width={width} height={26}>
            <TextLabel c={c} text={text} width={width} fontSize={fontSize} color={color} mono />
        </CanvasItem>
    )

    return (
        <Board c={c} width={w} height={h}>
            <CanvasItem x={0} y={0} width={w} height={h}>
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
                    {/* Threshold 0.5 horizontal line */}
                    <line
                        x1={40}
                        y1={sy(0.5)}
                        x2={360}
                        y2={sy(0.5)}
                        stroke={warm}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                    />
                    {/* Score curve */}
                    <path
                        d={`M ${pathPoints.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
                        fill="none"
                        stroke={c.textPrimary}
                        strokeWidth={2.5}
                    />
                    {/* 180h point (score 0.445) */}
                    <circle cx={sx(180)} cy={sy(0.445)} r={6} fill={blue} />
                    {/* 200h point (score 0.545) */}
                    <circle cx={sx(200)} cy={sy(0.545)} r={6} fill={green} />
                </svg>
            </CanvasItem>
            {label(20, 16, 350, 'Score Curve: s(a) = σ(0.02a + 0.18 − 4)', 15, c.textPrimary)}
            {label(270, sy(0.5) - 22, 90, 'Threshold 0.5', 13, warm)}
            {label(sx(180) - 70, sy(0.445) + 12, 140, 'a=180h → s=0.445 (No Alert)', 13, blue)}
            {label(sx(200) - 70, sy(0.545) - 26, 140, 'a=200h → s=0.545 (Alert!)', 13, green)}
            <CanvasItem x={20} y={366} width={350} height={44}>
                <TextLabel
                    c={c}
                    text="Changing the feature cap from 180h to 360h flips the binary alert decision across the 0.5 threshold."
                    width={350}
                    fontSize={14}
                    color={c.textSecondary}
                    align="center"
                />
            </CanvasItem>
        </Board>
    )
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 18,
        gap: 12,
        align: 'center',
        contentWidth: 824,
        title: 'Feature Transformations Directly Shift Downstream Decisions',
        subtitle:
            'Capping policies change feature values and can flip operational decisions on borderline instances.',
        children: Row({
            width: 824,
            gap: 16,
            align: 'center',
            justify: 'space-between',
            children: [
                Panel({
                    c,
                    width: 404,
                    padding: 8,
                    gap: 4,
                    tone: 'neutral',
                    title: 'Feature Capping Comparison',
                    titleFontSize: 17,
                    children: leftCapBoard(c),
                }),
                Panel({
                    c,
                    width: 404,
                    padding: 8,
                    gap: 4,
                    tone: 'warm',
                    title: 'Logistic Score Response',
                    titleFontSize: 17,
                    children: rightScoreBoard(c),
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
