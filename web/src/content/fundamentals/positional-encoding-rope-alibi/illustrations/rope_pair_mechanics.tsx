import React from 'react'
import {
    getThemeColors,
    AxisPlot,
    BadgePill,
    Column,
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
export const height = 750
export const alt =
    'For q=k=[1,0] in four RoPE pairs, query position m=4 and key position n=2 give offset −2. Contributions cos((n−m)θ_i) are −0.416, 0.980, 1.000, and 1.000 for θ_i=1, 0.1, 0.01, and 0.001. They sum to 2.564; scaling by √8 gives attention logit 0.906. RoPE rotates Q and K; V is unchanged.'

const queryPosition = 4
const keyPosition = 2
const frequencies = [1, 0.1, 0.01, 0.001]
const pairScores = frequencies.map((theta) => Math.cos((keyPosition - queryPosition) * theta))
const total = pairScores.reduce((sum, score) => sum + score, 0)
const logit = total / Math.sqrt(8)

function contributionBar(c: ThemeColors, value: number, color: string): React.ReactElement {
    return createWithChildren(
        Column,
        { width: 260, gap: 0, align: 'stretch' },
        React.createElement(AxisPlot, {
            c,
            width: 260,
            height: 30,
            xMin: -0.5,
            xMax: 1,
            yMin: 0,
            yMax: 1,
            padding: 4,
            showFrame: false,
            showAxes: false,
            showGrid: false,
            paths: [
                {
                    points: [
                        { x: -0.5, y: 0.5 },
                        { x: 1, y: 0.5 },
                    ],
                    color: c.borderSubtle,
                    strokeWidth: 2,
                },
                {
                    points: [
                        { x: 0, y: 0.18 },
                        { x: 0, y: 0.82 },
                    ],
                    color: c.textSecondary,
                    strokeWidth: 2,
                },
            ],
            vectors: [
                {
                    x1: 0,
                    y1: 0.5,
                    x2: value,
                    y2: 0.5,
                    color,
                    strokeWidth: 12,
                    showStartDot: false,
                    showEndDot: false,
                },
            ],
            points: [{ x: value, y: 0.5, r: 5, fill: color, stroke: c.bgSubtle, strokeWidth: 2 }],
        }),
        createWithChildren(
            Row,
            { width: '100%', gap: 0, align: 'center', justify: 'center' },
            ...[
                { text: '−.5', align: 'left' as const },
                { text: '0', align: 'center' as const },
                { text: '1.0', align: 'right' as const },
            ].map((tick) =>
                React.createElement(TextLabel, {
                    key: tick.text,
                    c,
                    text: tick.text,
                    fontSize: 20,
                    mono: true,
                    color: c.textPrimary,
                    width: '33.333%',
                    align: tick.align,
                }),
            ),
        ),
    )
}

function scoreRow(c: ThemeColors, pairIndex: number, tone: string): React.ReactElement {
    const theta = frequencies[pairIndex]
    const score = pairScores[pairIndex]
    return createWithChildren(
        Row,
        {
            gap: 7,
            width: '100%',
            justify: 'center',
            align: 'center',
            style: { padding: '6px 0', borderBottom: `1px solid ${c.borderSubtle}` },
        },
        React.createElement(TextLabel, {
            c,
            text: `i=${pairIndex} · θ=${theta}`,
            fontSize: 20,
            fontWeight: 800,
            mono: true,
            color: c.textPrimary,
            width: 132,
            align: 'left',
        }),
        contributionBar(c, score, score < 0 ? c.warningLight : c.primaryLight),
        React.createElement(TextLabel, {
            c,
            text: score.toFixed(3),
            fontSize: 20,
            fontWeight: 900,
            mono: true,
            color: tone,
            width: 74,
            align: 'right',
        }),
    )
}

const illustration = defineIllustration((theme) => {
    const light = theme.bg === getThemeColors('light').bg
    const c: ThemeColors = {
        ...theme,
        preset: 'engineering',
        shadow: 'transparent',
        primaryLight: light ? theme.primaryDark : theme.primaryLight,
        warningLight: light ? theme.warningDark : theme.warningLight,
        textSecondary: theme.textPrimary,
    }
    const badgeColors: ThemeColors = { ...c, textPrimary: light ? c.textPrimary : c.bg }
    return createWithChildren(
        Scene,
        { c, background: c.bgSubtle, padding: 16, gap: 9, contentWidth: 528, align: 'center' },
        React.createElement(TextLabel, {
            c,
            text: 'Four frequency pairs build one attention logit',
            fontSize: 24,
            fontWeight: 900,
            color: c.textPrimary,
            width: '100%',
            align: 'center',
        }),
        createWithChildren(
            Row,
            { gap: 8, width: '100%', justify: 'center', align: 'center' },
            React.createElement(BadgePill, {
                c: badgeColors,
                text: 'q=k=[1,0] per pair',
                tone: 'blue',
                height: 36,
                fontSize: 20,
                mono: true,
            }),
            React.createElement(BadgePill, {
                c: badgeColors,
                text: 'm=4, n=2',
                tone: 'green',
                height: 36,
                fontSize: 20,
                mono: true,
            }),
            React.createElement(BadgePill, {
                c: badgeColors,
                text: 'n−m=−2',
                tone: 'warm',
                height: 36,
                fontSize: 20,
                mono: true,
            }),
        ),
        React.createElement(TextLabel, {
            c,
            text: 'Each pair contributes cos((n−m)θᵢ) on the same scale.',
            fontSize: 20,
            color: c.textSecondary,
            width: '100%',
            align: 'center',
        }),
        ...frequencies.map((_, index) =>
            scoreRow(c, index, index === 0 ? c.warningLight : c.primaryLight),
        ),
        createWithChildren(
            Column,
            { gap: 4, width: '100%', align: 'center', style: { paddingTop: 8 } },
            React.createElement(TextLabel, {
                c,
                text: `Σ sᵢ = ${total.toFixed(3)}`,
                fontSize: 22,
                fontWeight: 900,
                mono: true,
                color: c.textPrimary,
            }),
            createWithChildren(
                Row,
                { gap: 10, width: '100%', justify: 'center', align: 'center' },
                React.createElement(TextLabel, {
                    c,
                    text: '÷ √8 →',
                    fontSize: 22,
                    fontWeight: 800,
                    color: c.textSecondary,
                }),
                React.createElement(BadgePill, {
                    c: badgeColors,
                    text: `logit ≈ ${logit.toFixed(3)}`,
                    tone: 'purple',
                    height: 40,
                    fontSize: 20,
                    mono: true,
                }),
            ),
        ),
        React.createElement(TextLabel, {
            c,
            text: 'RoPE rotates Q and K; the value vector V stays unchanged.',
            fontSize: 20,
            fontWeight: 800,
            color: c.textPrimary,
            width: '100%',
            align: 'center',
        }),
    )
})

export const create = illustration.create
export default illustration.default
