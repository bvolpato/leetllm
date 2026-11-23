import React from 'react'
import {
    BarChart,
    Column,
    Matrix,
    Panel,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const width = 780
export const height = 815

export const alt =
    'Four-step selective update trace on x = [3, 1, 4, 2] showing stacked carry versus write terms summing to state h_t, a table of input-dependent Delta_t, decay factor a_bar, state h_t, and readout weight C_t, and a full-width bar chart of modulated outputs y_t = C_t h_t.'

const softplus = (z: number) => Math.log(1 + Math.exp(z))
const inputs = [3, 1, 4, 2]
const trace = inputs.reduce<
    Array<{
        t: number
        x: number
        delta: number
        aBar: number
        carry: number
        write: number
        h: number
        cWeight: number
        y: number
    }>
>((acc, x, idx) => {
    const prev = idx === 0 ? 0 : acc[idx - 1].h
    const delta = softplus(-1 + 0.3 * x)
    const aBar = Math.exp(-delta)
    const carry = aBar * prev
    const write = delta * 0.1 * x * x
    const h = carry + write
    const cWeight = 1 + 0.05 * x
    acc.push({ t: idx + 1, x, delta, aBar, carry, write, h, cWeight, y: cWeight * h })
    return acc
}, [])

const maxScale = 1.65

const illustration = defineIllustration((c) => (
    <Scene c={c} density={2.3} padding={8} gap={6} background="transparent">
        <Column gap={6} align="stretch">
            <Panel c={c} title="Carry vs write decomposition (0 to 1.65)" padding={8} gap={4}>
                <Column gap={4}>
                    {trace.map((row) => (
                        <Row key={row.t} gap={10} align="center">
                            <TextLabel
                                c={c}
                                text={`t=${row.t} (x=${row.x})`}
                                width={136}
                                fontSize={23}
                                mono
                            />
                            <StackedBar
                                c={c}
                                width={560}
                                height={26}
                                showLegend={false}
                                segments={[
                                    {
                                        label: 'Carry',
                                        value: row.carry,
                                        valueLabel: row.carry.toFixed(2),
                                        color: c.info,
                                    },
                                    {
                                        label: 'Write',
                                        value: row.write,
                                        valueLabel: row.write.toFixed(2),
                                        color: c.positive,
                                    },
                                    {
                                        label: 'Headroom',
                                        value: Math.max(0.01, maxScale - row.h),
                                        valueLabel: '',
                                        color: c.bgHover,
                                    },
                                ]}
                            />
                        </Row>
                    ))}
                    <Row gap={18} align="center">
                        <TextLabel c={c} text="Carry = a_bar h[t-1]" color={c.info} fontSize={23} />
                        <TextLabel
                            c={c}
                            text="Write = Delta B x[t]"
                            color={c.positive}
                            fontSize={23}
                        />
                        <TextLabel c={c} text="Cap = 1.65" color={c.textMuted} fontSize={23} />
                    </Row>
                </Column>
            </Panel>

            <Panel c={c} title="Parameters & state (a_bar = exp(-Delta))" padding={8} gap={4}>
                <Matrix
                    c={c}
                    data={trace.map((r) => [r.x / 4, r.delta, r.aBar, r.cWeight - 1, r.h])}
                    labels={trace.map((r) => [
                        `${r.x}`,
                        r.delta.toFixed(2),
                        r.aBar.toFixed(2),
                        r.cWeight.toFixed(2),
                        r.h.toFixed(3),
                    ])}
                    rowLabels={trace.map((r) => `t=${r.t}`)}
                    colLabels={['x[t]', 'Delta', 'a_bar', 'C[t]', 'h[t]']}
                    rowLabelWidth={64}
                    cellWidth={128}
                    cellHeight={26}
                    fontSize={23}
                    colorize={true}
                    colorScale="strength"
                    colorDomain={[0, 1.6]}
                />
            </Panel>

            <Panel c={c} title="Modulated readout y[t] = C[t] h[t]" padding={8} gap={4}>
                <BarChart
                    c={c}
                    width={720}
                    height={205}
                    min={0}
                    max={2}
                    format="decimal"
                    data={trace.map((r) => ({
                        label: `t=${r.t} (y${r.t})`,
                        value: r.y,
                        valueLabel: r.y.toFixed(2),
                        color: r.t === 3 ? c.positive : c.accent,
                    }))}
                />
            </Panel>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
