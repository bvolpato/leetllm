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
export const height = 740
export const alt =
    'Three independent MCP verification gates: Gate 1 host review hides promote_model despite its readOnlyHint annotation; Gate 2 server authorization denies service ads access to a search-owned release; Gate 3 host verification drops a schema-valid reranker-v16 response when the request expected reranker-v17 even though response ID 3 matches.'

function gatePanel(
    c: Parameters<typeof Panel>[0]['c'],
    opts: {
        title: string
        inputText: string
        badge: string
        reason: string
        tone: 'warm' | 'critical'
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
                    gap: 10,
                    align: 'center',
                    children: [
                        BadgePill({ c, text: opts.badge, tone: 'critical', fontSize: 19 }),
                        TextLabel({
                            c,
                            text: opts.inputText,
                            fontSize: 19,
                            color: c.textPrimary,
                        }),
                    ],
                }),
                TextLabel({
                    c,
                    text: opts.reason,
                    fontSize: 19,
                    color: c.textSecondary,
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
        gap: 10,
        contentWidth,
        children: [
            Panel({
                c,
                tone: 'blue',
                width: contentWidth,
                padding: 10,
                gap: 4,
                title: 'Three separate gates guard MCP tool calls',
                children: TextLabel({
                    c,
                    text: 'Passing discovery, schema syntax, or request ID matching does not bypass remaining checks.',
                    fontSize: 19,
                    color: getReadableToneColor('blue', c),
                }),
            }),
            Column({
                gap: 6,
                align: 'center',
                children: [
                    gatePanel(c, {
                        title: 'Gate 1: Host catalog review',
                        badge: 'HIDDEN',
                        inputText: 'promote_model (readOnlyHint: true)',
                        reason: 'Untrusted server annotations cannot clear a write tool for prompt exposure.',
                        tone: 'warm',
                        panelWidth: contentWidth,
                    }),
                    FlowArrow({
                        c,
                        direction: 'down',
                        length: 16,
                        tone: 'blue',
                    }),
                    gatePanel(c, {
                        title: 'Gate 2: Server tenant check',
                        badge: 'DENIED',
                        inputText: 'caller: ads on search release',
                        reason: 'Server derives tenant from verified credentials and blocks cross-team reads.',
                        tone: 'critical',
                        panelWidth: contentWidth,
                    }),
                    FlowArrow({
                        c,
                        direction: 'down',
                        length: 16,
                        tone: 'blue',
                    }),
                    gatePanel(c, {
                        title: 'Gate 3: Host reply target match',
                        badge: 'DROPPED',
                        inputText: 'got reranker-v16 (want v17)',
                        reason: 'Matching id 3 and valid JSON schema still fail when the target release mismatches.',
                        tone: 'critical',
                        panelWidth: contentWidth,
                    }),
                ],
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
