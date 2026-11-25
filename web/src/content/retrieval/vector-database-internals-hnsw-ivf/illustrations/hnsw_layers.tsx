import React from 'react'
import {
    Board,
    Box,
    CanvasItem,
    FlowArrow,
    GraphDiagram,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'
export { createFilm } from './_parts/hnsw-film'

export const width = 680
export const height = 840
export const preset = 'engineering'
export const alt =
    'Constructed HNSW search descends through three layers while preserving the same vector ID: entry v7 routes to v4 on Layer 2, v4 descends into Layer 1 and routes to v6, and v6 descends into Layer 0 where v8 and v3 are inspected as neighbors. The solid links show greedy hops and dashed links show same-ID descents. A separate min-heap expands the closest unexpanded candidate first; a max-heap retains at most ef_search results. The expansion queue or visited set can exceed that result limit.'

function label(
    c: ThemeColors,
    text: string,
    x: number,
    y: number,
    labelWidth: number,
    fontSize = 24,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    weight = 650,
) {
    return (
        <CanvasItem x={x} y={y} width={labelWidth} height={Math.ceil(fontSize * 1.45)}>
            <TextLabel
                c={c}
                text={text}
                width="100%"
                fontSize={fontSize}
                fontWeight={weight}
                color={color}
                align={align}
            />
        </CanvasItem>
    )
}

const illustration = defineIllustration((colors) => {
    const c = { ...colors, shadow: 'transparent' }
    const route = getReadableToneColor('purple', c)
    const descend = getReadableToneColor('cyan', c)
    const explore = getReadableToneColor('blue', c)
    const retain = getReadableToneColor('green', c)

    return (
        <Scene
            c={c}
            padding={0}
            gap={0}
            contentWidth={width}
            title="HNSW descent keeps the same vector ID"
        >
            <Board c={c} width={width} height={height}>
                {label(
                    c,
                    'HNSW keeps the same ID across layers',
                    22,
                    12,
                    636,
                    27,
                    c.textPrimary,
                    'left',
                    800,
                )}
                {label(
                    c,
                    'Base-layer search separates expansion from retention.',
                    22,
                    52,
                    636,
                    22,
                    c.textSecondary,
                )}

                {label(c, 'Layer 2', 12, 128, 104, 24, route, 'center', 750)}
                {label(c, 'Layer 1', 12, 250, 104, 24, route, 'center', 750)}
                {label(c, 'Layer 0', 12, 376, 104, 24, route, 'center', 750)}
                <CanvasItem x={92} y={88} width={556} height={432}>
                    <GraphDiagram
                        c={c}
                        width={556}
                        height={432}
                        layout="manual"
                        nodeWidth={82}
                        nodeHeight={60}
                        labelFontSize={24}
                        arrowSize={5}
                        padding={18}
                        nodes={[
                            { id: 'l2-v7', label: 'v₇', x: 0.13, y: 0.11, tone: 'neutral' },
                            { id: 'l2-v4', label: 'v₄', x: 0.5, y: 0.11, tone: 'purple' },
                            { id: 'l1-v4', label: 'v₄', x: 0.5, y: 0.4, tone: 'purple' },
                            { id: 'l1-v6', label: 'v₆', x: 0.84, y: 0.4, tone: 'blue' },
                            { id: 'l0-v6', label: 'v₆', x: 0.84, y: 0.73, tone: 'cyan' },
                            { id: 'l0-v8', label: 'v₈', x: 0.5, y: 0.73, tone: 'green' },
                            { id: 'l0-v3', label: 'v₃', x: 0.5, y: 0.93, tone: 'green' },
                        ]}
                        edges={[
                            { from: 'l2-v7', to: 'l2-v4', tone: 'purple' },
                            { from: 'l2-v4', to: 'l1-v4', tone: 'purple', dashed: true },
                            { from: 'l1-v4', to: 'l1-v6', tone: 'blue' },
                            { from: 'l1-v6', to: 'l0-v6', tone: 'cyan', dashed: true },
                            { from: 'l0-v6', to: 'l0-v8', tone: 'green' },
                            { from: 'l0-v6', to: 'l0-v3', tone: 'green' },
                        ]}
                        ariaLabel="Three-layer HNSW route with same-ID vertical descents and two inspected base-layer neighbors."
                    />
                </CanvasItem>

                <CanvasItem x={30} y={528} width={36} height={34}>
                    <FlowArrow c={c} direction="right" length={28} tone="purple" />
                </CanvasItem>
                {label(c, 'greedy hop', 72, 530, 218, 22, route, 'left', 700)}
                <CanvasItem x={336} y={528} width={34} height={34}>
                    <FlowArrow c={c} direction="down" length={25} tone="cyan" />
                </CanvasItem>
                {label(c, 'same ID · descend', 378, 530, 270, 22, descend, 'left', 700)}

                {label(
                    c,
                    'Layer 0: expand and retain are separate operations',
                    22,
                    576,
                    636,
                    25,
                    c.textPrimary,
                    'left',
                    800,
                )}
                <CanvasItem x={32} y={616} width={296} height={78}>
                    <Box
                        c={c}
                        color="info"
                        width={296}
                        height={78}
                        fontSize={24}
                        label="Candidate queue"
                        outlined
                    />
                </CanvasItem>
                <CanvasItem x={352} y={616} width={296} height={78}>
                    <Box
                        c={c}
                        color="positive"
                        width={296}
                        height={78}
                        fontSize={24}
                        label="Result set"
                        outlined
                    />
                </CanvasItem>
                {label(c, 'Min-heap · expand closest', 32, 704, 296, 22, explore, 'center', 650)}
                {label(c, 'Max-heap · cap ef_search', 352, 704, 296, 22, retain, 'center', 650)}
                {label(
                    c,
                    'Visited nodes can outnumber retained results.',
                    22,
                    752,
                    636,
                    23,
                    c.textSecondary,
                    'left',
                    700,
                )}
                {label(
                    c,
                    'Return up to k items from retained Results.',
                    22,
                    788,
                    636,
                    23,
                    c.textPrimary,
                    'left',
                    750,
                )}
            </Board>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
