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
export const height = 700
export const alt =
    'Secret-zero credential broker architecture across a Unix domain socket: the sandboxed worker has no API token and sends requests to the host broker, which allows GET on owner/repo/pulls/42, rejects POST, DELETE, and other repositories with 403 before upstream egress, attaches host credentials outbound, and strips extra reply fields such as debug_token.'

const illustration = defineIllustration((baseTheme) => {
    const c = withDensity(baseTheme, 1.85)
    const box = (title: string, detail: string, tone: 'blue' | 'purple' | 'green') =>
        Panel({
            c,
            title,
            tone,
            width: 190,
            padding: 10,
            titleFontSize: 20,
            children: TextLabel({ c, text: detail, fontSize: 20, mono: true }),
        })

    const ruleRow = (req: string, verdict: string, tone: 'green' | 'red' | 'warm') =>
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
        title: 'Secret-Zero Credential Broker Over Unix Socket',
        padding: 16,
        gap: 12,
        contentWidth: 648,
        children: [
            Row({
                gap: 8,
                align: 'stretch',
                children: [
                    box('Worker Sandbox', 'No token · UDS', 'blue'),
                    FlowArrow({ c, direction: 'right', tone: 'blue', length: 20 }),
                    box('Host Broker', 'Origin + ACL gate', 'purple'),
                    FlowArrow({ c, direction: 'right', tone: 'green', length: 20 }),
                    box('Upstream API', '+ Bearer token', 'green'),
                ],
            }),
            Panel({
                c,
                title: '1. Inbound Egress Policy Checks (Before Upstream Call)',
                tone: 'blue',
                width: 648,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        ruleRow('GET owner/repo/pulls/42', 'Attach token -> 200', 'green'),
                        ruleRow('POST / DELETE /pulls/42', '403 blocked locally', 'red'),
                        ruleRow('GET other/repo/pulls/42', '403 wrong repository', 'red'),
                    ],
                }),
            }),
            Panel({
                c,
                title: '2. Outbound Response Allowlist Sanitizer',
                tone: 'warm',
                width: 648,
                padding: 12,
                titleFontSize: 20,
                children: Column({
                    gap: 8,
                    children: [
                        TextLabel({
                            c,
                            text: 'Raw API reply: {number: 42, state: "open", debug_token: "..."}',
                            fontSize: 20,
                            mono: true,
                        }),
                        BadgePill({
                            c,
                            text: 'Worker receives only: {number: 42, state: "open"}',
                            tone: 'green',
                            fontSize: 20,
                        }),
                    ],
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
