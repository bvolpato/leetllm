import React from 'react'
import {
    Arrow,
    Card,
    Panel,
    ProgressList,
    Row,
    Scene,
    StackedBar,
    TextLabel,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 940
export const height = 760
export const alt =
    'Top panel merges Chunk A [3, -1, 4, 1] (m=4, d=1.424404) rescaled by exp(4-6)=0.135335 with Chunk B [5, -9, 2, 6] (m=6, d=1.386195) into global m=6 and d=1.578968. Bottom left charts unscaled Chunk A (1.424), rescaled Chunk A (0.193), Chunk B (1.386), and merged d (1.579). Bottom right shows share split: 12.2% scaled A and 87.8% Chunk B.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.8)
    return (
        <Scene c={c} padding={16} gap={14}>
            <Panel
                c={c}
                width={908}
                padding={14}
                gap={10}
                tone="purple"
                titleFontSize={32}
                title="Merge softmax chunks [3,-1,4,1] and [5,-9,2,6]"
            >
                <Row gap={10} align="center" justify="space-between">
                    <Card c={c} width={268} padding={10} gap={4} tone="blue" title="Chunk A">
                        <TextLabel c={c} text="m=4, d=1.424404" fontSize={28} />
                        <TextLabel c={c} text="scaled: 0.192772" fontSize={28} />
                    </Card>
                    <Arrow c={c} direction="right" length={16} />
                    <Card c={c} width={268} padding={10} gap={4} tone="green" title="Chunk B">
                        <TextLabel c={c} text="m=6, d=1.386195" fontSize={28} />
                        <TextLabel c={c} text="scaled: 1.386195" fontSize={28} />
                    </Card>
                    <Arrow c={c} direction="right" length={16} />
                    <Card c={c} width={268} padding={10} gap={4} tone="purple" title="Merged">
                        <TextLabel c={c} text="m = max(4,6) = 6" fontSize={28} />
                        <TextLabel c={c} text="d = 1.578968" fontSize={28} />
                    </Card>
                </Row>
            </Panel>
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={447}
                    padding={14}
                    gap={14}
                    tone="blue"
                    titleFontSize={32}
                    title="Unscaled vs rescaled sums"
                >
                    <ProgressList
                        c={c}
                        gap={20}
                        labelWidth={96}
                        valueWidth={88}
                        barHeight={24}
                        fontSize={28}
                        rows={[
                            {
                                label: 'Raw A',
                                value: 1.424 / 1.579,
                                valueLabel: '1.424',
                                tone: 'neutral',
                            },
                            {
                                label: 'Scl A',
                                value: 0.193 / 1.579,
                                valueLabel: '0.193',
                                tone: 'blue',
                            },
                            {
                                label: 'B',
                                value: 1.386 / 1.579,
                                valueLabel: '1.386',
                                tone: 'green',
                            },
                            {
                                label: 'Sum',
                                value: 1,
                                valueLabel: '1.579',
                                tone: 'purple',
                            },
                        ]}
                    />
                </Panel>
                <Panel
                    c={c}
                    width={447}
                    padding={14}
                    gap={12}
                    tone="green"
                    titleFontSize={32}
                    title="Share of merged d = 1.578968"
                >
                    <StackedBar
                        c={c}
                        width={415}
                        height={85}
                        showLegend
                        segments={[
                            {
                                label: 'A: 0.192772',
                                value: 0.192772,
                                color: 'info',
                                valueLabel: '12.2%',
                            },
                            {
                                label: 'B: 1.386195',
                                value: 1.386195,
                                color: 'positive',
                                valueLabel: '87.8%',
                            },
                        ]}
                    />
                    <TextLabel
                        c={c}
                        text="exp(4 - 6) aligns A before adding B"
                        fontSize={28}
                        align="center"
                    />
                </Panel>
            </Row>
        </Scene>
    )
}

export default create('dark')
