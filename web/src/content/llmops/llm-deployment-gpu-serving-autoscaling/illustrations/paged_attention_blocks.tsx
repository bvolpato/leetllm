import React from 'react'
import {
    Column,
    GraphDiagram,
    Scene,
    TextLabel,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 700
export const height = 560
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'PagedAttention virtual-to-physical KV cache mapping: contiguous logical token blocks L0, L1, and L2 translate through the per-sequence Block Table to scattered physical HBM blocks P5, P2, and P8 while free block P1 remains available for the next generated page.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.15)

    return Scene({
        c: base,
        padding: 16,
        gap: 10,
        contentWidth: 668,
        children: Column({
            gap: 10,
            width: 668,
            children: [
                TextLabel({
                    c,
                    text: 'Block tables decouple logical token order from physical HBM',
                    fontSize: 27,
                    fontWeight: 700,
                    color: base.textPrimary,
                }),
                GraphDiagram({
                    c: base,
                    width: 668,
                    height: 430,
                    nodeWidth: 192,
                    nodeHeight: 80,
                    labelFontSize: 23,
                    detailFontSize: 21,
                    padding: 8,
                    arrowSize: 6,
                    nodes: [
                        {
                            id: 'l0',
                            label: 'Logical L0',
                            detail: 'Tokens 0..15',
                            x: 0.02,
                            y: 0.06,
                            tone: 'blue',
                        },
                        {
                            id: 'l1',
                            label: 'Logical L1',
                            detail: 'Tokens 16..31',
                            x: 0.02,
                            y: 0.5,
                            tone: 'blue',
                        },
                        {
                            id: 'l2',
                            label: 'Logical L2',
                            detail: 'Tokens 32..47',
                            x: 0.02,
                            y: 0.94,
                            tone: 'blue',
                        },
                        {
                            id: 'bt',
                            label: 'Block Table',
                            detail: 'L0→P5, L1→P2, L2→P8',
                            x: 0.5,
                            y: 0.5,
                            tone: 'purple',
                        },
                        {
                            id: 'p5',
                            label: 'Physical P5',
                            detail: 'Scattered HBM',
                            x: 0.98,
                            y: 0.06,
                            tone: 'green',
                        },
                        {
                            id: 'p2',
                            label: 'Physical P2',
                            detail: 'HBM page pool',
                            x: 0.98,
                            y: 0.35,
                            tone: 'green',
                        },
                        {
                            id: 'p8',
                            label: 'Physical P8',
                            detail: 'Tail append',
                            x: 0.98,
                            y: 0.65,
                            tone: 'green',
                        },
                        {
                            id: 'p1',
                            label: 'Free P1',
                            detail: 'Next free page',
                            x: 0.98,
                            y: 0.94,
                            tone: 'neutral',
                        },
                    ],
                    edges: [
                        { from: 'l0', to: 'bt', tone: 'blue' },
                        { from: 'l1', to: 'bt', tone: 'blue' },
                        { from: 'l2', to: 'bt', tone: 'blue' },
                        { from: 'bt', to: 'p5', tone: 'green' },
                        { from: 'bt', to: 'p2', tone: 'green' },
                        { from: 'bt', to: 'p8', tone: 'green' },
                    ],
                    ariaLabel: alt,
                }),
            ],
        }),
    })
}

export default create('dark')
