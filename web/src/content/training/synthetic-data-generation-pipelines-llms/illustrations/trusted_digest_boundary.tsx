import React from 'react'
import {
    Card,
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'Approved bytes {"page_size":100} followed by a newline have SHA-256 prefix a1052512c4b5. Changed bytes {"page_size":10000} have prefix dfd022ebeedd. A rewritten manifest stores the changed digest, so the changed bytes match that manifest and differ from the protected approved reference. A digest compares bytes with a known reference; approval identity and immutability require separate controls.'

const illustration = defineIllustration((c) => (
    <Scene
        c={c}
        title="A digest needs a trusted reference"
        subtitle="Cryptographic byte hashing · trusted root reference"
        padding={22}
        gap={12}
        contentWidth={816}
    >
        <Row gap={16} align="start">
            <Column gap={10} width={360}>
                <Panel
                    c={c}
                    title="Canonical approved artifact"
                    tone="green"
                    padding={12}
                    gap={6}
                    titleFontSize={14}
                >
                    <TextLabel c={c} text={'{"page_size": 100}\\n'} fontSize={13} mono />
                    <Row gap={6} align="center">
                        <FlowArrow c={c} direction="right" tone="green" length={14} />
                        <TextLabel c={c} text="SHA-256:" fontSize={11} color={c.textSecondary} />
                        <TextLabel
                            c={c}
                            text="a1052512c4b5…"
                            fontSize={12}
                            fontWeight={700}
                            color={c.positiveLight}
                            mono
                        />
                    </Row>
                </Panel>

                <Panel
                    c={c}
                    title="Modified payload"
                    tone="critical"
                    padding={12}
                    gap={6}
                    titleFontSize={14}
                >
                    <TextLabel c={c} text={'{"page_size": 10000}\\n'} fontSize={13} mono />
                    <Row gap={6} align="center">
                        <FlowArrow c={c} direction="right" tone="critical" length={14} />
                        <TextLabel c={c} text="SHA-256:" fontSize={11} color={c.textSecondary} />
                        <TextLabel
                            c={c}
                            text="dfd022ebeedd…"
                            fontSize={12}
                            fontWeight={700}
                            color={c.criticalLight}
                            mono
                        />
                    </Row>
                </Panel>
            </Column>

            <Column gap={10} width={440}>
                <Panel
                    c={c}
                    title="Comparison boundaries define trust"
                    tone="cyan"
                    padding={12}
                    gap={10}
                    titleFontSize={14}
                >
                    <Column gap={10}>
                        <Column gap={3}>
                            <Row gap={8} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text="Modified bytes ↔ Local file manifest"
                                    fontSize={12}
                                    fontWeight={700}
                                />
                                <BadgePill
                                    c={c}
                                    text="MATCH (Spoofed)"
                                    tone="warm"
                                    filled={false}
                                    fontSize={11}
                                    width={118}
                                    height={24}
                                />
                            </Row>
                            <TextLabel
                                c={c}
                                text="If the manifest is recomputed alongside edits, local checksum matches but payload is altered."
                                fontSize={11}
                                color={c.textSecondary}
                            />
                        </Column>

                        <Column gap={3}>
                            <Row gap={8} align="center" justify="space-between">
                                <TextLabel
                                    c={c}
                                    text="Modified bytes ↔ Immutable root digest"
                                    fontSize={12}
                                    fontWeight={700}
                                />
                                <BadgePill
                                    c={c}
                                    text="TAMPER DETECTED"
                                    tone="critical"
                                    filled
                                    fontSize={11}
                                    width={130}
                                    height={24}
                                />
                            </Row>
                            <TextLabel
                                c={c}
                                text="Verification against an out-of-band immutable reference immediately flags unauthorized mutation."
                                fontSize={11}
                                color={c.textSecondary}
                            />
                        </Column>
                    </Column>
                </Panel>

                <Card c={c} padding={8} gap={2}>
                    <TextLabel
                        c={c}
                        text="Digest algorithms prove byte identity, not authorization. The root digest reference must be immutable."
                        fontSize={11}
                        color={c.textSecondary}
                        align="center"
                    />
                </Card>
            </Column>
        </Row>
    </Scene>
))

export const create = illustration.create
export default illustration.default
