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

export const width = 680
export const height = 640
export const alt =
    'NLI verdict matrix comparing generated claims against one source passage stating manager approval is required and the rollback window is 30 minutes: approval required maps to entailed and released, 2-hour rollback maps to contradicted and held, and weekly on-call maps to neutral and abstained.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.85)
    const claimBranch = (
        title: string,
        claimText: string,
        verdict: string,
        route: string,
        tone: 'green' | 'red' | 'warm',
    ) =>
        Panel({
            c,
            title,
            tone,
            width: 208,
            padding: 10,
            titleFontSize: 20,
            children: Column({
                gap: 8,
                children: [
                    TextLabel({ c, text: claimText, fontSize: 20 }),
                    BadgePill({ c, text: verdict, tone, fontSize: 20 }),
                    FlowArrow({ c, direction: 'down', tone, length: 18 }),
                    BadgePill({ c, text: route, tone, fontSize: 20, filled: true }),
                ],
            }),
        })

    return Scene({
        c,
        title: 'Claim-to-Passage NLI Verification Routing',
        padding: 16,
        gap: 12,
        contentWidth: 648,
        children: [
            Panel({
                c,
                title: 'Pinned Policy Passage (doc-v4)',
                tone: 'blue',
                width: 648,
                padding: 12,
                titleFontSize: 20,
                children: TextLabel({
                    c,
                    text: '"Manager approval is required. Rollback window is 30 min."',
                    fontSize: 20,
                }),
            }),
            FlowArrow({ c, direction: 'down', tone: 'blue', length: 20 }),
            Row({
                gap: 12,
                align: 'stretch',
                children: [
                    claimBranch('Claim 1', '"Approval required"', 'Entailed', 'Release', 'green'),
                    claimBranch(
                        'Claim 2',
                        '"2h rollback limit"',
                        'Contradicted',
                        'Hold / Fix',
                        'red',
                    ),
                    claimBranch('Claim 3', '"On-call schedule"', 'Neutral', 'Abstain', 'warm'),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
