import React from 'react'
import {
    Board,
    CanvasItem,
    Panel,
    Row,
    ScatterPlot,
    Scene,
    SvgFrame,
    SvgPoint,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
    getToneColor,
    getToneFill,
    withColorAlpha,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'Two-panel comparison of retrieval encoder architectures. The left panel shows token interaction geometry: Bi-Encoder pools query and passage tokens independently into single vectors for one dot product q dot d; ColBERT Late Interaction keeps per-token vectors and sums query-row maxima over a token-to-token similarity grid; Cross-Encoder concatenates query and passage tokens for dense all-to-all self-attention. The right panel plots representative query latency (log milliseconds) against retrieval precision, showing Bi-Encoder fastest at lower precision, ColBERT in the middle, and Cross-Encoder slowest with highest precision.'

export const width = 780
export const height = 470

function interactionGeometryPanel(c: ThemeColors) {
    const w = 382
    const h = 392
    const green = getToneColor('green', c)
    const greenInk = getReadableToneColor('green', c)
    const blue = getToneColor('blue', c)
    const blueInk = getReadableToneColor('blue', c)
    const warm = getToneColor('warm', c)
    const warmInk = getReadableToneColor('warm', c)

    const qTokenXs = [22, 56]
    const dTokenXs = [16, 46, 76]

    const maxSimVals = [
        [0.12, 0.93, 0.08],
        [0.19, 0.07, 0.91],
    ]

    return Board({
        c,
        width: w,
        height: h,
        background: 'transparent',
        children: [
            <CanvasItem key="svg-arch" x={0} y={0} width={w} height={h}>
                <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
                    {/* Row 1: Bi-Encoder */}
                    <SvgFrame
                        c={c}
                        x={2}
                        y={4}
                        width={w - 4}
                        height={116}
                        rx={10}
                        fill={withColorAlpha(getToneFill('green', c), 0.35)}
                        stroke={withColorAlpha(green, 0.55)}
                        strokeWidth={1.25}
                    />
                    {/* Query tokens -> clean arrow -> pooled vector q */}
                    {qTokenXs.map((tx, idx) => (
                        <React.Fragment key={`bi-q-${idx}`}>
                            <SvgFrame
                                c={c}
                                x={tx}
                                y={42}
                                width={28}
                                height={22}
                                rx={4}
                                fill={withColorAlpha(green, 0.28)}
                                stroke={green}
                                strokeWidth={1.2}
                            />
                        </React.Fragment>
                    ))}
                    <VectorArrow
                        x1={92}
                        y1={53}
                        x2={146}
                        y2={53}
                        color={green}
                        strokeWidth={2}
                        arrowSize={4.5}
                    />
                    {/* Doc tokens -> clean arrow -> pooled vector d */}
                    {dTokenXs.map((tx, idx) => (
                        <React.Fragment key={`bi-d-${idx}`}>
                            <SvgFrame
                                c={c}
                                x={tx}
                                y={80}
                                width={24}
                                height={22}
                                rx={4}
                                fill={withColorAlpha(c.textSecondary, 0.16)}
                                stroke={c.borderLight}
                                strokeWidth={1.2}
                            />
                        </React.Fragment>
                    ))}
                    <VectorArrow
                        x1={108}
                        y1={91}
                        x2={146}
                        y2={91}
                        color={c.textSecondary}
                        strokeWidth={2}
                        arrowSize={4.5}
                    />
                    {/* Pooled vectors q, d -> single dot product */}
                    <SvgPoint cx={162} cy={53} r={11} fill={green} />
                    <SvgPoint cx={162} cy={91} r={11} fill={c.textSecondary} />
                    <line x1={173} y1={53} x2={232} y2={72} stroke={green} strokeWidth={2.5} />
                    <line x1={173} y1={91} x2={232} y2={72} stroke={green} strokeWidth={2.5} />
                    <SvgFrame
                        c={c}
                        x={232}
                        y={54}
                        width={64}
                        height={36}
                        rx={8}
                        fill={getToneFill('green', c)}
                        stroke={green}
                        strokeWidth={1.8}
                    />

                    {/* Row 2: ColBERT Late Interaction */}
                    <SvgFrame
                        c={c}
                        x={2}
                        y={134}
                        width={w - 4}
                        height={120}
                        rx={10}
                        fill={withColorAlpha(getToneFill('blue', c), 0.35)}
                        stroke={withColorAlpha(blue, 0.55)}
                        strokeWidth={1.25}
                    />
                    {[182, 214].map((cy, idx) => (
                        <React.Fragment key={`col-q-${idx}`}>
                            <SvgPoint cx={38} cy={cy} r={8} fill={blue} />
                        </React.Fragment>
                    ))}
                    {[174, 198, 222].map((cy, idx) => (
                        <React.Fragment key={`col-d-${idx}`}>
                            <SvgPoint cx={118} cy={cy} r={7} fill={c.textSecondary} />
                        </React.Fragment>
                    ))}
                    {[182, 214].map((qy, qi) =>
                        [174, 198, 222].map((dy, di) => {
                            const isMax = (qi === 0 && di === 1) || (qi === 1 && di === 2)
                            return (
                                <line
                                    key={`col-e-${qi}-${di}`}
                                    x1={46}
                                    y1={qy}
                                    x2={111}
                                    y2={dy}
                                    stroke={isMax ? blue : c.borderLight}
                                    strokeWidth={isMax ? 2.6 : 1.1}
                                    opacity={isMax ? 0.95 : 0.45}
                                />
                            )
                        }),
                    )}
                    {maxSimVals.map((row, ri) =>
                        row.map((val, ci) => {
                            const isPeak = val > 0.9
                            return (
                                <React.Fragment key={`ms-${ri}-${ci}`}>
                                    <SvgFrame
                                        c={c}
                                        x={152 + ci * 34}
                                        y={170 + ri * 30}
                                        width={30}
                                        height={26}
                                        rx={4}
                                        fill={
                                            isPeak
                                                ? blue
                                                : withColorAlpha(c.borderSubtle, 0.55)
                                        }
                                        stroke={isPeak ? blue : c.borderLight}
                                        strokeWidth={1}
                                    />
                                </React.Fragment>
                            )
                        }),
                    )}

                    {/* Row 3: Cross-Encoder */}
                    <SvgFrame
                        c={c}
                        x={2}
                        y={266}
                        width={w - 4}
                        height={120}
                        rx={10}
                        fill={withColorAlpha(getToneFill('warm', c), 0.35)}
                        stroke={withColorAlpha(warm, 0.55)}
                        strokeWidth={1.25}
                    />
                    {[0, 1, 2, 3, 4].map((i) => {
                        const isQ = i < 2
                        const cx = 28 + i * 24
                        return (
                            <React.Fragment key={`ce-tok-${i}`}>
                                <SvgPoint
                                    cx={cx}
                                    cy={322}
                                    r={7}
                                    fill={isQ ? warm : c.textSecondary}
                                />
                                {[0, 1, 2, 3, 4].map((j) =>
                                    j > i ? (
                                        <path
                                            key={`arc-${i}-${j}`}
                                            d={`M ${cx} 330 Q ${(cx + 28 + j * 24) / 2} ${334 + (j - i) * 11}, ${28 + j * 24} 330`}
                                            fill="none"
                                            stroke={warm}
                                            strokeWidth={1.25}
                                            opacity={0.65}
                                        />
                                    ) : null,
                                )}
                            </React.Fragment>
                        )
                    })}
                    {[0, 1, 2, 3, 4].map((r) =>
                        [0, 1, 2, 3, 4].map((col) => {
                            const crossBlock = (r < 2 && col >= 2) || (r >= 2 && col < 2)
                            return (
                                <React.Fragment key={`ce-m-${r}-${col}`}>
                                    <SvgFrame
                                        c={c}
                                        x={160 + col * 16}
                                        y={300 + r * 14}
                                        width={13}
                                        height={11}
                                        rx={2}
                                        fill={
                                            crossBlock
                                                ? warm
                                                : withColorAlpha(warm, 0.35)
                                        }
                                        stroke="none"
                                    />
                                </React.Fragment>
                            )
                        }),
                    )}
                </svg>
            </CanvasItem>,

            // Row 1 labels
            <CanvasItem key="lbl-bi-title" x={14} y={10} width={220} height={24}>
                <TextLabel
                    c={c}
                    text="Bi-Encoder"
                    width={220}
                    fontSize={16}
                    fontWeight={800}
                    color={greenInk}
                />
            </CanvasItem>,
            <CanvasItem key="lbl-bi-q" x={152} y={42} width={20} height={22}>
                <TextLabel
                    c={c}
                    text="q"
                    width={20}
                    fontSize={13}
                    fontWeight={800}
                    color={c.bg}
                    align="center"
                    mono
                />
            </CanvasItem>,
            <CanvasItem key="lbl-bi-d" x={152} y={80} width={20} height={22}>
                <TextLabel
                    c={c}
                    text="d"
                    width={20}
                    fontSize={13}
                    fontWeight={800}
                    color={c.bg}
                    align="center"
                    mono
                />
            </CanvasItem>,
            <CanvasItem key="lbl-bi-eq" x={232} y={61} width={64} height={24}>
                <TextLabel
                    c={c}
                    text="q · d"
                    width={64}
                    fontSize={17}
                    fontWeight={800}
                    color={greenInk}
                    align="center"
                    math
                />
            </CanvasItem>,
            <CanvasItem key="lbl-bi-note" x={300} y={55} width={76} height={36}>
                <TextLabel
                    c={c}
                    text="1 vec / doc"
                    width={76}
                    fontSize={13}
                    fontWeight={700}
                    color={c.textSecondary}
                    align="center"
                />
            </CanvasItem>,

            // Row 2 labels
            <CanvasItem key="lbl-col-title" x={14} y={140} width={240} height={24}>
                <TextLabel
                    c={c}
                    text="ColBERT · Late Interaction"
                    width={240}
                    fontSize={16}
                    fontWeight={800}
                    color={blueInk}
                />
            </CanvasItem>,
            <CanvasItem key="lbl-col-eq" x={262} y={184} width={112} height={40}>
                <TextLabel
                    c={c}
                    text="Σ max q_i·d_j"
                    width={112}
                    fontSize={15}
                    fontWeight={800}
                    color={blueInk}
                    align="center"
                    math
                />
            </CanvasItem>,

            // Row 3 labels
            <CanvasItem key="lbl-ce-title" x={14} y={272} width={260} height={24}>
                <TextLabel
                    c={c}
                    text="Cross-Encoder · Joint [q ; d]"
                    width={260}
                    fontSize={16}
                    fontWeight={800}
                    color={warmInk}
                />
            </CanvasItem>,
            <CanvasItem key="lbl-ce-eq" x={252} y={322} width={120} height={36}>
                <TextLabel
                    c={c}
                    text="Joint logit s"
                    width={120}
                    fontSize={15}
                    fontWeight={800}
                    color={warmInk}
                    align="center"
                    math
                />
            </CanvasItem>,
        ],
    })
}

const illustration = defineIllustration((c: ThemeColors) =>
    Scene({
        c,
        padding: 16,
        gap: 10,
        contentWidth: 748,
        align: 'center',
        background: 'transparent',
        children: Row({
            width: 748,
            gap: 14,
            align: 'stretch',
            justify: 'space-between',
            children: [
                Panel({
                    c,
                    title: 'Interaction connectivity',
                    tone: 'neutral',
                    width: 404,
                    padding: 10,
                    gap: 6,
                    titleFontSize: 16,
                    children: interactionGeometryPanel(c),
                }),
                Panel({
                    c,
                    title: 'Latency vs. precision regime',
                    tone: 'neutral',
                    width: 330,
                    padding: 10,
                    gap: 6,
                    titleFontSize: 16,
                    children: ScatterPlot({
                        c,
                        width: 308,
                        height: 382,
                        xMin: 0,
                        xMax: 3,
                        yMin: 0.65,
                        yMax: 1.0,
                        xAxisLabel: 'Query latency (log scale)',
                        yAxisLabel: 'Retrieval precision',
                        formatX: (v) =>
                            v <= 0.1
                                ? '1ms'
                                : v <= 1.1
                                  ? '10ms'
                                  : v <= 2.1
                                    ? '100ms'
                                    : '1s',
                        formatY: (v) => `${Math.round(v * 100)}%`,
                        showGrid: true,
                        points: [
                            {
                                x: 0.45,
                                y: 0.74,
                                label: 'Bi-Encoder',
                                color: 'positive',
                                size: 9,
                            },
                            {
                                x: 1.4,
                                y: 0.86,
                                label: 'ColBERT',
                                color: 'secondary',
                                size: 9,
                            },
                            {
                                x: 2.5,
                                y: 0.94,
                                label: 'Cross-Encoder',
                                color: 'warning',
                                size: 9,
                            },
                        ],
                    }),
                }),
            ],
        }),
    }),
)

export const create = illustration.create
export default illustration.default
