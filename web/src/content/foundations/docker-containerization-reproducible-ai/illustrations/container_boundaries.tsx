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
    'Container runtime filesystem layout showing four storage channels: read-only baked image layers for code and /opt/venv, a read-only bind mount at /app/eval that shadows baked data with host batches, a writable named volume for cached model weights, and an ephemeral runtime secret file at /run/secrets/eval_api_key excluded from image layers.'

export const width = 640
export const height = 600
export const preset = 'engineering'

const CHANNELS: Array<{
    channel: string
    source: string
    target: string
    tag: string
    tone: 'neutral' | 'blue' | 'purple' | 'green'
    behavior: string
}> = [
    {
        channel: 'Image layers (--read-only)',
        source: 'Dockerfile COPY',
        target: '/opt/venv + /app',
        tag: 'immutable',
        tone: 'neutral',
        behavior: 'Pinned Python runtime and scorer; rootfs stays unwritable.',
    },
    {
        channel: 'Bind mount (--mount type=bind,readonly)',
        source: './eval',
        target: '/app/eval',
        tag: 'overrides',
        tone: 'blue',
        behavior: 'Hides baked /app/eval; missing host path fails at startup.',
    },
    {
        channel: 'Named volume (Docker-managed)',
        source: 'hf_cache',
        target: '/cache/models',
        tag: 'rw cache',
        tone: 'green',
        behavior: 'Keeps downloaded weights across --rm container runs.',
    },
    {
        channel: 'Runtime secret (Compose / platform)',
        source: './secrets/*.txt',
        target: '/run/secrets/api_key',
        tag: 'not in image',
        tone: 'purple',
        behavior: 'Mounted in memory at run time; absent from image layers.',
    },
]

const illustration = defineIllustration((c) => {
    const toneColor = (tone: 'neutral' | 'blue' | 'purple' | 'green') =>
        tone === 'neutral' ? c.textSecondary : getReadableToneColor(tone, c)

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
                    text: 'Image Layers, Mounts, Volumes, and Secrets',
                    fontSize: 25,
                    fontWeight: 750,
                    color: c.textPrimary,
                    align: 'center',
                }),
                TextLabel({
                    c,
                    text: 'Match each input lifetime to how Docker attaches it at run time',
                    fontSize: 20,
                    color: c.textSecondary,
                    align: 'center',
                }),
                Column({
                    gap: 8,
                    width: 608,
                    children: CHANNELS.map((item) =>
                        Panel({
                            c,
                            title: item.channel,
                            tone: item.tone,
                            width: 608,
                            padding: '8px 12px',
                            gap: 4,
                            titleFontSize: 20,
                            children: Column({
                                gap: 4,
                                children: [
                                    Row({
                                        width: '100%',
                                        justify: 'space-between',
                                        align: 'center',
                                        children: [
                                            Row({
                                                gap: 8,
                                                align: 'center',
                                                children: [
                                                    TextLabel({
                                                        c,
                                                        text: item.source,
                                                        fontSize: 20,
                                                        fontWeight: 700,
                                                        color:
                                                            item.tone === 'neutral'
                                                                ? c.textPrimary
                                                                : toneColor(item.tone),
                                                    }),
                                                    FlowArrow({
                                                        c,
                                                        direction: 'right',
                                                        length: 24,
                                                        tone: item.tone,
                                                    }),
                                                    TextLabel({
                                                        c,
                                                        text: item.target,
                                                        fontSize: 20,
                                                        fontWeight: 700,
                                                        color: c.textPrimary,
                                                    }),
                                                ],
                                            }),
                                            TextLabel({
                                                c,
                                                text: item.tag,
                                                fontSize: 20,
                                                fontWeight: 750,
                                                color: toneColor(item.tone),
                                            }),
                                        ],
                                    }),
                                    TextLabel({
                                        c,
                                        text: item.behavior,
                                        fontSize: 20,
                                        color: c.textSecondary,
                                    }),
                                ],
                            }),
                        }),
                    ),
                }),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
