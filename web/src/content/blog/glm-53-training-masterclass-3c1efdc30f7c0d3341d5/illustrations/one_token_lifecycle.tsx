import React from 'react'
import { GraphDiagram, Row, Scene, TextLabel, defineIllustration, withDensity } from 'vizmatic'

export const width = 720
export const height = 680
export const alt =
    'A token prefix through position t minus one runs through the model forward pass to emit logits for position t. During rollout, inference samples token x_t and appends it to context. During training, the learner scores the recorded target x_t with its loss mask and advantage, then runs backward and optimizer updates to produce updated weights.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity({ ...baseC, shadow: 'transparent' }, 1.55)
    return (
        <Scene c={c} background="transparent" padding={20} gap={14} contentWidth={680}>
            <TextLabel
                c={c}
                text="One token: rollout sample vs. learner update"
                fontSize={26}
                fontWeight={700}
                color={c.textPrimary}
                width={680}
            />
            <GraphDiagram
                c={c}
                width={680}
                height={530}
                direction="TB"
                nodeGap={30}
                rankGap={36}
                labelFontSize={23}
                detailFontSize={22}
                routing="orthogonal"
                padding={10}
                nodes={[
                    {
                        id: 'prefix',
                        label: 'Prefix x_1..t-1',
                        detail: 'Context window before step t',
                        tone: 'blue',
                    },
                    {
                        id: 'forward',
                        label: 'Model forward pass',
                        detail: 'Logits + top-8 expert route',
                        tone: 'cyan',
                    },
                    {
                        id: 'sample',
                        label: 'Rollout: sample x_t',
                        detail: 'Append ID to next prefix',
                        tone: 'green',
                    },
                    {
                        id: 'score',
                        label: 'Learner: score x_t',
                        detail: 'Mask m_t = 1 · adv A',
                        tone: 'warm',
                    },
                    {
                        id: 'update',
                        label: 'Backward + Adam step',
                        detail: 'Updated weights theta',
                        tone: 'purple',
                    },
                ]}
                edges={[
                    { from: 'prefix', to: 'forward', tone: 'blue' },
                    { from: 'forward', to: 'sample', tone: 'green' },
                    { from: 'forward', to: 'score', tone: 'warm' },
                    { from: 'score', to: 'update', tone: 'purple' },
                ]}
            />
            <Row gap={18} width={680}>
                <TextLabel
                    c={c}
                    text="Green: rollout appends x_t"
                    fontSize={22}
                    color={c.textSecondary}
                    width={315}
                />
                <TextLabel
                    c={c}
                    text="Orange: update from target ID"
                    fontSize={22}
                    color={c.textSecondary}
                    width={345}
                />
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
