import { createElement, type ReactNode } from 'react'
import { GraphDiagram, Scene, getReadableToneColor, getThemeColors, getToneFill } from 'vizmatic'
import type { ThemeMode as Theme, ToneName } from 'vizmatic'

export const width = 640
export const height = 770
export const alt =
    'The hidden state of the token Birds branches into three learned projections: query [1.0, 0.5] asks what to find, key [0.8, 0.2] describes the token for matching, and value [2.0, 1.0] carries the content to mix.'

const indexedWeight = (index: string) =>
    createElement(
        'span',
        {
            style: {
                display: 'inline-flex',
                alignItems: 'baseline',
                whiteSpace: 'nowrap',
            },
        },
        'W',
        createElement('sub', { style: { fontSize: '0.82em', lineHeight: 1 } }, index),
    )

const indexedDimension = () =>
    createElement(
        'span',
        { style: { whiteSpace: 'nowrap' } },
        'width d',
        createElement('sub', { style: { fontSize: '0.82em', lineHeight: 1 } }, 'model'),
    )

export function create(theme: Theme) {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const detail = (tone: ToneName, node: ReactNode) =>
        createElement(
            'span',
            {
                style: {
                    color: getReadableToneColor(tone, c, getToneFill(tone, c), c.bg),
                    fontWeight: 700,
                },
            },
            node,
        )

    return Scene({
        c,
        title: 'One hidden state branches into Q, K, and V',
        contentWidth: 620,
        padding: 10,
        gap: 10,
        children: [
            GraphDiagram({
                c,
                width: 600,
                height: 560,
                layout: 'manual',
                routing: 'orthogonal',
                routingClearance: 14,
                labelFontSize: 22,
                detailFontSize: 22,
                nodeWidth: 176,
                nodeHeight: 110,
                ariaLabel:
                    'Hidden state branches into query, key, and value projections; query and key feed routing while value carries content.',
                nodes: [
                    {
                        id: 'x',
                        label: 'Hidden state x',
                        detail: detail('neutral', indexedDimension()),
                        x: 0.5,
                        y: 0.08,
                        width: 220,
                        tone: 'neutral',
                    },
                    {
                        id: 'q',
                        label: createElement('span', null, 'Query q = x ', indexedWeight('Q')),
                        detail: detail('purple', '[1.0, 0.5]'),
                        x: 0.16,
                        y: 0.44,
                        tone: 'purple',
                    },
                    {
                        id: 'k',
                        label: createElement('span', null, 'Key k = x ', indexedWeight('K')),
                        detail: detail('blue', '[0.8, 0.2]'),
                        x: 0.5,
                        y: 0.44,
                        tone: 'blue',
                    },
                    {
                        id: 'v',
                        label: createElement('span', null, 'Value v = x ', indexedWeight('V')),
                        detail: detail('green', '[2.0, 1.0]'),
                        x: 0.84,
                        y: 0.44,
                        tone: 'green',
                    },
                    {
                        id: 'score',
                        label: 'Routing q·k = 0.90',
                        detail: detail('purple', 'scaled 0.636'),
                        x: 0.28,
                        y: 0.84,
                        width: 220,
                        tone: 'purple',
                    },
                    {
                        id: 'payload',
                        label: 'Value [2.0, 1.0]',
                        detail: detail('green', 'mixed by weights'),
                        x: 0.84,
                        y: 0.84,
                        width: 220,
                        tone: 'green',
                    },
                ],
                edges: [
                    { from: 'x', to: 'q', fromSide: 'bottom', toSide: 'top', tone: 'purple' },
                    { from: 'x', to: 'k', fromSide: 'bottom', toSide: 'top', tone: 'blue' },
                    { from: 'x', to: 'v', fromSide: 'bottom', toSide: 'top', tone: 'green' },
                    { from: 'q', to: 'score', fromSide: 'bottom', toSide: 'top', tone: 'purple' },
                    { from: 'k', to: 'score', fromSide: 'bottom', toSide: 'top', tone: 'blue' },
                    { from: 'v', to: 'payload', fromSide: 'bottom', toSide: 'top', tone: 'green' },
                ],
            }),
        ],
    })
}

export default create('dark')
