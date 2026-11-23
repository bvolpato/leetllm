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

export const width = 760
export const height = 560
export const preset = 'engineering'
export const alt =
    'A jitted function reading Python global scale captures scale=1 on the first call with float32 shape [4] and returns 4. Changing global scale=3 while reusing shape [4] hits Trace A and still returns 4. Calling shape [2] misses cache, traces with global scale=3 as Trace B, and returns 6. Passing scale=3 as an explicit array argument returns 12 on shape [4].'

function callBox(
    c: Parameters<typeof Panel>[0]['c'],
    title: string,
    status: string,
    out: string,
    tone: 'blue' | 'critical' | 'warm',
) {
    return (
        <Panel c={c} title={title} tone={tone} padding={14} width={212} titleFontSize={23}>
            <Column gap={8}>
                <TextLabel c={c} text={status} fontSize={23} color={c.textSecondary} />
                <BadgePill
                    c={c}
                    text={out}
                    tone={tone}
                    filled={false}
                    fontSize={23}
                    height={42}
                    width={182}
                />
            </Column>
        </Panel>
    )
}

const illustration = defineIllustration((c) => (
    <Scene
        c={c}
        title="JIT caches by signature and freezes Python globals"
        subtitle="Trace reuse on [4] vs retrace on [2] vs explicit scalar input"
        padding={20}
        gap={14}
        contentWidth={720}
    >
        <Column gap={14}>
            <Row gap={8} align="center" justify="space-between">
                {callBox(c, '1. x=[4], g=1', 'Miss → Trace A', 'Out: 4 (bakes 1)', 'blue')}
                <FlowArrow c={c} direction="right" tone="neutral" length={18} />
                {callBox(c, '2. x=[4], g=3', 'Hit → Trace A', 'Out: 4 (stale 1)', 'critical')}
                <FlowArrow c={c} direction="right" tone="neutral" length={18} />
                {callBox(c, '3. x=[2], g=3', 'Miss → Trace B', 'Out: 6 (bakes 3)', 'warm')}
            </Row>
            <Panel
                c={c}
                title="Explicit scalar array avoids stale capture"
                tone="green"
                padding={16}
                titleFontSize={24}
            >
                <Row gap={14} align="center" justify="space-between">
                    <Column gap={6} width={520}>
                        <TextLabel
                            c={c}
                            text="fn(ones([4]), scale=jnp.asarray(3.0))"
                            fontSize={23}
                            mono
                        />
                        <TextLabel
                            c={c}
                            text="Signature: ([4], f32) + live array value"
                            fontSize={23}
                            color={c.textSecondary}
                        />
                    </Column>
                    <BadgePill
                        c={c}
                        text="Out: 12"
                        tone="green"
                        filled
                        fontSize={24}
                        height={44}
                        width={148}
                    />
                </Row>
            </Panel>
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
