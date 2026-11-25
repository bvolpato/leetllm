import React from 'react'
import {
    Board,
    CanvasItem,
    DiagramLegend,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withColorAlpha,
} from 'vizmatic'

export const width = 920
export const height = 540
export const alt =
    'Side-by-side 2D vector neighborhoods compare post-filtering versus pre-filtered ACORN traversal for query q=(5,5) with predicate region=EU and k=3. On the left, the unfiltered top-3 circle captures eu-1, us-1, and us-2; dropping disallowed US points leaves only eu-1 (1/3 underfilled). On the right, filter-aware ACORN traversal skips US nodes and steps cleanly through eligible EU vectors eu-4, eu-2, eu-1, and eu-3 to fill all 3/3 slots.'

interface VecPoint {
    id: string
    x: number
    y: number
    eu: boolean
    lx: number
    ly: number
}

const POINTS: VecPoint[] = [
    { id: 'eu-1', x: 5.5, y: 5.6, eu: true, lx: -20, ly: -31 },
    { id: 'us-1', x: 4.3, y: 5.4, eu: false, lx: -56, ly: -20 },
    { id: 'us-2', x: 5.7, y: 4.5, eu: false, lx: 12, ly: 8 },
    { id: 'us-3', x: 4.2, y: 4.0, eu: false, lx: -44, ly: 8 },
    { id: 'us-4', x: 6.4, y: 5.8, eu: false, lx: 10, ly: -12 },
    { id: 'us-5', x: 3.3, y: 5.9, eu: false, lx: -46, ly: -12 },
    { id: 'us-6', x: 6.8, y: 3.5, eu: false, lx: 10, ly: 4 },
    { id: 'us-7', x: 3.0, y: 3.0, eu: false, lx: -42, ly: 6 },
    { id: 'eu-2', x: 7.3, y: 6.6, eu: true, lx: -20, ly: -31 },
    { id: 'eu-3', x: 2.6, y: 6.9, eu: true, lx: -56, ly: -10 },
    { id: 'eu-4', x: 7.9, y: 2.5, eu: true, lx: -18, ly: 12 },
]

const QUERY = { x: 5.0, y: 5.0 }

const illustration = defineIllustration((c) => {
    const cyan = getReadableToneColor('cyan', c)
    const green = getReadableToneColor('green', c)
    const red = getReadableToneColor('red', c)
    const warm = getReadableToneColor('warm', c)

    // Plot area dimensions: domain [1, 9] x [1, 9] -> 360 x 280
    const plotW = 368
    const plotH = 286
    const leftPlotX = 48
    const rightPlotX = 504
    const plotY = 122

    const mapX = (px: number, originX: number) => originX + ((px - 1) / 8) * plotW
    const mapY = (py: number) => plotY + ((9 - py) / 8) * plotH
    const rScaleX = plotW / 8
    const rScaleY = plotH / 8

    const byId = Object.fromEntries(POINTS.map((p) => [p.id, p]))
    const acornHops: Array<[string, string]> = [
        ['eu-4', 'eu-2'],
        ['eu-2', 'eu-1'],
        ['eu-1', 'eu-3'],
    ]

    const drawGrid = (originX: number, prefix: string) =>
        [2, 4, 6, 8].map((v) => (
            <g key={`${prefix}-${v}`}>
                <line
                    x1={mapX(v, originX)}
                    y1={plotY}
                    x2={mapX(v, originX)}
                    y2={plotY + plotH}
                    stroke={c.border}
                    strokeWidth={1}
                    strokeDasharray="3 4"
                />
                <line
                    x1={originX}
                    y1={mapY(v)}
                    x2={originX + plotW}
                    y2={mapY(v)}
                    stroke={c.border}
                    strokeWidth={1}
                    strokeDasharray="3 4"
                />
            </g>
        ))

    return (
        <Scene c={c} padding={0} gap={0} contentWidth={width}>
            <Board c={c} width={width} height={height}>
                <CanvasItem x={0} y={0} width={width} height={height}>
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {/* Left panel */}
                        <rect
                            x={16}
                            y={50}
                            width={434}
                            height={476}
                            rx={14}
                            fill={c.bgCard}
                            stroke={red}
                            strokeWidth={2}
                        />
                        {/* Right panel */}
                        <rect
                            x={470}
                            y={50}
                            width={434}
                            height={476}
                            rx={14}
                            fill={c.bgCard}
                            stroke={green}
                            strokeWidth={2}
                        />

                        {/* Plot backgrounds */}
                        <rect
                            x={leftPlotX}
                            y={plotY}
                            width={plotW}
                            height={plotH}
                            rx={8}
                            fill={c.bgSubtle}
                            stroke={c.borderLight}
                            strokeWidth={1.25}
                        />
                        <rect
                            x={rightPlotX}
                            y={plotY}
                            width={plotW}
                            height={plotH}
                            rx={8}
                            fill={c.bgSubtle}
                            stroke={c.borderLight}
                            strokeWidth={1.25}
                        />

                        {drawGrid(leftPlotX, 'lg')}
                        {drawGrid(rightPlotX, 'rg')}

                        {/* LEFT: Unfiltered top-3 capture ellipse (radius 1.15 in data units) */}
                        <ellipse
                            cx={mapX(QUERY.x, leftPlotX)}
                            cy={mapY(QUERY.y)}
                            rx={1.15 * rScaleX}
                            ry={1.15 * rScaleY}
                            fill={withColorAlpha(warm, 0.16)}
                            stroke={warm}
                            strokeWidth={2.5}
                            strokeDasharray="6 4"
                        />

                        {/* LEFT: Points */}
                        {POINTS.map((p) => {
                            const cx = mapX(p.x, leftPlotX)
                            const cy = mapY(p.y)
                            const dropped = p.id === 'us-1' || p.id === 'us-2'
                            const kept = p.id === 'eu-1'
                            return (
                                <g key={`lp-${p.id}`}>
                                    {kept && (
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={13}
                                            fill="none"
                                            stroke={green}
                                            strokeWidth={2.5}
                                        />
                                    )}
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={p.eu ? 7.5 : 6.5}
                                        fill={p.eu ? green : c.textMuted}
                                        opacity={p.eu || dropped ? 1 : 0.45}
                                        stroke={c.bgCard}
                                        strokeWidth={1.5}
                                    />
                                    {dropped && (
                                        <g>
                                            <line
                                                x1={cx - 8}
                                                y1={cy - 8}
                                                x2={cx + 8}
                                                y2={cy + 8}
                                                stroke={red}
                                                strokeWidth={2.5}
                                            />
                                            <line
                                                x1={cx + 8}
                                                y1={cy - 8}
                                                x2={cx - 8}
                                                y2={cy + 8}
                                                stroke={red}
                                                strokeWidth={2.5}
                                            />
                                        </g>
                                    )}
                                </g>
                            )
                        })}

                        {/* LEFT: Query diamond */}
                        <polygon
                            points={`${mapX(QUERY.x, leftPlotX)},${mapY(QUERY.y) - 9} ${mapX(QUERY.x, leftPlotX) + 9},${mapY(QUERY.y)} ${mapX(QUERY.x, leftPlotX)},${mapY(QUERY.y) + 9} ${mapX(QUERY.x, leftPlotX) - 9},${mapY(QUERY.y)}`}
                            fill={cyan}
                            stroke={c.bgCard}
                            strokeWidth={2}
                        />

                        {/* RIGHT: Pre-filtered / ACORN capture ellipse (radius 3.25) */}
                        <ellipse
                            cx={mapX(QUERY.x, rightPlotX)}
                            cy={mapY(QUERY.y)}
                            rx={3.15 * rScaleX}
                            ry={3.15 * rScaleY}
                            fill={withColorAlpha(green, 0.08)}
                            stroke={green}
                            strokeWidth={2}
                            strokeDasharray="6 4"
                        />

                        {/* RIGHT: ACORN multi-hop traversal edges between eligible EU nodes */}
                        {acornHops.map(([aId, bId], idx) => {
                            const a = byId[aId]
                            const b = byId[bId]
                            const x1 = mapX(a.x, rightPlotX)
                            const y1 = mapY(a.y)
                            const x2 = mapX(b.x, rightPlotX)
                            const y2 = mapY(b.y)
                            const dx = x2 - x1
                            const dy = y2 - y1
                            const len = Math.hypot(dx, dy)
                            const ux = dx / len
                            const uy = dy / len
                            const ex = x2 - ux * 13
                            const ey = y2 - uy * 13
                            const px = -uy
                            const py = ux
                            return (
                                <g key={`hop-${idx}`}>
                                    <line
                                        x1={x1 + ux * 10}
                                        y1={y1 + uy * 10}
                                        x2={ex}
                                        y2={ey}
                                        stroke={green}
                                        strokeWidth={2.5}
                                    />
                                    <polygon
                                        points={`${ex + ux * 4},${ey + uy * 4} ${ex - ux * 6 + px * 4.5},${ey - uy * 6 + py * 4.5} ${ex - ux * 6 - px * 4.5},${ey - uy * 6 - py * 4.5}`}
                                        fill={green}
                                    />
                                </g>
                            )
                        })}

                        {/* RIGHT: Points (US dimmed/skipped, EU vibrant + top-3 rings) */}
                        {POINTS.map((p) => {
                            const cx = mapX(p.x, rightPlotX)
                            const cy = mapY(p.y)
                            const selected = p.id === 'eu-1' || p.id === 'eu-2' || p.id === 'eu-3'
                            return (
                                <g key={`rp-${p.id}`}>
                                    {selected && (
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={13}
                                            fill="none"
                                            stroke={green}
                                            strokeWidth={2.5}
                                        />
                                    )}
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={p.eu ? 7.5 : 5.5}
                                        fill={p.eu ? green : c.textMuted}
                                        opacity={p.eu ? 1 : 0.25}
                                        stroke={c.bgCard}
                                        strokeWidth={1.5}
                                    />
                                </g>
                            )
                        })}

                        {/* RIGHT: Query diamond */}
                        <polygon
                            points={`${mapX(QUERY.x, rightPlotX)},${mapY(QUERY.y) - 9} ${mapX(QUERY.x, rightPlotX) + 9},${mapY(QUERY.y)} ${mapX(QUERY.x, rightPlotX)},${mapY(QUERY.y) + 9} ${mapX(QUERY.x, rightPlotX) - 9},${mapY(QUERY.y)}`}
                            fill={cyan}
                            stroke={c.bgCard}
                            strokeWidth={2}
                        />

                        {/* Result slots beneath LEFT plot: [eu-1] [empty] [empty] */}
                        {[0, 1, 2].map((s) => (
                            <rect
                                key={`lslot-${s}`}
                                x={48 + s * 124}
                                y={456}
                                width={114}
                                height={44}
                                rx={8}
                                fill={s === 0 ? withColorAlpha(green, 0.2) : c.bgSubtle}
                                stroke={s === 0 ? green : red}
                                strokeWidth={2}
                                strokeDasharray={s === 0 ? undefined : '5 4'}
                            />
                        ))}

                        {/* Result slots beneath RIGHT plot: [eu-1] [eu-2] [eu-3] */}
                        {[0, 1, 2].map((s) => (
                            <rect
                                key={`rslot-${s}`}
                                x={504 + s * 124}
                                y={456}
                                width={114}
                                height={44}
                                rx={8}
                                fill={withColorAlpha(green, 0.2)}
                                stroke={green}
                                strokeWidth={2}
                            />
                        ))}
                    </svg>
                </CanvasItem>

                {/* Shared top legend */}
                <CanvasItem x={16} y={10} width={888} height={32}>
                    <DiagramLegend
                        c={c}
                        title="Filter: region = EU · k = 3"
                        items={[
                            { label: 'Query q', color: cyan, style: 'dot' },
                            { label: 'Eligible (EU)', color: green, style: 'dot' },
                            { label: 'Excluded (US)', color: c.textMuted, style: 'dot' },
                            { label: 'Dropped / underfill', color: red, style: 'dashed' },
                        ]}
                    />
                </CanvasItem>

                {/* Left header */}
                <CanvasItem x={34} y={62} width={398} height={24}>
                    <TextLabel
                        c={c}
                        text="Post-Filtering · Fixed top-3 ANN disk"
                        fontSize={18}
                        fontWeight={800}
                        color={red}
                    />
                </CanvasItem>
                <CanvasItem x={34} y={88} width={398} height={20}>
                    <TextLabel
                        c={c}
                        text="Top-3 grabs us-1, us-2 -> filter drops 2/3"
                        fontSize={13}
                        color={c.textSecondary}
                    />
                </CanvasItem>

                {/* Right header */}
                <CanvasItem x={488} y={62} width={398} height={24}>
                    <TextLabel
                        c={c}
                        text="Pre-Filtered / ACORN Traversal"
                        fontSize={18}
                        fontWeight={800}
                        color={green}
                    />
                </CanvasItem>
                <CanvasItem x={488} y={88} width={398} height={20}>
                    <TextLabel
                        c={c}
                        text="Skips US nodes; hops directly across EU neighbors"
                        fontSize={13}
                        color={c.textSecondary}
                    />
                </CanvasItem>

                {/* Point labels on LEFT plot */}
                {POINTS.filter((p) => ['eu-1', 'eu-2', 'eu-3', 'us-1', 'us-2'].includes(p.id)).map(
                    (p) => (
                        <CanvasItem
                            key={`ll-${p.id}`}
                            x={mapX(p.x, leftPlotX) + p.lx}
                            y={mapY(p.y) + p.ly}
                            width={48}
                            height={18}
                        >
                            <TextLabel
                                c={c}
                                text={p.id}
                                fontSize={12}
                                fontWeight={700}
                                mono
                                color={p.eu ? green : red}
                            />
                        </CanvasItem>
                    ),
                )}
                <CanvasItem
                    x={mapX(QUERY.x, leftPlotX) - 24}
                    y={mapY(QUERY.y) + 10}
                    width={24}
                    height={18}
                >
                    <TextLabel c={c} text="q" fontSize={14} fontWeight={800} mono color={cyan} align="center" />
                </CanvasItem>

                {/* Point labels on RIGHT plot */}
                {POINTS.filter((p) => p.eu).map((p) => (
                    <CanvasItem
                        key={`rl-${p.id}`}
                        x={mapX(p.x, rightPlotX) + p.lx}
                        y={mapY(p.y) + p.ly}
                        width={48}
                        height={18}
                    >
                        <TextLabel
                            c={c}
                            text={p.id}
                            fontSize={12}
                            fontWeight={800}
                            mono
                            color={green}
                        />
                    </CanvasItem>
                ))}
                <CanvasItem
                    x={mapX(QUERY.x, rightPlotX) - 24}
                    y={mapY(QUERY.y) + 10}
                    width={24}
                    height={18}
                >
                    <TextLabel c={c} text="q" fontSize={14} fontWeight={800} mono color={cyan} align="center" />
                </CanvasItem>

                {/* Left result labels */}
                <CanvasItem x={48} y={422} width={368} height={22}>
                    <TextLabel
                        c={c}
                        text="Returned slots: 1 / 3 (underfilled)"
                        fontSize={15}
                        fontWeight={800}
                        color={red}
                    />
                </CanvasItem>
                {['eu-1', 'empty', 'empty'].map((txt, s) => (
                    <CanvasItem key={`lslt-${s}`} x={48 + s * 124} y={468} width={114} height={22}>
                        <TextLabel
                            c={c}
                            text={txt}
                            fontSize={15}
                            fontWeight={800}
                            mono
                            color={s === 0 ? green : red}
                            align="center"
                        />
                    </CanvasItem>
                ))}

                {/* Right result labels */}
                <CanvasItem x={504} y={422} width={368} height={22}>
                    <TextLabel
                        c={c}
                        text="Returned slots: 3 / 3 (full top-k)"
                        fontSize={15}
                        fontWeight={800}
                        color={green}
                    />
                </CanvasItem>
                {['eu-1', 'eu-2', 'eu-3'].map((txt, s) => (
                    <CanvasItem key={`rslt-${s}`} x={504 + s * 124} y={468} width={114} height={22}>
                        <TextLabel
                            c={c}
                            text={txt}
                            fontSize={15}
                            fontWeight={800}
                            mono
                            color={green}
                            align="center"
                        />
                    </CanvasItem>
                ))}
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
