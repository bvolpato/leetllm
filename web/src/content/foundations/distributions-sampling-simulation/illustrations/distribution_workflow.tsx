import React from 'react'
import {
    AxisPlot,
    Board,
    CanvasItem,
    Column,
    Row,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
    getToneColor,
    type ThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const preset = 'engineering'
export const width = 600
export const height = 800
export const alt =
    'Three aligned probability bands show how temperature redistributes probability across blue, clear, cloudy, and green after the prompt “The sky is”. For one T = 1 Gumbel-Max draw, each word moves from its base logit by its sampled noise to a perturbed score; clear reaches 3.75, the largest score, and wins.'

const tokens = [
    { name: 'blue', tone: 'blue' },
    { name: 'clear', tone: 'cyan' },
    { name: 'cloudy', tone: 'warm' },
    { name: 'green', tone: 'green' },
] as const

const logits = [2.2, 1.5, 0.2, -1.5]
const temperatures = [0.3, 1, 2]
const gumbelDraws = [0.77, 2.25, -0.09, 0.43]

function softmaxAtTemperature(values: number[], temperature: number): number[] {
    const scaled = values.map((value) => value / temperature)
    const max = Math.max(...scaled)
    const weights = scaled.map((value) => Math.exp(value - max))
    const total = weights.reduce((sum, value) => sum + value, 0)
    return weights.map((weight) => weight / total)
}

function label(
    c: ThemeColors,
    text: string,
    fontSize: number,
    color = c.textPrimary,
    options: {
        fontWeight?: number
        width?: number | string
        align?: 'left' | 'center' | 'right'
        mono?: boolean
    } = {},
) {
    return TextLabel({ c, text, fontSize, color, ...options })
}

function probabilityRows(c: ThemeColors) {
    const labelWidth = 76
    const bandWidth = 476
    const columnWidth = bandWidth / tokens.length

    return Column({
        gap: 6,
        align: 'stretch',
        width: '100%',
        children: [
            Row({
                gap: 0,
                align: 'center',
                justify: 'start',
                width: '100%',
                children: [
                    React.createElement('div', {
                        key: 'blank',
                        style: { width: labelWidth, flexShrink: 0 },
                    }),
                    ...tokens.map((token) =>
                        React.createElement(
                            'div',
                            {
                                key: token.name,
                                style: {
                                    width: columnWidth,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    boxSizing: 'border-box',
                                },
                            },
                            React.createElement('span', {
                                style: {
                                    width: 10,
                                    height: 10,
                                    borderRadius: 2,
                                    backgroundColor: getToneColor(token.tone, c),
                                    flexShrink: 0,
                                },
                            }),
                            label(c, token.name, 21, c.textSecondary, { fontWeight: 650 }),
                        ),
                    ),
                ],
            }),
            ...temperatures.map((temperature) => {
                const probabilities = softmaxAtTemperature([...logits], temperature)
                const formatted = probabilities.map((probability) =>
                    probability < 0.001 ? '<0.1%' : `${(probability * 100).toFixed(1)}%`,
                )
                const temperatureRow = Column({
                    gap: 3,
                    align: 'stretch',
                    children: [
                        Row({
                            gap: 0,
                            align: 'center',
                            width: '100%',
                            children: [
                                label(c, `T=${temperature.toFixed(1)}`, 25, c.textPrimary, {
                                    width: labelWidth,
                                    fontWeight: 750,
                                    mono: true,
                                }),
                                React.createElement(
                                    'div',
                                    {
                                        style: {
                                            width: bandWidth,
                                            height: 25,
                                            display: 'flex',
                                            overflow: 'hidden',
                                            borderRadius: 4,
                                            border: `1px solid ${c.borderLight}`,
                                            boxSizing: 'border-box',
                                        },
                                    },
                                    ...tokens.map((token, index) =>
                                        React.createElement('div', {
                                            key: token.name,
                                            style: {
                                                flex: `0 0 ${probabilities[index] * 100}%`,
                                                boxSizing: 'border-box',
                                                minWidth: 0,
                                                backgroundColor: getToneColor(token.tone, c),
                                                ...(index < tokens.length - 1
                                                    ? { borderRight: `1px solid ${c.bg}` }
                                                    : {}),
                                            },
                                        }),
                                    ),
                                ),
                            ],
                        }),
                        Row({
                            gap: 0,
                            align: 'center',
                            width: '100%',
                            children: [
                                React.createElement('div', {
                                    key: 'blank',
                                    style: { width: labelWidth, flexShrink: 0 },
                                }),
                                ...tokens.map((token, index) =>
                                    React.cloneElement(
                                        label(
                                            c,
                                            formatted[index],
                                            25,
                                            getReadableToneColor(token.tone, c),
                                            {
                                                width: columnWidth,
                                                fontWeight: 700,
                                                mono: true,
                                            },
                                        ),
                                        { key: token.name },
                                    ),
                                ),
                            ],
                        }),
                    ],
                })
                return React.cloneElement(temperatureRow, { key: temperature })
            }),
        ],
    })
}

function startMarker(c: ThemeColors, color: string) {
    return React.createElement('span', {
        style: {
            width: 10,
            height: 10,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            backgroundColor: c.bg,
            boxSizing: 'border-box',
            flexShrink: 0,
        },
    })
}

function arrowMarker(c: ThemeColors, color: string) {
    return AxisPlot({
        c,
        width: 30,
        height: 16,
        xMin: 0,
        xMax: 1,
        yMin: 0,
        yMax: 1,
        padding: 2,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        vectors: [
            {
                x1: 0.08,
                y1: 0.5,
                x2: 0.92,
                y2: 0.5,
                color,
                strokeWidth: 2.5,
                arrow: true,
                arrowSize: 3.5,
            },
        ],
    })
}

function scoreRace(c: ThemeColors) {
    const boardWidth = 552
    const boardHeight = 210
    const graphWidth = 203
    const graphHeight = 178
    const graphX = 94
    const graphY = 0
    const formulaX = 313
    const formulaWidth = 235
    const padding = 14
    const minScore = -2
    const maxScore = 4
    const minRow = -0.8
    const maxRow = 3.5
    const innerWidth = graphWidth - padding * 2
    const innerHeight = graphHeight - padding * 2
    const xAt = (score: number) =>
        padding + ((score - minScore) / (maxScore - minScore)) * innerWidth
    const yAt = (row: number) => padding + ((maxRow - row) / (maxRow - minRow)) * innerHeight
    const scores = logits.map((value, index) => value + gumbelDraws[index])
    const rowFor = (index: number) => tokens.length - index - 1
    const ticks = [
        { value: -2, label: '−2' },
        { value: 0, label: '0' },
        { value: 2, label: '2' },
        { value: 4, label: '4' },
    ]
    const vectors = [
        ...tokens.flatMap((token, index) => {
            const row = rowFor(index)
            return [
                {
                    x1: minScore,
                    y1: row,
                    x2: maxScore,
                    y2: row,
                    color: c.borderSubtle,
                    strokeWidth: 1,
                    showStartDot: false,
                    showEndDot: false,
                },
                {
                    x1: logits[index],
                    y1: row,
                    x2: scores[index],
                    y2: row,
                    color: getToneColor(token.tone, c),
                    strokeWidth: token.name === 'clear' ? 3.5 : 2.5,
                    arrow: true,
                    arrowSize: 3.5,
                },
            ]
        }),
        {
            x1: minScore,
            y1: -0.55,
            x2: maxScore,
            y2: -0.55,
            color: c.borderLight,
            strokeWidth: 1.6,
            showStartDot: false,
            showEndDot: false,
        },
        ...ticks.map(({ value }) => ({
            x1: value,
            y1: -0.55,
            x2: value,
            y2: -0.34,
            color: c.borderLight,
            strokeWidth: 1.5,
            showStartDot: false,
            showEndDot: false,
        })),
    ]
    const chart = AxisPlot({
        c,
        width: graphWidth,
        height: graphHeight,
        xMin: minScore,
        xMax: maxScore,
        yMin: -0.8,
        yMax: maxRow,
        padding,
        showFrame: false,
        showAxes: false,
        showGrid: false,
        vectors,
        points: tokens.map((token, index) => ({
            x: logits[index],
            y: rowFor(index),
            fill: c.bg,
            stroke: getToneColor(token.tone, c),
            strokeWidth: 2,
            r: 4.5,
        })),
    })

    return Column({
        gap: 4,
        align: 'stretch',
        children: [
            Row({
                gap: 18,
                align: 'center',
                justify: 'center',
                children: [
                    Row({
                        gap: 5,
                        align: 'center',
                        children: [
                            startMarker(c, c.textSecondary),
                            label(c, 'start z', 21, c.textSecondary),
                        ],
                    }),
                    Row({
                        gap: 5,
                        align: 'center',
                        children: [
                            arrowMarker(c, c.textSecondary),
                            label(c, 'arrow tip z + g', 21, c.textSecondary),
                        ],
                    }),
                ],
            }),
            Board({
                c,
                width: boardWidth,
                height: boardHeight,
                children: [
                    CanvasItem({
                        x: graphX,
                        y: graphY,
                        width: graphWidth,
                        height: graphHeight,
                        children: chart,
                    }),
                    ...tokens.map((token, index) =>
                        React.cloneElement(
                            CanvasItem({
                                x: 0,
                                y: yAt(rowFor(index)) - 14,
                                width: 86,
                                height: 28,
                                children: label(
                                    c,
                                    token.name,
                                    25,
                                    getReadableToneColor(token.tone, c),
                                    {
                                        fontWeight: token.name === 'clear' ? 800 : 650,
                                    },
                                ),
                            }),
                            { key: `name-${token.name}` },
                        ),
                    ),
                    ...scores.map((score, index) =>
                        React.cloneElement(
                            CanvasItem({
                                x: formulaX,
                                y: yAt(rowFor(index)) - 14,
                                width: formulaWidth,
                                height: 28,
                                children: label(
                                    c,
                                    `${logits[index] < 0 ? '−' : ''}${Math.abs(logits[index]).toFixed(1)}${gumbelDraws[index] < 0 ? '−' : '+'}${Math.abs(gumbelDraws[index]).toFixed(2)}=${score < 0 ? '−' : ''}${Math.abs(score).toFixed(2)}`,
                                    25,
                                    getReadableToneColor(tokens[index].tone, c),
                                    { fontWeight: index === 1 ? 800 : 600, mono: true },
                                ),
                            }),
                            { key: `score-${index}` },
                        ),
                    ),
                    ...ticks.map(({ value, label: tickLabel }) =>
                        React.cloneElement(
                            CanvasItem({
                                x: graphX + xAt(value) - 21,
                                y: graphHeight - 1,
                                width: 42,
                                height: 25,
                                children: label(c, tickLabel, 20, c.textMuted, {
                                    fontWeight: 500,
                                    align: 'center',
                                    mono: true,
                                }),
                            }),
                            { key: `tick-${value}` },
                        ),
                    ),
                ],
            }),
        ],
    })
}

const illustration = defineIllustration((c) =>
    Scene({
        c,
        padding: 24,
        gap: 12,
        justify: 'flex-start',
        children: Column({
            gap: 10,
            align: 'stretch',
            width: '100%',
            children: [
                Column({
                    gap: 5,
                    align: 'stretch',
                    children: [
                        label(c, 'Temperature reshapes odds; noise picks one', 25, c.textPrimary, {
                            fontWeight: 800,
                        }),
                        label(c, 'Prompt “The sky is” · four candidate words', 21, c.textSecondary),
                    ],
                }),
                Column({
                    gap: 4,
                    align: 'stretch',
                    children: [
                        label(c, 'Temperature changes the probability bands', 25, c.textPrimary, {
                            fontWeight: 750,
                        }),
                        label(
                            c,
                            'Shared 0–100% scale; word colors stay fixed.',
                            21,
                            c.textSecondary,
                        ),
                    ],
                }),
                probabilityRows(c),
                Column({
                    gap: 4,
                    align: 'stretch',
                    children: [
                        label(c, 'One T = 1 draw · Gumbel-Max', 25, c.textPrimary, {
                            fontWeight: 750,
                        }),
                        label(
                            c,
                            'Add Gumbel noise to each logit; the largest score wins.',
                            21,
                            c.textSecondary,
                        ),
                    ],
                }),
                scoreRace(c),
            ],
        }),
    }),
)

export function create(theme: ThemeMode = 'dark') {
    return illustration.create(theme)
}

export default create()
