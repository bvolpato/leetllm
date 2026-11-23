import React from 'react'
import { Column, GraphDiagram, Scene, TextLabel, defineIllustration } from 'vizmatic'

export const width = 760
export const height = 720

export const alt =
    'Two-pass associative scan over four steps: bottom-up reduction merges (a, b) tuples to root (0.6561, 1.7194), and top-down prefix distribution computes states [0.600, 0.740, 1.466, 1.719] in O(log L) depth.'

const illustration = defineIllustration((c) => (
    <Scene c={c} density={1.9} padding={10} gap={8} background="transparent">
        <Column gap={8} align="center">
            <TextLabel
                c={c}
                text="Pass 1: upward associative reduction (a2, b2) o (a1, b1)"
                fontSize={24}
                fontWeight={600}
            />
            <GraphDiagram
                c={c}
                density={1}
                layout="manual"
                routing="straight"
                sizing="fixed"
                width={720}
                height={295}
                padding={8}
                labelFontSize={23}
                detailFontSize={23}
                arrowSize={6}
                nodes={[
                    {
                        id: 'r',
                        label: 'Root',
                        detail: '.656, 1.72',
                        x: 0.5,
                        y: 0.14,
                        tone: 'purple',
                    },
                    {
                        id: 'n12',
                        label: '[1..2]',
                        detail: '.81, .74',
                        x: 0.25,
                        y: 0.5,
                        tone: 'blue',
                    },
                    {
                        id: 'n34',
                        label: '[3..4]',
                        detail: '.81, 1.12',
                        x: 0.75,
                        y: 0.5,
                        tone: 'blue',
                    },
                    {
                        id: 'l1',
                        label: 't1',
                        detail: '.9, .6',
                        x: 0.125,
                        y: 0.86,
                        tone: 'neutral',
                    },
                    {
                        id: 'l2',
                        label: 't2',
                        detail: '.9, .2',
                        x: 0.375,
                        y: 0.86,
                        tone: 'neutral',
                    },
                    {
                        id: 'l3',
                        label: 't3',
                        detail: '.9, .8',
                        x: 0.625,
                        y: 0.86,
                        tone: 'neutral',
                    },
                    {
                        id: 'l4',
                        label: 't4',
                        detail: '.9, .4',
                        x: 0.875,
                        y: 0.86,
                        tone: 'neutral',
                    },
                ]}
                edges={[
                    { from: 'l1', to: 'n12', tone: 'blue' },
                    { from: 'l2', to: 'n12', tone: 'blue' },
                    { from: 'l3', to: 'n34', tone: 'blue' },
                    { from: 'l4', to: 'n34', tone: 'blue' },
                    { from: 'n12', to: 'r', tone: 'purple' },
                    { from: 'n34', to: 'r', tone: 'purple' },
                ]}
            />

            <TextLabel
                c={c}
                text="Pass 2: downward prefix sweep in O(log L) span"
                fontSize={24}
                fontWeight={600}
            />
            <GraphDiagram
                c={c}
                density={1}
                layout="manual"
                routing="straight"
                sizing="fixed"
                width={720}
                height={295}
                padding={8}
                labelFontSize={23}
                detailFontSize={23}
                arrowSize={6}
                nodes={[
                    {
                        id: 'p0',
                        label: 'Seed (1,0)',
                        detail: 'h0 = 0',
                        x: 0.5,
                        y: 0.14,
                        tone: 'purple',
                    },
                    {
                        id: 'pL',
                        label: 'Left',
                        detail: '1, 0',
                        x: 0.25,
                        y: 0.5,
                        tone: 'blue',
                    },
                    {
                        id: 'pR',
                        label: 'Right',
                        detail: '.81, .74',
                        x: 0.75,
                        y: 0.5,
                        tone: 'blue',
                    },
                    {
                        id: 'h1',
                        label: 'h1=.60',
                        detail: 't1',
                        x: 0.125,
                        y: 0.86,
                        tone: 'green',
                    },
                    {
                        id: 'h2',
                        label: 'h2=.74',
                        detail: 't2',
                        x: 0.375,
                        y: 0.86,
                        tone: 'green',
                    },
                    {
                        id: 'h3',
                        label: 'h3=1.47',
                        detail: 't3',
                        x: 0.625,
                        y: 0.86,
                        tone: 'green',
                    },
                    {
                        id: 'h4',
                        label: 'h4=1.72',
                        detail: 't4',
                        x: 0.875,
                        y: 0.86,
                        tone: 'green',
                    },
                ]}
                edges={[
                    { from: 'p0', to: 'pL', tone: 'blue' },
                    { from: 'p0', to: 'pR', tone: 'blue' },
                    { from: 'pL', to: 'h1', tone: 'green' },
                    { from: 'pL', to: 'h2', tone: 'green' },
                    { from: 'pR', to: 'h3', tone: 'green' },
                    { from: 'pR', to: 'h4', tone: 'green' },
                ]}
            />
        </Column>
    </Scene>
))

export const create = illustration.create
export default illustration.default
