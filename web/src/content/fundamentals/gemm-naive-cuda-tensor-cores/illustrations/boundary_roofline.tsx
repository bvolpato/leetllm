import React from 'react'
import {
    AxisPlot,
    BadgePill,
    BarChart,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 1020
export const height = 760
export const alt =
    'A100 80GB SXM hardware roofline on log-log axes alongside source panel-load intensity ratios. Left log-log roofline plots the 2,039 GB/s HBM slope meeting the FP32 ceiling at knee (9.56 FLOP/B, 19.5 TFLOP/s) and the FP16 Tensor Core ceiling at knee (153.0 FLOP/B, 312 TFLOP/s). Right bar chart keeps source panel-load ratios (Scalar 0.25, Shared 4.0, Reg 6.4, WMMA 8.0 FLOP/B) separate from measured HBM bytes.'

const lx = (intensity: number) => Math.log10(intensity / 0.2)
const ly = (tflops: number) => Math.log10(tflops / 0.4)
const bw = 2.039

const illustration = defineIllustration((colors) => {
    const c = withDensity(colors, 3.05)
    return (
        <Scene c={c} padding={14} gap={12}>
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={536}
                    tone="cyan"
                    padding={12}
                    gap={6}
                    title="A100 80GB SXM HBM Roofline"
                    titleFontSize={30}
                >
                    <TextLabel
                        c={c}
                        text="Y: TFLOP/s (log10)  |  X: HBM I (log10 FLOP/B)"
                        fontSize={30}
                        color={c.textMuted}
                    />
                    <AxisPlot
                        c={c}
                        width={508}
                        height={340}
                        xMin={0}
                        xMax={3.3}
                        yMin={0}
                        yMax={3.05}
                        padding={24}
                        showFrame
                        showAxes
                        showGrid
                        gridCount={5}
                        paths={[
                            {
                                color: c.positive,
                                strokeWidth: 4,
                                points: [
                                    { x: lx(0.25), y: ly(bw * 0.25) },
                                    { x: lx(153.0), y: ly(312.0) },
                                    { x: lx(320), y: ly(312.0) },
                                ],
                            },
                            {
                                color: c.warning,
                                strokeWidth: 4,
                                points: [
                                    { x: lx(9.56), y: ly(19.5) },
                                    { x: lx(320), y: ly(19.5) },
                                ],
                            },
                            {
                                color: c.info,
                                strokeWidth: 2,
                                dashed: true,
                                points: [
                                    { x: lx(9.56), y: 0 },
                                    { x: lx(9.56), y: ly(19.5) },
                                ],
                            },
                            {
                                color: c.positive,
                                strokeWidth: 2,
                                dashed: true,
                                points: [
                                    { x: lx(153.0), y: 0 },
                                    { x: lx(153.0), y: ly(312.0) },
                                ],
                            },
                        ]}
                        points={[
                            { x: lx(9.56), y: ly(19.5), fill: c.warning, r: 8 },
                            { x: lx(153.0), y: ly(312.0), fill: c.positive, r: 8 },
                        ]}
                    />
                    <Column gap={6}>
                        <Row gap={8}>
                            <BadgePill
                                c={c}
                                text="2,039 GB/s"
                                tone="cyan"
                                fontSize={30}
                                height={38}
                            />
                            <BadgePill
                                c={c}
                                text="FP32 (9.56, 19.5)"
                                tone="warm"
                                fontSize={30}
                                height={38}
                            />
                        </Row>
                        <BadgePill
                            c={c}
                            text="FP16 TC knee: (153.0, 312)"
                            tone="green"
                            fontSize={30}
                            height={38}
                        />
                    </Column>
                </Panel>

                <Panel
                    c={c}
                    width={442}
                    tone="warm"
                    padding={12}
                    gap={8}
                    title="Panel-Load Ratios (FLOP/B)"
                    titleFontSize={30}
                >
                    <BarChart
                        c={c}
                        width={412}
                        height={380}
                        min={0}
                        max={9.5}
                        showValues
                        data={[
                            { label: 'Scl', value: 0.25, color: c.critical, valueLabel: '0.25' },
                            { label: 'Sm', value: 4.0, color: c.warning, valueLabel: '4.0' },
                            { label: 'Reg', value: 6.4, color: c.info, valueLabel: '6.4' },
                            { label: 'TC', value: 8.0, color: c.positive, valueLabel: '8.0' },
                        ]}
                    />
                    <BadgePill
                        c={c}
                        text="Not measured HBM bytes"
                        tone="neutral"
                        fontSize={30}
                        height={40}
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
