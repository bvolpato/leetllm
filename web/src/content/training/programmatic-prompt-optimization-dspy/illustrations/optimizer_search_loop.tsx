import React from 'react'
import { createElement } from 'react'
import {
    BadgePill,
    Board,
    CanvasItem,
    Column,
    Panel,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'

export const width = 760
export const height = 580
export const preset = 'engineering'
export const alt =
    'Validation and held-out test splits share identical 0% to 100% axes over 20 examples each. On validation, Compiled A scores 19/20 (95%) vs Baseline 14/20 (70%), winning selection by +25 percentage points. On held-out test, rankings reverse: Baseline scores 16/20 (80%) vs Compiled A 13/20 (65%), a 15 percentage-point deficit.'

const splits = [
    {
        title: '1. Select on validation',
        gap: '+25 pp gain',
        gapTone: 'purple' as const,
        baseline: 14,
        compiled: 19,
    },
    {
        title: '2. Evaluate held-out test',
        gap: '−15 pp drop',
        gapTone: 'warm' as const,
        baseline: 16,
        compiled: 13,
    },
]

const illustration = defineIllustration((c) => {
    const baseColor = getReadableToneColor('blue', c)
    const candColor = getReadableToneColor('purple', c)
    const barW = 310

    return (
        <Scene
            c={c}
            title="Validation leaders can reverse on held-out test data"
            padding={20}
            gap={12}
            contentWidth={720}
        >
            <TextLabel
                c={c}
                text="Shared 0–100% scale · 20 cases per split"
                fontSize={23}
                color={c.textSecondary}
            />
            <Column gap={14}>
                {splits.map((split) => (
                    <Panel
                        key={split.title}
                        c={c}
                        title={split.title}
                        tone={split.gapTone}
                        padding={14}
                        titleFontSize={24}
                    >
                        <Row gap={14} align="center" justify="space-between">
                            <Board c={c} width={480} height={106}>
                                <CanvasItem x={0} y={0} width={480} height={106}>
                                    {createElement(
                                        'svg',
                                        { width: 480, height: 106, viewBox: '0 0 480 106' },
                                        createElement('rect', {
                                            x: 156,
                                            y: 12,
                                            width: barW,
                                            height: 28,
                                            rx: 4,
                                            fill: 'none',
                                            stroke: c.borderSubtle,
                                            strokeWidth: 2,
                                        }),
                                        createElement('rect', {
                                            x: 156,
                                            y: 12,
                                            width: (barW * split.baseline) / 20,
                                            height: 28,
                                            rx: 4,
                                            fill: baseColor,
                                        }),
                                        createElement('rect', {
                                            x: 156,
                                            y: 62,
                                            width: barW,
                                            height: 28,
                                            rx: 4,
                                            fill: 'none',
                                            stroke: c.borderSubtle,
                                            strokeWidth: 2,
                                        }),
                                        createElement('rect', {
                                            x: 156,
                                            y: 62,
                                            width: (barW * split.compiled) / 20,
                                            height: 28,
                                            rx: 4,
                                            fill: candColor,
                                        }),
                                    )}
                                </CanvasItem>
                                <CanvasItem x={0} y={12} width={148} height={30}>
                                    <TextLabel
                                        c={c}
                                        text="Baseline"
                                        fontSize={23}
                                        color={baseColor}
                                        fontWeight={700}
                                    />
                                </CanvasItem>
                                <CanvasItem x={0} y={62} width={148} height={30}>
                                    <TextLabel
                                        c={c}
                                        text="Compiled A"
                                        fontSize={23}
                                        color={candColor}
                                        fontWeight={700}
                                    />
                                </CanvasItem>
                            </Board>
                            <Column gap={8} width={182}>
                                <TextLabel
                                    c={c}
                                    text={`${split.baseline}/20 · ${split.baseline * 5}%`}
                                    fontSize={23}
                                    color={baseColor}
                                    mono
                                />
                                <TextLabel
                                    c={c}
                                    text={`${split.compiled}/20 · ${split.compiled * 5}%`}
                                    fontSize={23}
                                    color={candColor}
                                    mono
                                />
                                <BadgePill
                                    c={c}
                                    text={split.gap}
                                    tone={split.gapTone}
                                    filled
                                    fontSize={23}
                                    height={40}
                                    width={178}
                                />
                            </Column>
                        </Row>
                    </Panel>
                ))}
            </Column>
        </Scene>
    )
})

export const create = illustration.create
export default illustration.default
