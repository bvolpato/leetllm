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
    'Write guardrail stack starting from model proposal release_id=reranker-v17. Three authorization gates run in order: role and project check (stops missing role or project=ads), release policy gates (stops failed gates), and trusted approval binding operation ID op-search-v17-a (stops mismatched versions or principals). Below, Request 1 applies one effect and loses its reply; Request 2 retries with the same operation key and returns the saved result with still one effect.'

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
                title: 'Authorization Gates Before Write',
                subtitle: 'Model proposes release_id=reranker-v17 only',
                tone: 'purple',
                width: 596,
                padding: 10,
                gap: 6,
                children: Column({
                    gap: 6,
                    align: 'center',
                    children: [
                        Row({
                            gap: 8,
                            align: 'center',
                            justify: 'center',
                            children: [
                                BadgePill({
                                    c,
                                    text: '1. Role + project (search)',
                                    tone: 'purple',
                                    fontSize: 19,
                                }),
                                FlowArrow({
                                    c,
                                    direction: 'right',
                                    length: 12,
                                    tone: 'critical',
                                }),
                                BadgePill({
                                    c,
                                    text: 'Stop: no role or ads',
                                    tone: 'critical',
                                    fontSize: 19,
                                }),
                            ],
                        }),
                        FlowArrow({ c, direction: 'down', length: 10, tone: 'green' }),
                        Row({
                            gap: 8,
                            align: 'center',
                            justify: 'center',
                            children: [
                                BadgePill({
                                    c,
                                    text: '2. Policy: gates_passed=true',
                                    tone: 'purple',
                                    fontSize: 19,
                                }),
                                FlowArrow({
                                    c,
                                    direction: 'right',
                                    length: 12,
                                    tone: 'critical',
                                }),
                                BadgePill({
                                    c,
                                    text: 'Stop: gate failed',
                                    tone: 'critical',
                                    fontSize: 19,
                                }),
                            ],
                        }),
                        FlowArrow({ c, direction: 'down', length: 10, tone: 'green' }),
                        Row({
                            gap: 8,
                            align: 'center',
                            justify: 'center',
                            children: [
                                BadgePill({
                                    c,
                                    text: '3. Approval: op-search-v17-a',
                                    tone: 'green',
                                    fontSize: 19,
                                }),
                                FlowArrow({
                                    c,
                                    direction: 'right',
                                    length: 12,
                                    tone: 'critical',
                                }),
                                BadgePill({
                                    c,
                                    text: 'Stop: wrong version',
                                    tone: 'critical',
                                    fontSize: 19,
                                }),
                            ],
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                title: 'Idempotent Retry at Target Service',
                subtitle: 'Key binds action, target, and principal',
                tone: 'green',
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
                                    text: 'Req 1: op-search-v17-a',
                                    tone: 'blue',
                                    fontSize: 19,
                                }),
                                FlowArrow({ c, direction: 'right', length: 10, tone: 'green' }),
                                BadgePill({
                                    c,
                                    text: 'effects=1',
                                    tone: 'green',
                                    fontSize: 19,
                                }),
                                FlowArrow({ c, direction: 'right', length: 10, tone: 'warm' }),
                                BadgePill({
                                    c,
                                    text: 'Reply lost',
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
                                    text: 'Req 2: retry same key',
                                    tone: 'blue',
                                    fontSize: 19,
                                }),
                                FlowArrow({ c, direction: 'right', length: 10, tone: 'green' }),
                                BadgePill({
                                    c,
                                    text: 'Saved result, effects=1',
                                    tone: 'green',
                                    fontSize: 19,
                                }),
                            ],
                        }),
                        BadgePill({
                            c,
                            text: 'New approval mints a new ID -> new operation',
                            tone: 'neutral',
                            fontSize: 19,
                        }),
                    ],
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
