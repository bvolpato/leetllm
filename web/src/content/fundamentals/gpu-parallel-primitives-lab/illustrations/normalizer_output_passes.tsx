import React from 'react'
import {
    Arrow,
    Card,
    Grid,
    Panel,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { GridCell, ThemeMode } from 'vizmatic'

const logits = [3, -1, 4, 1, 5, -9, 2, 6]
const maxLogit = Math.max(...logits)
const denominator = logits.reduce((acc, x) => acc + Math.exp(x - maxLogit), 0)
const probabilities = logits.map((x) => (Math.exp(x - maxLogit) / denominator).toFixed(3))

export const width = 940
export const height = 740
export const alt = `Left panel shows two-pass standalone softmax: pass 1 reads eight logits to compute (m=6, d=${denominator.toFixed(6)}), and pass 2 rereads logits to output probabilities [${probabilities.join(', ')}]. Right panel shows fused attention tracking (m, d, O) in SRAM, rescaling both d and O by alpha, and emitting O/d without storing N x N probabilities.`

const cell = (label: string, tone?: GridCell['tone']): GridCell => ({
    label,
    tone,
})

const probRows: Array<Array<string | GridCell>> = [
    probabilities.slice(0, 4).map((p) => cell(p, 'blue')),
    probabilities.slice(4, 8).map((p, i) => cell(p, i === 3 ? 'green' : 'blue')),
]

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.8)
    return (
        <Scene c={c} padding={16} gap={14}>
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={447}
                    padding={14}
                    gap={10}
                    tone="blue"
                    titleFontSize={32}
                    title="Two-pass standalone softmax"
                >
                    <TextLabel c={c} text="(m, d) drops individual numerators" fontSize={28} />
                    <Card c={c} tone="blue" padding={12} gap={6} title="Pass 1: Fold 8 logits">
                        <TextLabel
                            c={c}
                            text={`m = 6, d = ${denominator.toFixed(6)}`}
                            fontSize={28}
                        />
                    </Card>
                    <Arrow c={c} direction="down" length={18} />
                    <Card c={c} tone="warm" padding={12} gap={6} title="Pass 2: Reread logits">
                        <TextLabel c={c} text="Emit exp(x_i - m) / d" fontSize={28} />
                    </Card>
                    <TextLabel c={c} text="Probabilities p0..p7:" fontSize={28} />
                    <Grid
                        c={c}
                        rows={probRows}
                        cellWidth={96}
                        cellHeight={44}
                        gap={6}
                        fontSize={28}
                    />
                </Panel>
                <Panel
                    c={c}
                    width={447}
                    padding={14}
                    gap={10}
                    tone="green"
                    titleFontSize={32}
                    title="Fused attention (m, d, O)"
                >
                    <TextLabel c={c} text="Rescale O on-chip to skip storing P" fontSize={28} />
                    <Card c={c} tone="purple" padding={12} gap={6} title="State (m, d, O)">
                        <TextLabel c={c} text="Keep weighted V sum O" fontSize={28} />
                    </Card>
                    <Arrow c={c} direction="down" length={18} />
                    <Card c={c} tone="blue" padding={12} gap={6} title="Next K, V tile">
                        <TextLabel c={c} text="alpha = exp(m_old - m_new)" fontSize={28} />
                        <TextLabel c={c} text="Rescale both d and O" fontSize={28} />
                    </Card>
                    <Arrow c={c} direction="down" length={18} />
                    <Card c={c} tone="green" padding={12} gap={6} title="Final output O / d">
                        <TextLabel c={c} text="Skip DRAM N x N P matrix" fontSize={28} />
                        <TextLabel c={c} text="FLOPs stay O(N^2)" fontSize={28} />
                    </Card>
                </Panel>
            </Row>
        </Scene>
    )
}

export default create('dark')
