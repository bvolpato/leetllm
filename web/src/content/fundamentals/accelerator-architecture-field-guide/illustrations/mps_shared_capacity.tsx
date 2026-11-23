import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getToneColor,
    defineIllustration,
} from 'vizmatic'

export const width = 1000
export const height = 900
export const alt =
    'MPS Graph operations execute on the GPU when supported. With fallback enabled, an unsupported operation may run on CPU and add a synchronization gap; a separate float64 allocation still fails. CPU and GPU execution draw on one finite unified physical memory pool containing 16 decimal GB of 8B BF16 weights plus KV cache, temporary activations, allocator headroom, macOS, and other apps. The other amounts are not specified or drawn to scale.'

const illustration = defineIllustration((c) => {
    const blue = getToneColor('blue', c)
    const cyan = getToneColor('cyan', c)
    const warm = getToneColor('warm', c)

    const label = (
        text: string,
        x: number,
        y: number,
        w: number,
        h: number,
        fontSize: number,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        fontWeight = 650,
        mono = false,
    ) =>
        CanvasItem({
            x,
            y,
            width: w,
            height: h,
            children: TextLabel({
                c,
                text,
                width: '100%',
                fontSize,
                color,
                align,
                fontWeight,
                mono,
            }),
        })

    const node = (x: number, y: number, w: number, h: number, stroke: string) =>
        SvgFrame({ c, x, y, width: w, height: h, rx: 7, fill: c.bgSubtle, stroke, strokeWidth: 2 })

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                CanvasItem({
                    x: 0,
                    y: 0,
                    width,
                    height,
                    children: (
                        <svg
                            width={width}
                            height={height}
                            viewBox={'0 0 ' + width + ' ' + height}
                            role="presentation"
                            aria-hidden="true"
                        >
                            {node(390, 114, 220, 70, blue)}
                            {node(50, 235, 250, 68, blue)}
                            {node(700, 235, 250, 68, warm)}
                            {node(375, 229, 250, 96, warm)}
                            {node(375, 355, 250, 68, warm)}
                            {node(50, 355, 250, 68, blue)}
                            {node(640, 355, 165, 68, warm)}
                            {node(825, 355, 170, 68, warm)}
                            {node(65, 458, 220, 66, blue)}
                            {node(580, 458, 220, 66, warm)}
                            <VectorArrow
                                x1={464}
                                y1={188}
                                x2={210}
                                y2={228}
                                color={c.textPrimary}
                                strokeWidth={3}
                                arrowSize={8}
                            />
                            <VectorArrow
                                x1={536}
                                y1={188}
                                x2={790}
                                y2={228}
                                color={c.textPrimary}
                                strokeWidth={3}
                                arrowSize={8}
                            />
                            <VectorArrow
                                x1={175}
                                y1={306}
                                x2={175}
                                y2={348}
                                color={c.textPrimary}
                                strokeWidth={3}
                                arrowSize={8}
                            />
                            <VectorArrow
                                x1={825}
                                y1={306}
                                x2={640}
                                y2={348}
                                color={c.textPrimary}
                                strokeWidth={3}
                                arrowSize={8}
                            />
                            <VectorArrow
                                x1={500}
                                y1={332}
                                x2={500}
                                y2={348}
                                color={c.textPrimary}
                                strokeWidth={3}
                                arrowSize={8}
                            />
                            <VectorArrow
                                x1={175}
                                y1={428}
                                x2={175}
                                y2={450}
                                color={c.textPrimary}
                                strokeWidth={3}
                                arrowSize={8}
                            />
                            <VectorArrow
                                x1={910}
                                y1={423}
                                x2={790}
                                y2={458}
                                color={c.textPrimary}
                                strokeWidth={3}
                                arrowSize={8}
                            />
                            <VectorArrow
                                x1={805}
                                y1={389}
                                x2={825}
                                y2={389}
                                color={c.textPrimary}
                                strokeWidth={3}
                                arrowSize={6}
                            />
                            <VectorArrow
                                x1={175}
                                y1={526}
                                x2={175}
                                y2={548}
                                color={c.textPrimary}
                                strokeWidth={3}
                                arrowSize={8}
                            />
                            <VectorArrow
                                x1={690}
                                y1={526}
                                x2={690}
                                y2={548}
                                color={c.textPrimary}
                                strokeWidth={3}
                                arrowSize={8}
                            />
                            <SvgFrame
                                c={c}
                                x={40}
                                y={552}
                                width={920}
                                height={340}
                                rx={10}
                                fill={c.bgSubtle}
                                stroke={c.border}
                                strokeWidth={2}
                            />
                            {[
                                [66, 615],
                                [365, 615],
                                [664, 615],
                                [66, 757],
                                [365, 757],
                                [664, 757],
                            ].map(([x, y], index) =>
                                SvgFrame({
                                    c,
                                    x,
                                    y,
                                    width: 270,
                                    height: index < 3 ? 130 : 86,
                                    rx: 6,
                                    fill: c.bgCard,
                                    stroke: index === 0 ? cyan : c.border,
                                    strokeWidth: index === 0 ? 2 : 1.5,
                                }),
                            )}
                        </svg>
                    ),
                }),
                label(
                    'One physical pool, two execution owners',
                    20,
                    14,
                    960,
                    46,
                    38,
                    c.textPrimary,
                    'center',
                    750,
                ),
                label(
                    'MPS Graph routes supported operations to GPU execution',
                    20,
                    60,
                    960,
                    40,
                    34,
                    c.textPrimary,
                    'center',
                    650,
                ),
                label('MPS Graph', 402, 131, 196, 40, 34, c.textPrimary, 'center', 700),
                label('Supported', 66, 248, 218, 40, 36, c.textPrimary, 'center', 700),
                label('Unsupported', 716, 248, 218, 40, 36, c.textPrimary, 'center', 700),
                label('float64', 393, 235, 214, 36, 36, c.textPrimary, 'center', 700, true),
                label('allocation', 393, 273, 214, 34, 34, c.textPrimary, 'center', 650),
                label('GPU op', 63, 369, 224, 40, 36, c.textPrimary, 'center', 700),
                label('fails', 390, 371, 220, 40, 36, c.textPrimary, 'center', 700),
                label('fallback', 645, 371, 155, 40, 34, c.textPrimary, 'center', 700),
                label('Sync gap', 830, 370, 160, 40, 33, c.textPrimary, 'center', 700),
                label('GPU owner', 76, 470, 198, 40, 34, c.textPrimary, 'center', 700),
                label('CPU owner', 591, 470, 198, 40, 34, c.textPrimary, 'center', 700),
                label(
                    'One finite unified physical memory pool',
                    60,
                    565,
                    880,
                    40,
                    34,
                    c.textPrimary,
                    'center',
                    750,
                ),
                label('8B BF16', 66, 618, 270, 34, 34, c.textPrimary, 'center', 700, true),
                label('weights', 66, 655, 270, 34, 34, c.textPrimary, 'center', 650),
                label('16 GB', 66, 692, 270, 34, 34, c.textPrimary, 'center', 650, true),
                label('KV cache', 381, 650, 238, 40, 34, c.textPrimary, 'center', 650),
                label('Temporary', 680, 630, 238, 34, 34, c.textPrimary, 'center', 650),
                label('activations', 680, 675, 238, 34, 34, c.textPrimary, 'center', 650),
                label('Allocator', 82, 761, 238, 34, 34, c.textPrimary, 'center', 650),
                label('headroom', 82, 798, 238, 34, 34, c.textPrimary, 'center', 650),
                label('macOS', 381, 780, 238, 40, 34, c.textPrimary, 'center', 650),
                label('Other apps', 680, 780, 238, 40, 34, c.textPrimary, 'center', 650),
                label(
                    'Other amounts are not specified or drawn to scale.',
                    60,
                    840,
                    880,
                    34,
                    34,
                    c.textPrimary,
                    'center',
                    600,
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
