import {
    BadgePill,
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 620
export const height = 740
export const alt =
    'A six-step release-status trace across Operator, Model, Host, and API. Turn 1: Operator asks why reranker-v16 failed; Model emits get_release_status(reranker-v16) with fc_item_1 and call_id status-1. Host verifies schema, release_id, and session project, queries API (canary_failed, error_rate 0.081, error_budget 0.02), and returns untrusted function_call_output linked by call_id status-1. Turn 2: Model compares 0.081 > 0.02 and answers.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 1.85)
    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 596,
        children: [
            Panel({
                c,
                title: 'Turn 1: Proposal & Host Execution',
                subtitle: 'Model proposes arguments; Host owns auth & API read',
                tone: 'blue',
                width: 596,
                padding: 10,
                gap: 8,
                children: Column({
                    gap: 8,
                    align: 'center',
                    children: [
                        Row({
                            gap: 8,
                            align: 'center',
                            justify: 'center',
                            children: [
                                BadgePill({
                                    c,
                                    text: '1. Operator',
                                    tone: 'neutral',
                                    fontSize: 19,
                                }),
                                FlowArrow({
                                    c,
                                    direction: 'right',
                                    length: 12,
                                    tone: 'neutral',
                                }),
                                BadgePill({
                                    c,
                                    text: 'Why did reranker-v16 fail?',
                                    tone: 'blue',
                                    fontSize: 19,
                                }),
                            ],
                        }),
                        Row({
                            gap: 8,
                            align: 'center',
                            justify: 'center',
                            children: [
                                BadgePill({ c, text: '2. Model', tone: 'blue', fontSize: 19 }),
                                FlowArrow({ c, direction: 'right', length: 10, tone: 'blue' }),
                                BadgePill({
                                    c,
                                    text: 'get_release_status(v16) [status-1]',
                                    tone: 'purple',
                                    fontSize: 19,
                                }),
                            ],
                        }),
                        Row({
                            gap: 8,
                            align: 'center',
                            justify: 'center',
                            children: [
                                BadgePill({
                                    c,
                                    text: '3. Host check',
                                    tone: 'purple',
                                    fontSize: 19,
                                }),
                                FlowArrow({
                                    c,
                                    direction: 'right',
                                    length: 10,
                                    tone: 'purple',
                                }),
                                BadgePill({
                                    c,
                                    text: 'ID shape + session project match',
                                    tone: 'purple',
                                    fontSize: 19,
                                }),
                            ],
                        }),
                        Row({
                            gap: 8,
                            align: 'center',
                            justify: 'center',
                            children: [
                                BadgePill({
                                    c,
                                    text: '4. Host <-> API',
                                    tone: 'green',
                                    fontSize: 19,
                                }),
                                FlowArrow({ c, direction: 'right', length: 10, tone: 'green' }),
                                BadgePill({
                                    c,
                                    text: 'canary_failed | err 0.081, cap 0.02',
                                    tone: 'green',
                                    fontSize: 19,
                                }),
                            ],
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                title: 'Turn 2: Linked Observation & Answer',
                subtitle: 'Call ID correlates output; data returns as untrusted',
                tone: 'warm',
                width: 596,
                padding: 10,
                gap: 8,
                children: Column({
                    gap: 8,
                    align: 'center',
                    children: [
                        Row({
                            gap: 8,
                            align: 'center',
                            justify: 'center',
                            children: [
                                BadgePill({
                                    c,
                                    text: '5. Host -> Model',
                                    tone: 'warm',
                                    fontSize: 19,
                                }),
                                FlowArrow({ c, direction: 'right', length: 10, tone: 'warm' }),
                                BadgePill({
                                    c,
                                    text: 'call_output [status-1, untrusted]',
                                    tone: 'warm',
                                    fontSize: 19,
                                }),
                            ],
                        }),
                        Row({
                            gap: 8,
                            align: 'center',
                            justify: 'center',
                            children: [
                                BadgePill({
                                    c,
                                    text: '6. Model -> Operator',
                                    tone: 'blue',
                                    fontSize: 19,
                                }),
                                FlowArrow({ c, direction: 'right', length: 10, tone: 'blue' }),
                                BadgePill({
                                    c,
                                    text: '0.081 > 0.02: over error budget',
                                    tone: 'green',
                                    fontSize: 19,
                                }),
                            ],
                        }),
                    ],
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
