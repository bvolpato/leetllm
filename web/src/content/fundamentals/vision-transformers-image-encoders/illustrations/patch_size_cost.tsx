import React from 'react'
import {
    BarChart,
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
    'Patch grids and self-attention cost for a 224 by 224 street scene across patch sizes. Coarse 32 by 32 patches create 49 tokens and trap a 28-pixel speed sign inside a single patch. Fine 14 by 14 patches resolve the sign across 4 tiles with 256 tokens, raising pairwise attention evaluations from 2.4k to 65.5k.'

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
                text="Patch size controls detail vs quadratic N^2 cost (224x224)"
                c={c}
                fontSize={27}
                fontWeight={700}
                math={false}
            />
            <Row gap={12} align="stretch" justify="space-between" width="100%">
                <Panel
                    c={c}
                    title="Coarse: P = 32"
                    tone="warm"
                    width={214}
                    padding={12}
                    gap={10}
                    align="center"
                    titleFontSize={25}
                >
                    <TextLabel
                        text="7x7 = 49 tokens"
                        c={c}
                        fontSize={24}
                        color={c.textSecondary}
                        math={false}
                    />
                    <TiledMatrix
                        rows={7}
                        cols={7}
                        c={c}
                        cellSize={21}
                        gap={2}
                        ariaLabel="7 by 7 coarse patch grid with 1 highlighted sign cell"
                        regions={[{ rowStart: 2, rowEnd: 3, colStart: 4, colEnd: 5, tone: 'red' }]}
                    />
                    {pill('2.4k pairs', 'warm', c)}
                </Panel>

                <Panel
                    c={c}
                    title="Fine: P = 14"
                    tone="blue"
                    width={220}
                    padding={12}
                    gap={10}
                    align="center"
                    titleFontSize={25}
                >
                    <TextLabel
                        text="16x16 = 256 tokens"
                        c={c}
                        fontSize={24}
                        color={c.textSecondary}
                        math={false}
                    />
                    <TiledMatrix
                        rows={8}
                        cols={8}
                        c={c}
                        cellSize={19}
                        gap={2}
                        ariaLabel="High-resolution patch grid showing 4 cells over the small sign"
                        regions={[{ rowStart: 2, rowEnd: 4, colStart: 4, colEnd: 6, tone: 'red' }]}
                    />
                    {pill('65.5k pairs', 'blue', c)}
                </Panel>

                <Panel
                    c={c}
                    title="Pairs (N^2 / 1k)"
                    tone="purple"
                    width={326}
                    padding={12}
                    gap={6}
                    align="center"
                    titleFontSize={25}
                >
                    <BarChart
                        c={chartC}
                        width={302}
                        height={240}
                        showValues={false}
                        showGrid
                        format="integer"
                        ariaLabel="Attention pair count in thousands for P=32, P=16, and P=14"
                        data={[
                            { label: '32', value: 2.4, color: 'warning' },
                            { label: '16', value: 38.4, color: 'info' },
                            { label: '14', value: 65.5, color: 'primary' },
                        ]}
                    />
                    <TextLabel
                        text="2.4k   |   38.4k   |   65.5k"
                        c={c}
                        fontSize={24}
                        fontWeight={700}
                        math={false}
                    />
                    <Row gap={6} align="center">
                        <FlowArrow direction="right" length={16} c={c} tone="purple" />
                        <TextLabel
                            text="27x jump (P=32 to 14)"
                            c={c}
                            fontSize={24}
                            fontWeight={600}
                            math={false}
                        />
                    </Row>
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
