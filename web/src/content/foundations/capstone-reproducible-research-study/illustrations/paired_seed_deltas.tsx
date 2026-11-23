import React from 'react'
import { Column, IntervalPlot, ScatterPlot, Scene, defineIllustration, withDensity } from 'vizmatic'
import study from './study_results.json'

export const width = 680
export const height = 780
export const alt =
    'Scatter plot of all 24 paired early-success deltas highlights five regressed seeds (s6, s11, s17, s19, s23) in red, paired with an interval plot showing the +14.3 pp mean, the 90% paired interval (+6.1 to +22.5 pp), the wider unpaired interval (+4.9 to +23.6 pp), and the +0.0 pp final guardrail.'

const points = study.rows.map((row) => {
    const deltaPp = (row.early_shaped - row.early_sparse) * 100
    return {
        x: row.seed,
        y: deltaPp,
        label: deltaPp < 0 ? `s${row.seed}` : undefined,
        color: deltaPp < 0 ? 'critical' : 'primary',
        size: deltaPp < 0 ? 7 : 6,
    }
})

const intervals = [
    {
        label: 'Paired',
        low: study.summary.early_low * 100,
        mid: study.summary.early_mean * 100,
        high: study.summary.early_high * 100,
        color: 'primary',
        lowLabel: `+${(study.summary.early_low * 100).toFixed(1)}`,
        midLabel: `+${(study.summary.early_mean * 100).toFixed(1)}`,
        highLabel: `+${(study.summary.early_high * 100).toFixed(1)}`,
    },
    {
        label: 'Unpaired',
        low: study.summary.unpaired_low * 100,
        mid: study.summary.early_mean * 100,
        high: study.summary.unpaired_high * 100,
        color: 'secondary',
        lowLabel: `+${(study.summary.unpaired_low * 100).toFixed(1)}`,
        midLabel: '+14.3',
        highLabel: `+${(study.summary.unpaired_high * 100).toFixed(1)}`,
    },
    {
        label: 'Guardrail',
        low: study.summary.final_low * 100,
        mid: study.summary.final_mean * 100,
        high: study.summary.final_high * 100,
        color: 'positive',
        lowLabel: '0.0',
        midLabel: '+0.0',
        highLabel: '0.0',
    },
]

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 2.05)
    return (
        <Scene
            c={c}
            density={2.05}
            padding={14}
            gap={10}
            title="Five seeds regress despite +14.3 pp mean"
            subtitle="24 paired seeds · early training deltas (pp)"
        >
            <Column gap={10}>
                <ScatterPlot
                    c={c}
                    width={640}
                    height={330}
                    title="Per-seed delta (red = 5 regressions)"
                    points={points}
                    xMin={-2}
                    xMax={26}
                    yMin={-40}
                    yMax={55}
                    xAxisLabel="Seed index"
                    yAxisLabel="pp"
                    formatX={(v: number) => `${Math.round(v)}`}
                    formatY={(v: number) => `${v > 0 ? '+' : ''}${Math.round(v)}`}
                    showGrid={true}
                />
                <IntervalPlot
                    c={c}
                    width={640}
                    height={255}
                    title="90% bootstrap intervals (pp)"
                    data={intervals}
                    min={-5}
                    max={30}
                    axisLabel="Shaped minus sparse (pp)"
                    format={(v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)}`}
                />
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
