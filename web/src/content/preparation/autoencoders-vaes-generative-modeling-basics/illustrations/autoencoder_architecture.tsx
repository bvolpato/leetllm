import React from 'react'
import {
    AxisPlot,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const width = 880
export const height = 760
export const alt =
    'Side-by-side comparison of deterministic autoencoder codes and a variational autoencoder posterior in a 2D latent plane relative to standard normal prior contours: the deterministic autoencoder places isolated points at (-1.8, 1.2) and (1.7, -1.3) leaving (0, 0) empty, whereas the VAE places a posterior centered at mu=[0.4, -0.2] with standard deviation [0.705, 1.051] and draws z=[0.752, -1.251] inside the prior.'

function circlePoints(cx: number, cy: number, rx: number, ry: number, steps = 64) {
    const pts: Array<{ x: number; y: number }> = []
    for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI * 2
        pts.push({ x: cx + rx * Math.cos(theta), y: cy + ry * Math.sin(theta) })
    }
    return pts
}

const illustration = defineIllustration((raw: ThemeColors) => {
    const c = withDensity(raw, 2.65)
    const prior1 = circlePoints(0, 0, 1, 1)
    const prior2 = circlePoints(0, 0, 2, 2)
    const posterior1 = circlePoints(0.4, -0.2, 0.705, 1.051)

    return (
        <Scene c={c} padding={12} gap={12}>
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    title="Deterministic Autoencoder"
                    subtitle="Codes scatter outside N(0, I)"
                    width={420}
                    padding={12}
                    tone="critical"
                    footer={
                        <TextLabel
                            c={c}
                            text="(-1.8, 1.2), (1.7, -1.3) | Dead (0, 0)"
                            fontSize={27}
                            color={c.textSecondary}
                            mono
                        />
                    }
                >
                    <Column gap={6} align="center">
                        <AxisPlot
                            c={c}
                            width={392}
                            height={340}
                            xMin={-2.4}
                            xMax={2.4}
                            yMin={-2.4}
                            yMax={2.4}
                            showFrame
                            showAxes
                            showGrid
                            gridCount={4}
                            xAxisLabel="z₁"
                            yAxisLabel="z₂"
                            paths={[
                                {
                                    points: prior1,
                                    color: c.border,
                                    strokeWidth: 1.5,
                                    dashed: true,
                                    opacity: 0.9,
                                },
                                {
                                    points: prior2,
                                    color: c.borderSubtle,
                                    strokeWidth: 1.5,
                                    dashed: true,
                                    opacity: 0.9,
                                },
                            ]}
                            points={[
                                { x: -1.8, y: 1.2, tone: 'blue', r: 7 },
                                { x: 1.7, y: -1.3, tone: 'purple', r: 7 },
                                {
                                    x: 0,
                                    y: 0,
                                    tone: 'critical',
                                    r: 7,
                                    stroke: c.bg,
                                    strokeWidth: 2,
                                },
                            ]}
                        />
                    </Column>
                </Panel>
                <Panel
                    c={c}
                    title="Variational Autoencoder"
                    subtitle="KL pulls q(z | x) into prior"
                    width={420}
                    padding={12}
                    tone="green"
                    footer={
                        <TextLabel
                            c={c}
                            text="mu=[0.4,-0.2] -> z=[0.75,-1.25]"
                            fontSize={27}
                            color={c.textSecondary}
                            mono
                        />
                    }
                >
                    <Column gap={6} align="center">
                        <AxisPlot
                            c={c}
                            width={392}
                            height={340}
                            xMin={-2.4}
                            xMax={2.4}
                            yMin={-2.4}
                            yMax={2.4}
                            showFrame
                            showAxes
                            showGrid
                            gridCount={4}
                            xAxisLabel="z₁"
                            yAxisLabel="z₂"
                            paths={[
                                {
                                    points: prior1,
                                    color: c.border,
                                    strokeWidth: 1.5,
                                    dashed: true,
                                    opacity: 0.9,
                                },
                                {
                                    points: prior2,
                                    color: c.borderSubtle,
                                    strokeWidth: 1.5,
                                    dashed: true,
                                    opacity: 0.9,
                                },
                                {
                                    points: posterior1,
                                    tone: 'blue',
                                    strokeWidth: 2.5,
                                    opacity: 0.95,
                                },
                            ]}
                            vectors={[
                                {
                                    x1: 0.4,
                                    y1: -0.2,
                                    x2: 0.752,
                                    y2: -1.251,
                                    tone: 'green',
                                    strokeWidth: 2.5,
                                    arrow: true,
                                    arrowSize: 7,
                                    showStartDot: true,
                                },
                            ]}
                            points={[
                                { x: 0.4, y: -0.2, tone: 'purple', r: 6.5 },
                                { x: 0.752, y: -1.251, tone: 'green', r: 7 },
                            ]}
                        />
                    </Column>
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
