import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withColorAlpha,
} from 'vizmatic'

export const width = 920
export const height = 500
export const alt =
    'A log-scaled RAG candidate narrowing funnel reduces 100,000 indexed chunks to 18,000 ACL- and version-permitted chunks (2 ms, privacy boundary), 50 hybrid BM25+dense RRF candidates (18 ms, recall), 5 cross-encoder reranked parent sections (35 ms, precision), and 1,800 packed prompt tokens driving a cited answer or abstention (320 ms model TTFT).'

const illustration = defineIllustration((c) => {
    const purple = getReadableToneColor('purple', c)
    const cyan = getReadableToneColor('cyan', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)

    const funnelLeft = 224
    const funnelMaxW = 396 // log10(100,000) = 5.0
    const logW = (count: number) => Math.max(26, (Math.log10(count) / 5) * funnelMaxW)

    const stages = [
        {
            name: '0 · Raw Corpus',
            sub: 'All indexed chunks',
            countLabel: '100,000 chunks',
            w: logW(100_000),
            y: 86,
            color: c.textSecondary,
            fill: withColorAlpha(c.border, 0.45),
            latency: 'Offline',
            latencyW: 0,
            invariant: 'Versioned bundle',
        },
        {
            name: '1 · ACL Pre-Filter',
            sub: 'Tenant, group, active rev',
            countLabel: '18,000 eligible',
            w: logW(18_000),
            y: 164,
            color: purple,
            fill: withColorAlpha(purple, 0.24),
            latency: '2 ms',
            latencyW: 12,
            invariant: 'No ACL leaks',
        },
        {
            name: '2 · Hybrid Retrieval',
            sub: 'BM25 + dense RRF',
            countLabel: '50 candidates',
            w: logW(50),
            y: 242,
            color: cyan,
            fill: withColorAlpha(cyan, 0.24),
            latency: '18 ms',
            latencyW: 28,
            invariant: 'High recall',
        },
        {
            name: '3 · Rerank & Expand',
            sub: 'Cross-encoder -> parent',
            countLabel: '5 parents',
            w: logW(5),
            y: 320,
            color: warm,
            fill: withColorAlpha(warm, 0.24),
            latency: '35 ms',
            latencyW: 44,
            invariant: 'Precision + clauses',
        },
        {
            name: '4 · Context -> LLM',
            sub: 'Pack [E1]..[E5] + cite',
            countLabel: '1,800 prompt tok',
            w: 170,
            y: 398,
            color: green,
            fill: withColorAlpha(green, 0.22),
            latency: '320 ms',
            latencyW: 126,
            invariant: 'Cited or abstain',
        },
    ]

    const barH = 48
    const centerX = funnelLeft + funnelMaxW / 2
    const ticks = [
        { exp: 0, label: '1' },
        { exp: 1, label: '10' },
        { exp: 2, label: '10²' },
        { exp: 3, label: '10³' },
        { exp: 4, label: '10⁴' },
        { exp: 5, label: '10⁵' },
    ]

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Outer panels */}
                        <rect
                            x={16}
                            y={14}
                            width={618}
                            height={472}
                            rx={14}
                            fill={c.bgCard}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />
                        <rect
                            x={648}
                            y={14}
                            width={256}
                            height={472}
                            rx={14}
                            fill={c.bgCard}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />

                        {/* Log10 vertical gridlines inside funnel panel (left-aligned log axis) */}
                        {ticks.map((t) => {
                            const gx = funnelLeft + (t.exp / 5) * funnelMaxW
                            return (
                                <line
                                    key={`grid-${t.exp}`}
                                    x1={gx}
                                    y1={76}
                                    x2={gx}
                                    y2={376}
                                    stroke={c.border}
                                    strokeWidth={1}
                                    strokeDasharray="3 4"
                                />
                            )
                        })}

                        {/* Connecting trapezoids between chunk stages 0->1->2->3 */}
                        {[0, 1, 2].map((i) => {
                            const a = stages[i]
                            const b = stages[i + 1]
                            return (
                                <polygon
                                    key={`trap-${i}`}
                                    points={`${funnelLeft},${a.y + barH} ${funnelLeft + a.w},${a.y + barH} ${funnelLeft + b.w},${b.y} ${funnelLeft},${b.y}`}
                                    fill={withColorAlpha(b.color, 0.12)}
                                />
                            )
                        })}

                        {/* Arrow from Stage 3 (5 parents) to Stage 4 (1,800 packed tokens) */}
                        <line
                            x1={funnelLeft + stages[3].w / 2}
                            y1={stages[3].y + barH}
                            x2={funnelLeft + stages[3].w / 2}
                            y2={stages[4].y - 6}
                            stroke={green}
                            strokeWidth={2.5}
                        />
                        <polygon
                            points={`${funnelLeft + stages[3].w / 2},${stages[4].y} ${funnelLeft + stages[3].w / 2 - 5},${stages[4].y - 9} ${funnelLeft + stages[3].w / 2 + 5},${stages[4].y - 9}`}
                            fill={green}
                        />

                        {/* Horizontal stage bars */}
                        {stages.map((s, i) => (
                            <g key={`bar-${i}`}>
                                <rect
                                    x={funnelLeft}
                                    y={s.y}
                                    width={s.w}
                                    height={barH}
                                    rx={8}
                                    fill={s.fill}
                                    stroke={s.color}
                                    strokeWidth={2}
                                />
                                {/* Horizontal divider in right panel */}
                                {i > 0 && (
                                    <line
                                        x1={664}
                                        y1={s.y - 14}
                                        x2={888}
                                        y2={s.y - 14}
                                        stroke={c.border}
                                        strokeWidth={1}
                                    />
                                )}
                                {/* Latency bar on right */}
                                {s.latencyW > 0 && (
                                    <rect
                                        x={668}
                                        y={s.y + 8}
                                        width={s.latencyW}
                                        height={16}
                                        rx={4}
                                        fill={s.color}
                                    />
                                )}
                            </g>
                        ))}

                        {/* Small reference bar for centerX unused suppression */}
                        <line
                            x1={centerX}
                            y1={0}
                            x2={centerX}
                            y2={0}
                            stroke="none"
                        />
                    </svg>
                </CanvasItem>

                {/* Left panel header */}
                <CanvasItem x={34} y={24} width={580} height={24}>
                    <TextLabel
                        c={c}
                        text="Candidate Narrowing Funnel (log₁₀ chunk scale)"
                        fontSize={18}
                        fontWeight={800}
                        color={c.textPrimary}
                    />
                </CanvasItem>

                {/* Top log10 axis ticks */}
                {ticks.map((t) => {
                    const gx = funnelLeft + (t.exp / 5) * funnelMaxW
                    return (
                        <CanvasItem key={`tlbl-${t.exp}`} x={gx - 20} y={54} width={40} height={18}>
                            <TextLabel
                                c={c}
                                text={t.label}
                                fontSize={12}
                                mono
                                color={c.textMuted}
                                align="center"
                            />
                        </CanvasItem>
                    )
                })}

                {/* Right panel header */}
                <CanvasItem x={666} y={24} width={224} height={24}>
                    <TextLabel
                        c={c}
                        text="Latency & Invariant"
                        fontSize={18}
                        fontWeight={800}
                        color={c.textPrimary}
                    />
                </CanvasItem>
                <CanvasItem x={666} y={50} width={224} height={20}>
                    <TextLabel
                        c={c}
                        text="375 ms e2e TTFT budget"
                        fontSize={13}
                        fontWeight={600}
                        color={c.textSecondary}
                    />
                </CanvasItem>

                {/* Stage labels, bar values, and right-column latency + invariant */}
                {stages.map((s, i) => {
                    const labelInside = s.w >= 145
                    const valueX = labelInside ? funnelLeft + 10 : funnelLeft + s.w + 10
                    const valueW = labelInside ? s.w - 20 : 180
                    return (
                        <React.Fragment key={`stage-txt-${i}`}>
                            <CanvasItem x={30} y={s.y + 4} width={186} height={22}>
                                <TextLabel
                                    c={c}
                                    text={s.name}
                                    fontSize={15}
                                    fontWeight={800}
                                    color={i === 0 ? c.textPrimary : s.color}
                                />
                            </CanvasItem>
                            <CanvasItem x={30} y={s.y + 26} width={186} height={18}>
                                <TextLabel
                                    c={c}
                                    text={s.sub}
                                    fontSize={12}
                                    color={c.textSecondary}
                                />
                            </CanvasItem>

                            {/* Bar quantity label */}
                            <CanvasItem x={valueX} y={s.y + 14} width={valueW} height={22}>
                                <TextLabel
                                    c={c}
                                    text={s.countLabel}
                                    fontSize={14}
                                    fontWeight={800}
                                    mono
                                    color={i === 0 ? c.textPrimary : s.color}
                                    align="left"
                                />
                            </CanvasItem>

                            {/* Right panel: latency text + invariant */}
                            <CanvasItem
                                x={s.latencyW > 0 ? 676 + s.latencyW : 668}
                                y={s.y + 5}
                                width={90}
                                height={22}
                            >
                                <TextLabel
                                    c={c}
                                    text={s.latency}
                                    fontSize={14}
                                    fontWeight={800}
                                    mono
                                    color={i === 0 ? c.textMuted : s.color}
                                />
                            </CanvasItem>
                            <CanvasItem x={668} y={s.y + 28} width={220} height={20}>
                                <TextLabel
                                    c={c}
                                    text={s.invariant}
                                    fontSize={13}
                                    fontWeight={600}
                                    color={c.textSecondary}
                                />
                            </CanvasItem>
                        </React.Fragment>
                    )
                })}

                {/* Bottom note in left panel */}
                <CanvasItem x={34} y={456} width={580} height={20}>
                    <TextLabel
                        c={c}
                        text="20,000× candidate reduction before LLM context · zero unauthorized chunks scored"
                        fontSize={13}
                        fontWeight={600}
                        color={c.textSecondary}
                    />
                </CanvasItem>
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
