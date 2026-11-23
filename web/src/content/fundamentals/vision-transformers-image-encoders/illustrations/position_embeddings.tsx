import React from 'react'
import {
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    defineIllustration,
    getReadableToneColor,
    type ThemeColors,
    type ToneName,
} from 'vizmatic'

export const width = 840
export const height = 470
export const alt =
    'Why vision transformers inject 2D coordinates and how 1D learned tables differ from 2D-RoPE. Shuffling sky, sign, tree, and road patches leaves the unordered bag identical unless position offsets tag each slot. When image width shifts from 3 columns to 4, 1D indices drift off rows whereas 2D-RoPE rotates separate x and y subspaces cleanly.'

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
            fontSize: 25,
            fontWeight: 700,
            whiteSpace: 'nowrap',
        }}
    >
        {text}
    </div>
)

const illustration = defineIllustration((c) => (
    <Scene c={c} background={c.bg} padding={18} contentWidth={804} gap={12}>
        <TextLabel
            text="Positional embeddings preserve 2D layout across shapes"
            c={c}
            fontSize={28}
            fontWeight={700}
            math={false}
        />
        <Row gap={12} align="stretch" justify="space-between" width="100%">
            <Panel
                c={c}
                title="1. Why order matters"
                tone="neutral"
                width={254}
                padding={12}
                gap={10}
                align="center"
                titleFontSize={25}
            >
                <TextLabel
                    text="Same 4 patches, two layouts"
                    c={c}
                    fontSize={25}
                    color={c.textSecondary}
                    math={false}
                />
                <Row gap={8} align="center" justify="center">
                    <Column gap={4} align="center">
                        <TiledMatrix
                            rows={2}
                            cols={2}
                            c={c}
                            cellSize={36}
                            gap={3}
                            ariaLabel="Original 2x2 street scene patch layout"
                            regions={[
                                { rowStart: 0, rowEnd: 1, colStart: 0, colEnd: 1, tone: 'blue' },
                                { rowStart: 0, rowEnd: 1, colStart: 1, colEnd: 2, tone: 'red' },
                                { rowStart: 1, rowEnd: 2, colStart: 0, colEnd: 1, tone: 'green' },
                                { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, tone: 'warm' },
                            ]}
                        />
                        <TextLabel text="Original" c={c} fontSize={25} math={false} />
                    </Column>
                    <FlowArrow direction="right" length={16} c={c} tone="warm" />
                    <Column gap={4} align="center">
                        <TiledMatrix
                            rows={2}
                            cols={2}
                            c={c}
                            cellSize={36}
                            gap={3}
                            ariaLabel="Shuffled 2x2 patches without position info"
                            regions={[
                                { rowStart: 0, rowEnd: 1, colStart: 0, colEnd: 1, tone: 'warm' },
                                { rowStart: 0, rowEnd: 1, colStart: 1, colEnd: 2, tone: 'red' },
                                { rowStart: 1, rowEnd: 2, colStart: 0, colEnd: 1, tone: 'blue' },
                                { rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, tone: 'green' },
                            ]}
                        />
                        <TextLabel text="Shuffled" c={c} fontSize={25} math={false} />
                    </Column>
                </Row>
                {pill('Same patch bag', 'warm', c)}
            </Panel>

            <Panel
                c={c}
                title="2. 1D vs 2D grid"
                tone="warm"
                width={260}
                padding={12}
                gap={10}
                align="center"
                titleFontSize={25}
            >
                <TextLabel
                    text="3x3 resized to 3x4"
                    c={c}
                    fontSize={25}
                    color={c.textSecondary}
                    math={false}
                />
                <Row gap={8} align="center">
                    <TiledMatrix
                        rows={3}
                        cols={3}
                        c={c}
                        cellSize={26}
                        gap={3}
                        ariaLabel="3 by 3 patch grid with row 1 highlighted"
                        regions={[{ rowStart: 1, rowEnd: 2, colStart: 0, colEnd: 3, tone: 'red' }]}
                    />
                    <FlowArrow direction="right" length={16} c={c} tone="warm" />
                    <TiledMatrix
                        rows={3}
                        cols={4}
                        c={c}
                        cellSize={24}
                        gap={3}
                        ariaLabel="3 by 4 patch grid showing 2D interpolation"
                        regions={[{ rowStart: 1, rowEnd: 2, colStart: 0, colEnd: 4, tone: 'blue' }]}
                    />
                </Row>
                <TextLabel text="1D index shifts rows" c={c} fontSize={25} math={false} />
                {pill('2D bicubic resize', 'warm', c)}
            </Panel>

            <Panel
                c={c}
                title="3. 2D-RoPE pairs"
                tone="green"
                width={266}
                padding={12}
                gap={10}
                align="center"
                titleFontSize={25}
            >
                <TextLabel
                    text="Rotate Q, K by (y, x)"
                    c={c}
                    fontSize={25}
                    color={c.textSecondary}
                    math={false}
                />
                <TiledMatrix
                    rows={2}
                    cols={6}
                    c={c}
                    cellSize={26}
                    gap={3}
                    ariaLabel="2D-RoPE head split into row and column frequency pairs"
                    regions={[
                        { rowStart: 0, rowEnd: 2, colStart: 0, colEnd: 3, tone: 'blue' },
                        { rowStart: 0, rowEnd: 2, colStart: 3, colEnd: 6, tone: 'green' },
                    ]}
                />
                <TextLabel text="Rows: y * theta" c={c} fontSize={25} math={false} />
                <TextLabel text="Cols: x * theta" c={c} fontSize={25} math={false} />
                {pill('Relative (dy, dx)', 'green', c)}
            </Panel>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
