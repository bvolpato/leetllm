import React from 'react'
import {
    BadgePill,
    Column,
    Flow,
    Panel,
    Row,
    Scene,
    TiledMatrix,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

const DENSITY = 2.5

export const width = 860
export const height = 800
export const alt =
    'GQA incremental decode step writes only two KV heads at slot t=1 and keeps temporary eight-head expansion strictly ephemeral during compute.'

function makeCacheUpdate(theme: ThemeMode = 'dark') {
    const c = withDensity(getThemeColors(theme), DENSITY)

    const stepFlow = Flow({
        c,
        direction: 'horizontal',
        gap: 6,
        connectorLength: 14,
        stages: [
            { title: '1. Proj', lines: ['8Q, 2KV'], tone: 'blue', width: 174, padding: 8 },
            { title: '2. RoPE', lines: ['Q, K'], tone: 'purple', width: 174, padding: 8 },
            { title: '3. Write', lines: ['Slot t=1'], tone: 'green', width: 174, padding: 8 },
            { title: '4. Read', lines: ['Keys 0..1'], tone: 'warm', width: 174, padding: 8 },
        ],
    })

    const storedCache = Panel({
        c,
        title: 'Persistent KV Cache (2 Heads)',
        subtitle: 'Slots 0,1 filled · 2,3 free',
        tone: 'green',
        titleFontSize: 29,
        padding: 12,
        gap: 10,
        width: 392,
        children: Column({
            gap: 12,
            align: 'center',
            children: [
                TiledMatrix({
                    c,
                    rows: 2,
                    cols: 4,
                    cellSize: 36,
                    gap: 5,
                    ariaLabel: 'Persistent 2-head KV cache across 4 slots',
                    regions: [
                        { rowStart: 0, rowEnd: 1, colStart: 0, colEnd: 2, tone: 'blue' },
                        { rowStart: 1, rowEnd: 2, colStart: 0, colEnd: 2, tone: 'green' },
                    ],
                }),
                BadgePill({ c, tone: 'green', text: 'Retained: 2 KV heads', fontSize: 26 }),
            ],
        }),
    })

    const ephemeralExpand = Panel({
        c,
        title: 'Compute Expansion (8 Heads)',
        subtitle: 'Temporary repeat for 8 queries',
        tone: 'warm',
        titleFontSize: 29,
        padding: 12,
        gap: 10,
        width: 392,
        children: Column({
            gap: 10,
            align: 'center',
            children: [
                TiledMatrix({
                    c,
                    rows: 8,
                    cols: 2,
                    cellSize: 18,
                    gap: 3,
                    ariaLabel: 'Temporary 8-head view for compute parity',
                    regions: [
                        { rowStart: 0, rowEnd: 4, colStart: 0, colEnd: 2, tone: 'blue' },
                        { rowStart: 4, rowEnd: 8, colStart: 0, colEnd: 2, tone: 'warm' },
                    ],
                }),
                BadgePill({ c, tone: 'warm', text: 'Ephemeral: 8 Q heads', fontSize: 26 }),
            ],
        }),
    })

    return Scene({
        c,
        density: DENSITY,
        padding: 14,
        gap: 12,
        contentWidth: 800,
        children: Column({
            gap: 12,
            children: [
                stepFlow,
                Row({ gap: 16, align: 'stretch', children: [storedCache, ephemeralExpand] }),
            ],
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    return makeCacheUpdate(theme)
}

export default create('dark')
