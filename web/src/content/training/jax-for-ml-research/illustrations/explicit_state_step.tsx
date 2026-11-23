import React from 'react'
import { createElement } from 'react'
import {
    BadgePill,
    Column,
    GraphDiagram,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 760
export const height = 650
export const preset = 'engineering'
export const alt =
    'A momentum and input-dropout training step receives zero weights, bias, and velocity plus a seed-7 Threefry key. Splitting retains K1 and issues dropout key D0 for the 4x2 mask [[1,0],[1,1],[1,1],[0,0]], rescaled by 1/0.75. Before the update, loss is 3.75 with gradients weight=[-2.0, 0.0] and bias=-2.5. With momentum 0.9 and learning rate 0.05, the step returns updated velocity [-2.0, 0.0] and -2.5, updated parameters [0.1, 0.0] and 0.125, and continuation key K1 while leaving inputs untouched.'

const maskRows = [
    [1, 0],
    [1, 1],
    [1, 1],
    [0, 0],
]

const illustration = defineIllustration((c) => {
    const keepColor = getReadableToneColor('green', c)
    const dropColor = getReadableToneColor('red', c)
    const maskSvg = createElement(
        'svg',
        { width: 92, height: 112, viewBox: '0 0 92 112' },
        ...maskRows.flatMap((row, r) =>
            row.map((cell, col) =>
                createElement('rect', {
                    key: `${r}-${col}`,
                    x: 8 + col * 40,
                    y: 4 + r * 26,
                    width: 34,
                    height: 20,
                    rx: 4,
                    fill: cell ? `${keepColor}cc` : 'transparent',
                    stroke: cell ? keepColor : dropColor,
                    strokeWidth: 2,
                }),
            ),
        ),
    )

    return (
        <Scene
            c={c}
            title="Stateless step consumes inputs and returns new state"
            subtitle="Momentum 0.9 · learning rate 0.05 · dropout keep 0.75"
            padding={20}
            gap={14}
            contentWidth={720}
        >
            <Column gap={14} align="center">
                <GraphDiagram
                    c={c}
                    direction="LR"
                    layout="auto"
                    routing="orthogonal"
                    nodeGap={36}
                    rankGap={70}
                    edgeGap={20}
                    nodeWidth={198}
                    nodeHeight={80}
                    labelFontSize={24}
                    detailFontSize={23}
                    nodes={[
                        { id: 'p', label: 'params', detail: 'w=[0,0], b=0', tone: 'blue' },
                        { id: 'v', label: 'velocity', detail: 'w=[0,0], b=0', tone: 'cyan' },
                        { id: 'k', label: 'key K0', detail: 'Seed 7 Threefry', tone: 'purple' },
                        { id: 'fn', label: 'train_step', detail: 'loss 3.75 · grad', tone: 'warm' },
                        {
                            id: 'np',
                            label: 'next_params',
                            detail: 'w=[0.1,0], b=.125',
                            tone: 'green',
                        },
                        { id: 'nv', label: 'next_vel', detail: 'w=[-2,0], b=-2.5', tone: 'green' },
                        { id: 'nk', label: 'next_key', detail: 'K1 retained', tone: 'purple' },
                    ]}
                    edges={[
                        { from: 'p', to: 'fn', tone: 'blue' },
                        { from: 'v', to: 'fn', tone: 'cyan' },
                        { from: 'k', to: 'fn', tone: 'purple' },
                        { from: 'fn', to: 'np', tone: 'green' },
                        { from: 'fn', to: 'nv', tone: 'green' },
                        { from: 'fn', to: 'nk', tone: 'purple' },
                    ]}
                />
                <Row gap={18} align="center" justify="center">
                    <Panel
                        c={c}
                        title="D0 mask"
                        tone="green"
                        padding={10}
                        width={190}
                        titleFontSize={23}
                    >
                        <Column gap={4} align="center">
                            {maskSvg}
                            <TextLabel
                                c={c}
                                text="scale × 1/0.75"
                                fontSize={23}
                                color={c.textSecondary}
                                align="center"
                            />
                        </Column>
                    </Panel>
                    <Column gap={12}>
                        <BadgePill
                            c={c}
                            text="g_w = [-2.0, 0.0] · g_b = -2.5"
                            tone="warm"
                            filled={false}
                            fontSize={23}
                            height={42}
                            width={480}
                        />
                        <Panel
                            c={c}
                            title="Inputs stay immutable"
                            tone="blue"
                            padding={12}
                            width={480}
                            titleFontSize={23}
                        >
                            <TextLabel
                                c={c}
                                text="x (4,2), y (4,) & old state unchanged"
                                fontSize={23}
                                color={c.textSecondary}
                                mono
                            />
                        </Panel>
                    </Column>
                </Row>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
