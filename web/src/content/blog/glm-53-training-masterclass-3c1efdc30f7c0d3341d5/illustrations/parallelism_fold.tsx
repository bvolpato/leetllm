import React from 'react'
import {
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const width = 720
export const height = 620
export const alt =
    'The same 64 learner ranks remain physically fixed while process-group overlays switch between attention layers and MoE layers. Attention uses an eight-by-eight TP8 by CP8 grid with optimizer shard size 8; MoE regroups all 64 ranks into one EP64 group holding 4 routed experts per rank with optimizer group size 1.'

const illustration = defineIllustration((baseC) => {
    const c = withDensity({ ...baseC, shadow: 'transparent' }, 1.45)
    return (
        <Scene c={c} background="transparent" padding={20} gap={14} contentWidth={680}>
            <TextLabel
                c={c}
                text="Same 64 ranks, two logical coordinate systems"
                fontSize={26}
                fontWeight={700}
                color={c.textPrimary}
                width={680}
            />
            <Row gap={18} width={680} align="stretch">
                <Panel
                    c={c}
                    title="Attention & Dense"
                    subtitle="TP8 (row) x CP8 (col)"
                    tone="blue"
                    width={331}
                    padding={16}
                    gap={10}
                >
                    <TiledMatrix
                        c={c}
                        rows={8}
                        cols={8}
                        cellSize={22}
                        gap={4}
                        tone="neutral"
                        regions={[
                            { rowStart: 1, rowEnd: 2, colStart: 0, colEnd: 8, tone: 'blue' },
                            { rowStart: 0, rowEnd: 8, colStart: 2, colEnd: 3, tone: 'cyan' },
                        ]}
                        ariaLabel="64 ranks with one TP8 row highlighted in blue and one CP8 column highlighted in cyan"
                    />
                    <Column gap={4}>
                        <TextLabel c={c} text="Row: TP8 matrix shard" fontSize={22} width={295} />
                        <TextLabel
                            c={c}
                            text="Col: CP8 ring + opt group 8"
                            fontSize={22}
                            color={c.textSecondary}
                            width={295}
                        />
                    </Column>
                </Panel>
                <Panel
                    c={c}
                    title="MoE Feed-Forward"
                    subtitle="EP64 · ETP1 · 4 experts/rank"
                    tone="purple"
                    width={331}
                    padding={16}
                    gap={10}
                >
                    <TiledMatrix
                        c={c}
                        rows={8}
                        cols={8}
                        cellSize={22}
                        gap={4}
                        tone="purple"
                        regions={[
                            { rowStart: 0, rowEnd: 8, colStart: 0, colEnd: 8, tone: 'purple' },
                        ]}
                        ariaLabel="All 64 ranks colored as one EP64 expert-parallel group"
                    />
                    <Column gap={4}>
                        <TextLabel c={c} text="4 x 64 = 256 experts" fontSize={22} width={295} />
                        <TextLabel
                            c={c}
                            text="All-to-all · opt group 1"
                            fontSize={22}
                            color={c.textSecondary}
                            width={295}
                        />
                    </Column>
                </Panel>
            </Row>
            <TextLabel
                c={c}
                text="DP = 1 in both views: ranks stay fixed; only collectives change"
                fontSize={22}
                color={c.textSecondary}
                width={680}
            />
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
