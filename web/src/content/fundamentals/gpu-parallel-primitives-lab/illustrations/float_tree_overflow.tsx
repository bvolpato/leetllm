import React from 'react'
import {
    Arrow,
    BadgePill,
    Card,
    Panel,
    Row,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 940
export const height = 740
export const alt =
    'Left panel compares float32 grouping on a = 1e8, b = 1.0, and c = -1e8 where ULP spacing is 8: (a + b) + c drops 1.0 to give 0.0, whereas (a + c) + b cancels first to give 1.0. Right panel contrasts signed int64 overflow where (I64_MAX + 1) + (-1) triggers undefined behavior first, while I64_MAX + (1 + -1) stays valid.'

export function create(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), 2.8)
    return (
        <Scene c={c} padding={16} gap={14}>
            <Row gap={14} align="stretch">
                <Panel
                    c={c}
                    width={447}
                    padding={14}
                    gap={12}
                    tone="purple"
                    titleFontSize={32}
                    title="Float32 grouping error"
                >
                    <TextLabel c={c} text="a = 1e8, b = 1, c = -1e8 (ULP = 8)" fontSize={28} />
                    <Card c={c} tone="red" padding={12} gap={8} title="(a + b) + c = 0.0">
                        <Row gap={8} align="center" justify="center">
                            <BadgePill c={c} text="1e8+1=1e8" tone="warm" fontSize={28} />
                            <Arrow c={c} direction="right" length={16} />
                            <BadgePill c={c} text="-1e8=0.0" tone="red" fontSize={28} />
                        </Row>
                        <TextLabel c={c} text="Absorbs small term before cancel" fontSize={28} />
                    </Card>
                    <Card c={c} tone="green" padding={12} gap={8} title="(a + c) + b = 1.0">
                        <Row gap={8} align="center" justify="center">
                            <BadgePill c={c} text="1e8-1e8=0" tone="blue" fontSize={28} />
                            <Arrow c={c} direction="right" length={16} />
                            <BadgePill c={c} text="+1.0=1.0" tone="green" fontSize={28} />
                        </Row>
                        <TextLabel c={c} text="Cancels big pair before adding 1" fontSize={28} />
                    </Card>
                    <TextLabel
                        c={c}
                        text="Repeatability is not accuracy"
                        fontSize={28}
                        align="center"
                    />
                </Panel>
                <Panel
                    c={c}
                    width={447}
                    padding={14}
                    gap={12}
                    tone="blue"
                    titleFontSize={32}
                    title="Signed int64 overflow"
                >
                    <TextLabel c={c} text="Valid final sum cannot undo UB" fontSize={28} />
                    <Card c={c} tone="red" padding={12} gap={8} title="(I64_MAX + 1) - 1">
                        <Row gap={8} align="center" justify="center">
                            <BadgePill c={c} text="MAX + 1" tone="red" fontSize={28} />
                            <Arrow c={c} direction="right" length={16} />
                            <BadgePill c={c} text="Overflow UB" tone="red" fontSize={28} />
                        </Row>
                        <TextLabel c={c} text="Up-sweep triggers signed overflow" fontSize={28} />
                    </Card>
                    <Card c={c} tone="green" padding={12} gap={8} title="I64_MAX + (1 - 1)">
                        <Row gap={8} align="center" justify="center">
                            <BadgePill c={c} text="1+(-1)=0" tone="blue" fontSize={28} />
                            <Arrow c={c} direction="right" length={16} />
                            <BadgePill c={c} text="MAX+0=MAX" tone="green" fontSize={28} />
                        </Row>
                        <TextLabel c={c} text="Safe intermediate grouping" fontSize={28} />
                    </Card>
                    <TextLabel
                        c={c}
                        text="Bound every intermediate partial sum"
                        fontSize={28}
                        align="center"
                    />
                </Panel>
            </Row>
        </Scene>
    )
}

export default create('dark')
