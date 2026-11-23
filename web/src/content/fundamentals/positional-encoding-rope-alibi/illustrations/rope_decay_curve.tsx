import React from 'react'
import {
    getThemeColors,
    AxisPlot,
    BadgePill,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

function createWithChildren<C extends React.ElementType>(
    component: C,
    props: Omit<React.ComponentProps<C>, 'children'>,
    ...children: React.ReactNode[]
): React.ReactElement {
    return React.createElement(component, props, ...children)
}

export const width = 560
export const height = 700
export const alt =
    'One chart compares a RoPE pair score S(Δ)=cos(0.5Δ) with the ALiBi bias B(Δ)=−0.1Δ over offsets from 0 to 12. From Δ=6 to 8, the RoPE pair rises from −0.990 to −0.654 as its phase turns, while the ALiBi term keeps falling from −0.600 to −0.800.'

const deltaMax = 12
const scoreMin = -1.3
const scoreMax = 1.1
const ropeAt = (delta: number) => Math.cos(delta * 0.5)
const alibiAt = (delta: number) => -0.1 * delta

function graph(c: ThemeColors): React.ReactElement {
    const ropeColor = c.primaryLight
    const alibiColor = c.criticalLight
    const guides = [6, 8]
    const yTicks = [1, 0, -1]
    const deltas = Array.from({ length: 145 }, (_, index) => (index / 144) * deltaMax)
    const horizontal = (score: number) => ({
        points: [
            { x: 0, y: score },
            { x: deltaMax, y: score },
        ],
        color: c.borderSubtle,
        strokeWidth: 1.5,
    })
    const vertical = (delta: number) => ({
        points: [
            { x: delta, y: scoreMin },
            { x: delta, y: scoreMax },
        ],
        color: c.warningLight,
        strokeWidth: 2,
        dashed: true as const,
    })
    return React.createElement(AxisPlot, {
        c,
        width: 528,
        height: 250,
        xMin: 0,
        xMax: deltaMax,
        yMin: scoreMin,
        yMax: scoreMax,
        padding: 24,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        paths: [
            ...yTicks.map(horizontal),
            {
                points: [
                    { x: 0, y: scoreMin },
                    { x: 0, y: scoreMax },
                ],
                color: c.borderLight,
                strokeWidth: 2,
            },
            {
                points: [
                    { x: 0, y: scoreMin },
                    { x: deltaMax, y: scoreMin },
                ],
                color: c.borderLight,
                strokeWidth: 2,
            },
            ...guides.map(vertical),
            {
                points: deltas.map((delta) => ({ x: delta, y: ropeAt(delta) })),
                color: ropeColor,
                strokeWidth: 5,
            },
            {
                points: deltas.map((delta) => ({ x: delta, y: alibiAt(delta) })),
                color: alibiColor,
                strokeWidth: 5,
            },
            ...[0, 4, 8, 12].map((delta) => ({
                points: [
                    { x: delta, y: scoreMin },
                    { x: delta, y: scoreMin + 0.08 },
                ],
                color: c.textSecondary,
                strokeWidth: 1.5,
            })),
        ],
        points: guides.flatMap((delta) => [
            {
                x: delta,
                y: ropeAt(delta),
                fill: ropeColor,
                stroke: c.bgSubtle,
                strokeWidth: 2,
                r: 7,
            },
            {
                x: delta,
                y: alibiAt(delta),
                fill: alibiColor,
                stroke: c.bgSubtle,
                strokeWidth: 2,
                r: 7,
            },
        ]),
    })
}

const illustration = defineIllustration((theme) => {
    const light = theme.bg === getThemeColors('light').bg
    const c: ThemeColors = {
        ...theme,
        preset: 'engineering',
        shadow: 'transparent',
        primaryLight: light ? theme.primaryDark : theme.primaryLight,
        criticalLight: light ? theme.criticalDark : theme.criticalLight,
        warningLight: light ? theme.warningDark : theme.warningLight,
        textSecondary: theme.textPrimary,
    }
    const badgeColors: ThemeColors = { ...c, textPrimary: light ? c.textPrimary : c.bg }
    return createWithChildren(
        Scene,
        { c, background: c.bgSubtle, padding: 16, gap: 8, contentWidth: 528, align: 'center' },
        React.createElement(TextLabel, {
            c,
            text: 'RoPE oscillates; ALiBi keeps falling',
            fontSize: 24,
            fontWeight: 900,
            color: c.textPrimary,
            width: '100%',
            align: 'center',
        }),
        React.createElement(TextLabel, {
            c,
            text: 'S(Δ) = cos(0.5Δ)  ·  B(Δ) = −0.1Δ',
            fontSize: 20,
            mono: true,
            color: c.textSecondary,
            width: '100%',
            align: 'center',
        }),
        createWithChildren(
            Row,
            { width: '100%', gap: 10, justify: 'center', align: 'center' },
            React.createElement(BadgePill, {
                c: badgeColors,
                text: 'RoPE · cosine phase',
                tone: 'blue',
                height: 36,
                fontSize: 20,
                mono: true,
            }),
            React.createElement(BadgePill, {
                c: badgeColors,
                text: 'ALiBi · linear penalty',
                tone: 'critical',
                height: 36,
                fontSize: 20,
                mono: true,
            }),
        ),
        React.createElement(TextLabel, {
            c,
            text: 'RoPE pair range: −1 to 1 · ALiBi at Δ=12: −1.2',
            fontSize: 20,
            mono: true,
            color: c.textPrimary,
            width: '100%',
            align: 'center',
        }),
        graph(c),
        React.createElement(TextLabel, {
            c,
            text: 'From offset Δ=6 to Δ=8',
            fontSize: 22,
            fontWeight: 900,
            color: c.textPrimary,
            width: '100%',
            align: 'center',
        }),
        createWithChildren(
            Row,
            { width: '100%', gap: 10, justify: 'center', align: 'center' },
            React.createElement(TextLabel, {
                c,
                text: 'RoPE  −0.990 → −0.654',
                fontSize: 20,
                fontWeight: 800,
                mono: true,
                color: c.primaryLight,
                width: '50%',
                align: 'center',
            }),
            React.createElement(TextLabel, {
                c,
                text: 'ALiBi  −0.600 → −0.800',
                fontSize: 20,
                fontWeight: 800,
                mono: true,
                color: c.criticalLight,
                width: '50%',
                align: 'center',
            }),
        ),
        React.createElement(TextLabel, {
            c,
            text: 'A single RoPE pair can rise again; the linear bias continues to decrease.',
            fontSize: 20,
            color: c.textSecondary,
            width: '100%',
            align: 'center',
        }),
    )
})

export const create = illustration.create
export default illustration.default
