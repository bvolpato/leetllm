import {
    BadgePill,
    FlowArrow,
    Matrix,
    Panel,
    Row,
    Scene,
    defineIllustration,
    withDensity,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 600
export const height = 700
export const alt =
    'A strict ReleaseStatusCall schema requires release_id as a string of 1 to 128 characters and include_gates as a boolean or null, with additionalProperties false. True and null pass; 1 fails as wrong type; promote_now fails as an extra key; and an empty release_id fails minLength 1. Passing schema still requires separate runtime permission checks.'

const illustration = defineIllustration((base) => {
    const c = withDensity(base, 1.85)
    return Scene({
        c,
        padding: 12,
        gap: 12,
        contentWidth: 576,
        children: [
            Panel({
                c,
                title: 'ReleaseStatusCall Schema',
                subtitle: 'additionalProperties: false | required: [release_id, include_gates]',
                tone: 'blue',
                width: 576,
                padding: 10,
                children: Row({
                    gap: 8,
                    justify: 'center',
                    children: [
                        BadgePill({
                            c,
                            text: 'release_id: string (1..128)',
                            tone: 'blue',
                            fontSize: 18,
                        }),
                        BadgePill({
                            c,
                            text: 'include_gates: bool | null',
                            tone: 'blue',
                            fontSize: 18,
                        }),
                    ],
                }),
            }),
            Panel({
                c,
                title: 'Five Input Validation Cases',
                tone: 'neutral',
                width: 576,
                padding: 10,
                children: Matrix({
                    c,
                    data: [
                        [1, 1],
                        [1, 1],
                        [0, 0],
                        [0, 0],
                        [0, 0],
                    ],
                    rowLabels: [
                        'include_gates = true',
                        'include_gates = null',
                        'include_gates = 1',
                        'promote_now = true',
                        'release_id = ""',
                    ],
                    colLabels: ['Result', 'Schema Rule'],
                    labels: [
                        ['Accept', 'boolean'],
                        ['Accept', 'nullable bool'],
                        ['Reject', 'wrong JSON type'],
                        ['Reject', 'extra key'],
                        ['Reject', 'minLength = 1'],
                    ],
                    cellWidth: 168,
                    cellHeight: 40,
                    rowLabelWidth: 210,
                    fontSize: 18,
                    colorize: true,
                    colorScale: 'strength',
                    colorDomain: [0, 1],
                }),
            }),
            Panel({
                c,
                title: 'Validation vs permission',
                width: 576,
                padding: 10,
                children: Row({
                    gap: 8,
                    justify: 'center',
                    align: 'center',
                    children: [
                        BadgePill({
                            c,
                            text: 'Schema passes',
                            tone: 'green',
                            fontSize: 18,
                        }),
                        FlowArrow({ c, direction: 'right', length: 14, tone: 'warm' }),
                        BadgePill({
                            c,
                            text: 'Runtime still checks permission',
                            tone: 'warm',
                            fontSize: 18,
                        }),
                    ],
                }),
            }),
        ],
    })
})

export const create = illustration.create
export default illustration.default
