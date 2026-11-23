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
export const height = 700
export const alt =
    'Top panel shows integer reduction shrinking 4,194,304 int32 inputs at 512 elements per block into 8,192 int64 partials, 16 partials, and 1 final sum. Bottom panel shows the scan hierarchy threshold at 512^2 = 262,144 elements: 262,144 yields 512 block totals fitting one metadata block, while 262,145 (+1) yields 513 totals spanning 2 blocks and adding a recursion level.'

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
                title="Reduction hierarchy (512 inputs per block)"
            >
                <TextLabel
                    c={c}
                    text="Array shrinks 512x per level to one int64 total"
                    fontSize={28}
                />
                <Row gap={8} align="center" justify="space-between">
                    <BadgePill c={c} text="4,194,304 int32" tone="neutral" fontSize={28} />
                    <Arrow c={c} direction="right" length={18} />
                    <BadgePill c={c} text="8,192 int64" tone="blue" fontSize={28} />
                    <Arrow c={c} direction="right" length={18} />
                    <BadgePill c={c} text="16 int64" tone="purple" fontSize={28} />
                    <Arrow c={c} direction="right" length={18} />
                    <BadgePill c={c} text="1 total" tone="green" fontSize={28} />
                </Row>
            </Panel>
            <Panel
                c={c}
                width={908}
                padding={14}
                gap={12}
                tone="blue"
                titleFontSize={32}
                title="Scan recursion depth threshold at 512^2 = 262,144"
            >
                <Card
                    c={c}
                    tone="green"
                    padding={12}
                    gap={8}
                    title="N = 262,144: 512 totals fit in one metadata block"
                >
                    <Row gap={10} align="center" justify="space-between">
                        <BadgePill c={c} text="262,144 inputs" fontSize={28} />
                        <Arrow c={c} direction="right" length={20} />
                        <BadgePill c={c} text="512 block totals" tone="blue" fontSize={28} />
                        <Arrow c={c} direction="right" length={20} />
                        <BadgePill c={c} text="1 metadata block" tone="green" fontSize={28} />
                    </Row>
                </Card>
                <Card
                    c={c}
                    tone="warm"
                    padding={12}
                    gap={8}
                    title="N = 262,145 (+1): 513 totals force extra recursion"
                >
                    <Row gap={10} align="center" justify="space-between">
                        <BadgePill c={c} text="513 block totals" tone="warm" fontSize={28} />
                        <Arrow c={c} direction="right" length={20} />
                        <BadgePill c={c} text="2 meta blocks" tone="red" fontSize={28} />
                        <Arrow c={c} direction="right" length={20} />
                        <BadgePill c={c} text="+1 recursion level" tone="purple" fontSize={28} />
                    </Row>
                </Card>
            </Panel>
        </Scene>
    )
}

export default create('dark')
