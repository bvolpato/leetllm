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
    getReadableToneColor,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'Comparison of post-retrieval application filtering versus pre-retrieval store filtering across seven ranked documents. In application post-filtering, the top 5 candidates are copied over the network, but all 5 are restricted and dropped, resulting in zero results returned and data exposure. In pre-retrieval store filtering, access checks execute inside the vector index, safely returning permitted documents without network leakage.'

const illustration = defineIllustration((c) => {
    const critical = getReadableToneColor('critical', c)
    const green = getReadableToneColor('green', c)
    const cyan = getReadableToneColor('cyan', c)

    return (
        <Scene
            c={c}
            title="Pre-Retrieval vs Post-Retrieval Access Control"
            subtitle="Comparing network disclosure risk and filtered recall across architectural boundaries"
            padding={20}
            gap={12}
            contentWidth={820}
        >
            <Row gap={16} align="start" justify="space-between">
                {/* 1. Database Store Order */}
                <Panel
                    c={c}
                    title="Ranked candidates in vector store"
                    tone="neutral"
                    padding={12}
                    gap={6}
                    titleFontSize={13}
                    width={240}
                >
                    <Column gap={4}>
                        <BadgePill
                            c={c}
                            text="1 · restricted-0 (Admin)"
                            tone="critical"
                            filled={false}
                            fontSize={11}
                            height={22}
                        />
                        <BadgePill
                            c={c}
                            text="2 · restricted-1 (Admin)"
                            tone="critical"
                            filled={false}
                            fontSize={11}
                            height={22}
                        />
                        <BadgePill
                            c={c}
                            text="3 · restricted-2 (Admin)"
                            tone="critical"
                            filled={false}
                            fontSize={11}
                            height={22}
                        />
                        <BadgePill
                            c={c}
                            text="4 · restricted-3 (Admin)"
                            tone="critical"
                            filled={false}
                            fontSize={11}
                            height={22}
                        />
                        <BadgePill
                            c={c}
                            text="5 · restricted-4 (Admin)"
                            tone="critical"
                            filled={false}
                            fontSize={11}
                            height={22}
                        />
                        <BadgePill
                            c={c}
                            text="6 · incident-checklist (Ops)"
                            tone="green"
                            filled
                            fontSize={11}
                            height={22}
                        />
                        <BadgePill
                            c={c}
                            text="7 · ops-runbook-faq (Ops)"
                            tone="green"
                            filled
                            fontSize={11}
                            height={22}
                        />
                    </Column>
                </Panel>

                {/* 2. Strategy A: Application Post-Filtering */}
                <Panel
                    c={c}
                    title="Pattern A: App Post-Filtering (Unsafe)"
                    tone="critical"
                    padding={12}
                    gap={8}
                    titleFontSize={13}
                    width={264}
                >
                    <Column gap={6}>
                        <TextLabel
                            c={c}
                            text="1. Fetch global top 5 from store"
                            fontSize={11}
                            color={c.textSecondary}
                        />
                        <BadgePill
                            c={c}
                            text="5 Restricted Docs Egressed"
                            tone="critical"
                            filled
                            fontSize={11}
                            height={24}
                        />
                        <FlowArrow c={c} direction="down" tone="critical" length={10} />
                        <TextLabel
                            c={c}
                            text="2. Application checks ACL in memory"
                            fontSize={11}
                            color={c.textSecondary}
                        />
                        <BadgePill
                            c={c}
                            text="0 Permitted Docs Returned"
                            tone="critical"
                            filled={false}
                            fontSize={11}
                            height={24}
                        />
                        <TextLabel
                            c={c}
                            text="Severe failure: Protected payloads leak across network boundaries into app memory, while valid ops docs are completely missed."
                            fontSize={10}
                            color={c.textSecondary}
                        />
                    </Column>
                </Panel>

                {/* 3. Strategy B: Vector Store Pre-Filtering */}
                <Panel
                    c={c}
                    title="Pattern B: Store Pre-Filtering (Secure)"
                    tone="green"
                    padding={12}
                    gap={8}
                    titleFontSize={13}
                    width={264}
                >
                    <Column gap={6}>
                        <TextLabel
                            c={c}
                            text="1. Push ACL predicate into vector index"
                            fontSize={11}
                            color={c.textSecondary}
                        />
                        <BadgePill
                            c={c}
                            text="Zero Leakage: Filter in DB"
                            tone="green"
                            filled={false}
                            fontSize={11}
                            height={24}
                        />
                        <FlowArrow c={c} direction="down" tone="green" length={10} />
                        <TextLabel
                            c={c}
                            text="2. Nearest neighbor search over permitted"
                            fontSize={11}
                            color={c.textSecondary}
                        />
                        <BadgePill
                            c={c}
                            text="2 Permitted Docs Returned"
                            tone="green"
                            filled
                            fontSize={11}
                            height={24}
                        />
                        <TextLabel
                            c={c}
                            text="Optimal security and recall: Restricted docs never egress the database. Ranks 6 and 7 are correctly retrieved."
                            fontSize={10}
                            color={c.textSecondary}
                        />
                    </Column>
                </Panel>
            </Row>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
