import React from 'react'
import {
    BarChart,
    Column,
    DiagramLegend,
    Panel,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withColorAlpha,
} from 'vizmatic'

export const width = 920
export const height = 500
export const alt =
    'Left bar chart compares HBM element transfers per row: naive 3-pass softmax moves 4N elements (three reads of x plus one write of P), standalone online 2-pass softmax moves 3N elements (two reads of x plus one write of P), and fused SRAM online softmax moves 1N elements in a single streaming pass. Right stacked bars align all three methods on a shared 4N scale, showing how keeping (m, d, O) in SRAM avoids 3N of intermediate HBM traffic.'

const illustration = defineIllustration((c) => {
    const red = getReadableToneColor('red', c)
    const warm = getReadableToneColor('warm', c)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const savedBg = withColorAlpha(c.border, 0.45)

    return (
        <Scene c={c} padding={18} gap={14} contentWidth={884} align="center">
            <Row gap={18} width={884} align="stretch">
                <Panel
                    c={c}
                    title="HBM Traffic per Row (×N)"
                    subtitle="Lower is faster on memory-bound GPUs"
                    tone="blue"
                    width={418}
                    padding={14}
                    gap={10}
                    titleFontSize={19}
                >
                    <BarChart
                        c={c}
                        width={386}
                        height={310}
                        min={0}
                        max={4.5}
                        showGrid
                        showValues
                        yAxisLabel="HBM trips (×N)"
                        format={(v) => `${v}N`}
                        data={[
                            { label: 'Naive 3-pass', value: 4, valueLabel: '4N', color: red },
                            { label: 'Online 2-pass', value: 3, valueLabel: '3N', color: warm },
                            { label: 'Fused SRAM', value: 1, valueLabel: '1N', color: green },
                        ]}
                    />
                    <TextLabel
                        c={c}
                        text="4× less HBM I/O vs naive 3-pass"
                        fontSize={14}
                        fontWeight={700}
                        color={green}
                        align="center"
                    />
                </Panel>

                <Panel
                    c={c}
                    title="Pass-by-Pass HBM Breakdown"
                    subtitle="Aligned on a shared 4N transfer budget"
                    tone="green"
                    width={448}
                    padding={14}
                    gap={12}
                    titleFontSize={19}
                >
                    <Column gap={5} width={416}>
                        <TextLabel
                            c={c}
                            text="Naive 3-pass · 4N HBM"
                            fontSize={15}
                            fontWeight={700}
                            color={red}
                        />
                        <StackedBar
                            c={c}
                            width={416}
                            height={40}
                            showLegend={false}
                            segments={[
                                { label: 'Read m', value: 1, valueLabel: 'Rd x (m)', color: blue },
                                { label: 'Read d', value: 1, valueLabel: 'Rd x (d)', color: blue },
                                { label: 'Read p', value: 1, valueLabel: 'Rd x', color: blue },
                                { label: 'Write P', value: 1, valueLabel: 'Wr P', color: red },
                            ]}
                        />
                    </Column>

                    <Column gap={5} width={416}>
                        <TextLabel
                            c={c}
                            text="Standalone Online · 3N HBM"
                            fontSize={15}
                            fontWeight={700}
                            color={warm}
                        />
                        <StackedBar
                            c={c}
                            width={416}
                            height={40}
                            showLegend={false}
                            segments={[
                                { label: 'Read m,d', value: 1, valueLabel: 'Rd x (m,d)', color: warm },
                                { label: 'Read x', value: 1, valueLabel: 'Rd x', color: blue },
                                { label: 'Write P', value: 1, valueLabel: 'Wr P', color: red },
                                { label: 'Saved', value: 1, valueLabel: '−1N', color: savedBg },
                            ]}
                        />
                    </Column>

                    <Column gap={5} width={416}>
                        <TextLabel
                            c={c}
                            text="Fused Online (Flash) · 1N HBM"
                            fontSize={15}
                            fontWeight={700}
                            color={green}
                        />
                        <StackedBar
                            c={c}
                            width={416}
                            height={40}
                            showLegend={false}
                            segments={[
                                { label: 'SRAM', value: 1, valueLabel: '1× SRAM', color: green },
                                {
                                    label: 'Avoided',
                                    value: 3,
                                    valueLabel: '3N HBM traffic avoided',
                                    color: savedBg,
                                },
                            ]}
                        />
                    </Column>

                    <DiagramLegend
                        c={c}
                        items={[
                            { label: 'Read HBM', color: blue, style: 'swatch' },
                            { label: 'Fused (m,d)', color: warm, style: 'swatch' },
                            { label: 'Write P', color: red, style: 'swatch' },
                            { label: 'SRAM tile', color: green, style: 'swatch' },
                        ]}
                    />

                    <TextLabel
                        c={c}
                        text="O' = O · exp(m₁ − m₂) + exp(x − m₂) · V"
                        fontSize={13}
                        fontWeight={600}
                        color={c.textSecondary}
                        mono
                        align="center"
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
