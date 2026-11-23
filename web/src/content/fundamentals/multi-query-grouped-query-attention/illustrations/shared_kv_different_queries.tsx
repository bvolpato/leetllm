import React from 'react'
import { GraphDiagram, Panel, Scene, getThemeColors, type ThemeMode } from 'vizmatic'

export const width = 1000
export const height = 760
export const alt =
    'Two query vectors read the same shared key and value rows. Scaling by square root of two gives score rows [0.707, 0] and [0, 0.707]; softmax gives [0.67, 0.33] and [0.33, 0.67]. With value rows [1, 0] and [0, 1], each output equals its own weights.'

const vectorRows = (first: string, second: string) =>
    React.createElement(
        'span',
        {
            style: { display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: 1.1 },
        },
        React.createElement('span', null, first),
        React.createElement('span', null, second),
    )

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const nodes = [
        {
            id: 'shared-k',
            label: 'Shared K',
            detail: vectorRows('K0 [1,0]', 'K1 [0,1]'),
            x: 0.36,
            y: 0.15,
            width: 244,
            height: 160,
            tone: 'cyan' as const,
        },
        {
            id: 'shared-v',
            label: 'Shared V',
            detail: vectorRows('V0 [1,0]', 'V1 [0,1]'),
            x: 0.85,
            y: 0.15,
            width: 244,
            height: 160,
            tone: 'green' as const,
        },
        {
            id: 'q0',
            label: 'Q0',
            detail: '[1,0]',
            x: 0.09,
            y: 0.5,
            width: 140,
            height: 112,
            tone: 'purple' as const,
        },
        {
            id: 'score0',
            label: 'q·K / √2',
            detail: '[.707,0]',
            x: 0.35,
            y: 0.5,
            width: 208,
            height: 112,
            tone: 'purple' as const,
        },
        {
            id: 'weight0',
            label: 'softmax',
            detail: vectorRows('[.67,', '.33]'),
            x: 0.6,
            y: 0.5,
            width: 190,
            height: 156,
            tone: 'purple' as const,
        },
        {
            id: 'out0',
            label: 'O0 = αV',
            detail: vectorRows('[.67,', '.33]'),
            x: 0.85,
            y: 0.5,
            width: 210,
            height: 156,
            tone: 'purple' as const,
        },
        {
            id: 'q1',
            label: 'Q1',
            detail: '[0,1]',
            x: 0.09,
            y: 0.82,
            width: 140,
            height: 112,
            tone: 'blue' as const,
        },
        {
            id: 'score1',
            label: 'q·K / √2',
            detail: '[0,.707]',
            x: 0.35,
            y: 0.82,
            width: 208,
            height: 112,
            tone: 'blue' as const,
        },
        {
            id: 'weight1',
            label: 'softmax',
            detail: vectorRows('[.33,', '.67]'),
            x: 0.6,
            y: 0.82,
            width: 190,
            height: 156,
            tone: 'blue' as const,
        },
        {
            id: 'out1',
            label: 'O1 = αV',
            detail: vectorRows('[.33,', '.67]'),
            x: 0.85,
            y: 0.82,
            width: 210,
            height: 156,
            tone: 'blue' as const,
        },
    ]

    const edges = [
        {
            from: 'q0',
            to: 'score0',
            fromSide: 'right' as const,
            toSide: 'left' as const,
            tone: 'purple' as const,
        },
        {
            from: 'shared-k',
            to: 'score0',
            fromSide: 'bottom' as const,
            toSide: 'top' as const,
            tone: 'cyan' as const,
        },
        {
            from: 'score0',
            to: 'weight0',
            fromSide: 'right' as const,
            toSide: 'left' as const,
            tone: 'purple' as const,
        },
        {
            from: 'weight0',
            to: 'out0',
            fromSide: 'right' as const,
            toSide: 'left' as const,
            tone: 'purple' as const,
        },
        {
            from: 'shared-v',
            to: 'out0',
            fromSide: 'bottom' as const,
            toSide: 'top' as const,
            tone: 'green' as const,
        },
        {
            from: 'q1',
            to: 'score1',
            fromSide: 'right' as const,
            toSide: 'left' as const,
            tone: 'blue' as const,
        },
        {
            from: 'shared-k',
            to: 'score1',
            fromSide: 'bottom' as const,
            toSide: 'top' as const,
            tone: 'cyan' as const,
        },
        {
            from: 'score1',
            to: 'weight1',
            fromSide: 'right' as const,
            toSide: 'left' as const,
            tone: 'blue' as const,
        },
        {
            from: 'weight1',
            to: 'out1',
            fromSide: 'right' as const,
            toSide: 'left' as const,
            tone: 'blue' as const,
        },
        {
            from: 'shared-v',
            to: 'out1',
            fromSide: 'bottom' as const,
            toSide: 'top' as const,
            tone: 'green' as const,
        },
    ]

    return Scene({
        c,
        title: 'Same K/V storage, different query outputs',
        subtitle: 'Two-dimensional example · probabilities and outputs shown to two decimals',
        padding: 14,
        gap: 8,
        contentWidth: 980,
        children: React.createElement(
            Panel,
            {
                c,
                title: 'dₖ = 2 · scale = √2',
                titleFontSize: 36,
                tone: 'cyan',
                width: 960,
                padding: 8,
                bodyStyle: { alignItems: 'center' },
            },
            React.createElement(GraphDiagram, {
                c,
                width: 940,
                height: 600,
                layout: 'manual',
                routing: 'orthogonal',
                routingClearance: 12,
                padding: 14,
                labelFontSize: 36,
                detailFontSize: 36,
                arrowSize: 8,
                ariaLabel:
                    'Two query lanes use the same stored K and V vectors, then calculate distinct softmax weights and outputs.',
                nodes,
                edges,
            }),
        ),
    })
}

export default create()
