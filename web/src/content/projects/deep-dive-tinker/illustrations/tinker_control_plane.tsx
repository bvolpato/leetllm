import React from 'react'
import {
    Board,
    CanvasItem,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
    getToneFill,
} from 'vizmatic'

export const width = 860
export const height = 500
export const alt =
    'Tinker decoupled client-server architecture: Local Python client holds TrainingClient and SamplingClient handles. Training, inference, LoRA weights, and optimizer states remain hosted across the network boundary.'

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const blueFill = getToneFill('blue', c)
    const purpleFill = getToneFill('purple', c)
    const greenFill = getToneFill('green', c)

    const labels: React.ReactNode[] = []
    const marks: React.ReactNode[] = []

    const text = (
        s: string,
        x: number,
        y: number,
        w: number,
        size = 16,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'center',
        weight = 500,
    ) =>
        labels.push(
            CanvasItem({
                x,
                y,
                width: w,
                height: size * 1.5,
                children: TextLabel({
                    c,
                    text: s,
                    width: w,
                    fontSize: size,
                    color,
                    align,
                    fontWeight: weight,
                }),
            }),
        )

    marks.push(
        <rect
            key="col-left"
            x={40}
            y={16}
            width={360}
            height={38}
            rx={6}
            fill={blueFill}
            stroke={blue}
            strokeWidth={1.5}
        />,
    )
    text('Local Client Application (Python SDK)', 40, 25, 360, 16, blue, 'center', 700)

    marks.push(
        <rect
            key="col-right"
            x={460}
            y={16}
            width={360}
            height={38}
            rx={6}
            fill={purpleFill}
            stroke={purple}
            strokeWidth={1.5}
        />,
    )
    text('Hosted Infrastructure & Model State', 460, 25, 360, 16, purple, 'center', 700)

    marks.push(
        <line
            key="divider"
            x1={430}
            y1={16}
            x2={430}
            y2={440}
            stroke={c.border}
            strokeWidth={2}
            strokeDasharray="6 6"
        />,
    )

    // --- Top Section: Training Path ---
    marks.push(
        <rect
            key="tc-box"
            x={40}
            y={76}
            width={360}
            height={130}
            rx={8}
            fill={c.bgCard}
            stroke={blue}
            strokeWidth={1.5}
        />,
    )
    text('TrainingClient', 56, 88, 328, 18, blue, 'left', 700)
    text('• forward_backward(datums) → Future[loss]', 56, 114, 328, 14, c.textPrimary, 'left', 500)
    text('• optim_step(adam_params) → Future[step]', 56, 138, 328, 14, c.textPrimary, 'left', 500)
    text(
        '• save_weights_for_sampler() → sampling client',
        56,
        162,
        328,
        14,
        c.textPrimary,
        'left',
        500,
    )

    marks.push(
        <rect
            key="tm-box"
            x={460}
            y={76}
            width={360}
            height={130}
            rx={8}
            fill={c.bgCard}
            stroke={purple}
            strokeWidth={1.5}
        />,
    )
    text('Training Engine (FSDP / Megatron / JAX)', 476, 88, 328, 18, purple, 'left', 700)
    text(
        '• Base weights (frozen) + LoRA rank adapters',
        476,
        114,
        328,
        14,
        c.textPrimary,
        'left',
        500,
    )
    text(
        '• Distributed gradient accumulation & Adam state',
        476,
        138,
        328,
        14,
        c.textPrimary,
        'left',
        500,
    )
    text('• Clock-cycle lockstep token dispatch', 476, 162, 328, 14, c.textPrimary, 'left', 500)

    marks.push(
        VectorArrow({
            x1: 400,
            y1: 135,
            x2: 460,
            y2: 135,
            color: blue,
            strokeWidth: 2,
            arrowSize: 5,
        }),
    )

    // --- Middle: Weight Sync / Sampler Snapshot ---
    marks.push(
        <rect
            key="snap-box"
            x={460}
            y={224}
            width={360}
            height={52}
            rx={6}
            fill={greenFill}
            stroke={green}
            strokeWidth={1.5}
        />,
    )
    text('Sampler Snapshot / Ephemeral Weight Sync', 460, 232, 360, 15, green, 'center', 700)
    text(
        'Exports active LoRA adapter weights without disk round-trip',
        460,
        252,
        360,
        12,
        c.textSecondary,
        'center',
        400,
    )

    marks.push(
        VectorArrow({
            x1: 640,
            y1: 206,
            x2: 640,
            y2: 224,
            color: green,
            strokeWidth: 2,
            arrowSize: 4,
        }),
    )
    marks.push(
        VectorArrow({
            x1: 640,
            y1: 276,
            x2: 640,
            y2: 296,
            color: green,
            strokeWidth: 2,
            arrowSize: 4,
        }),
    )

    // --- Bottom Section: Sampling Path ---
    marks.push(
        <rect
            key="sc-box"
            x={40}
            y={296}
            width={360}
            height={130}
            rx={8}
            fill={c.bgCard}
            stroke={blue}
            strokeWidth={1.5}
        />,
    )
    text('SamplingClient', 56, 308, 328, 18, blue, 'left', 700)
    text('• sample(prompt, max_tokens, temperature)', 56, 336, 328, 14, c.textPrimary, 'left', 500)
    text(
        '• Receives generated token IDs & log-probabilities',
        56,
        362,
        328,
        14,
        c.textPrimary,
        'left',
        500,
    )
    text(
        '• Reuses prefix cache via session routing key',
        56,
        388,
        328,
        14,
        c.textPrimary,
        'left',
        500,
    )

    marks.push(
        <rect
            key="inf-box"
            x={460}
            y={296}
            width={360}
            height={130}
            rx={8}
            fill={c.bgCard}
            stroke={purple}
            strokeWidth={1.5}
        />,
    )
    text('Inference Engine (vLLM / SGLang Server)', 476, 308, 328, 18, purple, 'left', 700)
    text('• Loads updated LoRA snapshot parameters', 476, 336, 328, 14, c.textPrimary, 'left', 500)
    text(
        '• High-throughput KV-cached auto-regressive decode',
        476,
        362,
        328,
        14,
        c.textPrimary,
        'left',
        500,
    )
    text(
        '• Returns token log-probabilities to client',
        476,
        388,
        328,
        14,
        c.textPrimary,
        'left',
        500,
    )

    marks.push(
        VectorArrow({
            x1: 400,
            y1: 345,
            x2: 460,
            y2: 345,
            color: blue,
            strokeWidth: 2,
            arrowSize: 5,
        }),
    )
    marks.push(
        VectorArrow({
            x1: 460,
            y1: 375,
            x2: 400,
            y2: 375,
            color: green,
            strokeWidth: 2,
            arrowSize: 5,
        }),
    )

    text(
        'Weights, gradients, and optimizer states remain securely hosted · Client retains lightweight RPC handles',
        40,
        460,
        780,
        14,
        c.textSecondary,
        'center',
        500,
    )

    return Board({
        c,
        width,
        height,
        children: [
            CanvasItem({
                x: 0,
                y: 0,
                width,
                height,
                children: (
                    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                        {marks}
                    </svg>
                ),
            }),
            ...labels,
        ],
    })
})

export const create = illustration.create
export default illustration.default
