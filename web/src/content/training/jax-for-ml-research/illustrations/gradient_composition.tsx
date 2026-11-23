import React from 'react'
import { createElement } from 'react'
import {
    BadgePill,
    Board,
    CanvasItem,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 760
export const height = 620
export const preset = 'engineering'
export const alt =
    'At zero parameters, the four regression rows produce per-example gradients [-4, 0, -4], [0, 2, 2], [-2, -2, -2], and [-12, -6, -6] on a shared -12 to +2 scale via vmap(grad). Weight gradients have shape [4, 2] and bias [4]. Averaging gives batch gradients weight=[-4.5, -1.5] and bias=-2.5, yielding updated weights [0.225, 0.075] and bias 0.125 at lr=0.05.'

const rows = [
    { label: 'Row 0', vals: [-4, 0, -4] },
    { label: 'Row 1', vals: [0, 2, 2] },
    { label: 'Row 2', vals: [-2, -2, -2] },
    { label: 'Row 3', vals: [-12, -6, -6] },
]
const comps = ['dw₀', 'dw₁', 'db']
const ticks = [-12, -8, -4, 0, 2]

const illustration = defineIllustration((c) => {
    const tones = [
        getReadableToneColor('blue', c),
        getReadableToneColor('cyan', c),
        getReadableToneColor('purple', c),
    ]
    const sx = (v: number) => 116 + ((v + 12) / 14) * 560
    const zeroX = sx(0)
    const svgBars = createElement(
        'svg',
        { width: 710, height: 315, viewBox: '0 0 710 315' },
        ...ticks.map((tick) =>
            createElement('line', {
                key: tick,
                x1: sx(tick),
                y1: 10,
                x2: sx(tick),
                y2: 274,
                stroke: tick === 0 ? c.textSecondary : c.borderSubtle,
                strokeWidth: tick === 0 ? 2 : 1,
                strokeDasharray: tick === 0 ? undefined : '4 4',
            }),
        ),
        ...rows.flatMap((row, rIdx) =>
            row.vals.map((val, cIdx) => {
                const xVal = sx(val)
                return createElement('rect', {
                    key: `${rIdx}-${cIdx}`,
                    x: Math.min(xVal, zeroX),
                    y: 16 + rIdx * 66 + cIdx * 19,
                    width: Math.max(4, Math.abs(xVal - zeroX)),
                    height: 15,
                    rx: 3,
                    fill: tones[cIdx],
                })
            }),
        ),
    )

    return (
        <Scene
            c={c}
            title="vmap(grad) retains per-example gradients before mean"
            subtitle="Shared scale -12 to +2 across all four regression rows"
            padding={20}
            gap={10}
            contentWidth={720}
        >
            <Column gap={10}>
                <Board c={c} width={710} height={315}>
                    <CanvasItem x={0} y={0} width={710} height={315}>
                        {svgBars}
                    </CanvasItem>
                    {rows.map((row, rIdx) => (
                        <CanvasItem key={row.label} x={4} y={24 + rIdx * 66} width={96} height={32}>
                            <TextLabel
                                c={c}
                                text={row.label}
                                fontSize={23}
                                fontWeight={700}
                                width={96}
                            />
                        </CanvasItem>
                    ))}
                    {ticks.map((tick) => (
                        <CanvasItem key={tick} x={sx(tick) - 28} y={278} width={56} height={32}>
                            <TextLabel
                                c={c}
                                text={String(tick)}
                                fontSize={23}
                                color={c.textSecondary}
                                align="center"
                                width={56}
                            />
                        </CanvasItem>
                    ))}
                </Board>
                <Row gap={12} justify="center">
                    {comps.map((name, i) => (
                        <BadgePill
                            key={name}
                            c={c}
                            text={name}
                            tone={(['blue', 'cyan', 'purple'] as const)[i]}
                            filled
                            fontSize={23}
                            height={38}
                            width={100}
                        />
                    ))}
                </Row>
                <Panel
                    c={c}
                    title="Mean reduction & lr=0.05 step"
                    tone="green"
                    padding={14}
                    titleFontSize={23}
                >
                    <Row gap={12} justify="space-between" align="center">
                        <TextLabel c={c} text="grad: w=[-4.5, -1.5], b=-2.5" fontSize={23} mono />
                        <TextLabel
                            c={c}
                            text="next: w=[0.225, 0.075], b=0.125"
                            fontSize={23}
                            color={c.positive}
                            mono
                        />
                    </Row>
                </Panel>
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
