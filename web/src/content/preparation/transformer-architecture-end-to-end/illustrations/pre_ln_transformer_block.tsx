import React from 'react'
import {
    Canvas,
    Column,
    Panel,
    Row,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    getToneFill,
} from 'vizmatic'
import type { ThemeColors, ThemeMode } from 'vizmatic'

export const width = 760
export const height = 470
export const alt =
    'Pre-LN and Post-LN blocks compared left to right across the same 3 by 4 stream. In Pre-LN, a direct identity skip path runs unbroken from input X through two residual additions to output Y while each branch applies LayerNorm before Attention or FFN. In Post-LN, LayerNorm sits directly on the main spine after each residual addition.'

function Connector({ width: w, color }: { width: number; color: string }) {
    return (
        <svg width={w} height={24} viewBox={`0 0 ${w} 24`}>
            <line x1={2} y1={12} x2={w - 8} y2={12} stroke={color} strokeWidth={2.4} />
            <polygon points={`${w - 9},6 ${w - 1},12 ${w - 9},18`} fill={color} />
        </svg>
    )
}

function BoxBadge({
    text,
    color,
    fill,
    width: w,
    c,
}: {
    text: string
    color: string
    fill: string
    width: number
    c: ThemeColors
}) {
    return (
        <div
            style={{
                width: w,
                padding: '6px 6px',
                borderRadius: 8,
                border: `1.5px solid ${color}`,
                backgroundColor: fill,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <TextLabel
                c={c}
                text={text}
                fontSize={23}
                fontWeight={650}
                color={color}
                align="center"
                width={w - 12}
                math={false}
            />
        </div>
    )
}

function PlusNode({ color, c }: { color: string; c: ThemeColors }) {
    return (
        <div
            style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                border: `2px solid ${color}`,
                backgroundColor: c.bgCard,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <TextLabel
                c={c}
                text="+"
                fontSize={24}
                fontWeight={700}
                color={color}
                align="center"
                width={28}
                math={false}
            />
        </div>
    )
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(theme)
    const blue = getReadableToneColor('blue', c)
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const blueFill = getToneFill('blue', c)
    const warmFill = getToneFill('warm', c)
    const greenFill = getToneFill('green', c)

    return (
        <Canvas c={c} background="transparent" padding={10} justify="flex-start">
            <Column gap={12} width={740}>
                <Panel
                    title="1. Pre-LN: direct identity skip spine (keeps [3, 4])"
                    titleFontSize={24}
                    c={c}
                    width={740}
                    padding={12}
                    gap={8}
                    tone="blue"
                >
                    <Column gap={8}>
                        <Row gap={6} wrap={false} align="center">
                            <BoxBadge
                                text="X [3,4]"
                                color={blue}
                                fill={blueFill}
                                width={96}
                                c={c}
                            />
                            <Connector width={132} color={blue} />
                            <PlusNode color={blue} c={c} />
                            <Connector width={36} color={blue} />
                            <TextLabel
                                c={c}
                                text="x1"
                                fontSize={23}
                                fontWeight={650}
                                color={c.textSecondary}
                                width={34}
                                align="center"
                                math={false}
                            />
                            <Connector width={132} color={blue} />
                            <PlusNode color={blue} c={c} />
                            <Connector width={30} color={blue} />
                            <BoxBadge
                                text="Y [3,4]"
                                color={blue}
                                fill={blueFill}
                                width={96}
                                c={c}
                            />
                        </Row>
                        <Row gap={8} wrap={false} align="center">
                            <TextLabel
                                c={c}
                                text="Branches:"
                                fontSize={23}
                                color={c.textSecondary}
                                width={108}
                                math={false}
                            />
                            <BoxBadge
                                text="Norm -> Attn"
                                color={warm}
                                fill={warmFill}
                                width={210}
                                c={c}
                            />
                            <TextLabel
                                c={c}
                                text="to +1"
                                fontSize={23}
                                color={warm}
                                width={68}
                                align="center"
                                math={false}
                            />
                            <BoxBadge
                                text="Norm -> FFN"
                                color={green}
                                fill={greenFill}
                                width={210}
                                c={c}
                            />
                            <TextLabel
                                c={c}
                                text="to +2"
                                fontSize={23}
                                color={green}
                                width={68}
                                align="center"
                                math={false}
                            />
                        </Row>
                    </Column>
                </Panel>

                <Panel
                    title="2. Post-LN: LayerNorm rescales main path after add"
                    titleFontSize={24}
                    c={c}
                    width={740}
                    padding={12}
                    gap={8}
                    tone="warm"
                >
                    <Column gap={8}>
                        <Row gap={6} wrap={false} align="center">
                            <BoxBadge
                                text="X [3,4]"
                                color={blue}
                                fill={blueFill}
                                width={94}
                                c={c}
                            />
                            <Connector width={56} color={c.textMuted} />
                            <PlusNode color={warm} c={c} />
                            <Connector width={16} color={warm} />
                            <BoxBadge
                                text="Norm"
                                color={warm}
                                fill={c.bgCardAlt}
                                width={78}
                                c={c}
                            />
                            <Connector width={22} color={warm} />
                            <TextLabel
                                c={c}
                                text="x1"
                                fontSize={23}
                                fontWeight={650}
                                color={c.textSecondary}
                                width={32}
                                align="center"
                                math={false}
                            />
                            <Connector width={52} color={c.textMuted} />
                            <PlusNode color={warm} c={c} />
                            <Connector width={16} color={warm} />
                            <BoxBadge
                                text="Norm"
                                color={warm}
                                fill={c.bgCardAlt}
                                width={78}
                                c={c}
                            />
                            <Connector width={18} color={warm} />
                            <BoxBadge
                                text="Y [3,4]"
                                color={blue}
                                fill={blueFill}
                                width={94}
                                c={c}
                            />
                        </Row>
                        <Row gap={8} wrap={false} align="center">
                            <TextLabel
                                c={c}
                                text="Branches:"
                                fontSize={23}
                                color={c.textSecondary}
                                width={108}
                                math={false}
                            />
                            <BoxBadge
                                text="Causal Attn"
                                color={warm}
                                fill={warmFill}
                                width={210}
                                c={c}
                            />
                            <TextLabel
                                c={c}
                                text="at +1"
                                fontSize={23}
                                color={warm}
                                width={132}
                                align="center"
                                math={false}
                            />
                            <BoxBadge text="FFN" color={green} fill={greenFill} width={128} c={c} />
                            <TextLabel
                                c={c}
                                text="at +2"
                                fontSize={23}
                                color={green}
                                width={124}
                                align="center"
                                math={false}
                            />
                        </Row>
                    </Column>
                </Panel>

                <TextLabel
                    c={c}
                    text="Direct Pre-LN skip aids stability while both branches still shape gradients."
                    fontSize={23}
                    color={c.textSecondary}
                    align="center"
                    width={740}
                    math={false}
                />
            </Column>
        </Canvas>
    )
}

export default create('dark')
