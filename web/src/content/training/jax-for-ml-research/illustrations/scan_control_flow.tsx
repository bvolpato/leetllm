import React from 'react'
import {
    AxisPlot,
    BadgePill,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const width = 760
export const height = 600
export const preset = 'engineering'
export const alt =
    'Trajectories compare dynamic lax.while_loop (double while < 8) against 3-step lax.scan (always 3 doublings). At input 1 both reach [1, 2, 4, 8]. At input 3, while_loop stops at [3, 6, 12] after two steps, while scan continues to [3, 6, 12, 24]. Fixed-length scan multiplies three x2 factors for reverse-mode derivative 8, whereas dynamic while_loop does not support reverse-mode differentiation.'

const illustration = defineIllustration((c) => (
    <Scene
        c={c}
        title="Fixed scan differentiates across steps; while_loop stops early"
        subtitle="Doubling state from x₀ = 1 vs x₀ = 3 across step indices 0 to 3"
        padding={20}
        gap={12}
        contentWidth={720}
    >
        <Row gap={18} align="center">
            <Column gap={6} align="center" width={400}>
                <Row gap={8} justify="space-between" width={380}>
                    <TextLabel c={c} text="state (0..24)" fontSize={23} color={c.textSecondary} />
                    <TextLabel c={c} text="max = 24" fontSize={23} color={c.positive} mono />
                </Row>
                <AxisPlot
                    c={c}
                    width={390}
                    height={330}
                    xMin={-0.2}
                    xMax={3.3}
                    yMin={0}
                    yMax={26}
                    padding={28}
                    showGrid
                    gridCount={4}
                    paths={[
                        {
                            points: [
                                { x: 0, y: 1 },
                                { x: 1, y: 2 },
                                { x: 2, y: 4 },
                                { x: 3, y: 8 },
                            ],
                            tone: 'cyan',
                            strokeWidth: 4,
                        },
                        {
                            points: [
                                { x: 0, y: 3 },
                                { x: 1, y: 6 },
                                { x: 2, y: 12 },
                                { x: 3, y: 24 },
                            ],
                            tone: 'green',
                            strokeWidth: 4,
                        },
                        {
                            points: [
                                { x: 0, y: 3 },
                                { x: 1, y: 6 },
                                { x: 2, y: 12 },
                            ],
                            tone: 'warm',
                            strokeWidth: 6,
                            opacity: 0.7,
                        },
                    ]}
                    points={[
                        { x: 3, y: 8, tone: 'cyan', r: 8 },
                        { x: 2, y: 12, tone: 'warm', r: 10 },
                        { x: 3, y: 24, tone: 'green', r: 9 },
                    ]}
                />
                <TextLabel
                    c={c}
                    text="step index: 0 → 1 → 2 → 3"
                    fontSize={23}
                    color={c.textSecondary}
                    align="center"
                />
            </Column>
            <Column gap={12} width={302}>
                <Panel
                    c={c}
                    title="x₀ = 1 (both match)"
                    tone="cyan"
                    padding={12}
                    titleFontSize={23}
                >
                    <TextLabel c={c} text="1 → 2 → 4 → 8" fontSize={23} mono />
                </Panel>
                <Panel
                    c={c}
                    title="x₀ = 3 · while_loop"
                    tone="warm"
                    padding={12}
                    titleFontSize={23}
                >
                    <TextLabel c={c} text="3 → 6 → 12 (stops)" fontSize={23} mono />
                    <TextLabel
                        c={c}
                        text="No reverse-mode AD"
                        fontSize={23}
                        color={c.textSecondary}
                    />
                </Panel>
                <Panel c={c} title="x₀ = 3 · lax.scan" tone="green" padding={12} titleFontSize={23}>
                    <TextLabel c={c} text="3 → 6 → 12 → 24" fontSize={23} mono />
                    <BadgePill
                        c={c}
                        text="grad: 2×2×2 = 8"
                        tone="green"
                        filled
                        fontSize={23}
                        height={42}
                        width={254}
                    />
                </Panel>
            </Column>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
