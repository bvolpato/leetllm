import React from 'react'
import {
    BarChart,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    defineIllustration,
    getReadableToneColor,
    withDensity,
    type ThemeColors,
    type ToneName,
} from 'vizmatic'

export const width = 820
export const height = 510
export const alt =
    'Three VLM bridge designs connecting visual features to a language decoder for a 224 by 224 image. LLaVA passes all 256 patch tokens linearly into the LLM prefix. Qwen2.5-VL groups adjacent 2 by 2 patches via an MLP merger to cut prefix count fourfold from 256 to 64. Flamingo resamples NFNet features into 64 latents for gated cross-attention outside the prefix. A bar chart compares prefix tokens at 448 pixels (1024 vs 256).'

const pill = (text: string, tone: ToneName, c: ThemeColors) => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '7px 14px',
            borderRadius: 999,
            border: '2px solid ' + getReadableToneColor(tone, c, c.bgSubtle),
            background: c.bgSubtle,
            color: getReadableToneColor(tone, c, c.bgSubtle),
            fontSize: 24,
            fontWeight: 700,
            whiteSpace: 'nowrap',
        }}
    >
        {text}
    </div>
)

const illustration = defineIllustration((c) => {
    const chartC = withDensity(c, 2.75)
    return (
        <Scene c={c} background={c.bg} padding={18} contentWidth={784} gap={12}>
            <TextLabel
                text="Bridging visual encoders into a language decoder"
                c={c}
                fontSize={28}
                fontWeight={700}
                math={false}
            />
            <Row gap={12} align="stretch" justify="space-between" width="100%">
                <Column gap={10} style={{ flex: 1, minWidth: 0 }}>
                    <Panel
                        c={c}
                        title="LLaVA: Token-wise linear / MLP"
                        tone="blue"
                        width="100%"
                        padding={10}
                        gap={8}
                        titleFontSize={24}
                    >
                        <Row gap={10} align="center" justify="space-between">
                            <TiledMatrix
                                rows={4}
                                cols={4}
                                c={c}
                                cellSize={18}
                                gap={2}
                                ariaLabel="16x16 unmerged patch token layout"
                                tone="blue"
                            />
                            <FlowArrow direction="right" length={22} c={c} tone="blue" />
                            {pill('256 slots -> prefix', 'blue', c)}
                        </Row>
                    </Panel>

                    <Panel
                        c={c}
                        title="Qwen2.5-VL: 2x2 MLP merger"
                        tone="green"
                        width="100%"
                        padding={10}
                        gap={8}
                        titleFontSize={24}
                    >
                        <Row gap={10} align="center" justify="space-between">
                            <TiledMatrix
                                rows={4}
                                cols={4}
                                c={c}
                                cellSize={18}
                                gap={2}
                                ariaLabel="2x2 grouped spatial regions merged into 64 tokens"
                                regions={[
                                    {
                                        rowStart: 0,
                                        rowEnd: 2,
                                        colStart: 0,
                                        colEnd: 2,
                                        tone: 'green',
                                    },
                                    {
                                        rowStart: 0,
                                        rowEnd: 2,
                                        colStart: 2,
                                        colEnd: 4,
                                        tone: 'cyan',
                                    },
                                    {
                                        rowStart: 2,
                                        rowEnd: 4,
                                        colStart: 0,
                                        colEnd: 2,
                                        tone: 'cyan',
                                    },
                                    {
                                        rowStart: 2,
                                        rowEnd: 4,
                                        colStart: 2,
                                        colEnd: 4,
                                        tone: 'green',
                                    },
                                ]}
                            />
                            <FlowArrow direction="right" length={22} c={c} tone="green" />
                            {pill('64 slots -> prefix', 'green', c)}
                        </Row>
                    </Panel>

                    <Panel
                        c={c}
                        title="Flamingo: Perceiver cross-attn"
                        tone="warm"
                        width="100%"
                        padding={10}
                        gap={8}
                        titleFontSize={24}
                    >
                        <Row gap={10} align="center" justify="space-between">
                            <TextLabel
                                text="NFNet grid"
                                c={c}
                                fontSize={24}
                                fontWeight={700}
                                math={false}
                            />
                            <FlowArrow direction="right" length={22} c={c} tone="warm" />
                            {pill('64 KV slots (no prefix)', 'warm', c)}
                        </Row>
                    </Panel>
                </Column>

                <Panel
                    c={c}
                    title="Slots at 448px"
                    tone="purple"
                    width={304}
                    padding={12}
                    gap={6}
                    align="center"
                    titleFontSize={25}
                >
                    <TextLabel
                        text="P = 14 (32 x 32 patches)"
                        c={c}
                        fontSize={24}
                        color={c.textSecondary}
                        math={false}
                    />
                    <BarChart
                        c={chartC}
                        width={280}
                        height={240}
                        showValues={false}
                        showGrid
                        format="integer"
                        ariaLabel="Decoder visual prefix slot count for 448 by 448 image"
                        data={[
                            { label: '1x1', value: 1024, color: 'info' },
                            { label: '2x2', value: 256, color: 'positive' },
                        ]}
                    />
                    <TextLabel
                        text="1,024  vs  256 tokens (4x KV drop)"
                        c={c}
                        fontSize={24}
                        fontWeight={700}
                        math={false}
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
