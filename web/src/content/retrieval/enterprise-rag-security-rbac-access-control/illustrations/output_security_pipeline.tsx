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
    getReadableToneColor,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'A four-stage egress security pipeline for model drafts. Stage 1 verifies that all documents in the complete context manifest remain authorized for the caller. If any source was revoked mid-generation, the entire draft is discarded. Stage 2 executes PII and secret redaction. Stage 3 confirms that all citations match permitted manifest IDs. Stage 4 verifies claim-level grounding before safe response release.'

const illustration = defineIllustration((c) => {
    const green = getReadableToneColor('green', c)
    const critical = getReadableToneColor('critical', c)
    const warm = getReadableToneColor('warm', c)

    return (
        <Scene
            c={c}
            title="Egress Security and Output Gate Validation"
            subtitle="Re-authorizing context manifests, scrubbing sensitive patterns, and auditing citations"
            padding={20}
            gap={10}
            contentWidth={820}
        >
            <Row gap={10} align="start" justify="space-between">
                {/* Gate 1: Manifest Re-Authorization */}
                <Panel
                    c={c}
                    title="1 · Re-Authorize Manifest"
                    tone="blue"
                    padding={10}
                    gap={6}
                    titleFontSize={13}
                    width={195}
                >
                    <Column gap={5} align="center">
                        <BadgePill
                            c={c}
                            text="Context Manifest"
                            tone="blue"
                            filled
                            fontSize={10}
                            width={115}
                            height={20}
                        />
                        <TextLabel
                            c={c}
                            text="[FAQ, Key-Runbook]"
                            fontSize={10}
                            color={c.textSecondary}
                            mono
                        />
                        <FlowArrow c={c} direction="down" tone="blue" length={8} />
                        <BadgePill
                            c={c}
                            text="Recheck ACL"
                            tone="blue"
                            filled={false}
                            fontSize={10}
                            width={90}
                            height={20}
                        />
                        <TextLabel
                            c={c}
                            text="If any doc in manifest was revoked mid-call: DISCARD whole draft immediately."
                            fontSize={10}
                            color={c.textSecondary}
                            align="center"
                        />
                    </Column>
                </Panel>

                {/* Gate 2: Secret & PII Scrubbing */}
                <Panel
                    c={c}
                    title="2 · Secret Redaction"
                    tone="warm"
                    padding={10}
                    gap={6}
                    titleFontSize={13}
                    width={195}
                >
                    <Column gap={5} align="center">
                        <BadgePill
                            c={c}
                            text="Pattern Scanner"
                            tone="warm"
                            filled
                            fontSize={10}
                            width={105}
                            height={20}
                        />
                        <TextLabel
                            c={c}
                            text="API keys, tokens, PII"
                            fontSize={10}
                            color={c.textSecondary}
                        />
                        <FlowArrow c={c} direction="down" tone="warm" length={8} />
                        <BadgePill
                            c={c}
                            text="Token Masking"
                            tone="warm"
                            filled={false}
                            fontSize={10}
                            width={100}
                            height={20}
                        />
                        <TextLabel
                            c={c}
                            text="Scans decoded tokens against regex and high-entropy secret detectors."
                            fontSize={10}
                            color={c.textSecondary}
                            align="center"
                        />
                    </Column>
                </Panel>

                {/* Gate 3: Citation Integrity */}
                <Panel
                    c={c}
                    title="3 · Citation Binding"
                    tone="cyan"
                    padding={10}
                    gap={6}
                    titleFontSize={13}
                    width={195}
                >
                    <Column gap={5} align="center">
                        <BadgePill
                            c={c}
                            text="Citations in Draft"
                            tone="cyan"
                            filled
                            fontSize={10}
                            width={110}
                            height={20}
                        />
                        <TextLabel
                            c={c}
                            text="[E1: ops-runbook-faq]"
                            fontSize={10}
                            color={c.textSecondary}
                            mono
                        />
                        <FlowArrow c={c} direction="down" tone="cyan" length={8} />
                        <BadgePill
                            c={c}
                            text="Subset Check"
                            tone="cyan"
                            filled={false}
                            fontSize={10}
                            width={90}
                            height={20}
                        />
                        <TextLabel
                            c={c}
                            text="Every cited ID must exist in the caller-authorized context manifest."
                            fontSize={10}
                            color={c.textSecondary}
                            align="center"
                        />
                    </Column>
                </Panel>

                {/* Gate 4: Grounding & Release */}
                <Panel
                    c={c}
                    title="4 · Grounding Release"
                    tone="green"
                    padding={10}
                    gap={6}
                    titleFontSize={13}
                    width={195}
                >
                    <Column gap={5} align="center">
                        <BadgePill
                            c={c}
                            text="Entailment Check"
                            tone="green"
                            filled
                            fontSize={10}
                            width={110}
                            height={20}
                        />
                        <FlowArrow c={c} direction="down" tone="green" length={8} />
                        <BadgePill
                            c={c}
                            text="SAFE RELEASE"
                            tone="green"
                            filled
                            fontSize={10}
                            width={100}
                            height={22}
                        />
                        <TextLabel
                            c={c}
                            text="Response streamed to caller with verified citation lineage and trace log."
                            fontSize={10}
                            color={c.textSecondary}
                            align="center"
                        />
                    </Column>
                </Panel>
            </Row>

            <Card c={c} padding={8} gap={2} width={816}>
                <TextLabel
                    c={c}
                    text="Crucial invariant: Never evaluate access only on cited sources. A model draft can reflect un-cited context documents that were revoked during the request."
                    fontSize={11}
                    color={c.textSecondary}
                    align="center"
                />
            </Card>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
