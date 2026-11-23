import React from 'react'
import {
    GraphDiagram,
    Panel,
    Row,
    Scene,
    TextLabel,
    getReadableToneColor,
    getThemeColors,
    renderToPngWithOutput,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

// From web/: pnpm exec tsx -e "import { renderBanner } from './src/content/foundations/decision-trees-random-forests-gradient-boosting/social_banner.tsx'; renderBanner('./src/content/foundations/decision-trees-random-forests-gradient-boosting/social_banner.png')"
export const width = 1200
export const height = 630
export const autoSize = false
export const alt =
    'Decision Trees, Forests, and Boosting. A flower classifier splits petal width at 1.75 cm. Forests average separately fitted trees. Boosting adds a fitted correction to a current prediction.'

const leftProbability = 4 / 38
const rightProbability = 31 / 32
const forestScore = (0.2 + 0.8 + 0.8) / 3
const initialGrowth = 30
const learningRate = 0.1
const residualCorrection = -15
const updatedGrowth = initialGrowth + learningRate * residualCorrection

// Explicit downward arrowheads preserve the direction of these vertical routes.
function routedGraph(
    graph: React.ReactElement,
    routes: React.ReactNode,
    labels?: React.ReactNode,
) {
    return React.createElement(
        'div',
        {
            style: {
                display: 'flex',
                position: 'relative',
                width: 320,
                height: 218,
            },
        },
        graph,
        React.createElement(
            'svg',
            {
                width: 320,
                height: 218,
                viewBox: '0 0 320 218',
                style: { position: 'absolute', left: 0, top: 0 },
            },
            routes,
        ),
        labels,
    )
}

export function create(theme: ThemeMode = 'dark'): React.ReactElement {
    const c = getThemeColors(
        theme,
        theme === 'dark' ? 'default' : 'engineering',
    )
    const blue = getReadableToneColor('blue', c)
    const purple = getReadableToneColor('purple', c)
    const green = getReadableToneColor('green', c)
    const subtitle = (text: string) =>
        TextLabel({
            c,
            text,
            fontSize: 19,
            color: c.textSecondary,
            width: '100%',
            align: 'center',
        })
    return Scene({
        c,
        background: c.bg,
        padding: 46,
        contentWidth: 1108,
        gap: 18,
        children: [
            TextLabel({
                c,
                text: 'Decision Trees, Forests, and Boosting',
                fontSize: 44,
                fontWeight: 750,
                color: c.textPrimary,
                width: 1108,
            }),
            TextLabel({
                c,
                text: 'Learn a question. Combine answers. Improve a prediction.',
                fontSize: 25,
                color: c.textSecondary,
                width: 1108,
            }),
            Row({
                gap: 20,
                align: 'stretch',
                justify: 'center',
                children: [
                    Panel({
                        c,
                        title: 'Decision tree',
                        titleFontSize: 25,
                        tone: 'blue',
                        width: 356,
                        padding: 18,
                        gap: 14,
                        children: [
                            subtitle('Route through fitted splits'),
                            routedGraph(
                                GraphDiagram({
                                    c,
                                    width: 320,
                                    height: 218,
                                    padding: 12,
                                    layout: 'manual',
                                    labelFontSize: 20,
                                    detailFontSize: 16,
                                    nodes: [
                                        {
                                            id: 'split',
                                            label: 'width ≤ 1.75 cm?',
                                            x: 0.5,
                                            y: 0.12,
                                            width: 264,
                                            height: 56,
                                            tone: 'blue',
                                        },
                                        {
                                            id: 'left',
                                            label: `p = ${leftProbability.toFixed(2)}`,
                                            x: 0.06,
                                            y: 0.87,
                                            width: 130,
                                            height: 56,
                                            tone: 'blue',
                                        },
                                        {
                                            id: 'right',
                                            label: `p = ${rightProbability.toFixed(2)}`,
                                            x: 0.94,
                                            y: 0.87,
                                            width: 130,
                                            height: 56,
                                            tone: 'blue',
                                        },
                                    ],
                                    edges: [],
                                }),
                                React.createElement(
                                    'g',
                                    {
                                        stroke: blue,
                                        strokeWidth: 2.5,
                                        fill: 'none',
                                    },
                                    React.createElement('path', {
                                        d: 'M160 63.28 V100 H65 V152.78 M160 100 H255 V152.78',
                                    }),
                                    React.createElement('polygon', {
                                        points: '65,152.78 59,142.78 71,142.78',
                                        fill: blue,
                                        stroke: 'none',
                                    }),
                                    React.createElement('polygon', {
                                        points: '255,152.78 249,142.78 261,142.78',
                                        fill: blue,
                                        stroke: 'none',
                                    }),
                                ),
                                React.createElement(
                                    'div',
                                    {
                                        style: {
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            width: 320,
                                            height: 218,
                                            display: 'flex',
                                        },
                                    },
                                    React.createElement(
                                        'div',
                                        {
                                            style: {
                                                position: 'absolute',
                                                left: 80,
                                                top: 116,
                                                width: 45,
                                                height: 25,
                                                display: 'flex',
                                            },
                                        },
                                        TextLabel({
                                            c,
                                            text: 'yes',
                                            fontSize: 17,
                                            color: c.textSecondary,
                                            width: 45,
                                        }),
                                    ),
                                    React.createElement(
                                        'div',
                                        {
                                            style: {
                                                position: 'absolute',
                                                left: 215,
                                                top: 116,
                                                width: 45,
                                                height: 25,
                                                display: 'flex',
                                            },
                                        },
                                        TextLabel({
                                            c,
                                            text: 'no',
                                            fontSize: 17,
                                            color: c.textSecondary,
                                            width: 45,
                                        }),
                                    ),
                                ),
                            ),
                        ],
                    }),
                    Panel({
                        c,
                        title: 'Random forest',
                        titleFontSize: 25,
                        tone: 'purple',
                        width: 356,
                        padding: 18,
                        gap: 14,
                        children: [
                            subtitle('Separately fitted trees'),
                            routedGraph(
                                GraphDiagram({
                                    c,
                                    width: 320,
                                    height: 218,
                                    padding: 8,
                                    layout: 'manual',
                                    labelFontSize: 19,
                                    detailFontSize: 23,
                                    nodes: [
                                        {
                                            id: 'a',
                                            label: 'Tree 1',
                                            detail: '0.20',
                                            x: 0,
                                            y: 0.12,
                                            width: 94,
                                            height: 72,
                                            tone: 'purple',
                                        },
                                        {
                                            id: 'b',
                                            label: 'Tree 2',
                                            detail: '0.80',
                                            x: 0.5,
                                            y: 0.12,
                                            width: 94,
                                            height: 72,
                                            tone: 'purple',
                                        },
                                        {
                                            id: 'c',
                                            label: 'Tree 3',
                                            detail: '0.80',
                                            x: 1,
                                            y: 0.12,
                                            width: 94,
                                            height: 72,
                                            tone: 'purple',
                                        },
                                        {
                                            id: 'mean',
                                            label: `Mean = ${forestScore.toFixed(2)}`,
                                            x: 0.5,
                                            y: 0.9,
                                            width: 246,
                                            height: 56,
                                            tone: 'purple',
                                        },
                                    ],
                                    edges: [],
                                }),
                                React.createElement(
                                    'g',
                                    {
                                        stroke: purple,
                                        strokeWidth: 2.5,
                                        fill: 'none',
                                    },
                                    React.createElement('path', {
                                        d: 'M47 72 V116 H160 M273 72 V116 H160 M160 72 V161.8',
                                    }),
                                    React.createElement('polygon', {
                                        points: '160,161.8 154,151.8 166,151.8',
                                        fill: purple,
                                        stroke: 'none',
                                    }),
                                ),
                            ),
                        ],
                    }),
                    Panel({
                        c,
                        title: 'Gradient boosting',
                        titleFontSize: 25,
                        tone: 'green',
                        width: 356,
                        padding: 18,
                        gap: 14,
                        children: [
                            subtitle('Sequential error corrections'),
                            routedGraph(
                                GraphDiagram({
                                    c,
                                    width: 320,
                                    height: 218,
                                    padding: 6,
                                    layout: 'manual',
                                    labelFontSize: 23,
                                    nodes: [
                                        {
                                            id: 'base',
                                            label: `${initialGrowth.toFixed(1)} mm`,
                                            x: 0.5,
                                            y: 0,
                                            width: 246,
                                            height: 48,
                                            tone: 'neutral',
                                        },
                                        {
                                            id: 'delta',
                                            label: `+ ${learningRate.toFixed(2)} × (−15.0)`,
                                            x: 0.5,
                                            y: 0.5,
                                            width: 246,
                                            height: 48,
                                            tone: 'green',
                                        },
                                        {
                                            id: 'updated',
                                            label: `${updatedGrowth.toFixed(1)} mm`,
                                            x: 0.5,
                                            y: 1,
                                            width: 246,
                                            height: 48,
                                            tone: 'green',
                                        },
                                    ],
                                    edges: [],
                                }),
                                React.createElement(
                                    'g',
                                    {
                                        stroke: green,
                                        strokeWidth: 2.5,
                                        fill: 'none',
                                    },
                                    React.createElement('path', {
                                        d: 'M160 48 V85 M160 133 V170',
                                    }),
                                    React.createElement('polygon', {
                                        points: '160,85 154,75 166,75',
                                        fill: green,
                                        stroke: 'none',
                                    }),
                                    React.createElement('polygon', {
                                        points: '160,170 154,160 166,160',
                                        fill: green,
                                        stroke: 'none',
                                    }),
                                ),
                            ),
                        ],
                    }),
                ],
            }),
            TextLabel({
                c,
                text: 'From measured flowers to fitted trees and explained corrections.',
                fontSize: 22,
                color: c.textSecondary,
                width: 1108,
            }),
            TextLabel({
                c,
                text: 'LeetLLM',
                fontSize: 23,
                fontWeight: 700,
                color: c.textPrimary,
                width: 1108,
                align: 'right',
            }),
        ],
    })
}

export async function renderBanner(
    outputPath: string,
    theme: ThemeMode = 'dark',
) {
    const result = await renderToPngWithOutput(create(theme), {
        width,
        height,
        outputPath,
        scale: 1,
        crop: false,
        watermark: false,
        background: 'theme',
        theme,
    })
    if (result.pixelWidth !== width || result.pixelHeight !== height)
        throw new Error('Unexpected banner dimensions')
    return result
}
export default create('dark')
