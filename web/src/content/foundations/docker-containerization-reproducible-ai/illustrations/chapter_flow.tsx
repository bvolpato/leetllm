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
    'Four read-only container image layers (python:3.12-slim base, /opt/venv packages, scripts/score_eval.py, and eval/eval_cases.jsonl, with no Linux kernel inside the image) launch via docker run --rm into a non-root appuser container sharing the host or Desktop VM Linux kernel to print accuracy 0.667.'

export const width = 640
export const height = 560
export const preset = 'engineering'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)

    const layers = [
        { num: '4', title: 'eval/eval_cases.jsonl', note: 'copied eval cases' },
        { num: '3', title: 'scripts/score_eval.py', note: 'evaluation script' },
        { num: '2', title: '/opt/venv packages', note: 'pinned dependencies' },
        { num: '1', title: 'python:3.12-slim', note: 'user space (no kernel)' },
    ]

    const runtimeSteps = [
        { k: 'Process', v: 'uid=10001 (appuser)' },
        { k: 'Root FS', v: '--read-only image' },
        { k: 'Kernel', v: 'host / VM Linux kernel' },
        { k: 'Stdout', v: 'accuracy 0.667 (2/3)' },
        { k: 'On exit', v: '--rm drops container' },
    ]

    return Scene({
        c,
        padding: 12,
        gap: 10,
        contentWidth: 616,
        align: 'center',
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                TextLabel({
                    c,
                    text: 'Image Layers vs. Running Container',
                    fontSize: 25,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Stored layers stay read-only; container runs on host kernel',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                Row({
                    gap: 8,
                    align: 'center',
                    justify: 'center',
                    children: [
                        Panel({
                            c,
                            title: 'Stored Image (build)',
                            tone: 'blue',
                            width: 300,
                            padding: '10px 12px',
                            gap: 8,
                            titleFontSize: 20,
                            children: Column({
                                gap: 8,
                                children: layers.map((layer) =>
                                    Column({
                                        gap: 2,
                                        children: [
                                            TextLabel({
                                                c,
                                                text: `${layer.num}. ${layer.title}`,
                                                fontSize: 20,
                                                fontWeight: 700,
                                                color: blue,
                                            }),
                                            TextLabel({
                                                c,
                                                text: layer.note,
                                                fontSize: 20,
                                                color: c.textSecondary,
                                            }),
                                        ],
                                    }),
                                ),
                            }),
                        }),
                        Column({
                            gap: 4,
                            align: 'center',
                            children: [
                                TextLabel({
                                    c,
                                    text: 'run',
                                    fontSize: 20,
                                    fontWeight: 700,
                                    color: purple,
                                }),
                                FlowArrow({
                                    c,
                                    direction: 'right',
                                    length: 34,
                                    tone: 'purple',
                                }),
                            ],
                        }),
                        Panel({
                            c,
                            title: 'Container (run --rm)',
                            tone: 'purple',
                            width: 266,
                            padding: '10px 12px',
                            gap: 8,
                            titleFontSize: 20,
                            children: Column({
                                gap: 8,
                                children: runtimeSteps.map((step, idx) =>
                                    Column({
                                        gap: 2,
                                        children: [
                                            TextLabel({
                                                c,
                                                text: step.k,
                                                fontSize: 20,
                                                fontWeight: 700,
                                                color: idx === 3 ? green : purple,
                                            }),
                                            TextLabel({
                                                c,
                                                text: step.v,
                                                fontSize: 20,
                                                color: c.textPrimary,
                                            }),
                                        ],
                                    }),
                                ),
                            }),
                        }),
                    ],
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
