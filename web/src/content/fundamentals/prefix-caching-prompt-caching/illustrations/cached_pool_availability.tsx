import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    defineIllustration,
    withColorAlpha,
    type ThemeColors,
} from 'vizmatic'

export const width = 840
export const height = 560
export const alt =
    'A 1,000-block KV pool (10 blocks per grid cell) starts with 450 referenced, 400 cached unreferenced, and 150 uncached free blocks. Allocating 200 new blocks consumes all 150 free blocks and evicts 50 cached blocks, leaving 350 cached unreferenced blocks available.'

const FONT = 26

function PoolGridSvg({
    x0,
    y0,
    cell,
    gap,
    states,
    c,
}: {
    x0: number
    y0: number
    cell: number
    gap: number
    states: ('ref' | 'cached' | 'free' | 'new')[]
    c: ThemeColors
}) {
    const colors = {
        ref: {
            fill: withColorAlpha(c.violet, 0.45),
            stroke: c.violetLight,
            dash: undefined,
        },
        cached: {
            fill: withColorAlpha(c.primary, 0.42),
            stroke: c.primaryLight,
            dash: undefined,
        },
        free: {
            fill: withColorAlpha(c.positive, 0.14),
            stroke: c.positiveLight,
            dash: '3 2',
        },
        new: {
            fill: withColorAlpha(c.warning, 0.48),
            stroke: c.warningLight,
            dash: undefined,
        },
    }
    return (
        <g>
            {states.map((st, idx) => {
                const row = Math.floor(idx / 10)
                const col = idx % 10
                const stColor = colors[st]
                return (
                    <rect
                        key={idx}
                        x={x0 + col * (cell + gap)}
                        y={y0 + row * (cell + gap)}
                        width={cell}
                        height={cell}
                        rx={3}
                        fill={stColor.fill}
                        stroke={stColor.stroke}
                        strokeWidth={1.3}
                        strokeDasharray={stColor.dash}
                    />
                )
            })}
        </g>
    )
}

function CachedPoolDiagram({ c }: { c: ThemeColors }) {
    const nowStates = Array.from({ length: 100 }, (_, i) =>
        i < 45 ? 'ref' : i < 85 ? 'cached' : 'free',
    ) as ('ref' | 'cached' | 'free' | 'new')[]
    const afterStates = Array.from({ length: 100 }, (_, i) =>
        i < 45 ? 'ref' : i < 80 ? 'cached' : 'new',
    ) as ('ref' | 'cached' | 'free' | 'new')[]

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={28} y={18} width={784} height={40}>
                <TextLabel
                    c={c}
                    text="Cached blocks remain reclaimable headroom"
                    fontSize={29}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={28} y={60} width={784} height={36}>
                <TextLabel
                    c={c}
                    text="1,000-block KV pool (10/cell): +200 alloc evicts 50"
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={112}
                        width={264}
                        height={302}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <SvgFrame
                        c={c}
                        x={312}
                        y={112}
                        width={264}
                        height={302}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <PoolGridSvg x0={48} y0={164} cell={19} gap={3.6} states={nowStates} c={c} />
                    <PoolGridSvg x0={332} y0={164} cell={19} gap={3.6} states={afterStates} c={c} />
                    <rect
                        x={602}
                        y={128}
                        width={20}
                        height={20}
                        rx={4}
                        fill={withColorAlpha(c.violet, 0.45)}
                        stroke={c.violetLight}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={602}
                        y={174}
                        width={20}
                        height={20}
                        rx={4}
                        fill={withColorAlpha(c.primary, 0.42)}
                        stroke={c.primaryLight}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={602}
                        y={220}
                        width={20}
                        height={20}
                        rx={4}
                        fill={withColorAlpha(c.positive, 0.14)}
                        stroke={c.positiveLight}
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                    />
                    <rect
                        x={602}
                        y={266}
                        width={20}
                        height={20}
                        rx={4}
                        fill={withColorAlpha(c.warning, 0.48)}
                        stroke={c.warningLight}
                        strokeWidth={1.5}
                    />
                </svg>
            </CanvasItem>
            <CanvasItem x={48} y={122} width={224} height={32}>
                <TextLabel c={c} text="Now (550 avail)" fontSize={FONT} fontWeight={700} />
            </CanvasItem>
            <CanvasItem x={332} y={122} width={224} height={32}>
                <TextLabel c={c} text="After +200 alloc" fontSize={FONT} fontWeight={700} />
            </CanvasItem>
            <CanvasItem x={632} y={122} width={186} height={34}>
                <TextLabel c={c} text="Live ref: 450" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={632} y={168} width={186} height={34}>
                <TextLabel c={c} text="Cached: 400" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={632} y={214} width={186} height={34}>
                <TextLabel c={c} text="Free: 150" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={632} y={260} width={186} height={34}>
                <TextLabel c={c} text="New alloc: 200" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={600} y={316} width={220} height={34}>
                <TextLabel
                    c={c}
                    text="350 stay cached"
                    fontSize={FONT}
                    fontWeight={700}
                    color={c.positiveLight}
                />
            </CanvasItem>
            <CanvasItem x={600} y={356} width={220} height={34}>
                <TextLabel c={c} text="50 evicted" fontSize={FONT} color={c.warningLight} />
            </CanvasItem>
            <CanvasItem x={28} y={442} width={784} height={36}>
                <TextLabel
                    c={c}
                    text="85% occupancy still leaves 550 allocatable blocks."
                    fontSize={FONT}
                    fontWeight={700}
                    color={c.primaryLight}
                />
            </CanvasItem>
            <CanvasItem x={28} y={484} width={784} height={36}>
                <TextLabel
                    c={c}
                    text="Report live-referenced and cached-reclaimable capacity apart."
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
        </Board>
    )
}

const illustration = defineIllustration((c) => <CachedPoolDiagram c={c} />)

export const create = illustration.create
export default illustration.default
