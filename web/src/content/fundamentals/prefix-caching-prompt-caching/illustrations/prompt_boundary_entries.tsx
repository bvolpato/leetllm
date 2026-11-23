import React from 'react'
import {
    Board,
    CanvasItem,
    SvgFrame,
    TextLabel,
    defineIllustration,
    withColorAlpha,
    type ThemeColors,
} from 'vizmatic'

export const width = 840
export const height = 580
export const alt =
    'Stable-first prompts (system, guide, tools, then Q1 or Q2) share three leading blocks; variable-first prompts share zero. A stored entry must also end cleanly after the 6,000-token guide rather than after a 6,048-token full request so 6,037-token requests hit.'

const FONT = 26

function BoundaryEntriesDiagram({ c }: { c: ThemeColors }) {
    const blocksStable = ['system', 'guide', 'tools']
    const boxW = 118

    return (
        <Board c={c} width={width} height={height}>
            <CanvasItem x={28} y={18} width={784} height={40}>
                <TextLabel
                    c={c}
                    text="Prompt order and markers decide cache reuse"
                    fontSize={29}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={28} y={60} width={784} height={36}>
                <TextLabel
                    c={c}
                    text="Put stable blocks first; stop marker before question"
                    fontSize={FONT}
                    color={c.textMuted}
                />
            </CanvasItem>
            <CanvasItem x={0} y={0} width={width} height={height}>
                <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                    <SvgFrame
                        c={c}
                        x={28}
                        y={112}
                        width={784}
                        height={182}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    {blocksStable.map((lbl, idx) => (
                        <rect
                            key={lbl}
                            x={196 + idx * 124}
                            y={168}
                            width={boxW}
                            height={38}
                            rx={6}
                            fill={withColorAlpha(c.positive, 0.22)}
                            stroke={c.positiveLight}
                            strokeWidth={1.8}
                        />
                    ))}
                    <rect
                        x={568}
                        y={168}
                        width={110}
                        height={38}
                        rx={6}
                        fill={withColorAlpha(c.warning, 0.22)}
                        stroke={c.warningLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={196}
                        y={228}
                        width={110}
                        height={38}
                        rx={6}
                        fill={withColorAlpha(c.critical, 0.22)}
                        stroke={c.criticalLight}
                        strokeWidth={1.8}
                    />
                    {blocksStable.map((lbl, idx) => (
                        <rect
                            key={`${lbl}-miss`}
                            x={312 + idx * 124}
                            y={228}
                            width={boxW}
                            height={38}
                            rx={6}
                            fill={c.bgSubtle}
                            stroke={c.borderLight}
                            strokeWidth={1.5}
                        />
                    ))}
                    <SvgFrame
                        c={c}
                        x={28}
                        y={316}
                        width={784}
                        height={232}
                        rx={12}
                        fill={c.bgCard}
                        stroke={c.border}
                        strokeWidth={1.5}
                    />
                    <rect
                        x={196}
                        y={384}
                        width={384}
                        height={34}
                        rx={6}
                        fill={withColorAlpha(c.critical, 0.28)}
                        stroke={c.criticalLight}
                        strokeWidth={1.8}
                    />
                    <rect
                        x={196}
                        y={462}
                        width={344}
                        height={34}
                        rx={6}
                        fill={withColorAlpha(c.positive, 0.28)}
                        stroke={c.positiveLight}
                        strokeWidth={1.8}
                    />
                </svg>
            </CanvasItem>
            <CanvasItem x={48} y={124} width={744} height={34}>
                <TextLabel c={c} text="1. Prefix layout order" fontSize={FONT} fontWeight={700} />
            </CanvasItem>
            <CanvasItem x={48} y={170} width={140} height={34}>
                <TextLabel c={c} text="Stable 1st" fontSize={FONT} />
            </CanvasItem>
            {blocksStable.map((lbl, idx) => (
                <CanvasItem key={`${lbl}-t`} x={196 + idx * 124} y={170} width={boxW} height={34}>
                    <TextLabel c={c} text={lbl} fontSize={FONT} align="center" width={boxW} />
                </CanvasItem>
            ))}
            <CanvasItem x={568} y={170} width={110} height={34}>
                <TextLabel c={c} text="Q1" fontSize={FONT} align="center" width={110} />
            </CanvasItem>
            <CanvasItem x={692} y={170} width={104} height={34}>
                <TextLabel
                    c={c}
                    text="3 hit"
                    fontSize={FONT}
                    fontWeight={700}
                    color={c.positiveLight}
                />
            </CanvasItem>
            <CanvasItem x={48} y={230} width={140} height={34}>
                <TextLabel c={c} text="Var 1st" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={196} y={230} width={110} height={34}>
                <TextLabel c={c} text="Q1" fontSize={FONT} align="center" width={110} />
            </CanvasItem>
            {blocksStable.map((lbl, idx) => (
                <CanvasItem key={`${lbl}-m`} x={312 + idx * 124} y={230} width={boxW} height={34}>
                    <TextLabel
                        c={c}
                        text={lbl}
                        fontSize={FONT}
                        align="center"
                        width={boxW}
                        color={c.textMuted}
                    />
                </CanvasItem>
            ))}
            <CanvasItem x={692} y={230} width={104} height={34}>
                <TextLabel
                    c={c}
                    text="0 hit"
                    fontSize={FONT}
                    fontWeight={700}
                    color={c.criticalLight}
                />
            </CanvasItem>
            <CanvasItem x={48} y={328} width={744} height={34}>
                <TextLabel
                    c={c}
                    text="2. Stored endpoint vs next request (6,037 tokens)"
                    fontSize={FONT}
                    fontWeight={700}
                />
            </CanvasItem>
            <CanvasItem x={48} y={384} width={140} height={34}>
                <TextLabel c={c} text="Auto end" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={206} y={384} width={364} height={34}>
                <TextLabel c={c} text="stored 6,048 (incl Q1)" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={592} y={384} width={206} height={34}>
                <TextLabel
                    c={c}
                    text="reuses 0"
                    fontSize={FONT}
                    fontWeight={700}
                    color={c.criticalLight}
                />
            </CanvasItem>
            <CanvasItem x={48} y={462} width={140} height={34}>
                <TextLabel c={c} text="Marked" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={206} y={462} width={324} height={34}>
                <TextLabel c={c} text="stored 6,000 guide" fontSize={FONT} />
            </CanvasItem>
            <CanvasItem x={592} y={462} width={206} height={34}>
                <TextLabel
                    c={c}
                    text="reuses 6,000"
                    fontSize={FONT}
                    fontWeight={700}
                    color={c.positiveLight}
                />
            </CanvasItem>
        </Board>
    )
}

const illustration = defineIllustration((c) => <BoundaryEntriesDiagram c={c} />)

export const create = illustration.create
export default illustration.default
