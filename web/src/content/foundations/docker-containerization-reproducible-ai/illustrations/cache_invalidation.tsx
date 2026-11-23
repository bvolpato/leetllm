import {
    Column,
    FlowArrow,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const alt =
    'Comparison of Dockerfile build cache reuse when editing either score_eval.py or requirements.txt. Copying and installing requirements before application code keeps the first two steps cached during code edits, whereas editing requirements.txt invalidates the installation step and all later steps.'

export const width = 640
export const height = 640
export const preset = 'engineering'

interface LayerRow {
    step: string
    codeEdit: 'cache hit' | 'edit (rebuild)' | 'rebuild'
    depsEdit: 'edit (rebuild)' | 'rebuild'
}

const LAYERS: LayerRow[] = [
    {
        step: '1. COPY requirements.txt',
        codeEdit: 'cache hit',
        depsEdit: 'edit (rebuild)',
    },
    {
        step: '2. pip install /opt/venv',
        codeEdit: 'cache hit',
        depsEdit: 'rebuild',
    },
    {
        step: '3. COPY score_eval.py',
        codeEdit: 'edit (rebuild)',
        depsEdit: 'rebuild',
    },
    {
        step: '4. COPY eval/',
        codeEdit: 'rebuild',
        depsEdit: 'rebuild',
    },
]

const illustration = defineIllustration((c) => {
    const green = getReadableToneColor('green', c)
    const purple = getReadableToneColor('purple', c)
    const warm = getReadableToneColor('warm', c)

    const colorFor = (state: string) =>
        state === 'cache hit' ? green : state === 'edit (rebuild)' ? purple : warm

    const arrowToneFor = (state: string): 'green' | 'purple' | 'warm' =>
        state === 'cache hit' ? 'green' : state === 'edit (rebuild)' ? 'purple' : 'warm'

    const renderTrace = (title: string, pick: (row: LayerRow) => string) =>
        Panel({
            c,
            title,
            tone: 'neutral',
            width: 298,
            padding: '10px 12px',
            gap: 6,
            titleFontSize: 21,
            children: Column({
                gap: 4,
                children: LAYERS.flatMap((row, idx) => {
                    const state = pick(row)
                    const block = Column({
                        gap: 2,
                        children: [
                            TextLabel({
                                c,
                                text: row.step,
                                fontSize: 20,
                                fontWeight: 700,
                                color: c.textPrimary,
                            }),
                            TextLabel({
                                c,
                                text: state,
                                fontSize: 20,
                                fontWeight: 700,
                                color: colorFor(state),
                            }),
                        ],
                    })
                    if (idx === LAYERS.length - 1) return [block]
                    return [
                        block,
                        Row({
                            width: '100%',
                            justify: 'center',
                            children: FlowArrow({
                                c,
                                direction: 'down',
                                length: 18,
                                tone: arrowToneFor(pick(LAYERS[idx + 1])),
                            }),
                        }),
                    ]
                }),
            }),
        })

    return Scene({
        c,
        padding: 14,
        gap: 10,
        contentWidth: 612,
        align: 'center',
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Where an Edit Invalidates the Build Cache',
                    fontSize: 25,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Put stable dependency steps before fast-changing code',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                Row({
                    gap: 12,
                    align: 'stretch',
                    justify: 'center',
                    children: [
                        renderTrace('Edit scorer code', (row) => row.codeEdit),
                        renderTrace('Edit requirements.txt', (row) => row.depsEdit),
                    ],
                }),
                Row({
                    gap: 16,
                    justify: 'center',
                    children: [
                        TextLabel({
                            c,
                            text: 'Green: cached',
                            fontSize: 20,
                            fontWeight: 650,
                            color: green,
                        }),
                        TextLabel({
                            c,
                            text: 'Purple: edited',
                            fontSize: 20,
                            fontWeight: 650,
                            color: purple,
                        }),
                        TextLabel({
                            c,
                            text: 'Amber: rebuilt',
                            fontSize: 20,
                            fontWeight: 650,
                            color: warm,
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
