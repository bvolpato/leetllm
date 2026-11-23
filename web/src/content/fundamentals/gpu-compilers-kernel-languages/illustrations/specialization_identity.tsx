import React from 'react'
import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const width = 980
export const height = 780
export const alt =
    'Left column shows vector_add.cu unchanged while scale.cuh changes SCALE from 1 to 2 for inputs 4 and 5: a source-only key returns stale hit 9, whereas a dependency-aware key misses and rebuilds 18; below, identical shape 1000 misses when stride changes from 1 to 2. Right column flows four key groups (source plus transitive headers, toolchain plus ordered flags and target, shape plus stride and dtype, block plus warps and stages) into a SHA-256 recipe digest.'

const card = (
    c: Parameters<Parameters<typeof defineIllustration>[0]>[0],
    title: string,
    sub: string,
    tone: 'blue' | 'purple' | 'green' | 'warm' | 'cyan' | 'neutral' | 'red',
    w: number,
) => (
    <Panel c={c} title={title} titleFontSize={30} tone={tone} padding={8} gap={2} width={w}>
        <TextLabel text={sub} c={c} fontSize={29} color={c.textMuted} />
    </Panel>
)

const illustration = defineIllustration((c) => {
    return (
        <Scene c={c} padding={14} gap={14} contentWidth={width - 28} align="center">
            <Row gap={14} width={width - 28} align="start">
                <Column gap={14} width={504}>
                    <Panel
                        c={c}
                        title="scale.cuh changes 1 to 2"
                        titleFontSize={31}
                        tone="warm"
                        padding={12}
                        gap={10}
                        width={504}
                    >
                        <TextLabel
                            text="cu same; 4+5 needs 18"
                            c={c}
                            fontSize={29}
                            color={c.textMuted}
                        />
                        <Row gap={8} align="center">
                            {card(c, 'Source key', 'skips header', 'neutral', 216)}
                            <FlowArrow direction="right" length={16} c={c} tone="red" />
                            {card(c, 'Stale hit: 9', 'old scale x1', 'red', 216)}
                        </Row>
                        <Row gap={8} align="center">
                            {card(c, 'Header key', 'adds .cuh', 'blue', 216)}
                            <FlowArrow direction="right" length={16} c={c} tone="green" />
                            {card(c, 'Rebuild: 18', 'new x2 build', 'green', 216)}
                        </Row>
                    </Panel>

                    <Panel
                        c={c}
                        title="Same shape, different stride"
                        titleFontSize={31}
                        tone="blue"
                        padding={12}
                        gap={10}
                        width={504}
                    >
                        <Row gap={8} align="center">
                            {card(c, 'stride = 1', 'K1 cached', 'green', 216)}
                            <FlowArrow direction="right" length={16} c={c} tone="warm" />
                            {card(c, 'stride = 2', 'misses K1', 'warm', 216)}
                        </Row>
                    </Panel>
                </Column>

                <Panel
                    c={c}
                    title="SHA-256 key inputs"
                    titleFontSize={31}
                    tone="purple"
                    padding={12}
                    gap={8}
                    width={434}
                >
                    {card(c, '1. Source + headers', 'cu + scale.cuh', 'blue', 408)}
                    {card(c, '2. Toolchain + flags', 'flags, sm_90/90a', 'cyan', 408)}
                    {card(c, '3. Shape + stride', '(1000,), s=2, fp32', 'warm', 408)}
                    {card(c, '4. Launch config', 'BLOCK=256, warps', 'purple', 408)}
                    <Row justify="center" width={408}>
                        <FlowArrow direction="down" length={14} c={c} tone="green" />
                    </Row>
                    <BadgePill
                        text="Unique SHA-256 digest"
                        tone="green"
                        c={c}
                        width={408}
                        height={42}
                        fontSize={30}
                    />
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
