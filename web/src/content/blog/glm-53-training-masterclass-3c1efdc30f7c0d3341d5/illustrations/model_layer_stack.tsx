import React from 'react'
import {
    Flow,
    Panel,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 720
export const height = 740
export const alt =
    'GLM-5.3 sequential stack from token embedding through three dense Transformer layers, seventy-five MoE Transformer layers, and final norm and vocabulary head, plus layer 78 MTP module. A zoomed MoE layer shows normalization, sparse MLA attention, residual addition, top-eight plus one shared expert FFN, and residual addition.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity({ ...baseC, shadow: 'transparent' }, 1.45)
    return (
        <Scene c={c} background="transparent" padding={20} gap={14} contentWidth={680}>
            <TextLabel
                c={c}
                text="GLM-5.3 depth: 78 base layers + 1 MTP module"
                fontSize={26}
                fontWeight={700}
                color={c.textPrimary}
                width={680}
            />
            <StackedBar
                c={c}
                width={680}
                height={52}
                showLegend
                ariaLabel="Proportion of 3 dense layers vs 75 MoE layers vs 1 MTP module"
                segments={[
                    { label: 'Dense L0..2 (3)', value: 3, color: 'cyan' },
                    { label: 'MoE L3..77 (75)', value: 75, color: 'purple' },
                    { label: 'MTP L78 (1)', value: 1, color: 'warm' },
                ]}
            />
            <Row gap={16} width={680} align="stretch">
                <Panel
                    c={c}
                    title="Sequential trunk (PP=1)"
                    tone="blue"
                    width={332}
                    padding={14}
                    gap={10}
                >
                    <Flow
                        c={c}
                        direction="vertical"
                        gap={4}
                        connectorLength={12}
                        stages={[
                            {
                                title: 'Embed 154,880 -> 6,144',
                                tone: 'blue',
                                width: 300,
                                padding: 10,
                            },
                            {
                                title: 'L0..L2 Dense (FFN 12,288)',
                                tone: 'cyan',
                                width: 300,
                                padding: 10,
                            },
                            {
                                title: 'L3..L77 MoE (top-8 + 1 shared)',
                                tone: 'purple',
                                width: 300,
                                padding: 10,
                            },
                            {
                                title: 'Norm + Head · L78 MTP',
                                tone: 'warm',
                                width: 300,
                                padding: 10,
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    title="Inside 1 MoE layer"
                    tone="purple"
                    width={332}
                    padding={14}
                    gap={10}
                >
                    <Flow
                        c={c}
                        direction="vertical"
                        gap={4}
                        connectorLength={12}
                        connectorTone="purple"
                        stages={[
                            {
                                title: 'RMSNorm + Sparse MLA',
                                subtitle: 'Q 2,048 · KV 512 · K<=2,048',
                                tone: 'cyan',
                                width: 300,
                                padding: 10,
                            },
                            {
                                title: 'Residual add (+ x)',
                                tone: 'blue',
                                width: 300,
                                padding: 8,
                            },
                            {
                                title: 'RMSNorm + MoE router',
                                subtitle: '8 of 256 + 1 shared (2,048)',
                                tone: 'green',
                                width: 300,
                                padding: 10,
                            },
                            {
                                title: 'Residual add (+ x)',
                                tone: 'blue',
                                width: 300,
                                padding: 8,
                            },
                        ]}
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
