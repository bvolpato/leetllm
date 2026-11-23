import React from 'react'
import {
    Canvas,
    Column,
    Panel,
    Row,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
} from 'vizmatic'
import type { ThemeColors, ThemeMode } from 'vizmatic'

export const width = 760
export const height = 470
export const alt =
    'Visibility grids for three Transformer families, where rows are queries and columns are keys. Encoder-only self-attention fills all sixteen cells. Decoder-only self-attention is lower triangular. An encoder-decoder model pairs causal target self-attention with full cross-attention so each target query reads every source position.'

function MaskGrid({
    cols,
    causal,
    color,
    fill,
    c,
}: {
    cols: number
    causal: boolean
    color: string
    fill: string
    c: ThemeColors
}) {
    const step = 30
    const size = 25
    const w = cols * step
    const h = 4 * step
    const cells: React.ReactNode[] = []
    for (let r = 0; r < 4; r++) {
        for (let col = 0; col < cols; col++) {
            const visible = !causal || col <= r
            cells.push(
                <rect
                    key={`${r}-${col}`}
                    x={col * step + 1}
                    y={r * step + 1}
                    width={size}
                    height={size}
                    rx={3}
                    fill={visible ? fill : 'none'}
                    stroke={visible ? color : c.borderSubtle}
                    strokeWidth={1.5}
                />,
            )
        }
    }
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
            {cells}
        </svg>
    )
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const blueFill = getToneFill('blue', c)
    const warmFill = getToneFill('warm', c)
    const greenFill = getToneFill('green', c)

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Column gap={10} width={740}>
                <Row gap={10} wrap={false} align="stretch">
                    <Panel
                        title="Encoder-only"
                        titleFontSize={24}
                        c={c}
                        width={186}
                        padding={12}
                        gap={8}
                        tone="blue"
                    >
                        <Column gap={8} align="center">
                            <MaskGrid cols={4} causal={false} color={blue} fill={blueFill} c={c} />
                            <TextLabel
                                c={c}
                                text="All keys visible"
                                fontSize={23}
                                color={blue}
                                align="center"
                                width={160}
                                math={false}
                            />
                        </Column>
                    </Panel>

                    <Panel
                        title="Decoder-only"
                        titleFontSize={24}
                        c={c}
                        width={186}
                        padding={12}
                        gap={8}
                        tone="warm"
                    >
                        <Column gap={8} align="center">
                            <MaskGrid cols={4} causal={true} color={warm} fill={warmFill} c={c} />
                            <TextLabel
                                c={c}
                                text="Causal (k <= q)"
                                fontSize={23}
                                color={warm}
                                align="center"
                                width={160}
                                math={false}
                            />
                        </Column>
                    </Panel>

                    <Panel
                        title="Encoder-decoder (target + cross)"
                        titleFontSize={24}
                        c={c}
                        width={348}
                        padding={12}
                        gap={8}
                        tone="green"
                    >
                        <Row gap={14} wrap={false} align="center" justify="space-between">
                            <Column gap={8} align="center">
                                <MaskGrid
                                    cols={4}
                                    causal={true}
                                    color={warm}
                                    fill={warmFill}
                                    c={c}
                                />
                                <TextLabel
                                    c={c}
                                    text="Target self"
                                    fontSize={23}
                                    color={warm}
                                    align="center"
                                    width={132}
                                    math={false}
                                />
                            </Column>
                            <Column gap={8} align="center">
                                <MaskGrid
                                    cols={5}
                                    causal={false}
                                    color={green}
                                    fill={greenFill}
                                    c={c}
                                />
                                <TextLabel
                                    c={c}
                                    text="Cross to src"
                                    fontSize={23}
                                    color={green}
                                    align="center"
                                    width={160}
                                    math={false}
                                />
                            </Column>
                        </Row>
                    </Panel>
                </Row>
                <TextLabel
                    c={c}
                    text="Rows are query positions and columns are key positions."
                    fontSize={23}
                    color={c.textSecondary}
                    align="center"
                    width={740}
                    math={false}
                />
            </Column>
        </Canvas>
    )
}

export default create('dark')
