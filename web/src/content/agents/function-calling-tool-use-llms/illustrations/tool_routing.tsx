import {
    BadgePill,
    BarChart,
    FlowArrow,
    Panel,
    Row,
    Scene,
    defineIllustration,
    getReadableToneColor,
    withDensity,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 620
export const height = 700
export const alt =
    'Dynamic tool routing for Why did reranker-v16 fail with caller role triage. Step 1 permission filter removes promote_model and restart_cluster (requiring ops-admin) before similarity scoring. Step 2 ranks allowed tools by cosine similarity: get_release_status (0.999) and search_release_policy (0.892). Top-2 tools reach the model, and the dispatcher checks permission again at execution.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 1.85)
    const green = getReadableToneColor('green', c, c.bg)
    const blue = getReadableToneColor('blue', c, c.bg)
    const scores = [
        {
            label: 'get_release_status',
            value: 0.999,
            color: green,
            valueLabel: '0.999',
        },
        {
            label: 'search_release_policy',
            value: 0.892,
            color: blue,
            valueLabel: '0.892',
        },
    ]

    return Scene({
        c,
        padding: 12,
        gap: 12,
        contentWidth: 596,
        children: [
            Panel({
                c,
                title: 'Step 1: Permission Pre-Filter (role: triage)',
                subtitle: 'Privileged ops-admin tools dropped before scoring',
                tone: 'critical',
                width: 596,
                padding: 10,
                children: Row({
                    gap: 8,
                    justify: 'center',
                    children: [
                        BadgePill({
                            c,
                            text: 'X promote_model (ops-admin)',
                            tone: 'critical',
                            fontSize: 19,
                        }),
                        BadgePill({
                            c,
                            text: 'X restart_cluster (ops-admin)',
                            tone: 'critical',
                            fontSize: 19,
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                title: 'Step 2: Cosine Similarity Over Allowed Tools',
                subtitle: 'Query: "Why did reranker-v16 fail?" | top-k = 2',
                tone: 'green',
                width: 596,
                padding: 10,
                children: BarChart({
                    c,
                    width: 568,
                    height: 185,
                    min: 0,
                    max: 1.2,
                    showGrid: true,
                    showValues: true,
                    data: scores,
                }),
            }),
            Panel({
                c,
                title: 'Execution still checks role',
                width: 596,
                padding: 10,
                children: Row({
                    gap: 8,
                    justify: 'center',
                    align: 'center',
                    children: [
                        BadgePill({ c, text: 'Top-2 exposed', tone: 'blue', fontSize: 19 }),
                        FlowArrow({ c, direction: 'right', length: 14, tone: 'green' }),
                        BadgePill({
                            c,
                            text: 'Dispatcher rechecks role on call',
                            tone: 'green',
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
