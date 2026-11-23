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
    withDensity,
} from 'vizmatic'
import type { ToneName } from 'vizmatic'

export const width = 680
export const height = 700
export const alt =
    'Approval binding diagram showing host-verified actor, operation ID, action digest, and single-use replay protection across five outcomes: missing approval waits, valid request executes once, exact replay stays idempotent at count one, and changed target, changed digest, or reused approval are denied.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.85)
    const tokenBox = (title: string, detail: string, tone: 'blue' | 'purple' | 'warm') =>
        Panel({
            c,
            title,
            tone,
            width: 192,
            padding: 10,
            titleFontSize: 20,
            children: TextLabel({ c, text: detail, fontSize: 20, mono: true }),
        })

    const decisionRow = (req: string, verdict: string, tone: ToneName) =>
        Row({
            gap: 8,
            justify: 'space-between',
            align: 'center',
            children: [
                TextLabel({ c, text: req, fontSize: 20, mono: true }),
                BadgePill({ c, text: verdict, tone, fontSize: 20 }),
            ],
        })

    return Scene({
        c,
        title: 'Approval Binding, Action Digests, and Replay Locks',
        padding: 16,
        gap: 12,
        contentWidth: 648,
        children: [
            Row({
                gap: 8,
                align: 'stretch',
                children: [
                    tokenBox('Host Context', 'engineer-7 · op-42', 'blue'),
                    FlowArrow({ c, direction: 'right', tone: 'blue', length: 20 }),
                    tokenBox('Action Digest', 'SHA256(prod, sha)', 'purple'),
                    FlowArrow({ c, direction: 'right', tone: 'purple', length: 20 }),
                    tokenBox('Approval Row', 'release-mgr · 15m', 'warm'),
                ],
            }),
            FlowArrow({ c, direction: 'down', tone: 'purple', length: 20 }),
            Panel({
                c,
                title: 'Execution Gate Decisions (Single-Use Lock)',
                tone: 'neutral',
                width: 648,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        decisionRow('1. No approval row', 'Wait for approval (count=0)', 'warm'),
                        decisionRow('2. Digest + TTL valid', 'Executed once (count=1)', 'green'),
                        decisionRow(
                            '3. Same op_id + digest',
                            'Idempotent replay (count=1)',
                            'green',
                        ),
                        decisionRow(
                            '4. Edited env or sha',
                            'Deny digest mismatch (count=1)',
                            'red',
                        ),
                        decisionRow('5. Consumed row reused', 'Deny replay lock (count=1)', 'red'),
                    ],
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
