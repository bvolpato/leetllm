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
export const height = 800
export const alt =
    'Top panel compares 3 x 4 = 12 custom adapters against 3 + 4 = 7 shared MCP modules. Main diagram shows one host orchestrating three 1:1 MCP client-server links: Deployments returns canary_clean, Rollout Policy times out, and Traffic Control is held by host policy with shift_traffic blocked despite a reachable socket.'

function laneRow(
    c: Parameters<typeof Panel>[0]['c'],
    opts: {
        clientTitle: string
        clientMeta: string
        arrowLabel: string
        serverTitle: string
        statusText: string
        tone: 'green' | 'critical' | 'warm'
    },
) {
    return Row({
        gap: 8,
        align: 'center',
        children: [
            Panel({
                c,
                tone: 'neutral',
                width: 198,
                padding: 8,
                gap: 4,
                title: opts.clientTitle,
                children: TextLabel({
                    c,
                    text: opts.clientMeta,
                    fontSize: 19,
                    color: c.textSecondary,
                }),
            }),
            FlowArrow({
                c,
                direction: 'right',
                length: 76,
                label: opts.arrowLabel,
                tone: opts.tone,
            }),
            Panel({
                c,
                tone: opts.tone,
                width: 284,
                padding: 8,
                gap: 4,
                title: opts.serverTitle,
                children: BadgePill({
                    c,
                    text: opts.statusText,
                    tone: opts.tone,
                    fontSize: 19,
                }),
            }),
        ],
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
                tone: 'neutral',
                width: contentWidth,
                padding: 8,
                gap: 6,
                title: 'Shared protocol cuts integration pairs',
                children: Row({
                    gap: 10,
                    children: [
                        Panel({
                            c,
                            tone: 'neutral',
                            width: 280,
                            padding: 8,
                            gap: 4,
                            title: 'Custom: 3 x 4 = 12',
                            children: TextLabel({
                                c,
                                text: 'Separate adapter per app',
                                fontSize: 19,
                                color: c.textSecondary,
                            }),
                        }),
                        Panel({
                            c,
                            tone: 'blue',
                            width: 284,
                            padding: 8,
                            gap: 4,
                            title: 'MCP: 3 + 4 = 7',
                            children: TextLabel({
                                c,
                                text: 'Each link still checks access',
                                fontSize: 19,
                                color: getReadableToneColor('blue', c),
                            }),
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                tone: 'blue',
                width: contentWidth,
                padding: 10,
                gap: 8,
                title: 'One host runs three 1:1 client-server links',
                subtitle: 'Host policy gates every call before any client sends',
                children: Column({
                    gap: 8,
                    children: [
                        laneRow(c, {
                            clientTitle: 'Client 1',
                            clientMeta: 'get_release_status',
                            arrowLabel: 'read',
                            serverTitle: 'Deployments Server',
                            statusText: 'canary_clean',
                            tone: 'green',
                        }),
                        laneRow(c, {
                            clientTitle: 'Client 2',
                            clientMeta: 'get_rollout_policy',
                            arrowLabel: '5s limit',
                            serverTitle: 'Policy Server',
                            statusText: 'timeout (fail closed)',
                            tone: 'critical',
                        }),
                        laneRow(c, {
                            clientTitle: 'Client 3',
                            clientMeta: 'shift_traffic',
                            arrowLabel: 'HELD',
                            serverTitle: 'Traffic Server (up)',
                            statusText: 'held: missing policy',
                            tone: 'warm',
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                tone: 'warm',
                width: contentWidth,
                padding: 8,
                gap: 4,
                title: 'Connection health does not grant execution',
                children: TextLabel({
                    c,
                    text: 'Client 1 completes its read while host policy holds shift_traffic despite Traffic Server reachability.',
                    fontSize: 19,
                    color: getReadableToneColor('warm', c),
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
