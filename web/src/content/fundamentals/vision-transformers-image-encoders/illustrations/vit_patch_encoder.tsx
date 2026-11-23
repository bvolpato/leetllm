import React from 'react'
import {
    FlowArrow,
    Matrix,
    Panel,
    PixelGrid,
    Row,
    Scene,
    TextLabel,
    TiledMatrix,
    defineIllustration,
    getReadableToneColor,
    type RgbPixel,
    type ThemeColors,
    type ToneName,
} from 'vizmatic'

export const width = 840
export const height = 470
export const alt =
    'A 4 by 4 street scene pixel grid splits into four 2 by 2 patches covering sky, crimson speed sign, foliage, and asphalt. Each patch flattens into a row vector, projects linearly into D-wide token embeddings with added position offsets, and pairs with a learnable class token.'

const sky: RgbPixel = [88, 166, 232]
const cloud: RgbPixel = [196, 224, 248]
const signRed: RgbPixel = [220, 56, 56]
const signText: RgbPixel = [245, 245, 245]
const leaf: RgbPixel = [64, 152, 92]
const road: RgbPixel = [58, 66, 78]
const stripe: RgbPixel = [232, 196, 72]

const rgbPixels: RgbPixel[][] = [
    [sky, cloud, signRed, signText],
    [sky, sky, signText, signRed],
    [leaf, leaf, road, stripe],
    [road, road, road, road],
]

export const pixels: number[][] = [
    [0.64, 0.85, 0.48, 0.96],
    [0.62, 0.64, 0.96, 0.48],
    [0.44, 0.46, 0.25, 0.8],
    [0.24, 0.25, 0.24, 0.25],
]

export const patches: number[][] = [
    [pixels[0][0], pixels[0][1], pixels[1][0], pixels[1][1]],
    [pixels[0][2], pixels[0][3], pixels[1][2], pixels[1][3]],
    [pixels[2][0], pixels[2][1], pixels[3][0], pixels[3][1]],
    [pixels[2][2], pixels[2][3], pixels[3][2], pixels[3][3]],
]

const projectedTokens: number[][] = [
    [0.5, -0.2, 0.4],
    [0.6, 0.8, -0.4],
    [0.3, 0.5, 0.8],
    [0.7, -0.4, 0.2],
]

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
            text="Patchify, flatten, and linearly project an image"
            c={c}
            fontSize={28}
            fontWeight={700}
            math={false}
        />
        <Row gap={10} align="stretch" justify="space-between" width="100%">
            <Panel
                c={c}
                title="1. RGB crop (4x4)"
                tone="blue"
                width={214}
                padding={12}
                gap={10}
                align="center"
                titleFontSize={25}
            >
                <PixelGrid pixels={rgbPixels} c={c} width={156} height={156} />
                {pill('H x W x 3', 'blue', c)}
            </Panel>

            <FlowArrow direction="right" length={20} c={c} tone="blue" />

            <Panel
                c={c}
                title="2. 2x2 patches"
                tone="cyan"
                width={210}
                padding={12}
                gap={10}
                align="center"
                titleFontSize={25}
            >
                <TiledMatrix
                    rows={4}
                    cols={4}
                    c={c}
                    cellSize={34}
                    gap={4}
                    ariaLabel="Four 2 by 2 patch regions"
                    regions={[
                        { rowStart: 0, rowEnd: 2, colStart: 0, colEnd: 2, tone: 'blue' },
                        { rowStart: 0, rowEnd: 2, colStart: 2, colEnd: 4, tone: 'red' },
                        { rowStart: 2, rowEnd: 4, colStart: 0, colEnd: 2, tone: 'green' },
                        { rowStart: 2, rowEnd: 4, colStart: 2, colEnd: 4, tone: 'warm' },
                    ]}
                />
                <TextLabel text="4 x (2x2x3)" c={c} fontSize={25} fontWeight={700} math={false} />
            </Panel>

            <FlowArrow direction="right" length={20} c={c} tone="purple" />

            <Panel
                c={c}
                title="3. Token matrix Z0"
                tone="purple"
                width={300}
                padding={12}
                gap={10}
                align="center"
                titleFontSize={25}
            >
                <Matrix
                    data={projectedTokens}
                    c={c}
                    rowLabels={['P1', 'P2', 'P3', 'P4']}
                    colLabels={['d0', 'd1', 'd2']}
                    cellWidth={74}
                    cellHeight={38}
                    rowLabelWidth={46}
                    fontSize={25}
                    format="decimal"
                    colorScale="heat"
                    highlightRow={1}
                    ariaLabel="Projected patch token vectors"
                />
                {pill('Prepend [CLS]', 'purple', c)}
            </Panel>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
