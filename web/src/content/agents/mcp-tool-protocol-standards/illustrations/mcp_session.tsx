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
    withDensity,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 620
export const height = 780
export const alt =
    'Three JSON-RPC 2.0 request and response pairs with matching IDs under MCP 2026-07-28: id 1 server/discover returns supported versions and tools capability, id 2 tools/list returns get_release_status, and id 3 tools/call for reranker-v17 returns resultType complete, isError false, and canary_clean. Every request repeats protocolVersion and clientCapabilities under params._meta.'

function exchangeCard(
    c: Parameters<typeof Panel>[0]['c'],
    opts: {
        title: string
        reqId: string
        method: string
        reqBody: string
        resId: string
        resBody: string
        tone: 'neutral' | 'blue'
        panelWidth: number
    },
) {
    return Panel({
        c,
        tone: opts.tone,
        width: opts.panelWidth,
        padding: 10,
        gap: 6,
        title: opts.title,
        children: Column({
            gap: 6,
            children: [
                Row({
                    gap: 8,
                    align: 'center',
                    children: [
                        BadgePill({ c, text: opts.reqId, tone: 'neutral', fontSize: 19 }),
                        BadgePill({ c, text: opts.method, tone: 'purple', fontSize: 19 }),
                        TextLabel({
                            c,
                            text: opts.reqBody,
                            fontSize: 19,
                            color: c.textSecondary,
                        }),
                    ],
                }),
                Row({
                    gap: 8,
                    align: 'center',
                    children: [
                        BadgePill({ c, text: opts.resId, tone: 'green', fontSize: 19 }),
                        TextLabel({
                            c,
                            text: opts.resBody,
                            fontSize: 19,
                            color: getReadableToneColor('green', c),
                        }),
                    ],
                }),
            ],
        }),
    })
}

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 1.85)
    const contentWidth = width - 24

    return Scene({
        c,
        padding: 12,
        gap: 8,
        contentWidth,
        children: [
            Panel({
                c,
                tone: 'blue',
                width: contentWidth,
                padding: 10,
                gap: 4,
                title: 'MCP 2026-07-28: every request sends _meta',
                children: TextLabel({
                    c,
                    text: 'protocolVersion: "2026-07-28", clientCapabilities: {}',
                    fontSize: 19,
                    color: getReadableToneColor('blue', c),
                }),
            }),
            Column({
                gap: 6,
                align: 'center',
                children: [
                    exchangeCard(c, {
                        title: '1. Capability pre-flight (optional)',
                        reqId: 'REQ id:1',
                        method: 'server/discover',
                        reqBody: '+ _meta',
                        resId: 'RES id:1',
                        resBody: 'versions: ["2026-07-28"], tools: {}',
                        tone: 'neutral',
                        panelWidth: contentWidth,
                    }),
                    FlowArrow({
                        c,
                        direction: 'down',
                        length: 16,
                        tone: 'blue',
                    }),
                    exchangeCard(c, {
                        title: '2. Catalog discovery',
                        reqId: 'REQ id:2',
                        method: 'tools/list',
                        reqBody: '+ _meta',
                        resId: 'RES id:2',
                        resBody: 'get_release_status + schemas',
                        tone: 'neutral',
                        panelWidth: contentWidth,
                    }),
                    FlowArrow({
                        c,
                        direction: 'down',
                        length: 16,
                        tone: 'blue',
                    }),
                    exchangeCard(c, {
                        title: '3. Tool invocation',
                        reqId: 'REQ id:3',
                        method: 'tools/call',
                        reqBody: 'reranker-v17 + _meta',
                        resId: 'RES id:3',
                        resBody: 'complete, isError: false, canary_clean',
                        tone: 'blue',
                        panelWidth: contentWidth,
                    }),
                ],
            }),
            Panel({
                c,
                tone: 'warm',
                width: contentWidth,
                padding: 10,
                gap: 4,
                title: 'Client checks before accepting output',
                children: TextLabel({
                    c,
                    text: 'Match pending id, check resultType == complete, reject isError == true, validate outputSchema.',
                    fontSize: 19,
                    color: getReadableToneColor('warm', c),
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
