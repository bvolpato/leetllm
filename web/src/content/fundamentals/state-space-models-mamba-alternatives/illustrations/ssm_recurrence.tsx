import React from 'react'
import { BarChart, Column, Matrix, Panel, Scene, defineIllustration } from 'vizmatic'

export const width = 720
export const height = 690

export const alt =
    'Step-by-step plot and state table of h_t = 0.9 h_{t-1} + 0.2 x_t over x = [3, 1, 4, 2], separating retained 0.9 h_{t-1} carry from incoming 0.2 x_t write to reach h_4 = 1.7194.'

const inputs = [3, 1, 4, 2]
const steps = inputs.reduce<
    Array<{ t: number; x: number; carry: number; write: number; h: number }>
>((acc, x, idx) => {
    const prev = idx === 0 ? 0 : acc[idx - 1].h
    const carry = 0.9 * prev
    const write = 0.2 * x
    const h = carry + write
    acc.push({ t: idx + 1, x, carry, write, h })
    return acc
}, [])

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.2} padding={12} gap={12} background="transparent">
        <Column gap={12} align="stretch">
            <Panel
                c={c}
                title="State growth across steps"
                subtitle="h[t] = 0.9 h[t-1] + 0.2 x[t] (h0 = 0)"
                padding={12}
                gap={6}
            >
                <BarChart
                    c={c}
                    width={650}
                    height={200}
                    min={0}
                    max={2}
                    format="decimal"
                    data={steps.map((s) => ({
                        label: `t=${s.t} (x=${s.x})`,
                        value: s.h,
                        valueLabel: s.h.toFixed(4),
                        color: s.t === 4 ? c.positive : c.info,
                    }))}
                />
            </Panel>

            <Panel
                c={c}
                title="Carry plus incoming write"
                subtitle="Fixed state blends past carry and input"
                padding={12}
                gap={8}
            >
                <Matrix
                    c={c}
                    data={steps.map((s) => [s.carry, s.write, s.h])}
                    labels={steps.map((s) => [
                        s.carry.toFixed(4),
                        s.write.toFixed(2),
                        s.h.toFixed(4),
                    ])}
                    rowLabels={steps.map((s) => `t=${s.t} (x=${s.x})`)}
                    colLabels={['0.9 h[t-1]', '0.2 x[t]', 'h[t]']}
                    rowLabelWidth={136}
                    cellWidth={145}
                    cellHeight={46}
                    fontSize={23}
                    colorize={true}
                    colorScale="strength"
                    colorDomain={[0, 1.8]}
                    highlightCol={2}
                    highlightColor={c.positive}
                />
            </Panel>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
