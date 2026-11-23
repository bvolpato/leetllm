import React from 'react'
import {
    BarChart,
    Flow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 720
export const height = 680
export const alt =
    'Fully asynchronous RL overlaps 48 rollout workers with 64 learner GPUs targeting staleness lag S of at most two updates. Trajectories tagged v130 arrive at learner steps 130, 131, and 132 within target lag zero to two, while a v129 trajectory arriving at step 132 exceeds lag two. A pause, weight sync, and resume cycle refreshes workers to v132.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity({ ...baseC, shadow: 'transparent' }, 1.45)
    return (
        <Scene c={c} background="transparent" padding={20} gap={14} contentWidth={680}>
            <TextLabel
                c={c}
                text="Async rollout overlap and staleness target S = 2"
                fontSize={26}
                fontWeight={700}
                color={c.textPrimary}
                width={680}
            />
            <Flow
                c={c}
                direction="horizontal"
                gap={8}
                connectorLength={20}
                stages={[
                    {
                        title: '48 Rollout Workers',
                        subtitle: 'Emit version tag',
                        tone: 'green',
                        width: 204,
                    },
                    { title: 'Sample Queue', subtitle: 'Batch B = 32', tone: 'purple', width: 184 },
                    {
                        title: '64 Learner GPUs',
                        subtitle: 'Check step lag',
                        tone: 'blue',
                        width: 204,
                    },
                ]}
            />
            <BarChart
                c={c}
                width={680}
                height={230}
                min={0}
                max={3}
                showValues
                showGrid
                title="Weight version lag at learner update (target <= 2)"
                ariaLabel="Bar chart comparing arriving weight version lags against the two-step target"
                data={[
                    { label: 'v130 @ L130', value: 0, color: 'green', valueLabel: '0' },
                    { label: 'v130 @ L131', value: 1, color: 'green', valueLabel: '1' },
                    { label: 'v130 @ L132', value: 2, color: 'cyan', valueLabel: '2 (limit)' },
                    { label: 'v129 @ L132', value: 3, color: 'red', valueLabel: '3 (over)' },
                ]}
            />
            <Panel c={c} title="Periodic weight refresh" tone="warm" width={680} padding={12}>
                <Row gap={12} width={656}>
                    <TextLabel c={c} text="1. Pause rollout" fontSize={22} width={185} />
                    <TextLabel c={c} text="2. Sync to v132" fontSize={22} width={225} />
                    <TextLabel c={c} text="3. Resume workers" fontSize={22} width={215} />
                </Row>
            </Panel>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
