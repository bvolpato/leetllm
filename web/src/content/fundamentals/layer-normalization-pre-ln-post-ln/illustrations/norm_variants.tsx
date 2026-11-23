import React from 'react'
import {
    LineChart,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'

export const width = 880
export const height = 610
export const autoSize = true
export const alt =
    'Two side-by-side line plots compare LayerNorm and RMSNorm on input x = [3, 1, -1, 5] and shifted input x + 10 = [13, 11, 9, 15]. LayerNorm outputs remain identical at [0.45, -0.45, -1.34, 1.34] after adding 10 because mean subtraction cancels uniform shifts. RMSNorm lacks centering, so outputs shift from [1.00, 0.33, -0.33, 1.67] to [1.07, 0.90, 0.74, 1.23].'

const input = [3, 1, -1, 5]
const panels = [input, input.map((v) => v + 10)].map((values, idx) => {
    const mean = values.reduce((s, v) => s + v, 0) / values.length
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
    const rms = Math.sqrt(values.reduce((s, v) => s + v * v, 0) / values.length)
    const ln = values.map((v) => Number(((v - mean) / Math.sqrt(variance)).toFixed(2)))
    const rmsVals = values.map((v) => Number((v / rms).toFixed(2)))
    return {
        title: idx === 0 ? 'Input x = [3, 1, -1, 5]' : 'Shifted x + 10 = [13, 11, 9, 15]',
        note: idx === 0 ? 'RMS = 3.00 | SD = 2.24' : 'LN unchanged | RMS shifts +',
        ln,
        rms: rmsVals,
    }
})

const illustration = defineIllustration((c) => {
    const chartC = withDensity(c, 2.95)
    const lnColor = getReadableToneColor('purple', c, c.bgCard)
    const rmsColor = getReadableToneColor('green', c, c.bgCard)

    return (
        <Scene c={c} padding={16} gap={12}>
            <Panel
                c={c}
                title="LayerNorm vs RMSNorm under a +10 input shift"
                titleFontSize={27}
                width={848}
                background={c.bgCard}
                borderColor={c.borderSubtle}
                padding={10}
                gap={0}
            />
            <Row gap={16} align="stretch">
                {panels.map((p) => (
                    <Panel
                        key={p.title}
                        c={c}
                        title={p.title}
                        titleFontSize={26}
                        width={416}
                        background={c.bgCard}
                        borderColor={c.borderSubtle}
                        padding={12}
                        gap={6}
                    >
                        <TextLabel
                            c={c}
                            text={p.note}
                            fontSize={26}
                            color={c.textSecondary}
                            math={false}
                        />
                        <LineChart
                            c={chartC}
                            series={[
                                { name: 'LN', points: p.ln, color: lnColor },
                                { name: 'RMS', points: p.rms, color: rmsColor },
                            ]}
                            labels={['f1', 'f2', 'f3', 'f4']}
                            width={392}
                            height={186}
                            min={-1.5}
                            max={1.8}
                            showGrid
                            showPoints
                            directLabels={false}
                        />
                        <TextLabel
                            c={c}
                            text={`LN: [${p.ln.map((v) => v.toFixed(2)).join(', ')}]`}
                            fontSize={26}
                            color={lnColor}
                            math={false}
                        />
                        <TextLabel
                            c={c}
                            text={`RMS: [${p.rms.map((v) => v.toFixed(2)).join(', ')}]`}
                            fontSize={26}
                            color={rmsColor}
                            math={false}
                        />
                    </Panel>
                ))}
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
