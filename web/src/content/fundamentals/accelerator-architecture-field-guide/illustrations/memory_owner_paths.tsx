import React from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    TextLabel,
    VectorArrow,
    getReadableToneColor,
    getToneColor,
    defineIllustration,
} from 'vizmatic'

export const width = 900
export const height = 740
export const alt =
    'Inside one GPU device, a weight tile moves from device-wide HBM through the GPU-wide L2 cache into block-scoped shared memory, thread-scoped registers, and a matrix accumulator. The completed Y tile returns to HBM. The memory, block, and SM boundaries are nested inside the device; a separate peer link connects HBM on two devices.'

const illustration = defineIllustration((c) => {
    const label = (
        text: string,
        x: number,
        y: number,
        w: number,
        h: number,
        fontSize: number,
        color = c.textPrimary,
        align: 'left' | 'center' | 'right' = 'left',
        fontWeight = 600,
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

    const purple = getToneColor('purple', c)
    const cyan = getToneColor('cyan', c)
    const green = getToneColor('green', c)
    const arrow = getReadableToneColor('cyan', c)

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
                            <SvgFrame
                                c={c}
                                x={24}
                                y={82}
                                width={852}
                                height={490}
                                rx={8}
                                fill="transparent"
                                stroke={c.border}
                                strokeWidth={2}
                            />
                            <SvgFrame
                                c={c}
                                x={36}
                                y={140}
                                width={220}
                                height={360}
                                rx={6}
                                fill={c.bgSubtle}
                                stroke={purple}
                                strokeWidth={2}
                            />
                            <SvgFrame
                                c={c}
                                x={264}
                                y={246}
                                width={228}
                                height={96}
                                rx={5}
                                fill={c.bgCard}
                                stroke={cyan}
                                strokeWidth={2}
                            />
                            <SvgFrame
                                c={c}
                                x={500}
                                y={140}
                                width={376}
                                height={425}
                                rx={8}
                                fill={c.bgSubtle}
                                stroke={c.border}
                                strokeWidth={2}
                            />
                            <SvgFrame
                                c={c}
                                x={515}
                                y={178}
                                width={346}
                                height={377}
                                rx={6}
                                fill="transparent"
                                stroke={c.borderLight}
                                strokeWidth={1.5}
                            />

                            <VectorArrow
                                x1={238}
                                y1={286}
                                x2={262}
                                y2={286}
                                color={arrow}
                                strokeWidth={2.5}
                                arrowSize={5}
                            />
                            <VectorArrow
                                x1={494}
                                y1={294}
                                x2={521}
                                y2={278}
                                color={arrow}
                                strokeWidth={2.5}
                                arrowSize={5}
                            />
                            <VectorArrow
                                x1={688}
                                y1={322}
                                x2={688}
                                y2={343}
                                color={arrow}
                                strokeWidth={2.5}
                                arrowSize={5}
                            />
                            <VectorArrow
                                x1={688}
                                y1={435}
                                x2={688}
                                y2={456}
                                color={arrow}
                                strokeWidth={2.5}
                                arrowSize={5}
                            />
                            <polyline
                                points="688,548 688,564 260,564 260,419"
                                fill="none"
                                stroke={arrow}
                                strokeWidth="2.5"
                            />
                            <VectorArrow
                                x1={260}
                                y1={419}
                                x2={238}
                                y2={419}
                                color={arrow}
                                strokeWidth={2.5}
                                arrowSize={5}
                            />

                            <SvgFrame
                                c={c}
                                x={58}
                                y={252}
                                width={180}
                                height={68}
                                rx={4}
                                fill={c.bgCard}
                                stroke={purple}
                                strokeWidth={1.5}
                            />
                            <SvgFrame
                                c={c}
                                x={58}
                                y={385}
                                width={180}
                                height={68}
                                rx={4}
                                fill={c.bgCard}
                                stroke={purple}
                                strokeWidth={1.5}
                            />
                            <SvgFrame
                                c={c}
                                x={523}
                                y={232}
                                width={330}
                                height={90}
                                rx={4}
                                fill={c.bgCard}
                                stroke={cyan}
                                strokeWidth={1.5}
                            />
                            <SvgFrame
                                c={c}
                                x={523}
                                y={345}
                                width={330}
                                height={90}
                                rx={4}
                                fill={c.bgCard}
                                stroke={green}
                                strokeWidth={1.5}
                            />
                            <SvgFrame
                                c={c}
                                x={523}
                                y={458}
                                width={330}
                                height={90}
                                rx={4}
                                fill={c.bgCard}
                                stroke={green}
                                strokeWidth={1.5}
                            />

                            <SvgFrame
                                c={c}
                                x={32}
                                y={645}
                                width={235}
                                height={58}
                                rx={4}
                                fill={c.bgCard}
                                stroke={purple}
                                strokeWidth={1.5}
                            />
                            <SvgFrame
                                c={c}
                                x={332}
                                y={645}
                                width={235}
                                height={58}
                                rx={4}
                                fill={c.bgCard}
                                stroke={cyan}
                                strokeWidth={1.5}
                            />
                            <SvgFrame
                                c={c}
                                x={632}
                                y={645}
                                width={235}
                                height={58}
                                rx={4}
                                fill={c.bgCard}
                                stroke={purple}
                                strokeWidth={1.5}
                            />
                            <VectorArrow
                                x1={269}
                                y1={674}
                                x2={328}
                                y2={674}
                                color={arrow}
                                strokeWidth={2.5}
                                arrowSize={5}
                            />
                            <VectorArrow
                                x1={569}
                                y1={674}
                                x2={628}
                                y2={674}
                                color={arrow}
                                strokeWidth={2.5}
                                arrowSize={5}
                            />
                        </svg>
                    ),
                }),
                label(
                    'One tile moves through nested owners',
                    24,
                    12,
                    852,
                    42,
                    36,
                    c.textPrimary,
                    'center',
                    750,
                ),
                label('GPU device', 42, 87, 260, 40, 32, c.textPrimary, 'left', 700),
                label('HBM', 39, 146, 214, 38, 32, c.textPrimary, 'center', 750),
                label('device-wide', 39, 188, 214, 38, 32, c.textPrimary, 'center', 600),
                label('W tile', 64, 266, 168, 40, 32, c.textPrimary, 'center', 700),
                label('Y tile', 64, 399, 168, 40, 32, c.textPrimary, 'center', 700),
                label('L2', 276, 252, 204, 40, 32, c.textPrimary, 'center', 700),
                label('GPU-wide', 276, 299, 204, 40, 32, c.textPrimary, 'center', 600),
                label('SM 0', 508, 145, 360, 40, 32, c.textPrimary, 'center', 750),
                label('Block 0', 520, 188, 335, 40, 32, c.textPrimary, 'center', 700),
                label('Shared · block', 528, 257, 320, 40, 32, c.textPrimary, 'center', 650),
                label('Registers · thread', 528, 370, 320, 40, 32, c.textPrimary, 'center', 650),
                label('Matrix accumulator', 528, 483, 320, 40, 32, c.textPrimary, 'center', 700),
                label(
                    'Separate device-to-device path',
                    32,
                    590,
                    835,
                    40,
                    32,
                    c.textPrimary,
                    'center',
                    700,
                ),
                label('GPU 0 HBM', 38, 654, 223, 40, 32, c.textPrimary, 'center', 650),
                label('Peer link', 338, 654, 223, 40, 32, c.textPrimary, 'center', 650),
                label('GPU 1 HBM', 638, 654, 223, 40, 32, c.textPrimary, 'center', 650),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
