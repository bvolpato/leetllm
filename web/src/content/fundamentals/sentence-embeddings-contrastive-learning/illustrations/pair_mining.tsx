import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneColor,
    getToneFill,
    withColorAlpha,
} from 'vizmatic'
import type { ThemeColors, ToneName } from 'vizmatic'

export const alt =
    '2D unit-circle cosine similarity plot for query "How does RoPE encode token position?" at 0 degrees (cosine 1.00). At exact cosine positions on the circle: true positive RoPE rotation sits at +23 degrees (cosine 0.92, protect); an unlabeled false negative RoPE paraphrase sits at -27 degrees (cosine 0.89, audit and mask); hard negative 1 Sinusoidal abs bias sits at +41 degrees (cosine 0.76, mine); hard negative 2 Learned pos embed sits at -47 degrees (cosine 0.68, mine); and easy negative NF4 quant sits at +87 degrees (cosine 0.05, drop).'

export const width = 780
export const height = 460

interface CandidatePoint {
    short: string
    name: string
    cos: number
    sign: 1 | -1
    role: string
    tone: ToneName
    dashed?: boolean
}

function unitPos(cos: number, sign: 1 | -1) {
    const sin = Math.sqrt(Math.max(0, 1 - cos * cos)) * sign
    return { x: cos, y: sin }
}

const points: CandidatePoint[] = [
    { short: 'p⁺', name: 'RoPE pair rotation', cos: 0.92, sign: 1, role: 'protect (positive)', tone: 'green' },
    {
        short: 'fn',
        name: 'Unlabeled RoPE match',
        cos: 0.89,
        sign: -1,
        role: 'audit (false neg)',
        tone: 'purple',
        dashed: true,
    },
    { short: 'h₁', name: 'Sinusoidal abs bias', cos: 0.76, sign: 1, role: 'mine (hard #1)', tone: 'warm' },
    { short: 'h₂', name: 'Learned pos embed', cos: 0.68, sign: -1, role: 'mine (hard #2)', tone: 'warm' },
    { short: 'e₁', name: 'NF4 block packing', cos: 0.05, sign: 1, role: 'drop (easy)', tone: 'neutral' },
]

const illustration = defineIllustration((c: ThemeColors) => {
    const plotW = 412
    const plotH = 396
    const pad = 26
    const xMin = -0.14
    const xMax = 1.32
    const yMin = -1.08
    const yMax = 1.18

    const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (plotW - pad * 2)
    const sy = (y: number) => pad + (plotH - pad * 2) - ((y - yMin) / (yMax - yMin)) * (plotH - pad * 2)

    // Right semicircle arc from -92 deg to +92 deg
    const unitArc = Array.from({ length: 75 }, (_, i) => {
        const deg = -92 + (i * 184) / 74
        const rad = (deg * Math.PI) / 180
        return { x: Math.cos(rad), y: Math.sin(rad) }
    })

    const cosLine = (cosVal: number, tone: ToneName) => ({
        points: [
            { x: cosVal, y: -Math.sqrt(1 - cosVal * cosVal) - 0.05 },
            { x: cosVal, y: Math.sqrt(1 - cosVal * cosVal) + 0.05 },
        ],
        tone,
        strokeWidth: 1.5,
        dashed: true,
        opacity: 0.7,
    })

    const blueInk = getReadableToneColor('blue', c)
    const purpleInk = getReadableToneColor('purple', c)
    const warmInk = getReadableToneColor('warm', c)

    return Scene({
        c,
        padding: 16,
        gap: 10,
        contentWidth: 748,
        align: 'center',
        background: 'transparent',
        children: Row({
            width: 748,
            gap: 14,
            align: 'center',
            justify: 'space-between',
            children: [
                Board({
                    c,
                    width: plotW,
                    height: plotH,
                    background: 'transparent',
                    children: [
                        <CanvasItem key="axis-plot" x={0} y={0} width={plotW} height={plotH}>
                            <AxisPlot
                                c={c}
                                width={plotW}
                                height={plotH}
                                padding={pad}
                                xMin={xMin}
                                xMax={xMax}
                                yMin={yMin}
                                yMax={yMax}
                                showFrame={false}
                                showGrid={false}
                                paths={[
                                    {
                                        points: [
                                            { x: -0.12, y: 0 },
                                            { x: 1.0, y: 0 },
                                        ],
                                        tone: 'neutral',
                                        strokeWidth: 1.4,
                                        opacity: 0.45,
                                    },
                                    {
                                        points: [
                                            { x: 0, y: -1.04 },
                                            { x: 0, y: 1.12 },
                                        ],
                                        tone: 'neutral',
                                        strokeWidth: 1.4,
                                        opacity: 0.45,
                                    },
                                    {
                                        points: unitArc,
                                        tone: 'neutral',
                                        strokeWidth: 2,
                                        dashed: true,
                                        opacity: 0.65,
                                    },
                                    cosLine(0.6, 'warm'),
                                    cosLine(0.85, 'purple'),
                                    ...points
                                        .filter((p) => p.dashed)
                                        .map((p) => ({
                                            points: [{ x: 0, y: 0 }, unitPos(p.cos, p.sign)],
                                            tone: p.tone,
                                            strokeWidth: 3,
                                            dashed: true,
                                        })),
                                ]}
                                vectors={[
                                    {
                                        x1: 0,
                                        y1: 0,
                                        x2: 1,
                                        y2: 0,
                                        tone: 'blue',
                                        strokeWidth: 3.5,
                                        arrow: true,
                                        arrowSize: 6,
                                    },
                                    ...points
                                        .filter((p) => !p.dashed)
                                        .map((p) => {
                                            const pos = unitPos(p.cos, p.sign)
                                            return {
                                                x1: 0,
                                                y1: 0,
                                                x2: pos.x,
                                                y2: pos.y,
                                                tone: p.tone,
                                                strokeWidth: p.tone === 'neutral' ? 2.5 : 3.2,
                                                arrow: true,
                                                arrowSize: 6,
                                                opacity: p.tone === 'neutral' ? 0.65 : 0.95,
                                            }
                                        }),
                                ]}
                                points={[
                                    { x: 0, y: 0, fill: c.textPrimary, r: 4 },
                                    ...points.map((p) => {
                                        const pos = unitPos(p.cos, p.sign)
                                        return {
                                            x: pos.x,
                                            y: pos.y,
                                            tone: p.tone,
                                            r: p.dashed ? 7 : 6,
                                            stroke: c.bg,
                                            strokeWidth: 2,
                                        }
                                    }),
                                ]}
                            />
                        </CanvasItem>,

                        // Direct point labels positioned cleanly outside the arc
                        <CanvasItem key="lbl-q" x={sx(1.0) + 8} y={sy(0) - 24} width={76} height={22}>
                            <TextLabel
                                c={c}
                                text="q (1.0)"
                                width={76}
                                fontSize={14}
                                fontWeight={800}
                                color={blueInk}
                                mono
                            />
                        </CanvasItem>,
                        <CanvasItem key="lbl-p" x={sx(0.92) + 12} y={sy(0.39) - 12} width={76} height={22}>
                            <TextLabel
                                c={c}
                                text="p⁺ 0.92"
                                width={76}
                                fontSize={14}
                                fontWeight={800}
                                color={getReadableToneColor('green', c)}
                                math
                            />
                        </CanvasItem>,
                        <CanvasItem key="lbl-fn" x={sx(0.89) + 12} y={sy(-0.46) - 10} width={76} height={22}>
                            <TextLabel
                                c={c}
                                text="fn 0.89"
                                width={76}
                                fontSize={14}
                                fontWeight={800}
                                color={purpleInk}
                                mono
                            />
                        </CanvasItem>,
                        <CanvasItem key="lbl-h1" x={sx(0.76) + 12} y={sy(0.65) - 14} width={76} height={22}>
                            <TextLabel
                                c={c}
                                text="h₁ 0.76"
                                width={76}
                                fontSize={14}
                                fontWeight={800}
                                color={warmInk}
                                math
                            />
                        </CanvasItem>,
                        <CanvasItem key="lbl-h2" x={sx(0.68) + 12} y={sy(-0.73) - 10} width={76} height={22}>
                            <TextLabel
                                c={c}
                                text="h₂ 0.68"
                                width={76}
                                fontSize={14}
                                fontWeight={800}
                                color={warmInk}
                                math
                            />
                        </CanvasItem>,
                        <CanvasItem key="lbl-e1" x={sx(0.05) + 14} y={sy(1.0) - 24} width={80} height={22}>
                            <TextLabel
                                c={c}
                                text="e₁ 0.05"
                                width={80}
                                fontSize={14}
                                fontWeight={700}
                                color={c.textMuted}
                                math
                            />
                        </CanvasItem>,

                        // Cosine threshold annotations
                        <CanvasItem key="zone-mine" x={sx(0.6) - 38} y={sy(-1.02)} width={86} height={20}>
                            <TextLabel
                                c={c}
                                text="mine >=0.6"
                                width={86}
                                fontSize={12.5}
                                fontWeight={750}
                                color={warmInk}
                                align="center"
                                mono
                            />
                        </CanvasItem>,
                        <CanvasItem key="zone-audit" x={sx(0.85) - 42} y={sy(1.09)} width={92} height={20}>
                            <TextLabel
                                c={c}
                                text="audit >0.85"
                                width={92}
                                fontSize={12.5}
                                fontWeight={750}
                                color={purpleInk}
                                align="center"
                                mono
                            />
                        </CanvasItem>,
                    ],
                }),

                // Compact right-hand key mapping exact cosine positions to mining actions
                Panel({
                    c,
                    title: 'Cosine mining zones (unit circle)',
                    tone: 'neutral',
                    width: 320,
                    padding: 12,
                    gap: 8,
                    titleFontSize: 16,
                    children: Column({
                        width: 294,
                        gap: 8,
                        align: 'stretch',
                        children: [
                            ...points.map((p) => {
                                const ink =
                                    p.tone === 'neutral'
                                        ? c.textMuted
                                        : getReadableToneColor(p.tone, c)
                                const border =
                                    p.tone === 'neutral'
                                        ? c.borderLight
                                        : withColorAlpha(getToneColor(p.tone, c), 0.7)
                                const bg =
                                    p.tone === 'neutral'
                                        ? withColorAlpha(c.bgCard, 0.5)
                                        : withColorAlpha(getToneFill(p.tone, c), 0.45)
                                return (
                                    <div
                                        key={`leg-${p.short}`}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 8,
                                            padding: '7px 10px',
                                            borderRadius: 8,
                                            border: `1.5px ${p.dashed ? 'dashed' : 'solid'} ${border}`,
                                            backgroundColor: bg,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 2,
                                            }}
                                        >
                                            <TextLabel
                                                c={c}
                                                text={`${p.short} · ${p.name}`}
                                                width={186}
                                                fontSize={14}
                                                fontWeight={800}
                                                color={c.textPrimary}
                                                math
                                            />
                                            <TextLabel
                                                c={c}
                                                text={p.role}
                                                width={186}
                                                fontSize={13}
                                                fontWeight={700}
                                                color={ink}
                                            />
                                        </div>
                                        <TextLabel
                                            c={c}
                                            text={p.cos.toFixed(2)}
                                            width={46}
                                            fontSize={16}
                                            fontWeight={850}
                                            color={ink}
                                            align="right"
                                            mono
                                        />
                                    </div>
                                )
                            }),
                        ],
                    }),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
