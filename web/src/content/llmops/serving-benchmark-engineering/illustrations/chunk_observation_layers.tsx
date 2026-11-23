import React from 'react'
import {
    Column,
    Flow,
    Panel,
    Row,
    Scene,
    TextLabel,
    TitleBar,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 680
export const height = 750
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'A two-part diagram separates raw network observations from token-granular timing. The upper pipeline shows TCP byte reads feeding reconstructed SSE events, where each content chunk yields only one arrival timestamp and keeps individual token times inside multi-token chunks unknown. The lower panel contrasts a genuine token-event trace with timestamps at 240, 280, 320, 440, and 480 milliseconds, giving inter-token gaps of 40, 40, 120, and 40 milliseconds.'

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.05)
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const warm = getReadableToneColor('warm', c)

    return Scene({
        c,
        density: 2.05,
        padding: 10,
        gap: 10,
        contentWidth: 640,
        children: Column({
            gap: 10,
            width: 640,
            children: [
                TitleBar({
                    c,
                    title: 'Chunks hide per-token gaps',
                    subtitle: 'Only per-token events measure ITL',
                }),
                Flow({
                    c,
                    direction: 'horizontal',
                    gap: 4,
                    connectorLength: 10,
                    stages: [
                        { title: 'TCP bytes', subtitle: 'TTFTB', tone: 'neutral', width: 142 },
                        { title: 'SSE frame', subtitle: 'Chunk', tone: 'blue', width: 142 },
                        { title: '3 tokens', subtitle: '1 time', tone: 'purple', width: 142 },
                        { title: 'Token log', subtitle: 'True ITL', tone: 'green', width: 142 },
                    ],
                }),
                Row({
                    gap: 10,
                    width: 640,
                    align: 'stretch',
                    children: [
                        Panel({
                            c,
                            title: 'Multi-token chunk',
                            subtitle: 'Inter-chunk only',
                            tone: 'warm',
                            width: 315,
                            children: Column({
                                gap: 4,
                                children: [
                                    TextLabel({
                                        c,
                                        text: '1 chunk = 3 tokens',
                                        fontSize: 21,
                                        color: c.textPrimary,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'Inner ITL unknown',
                                        fontSize: 21,
                                        color: warm,
                                        fontWeight: 600,
                                    }),
                                ],
                            }),
                        }),
                        Panel({
                            c,
                            title: 'Token trace (r01)',
                            subtitle: '0 to 500 ms window',
                            tone: 'green',
                            width: 315,
                            children: Column({
                                gap: 4,
                                children: [
                                    TextLabel({
                                        c,
                                        text: '240,280,320,440,480',
                                        fontSize: 20,
                                        color: blue,
                                        mono: true,
                                        fontWeight: 700,
                                    }),
                                    TextLabel({
                                        c,
                                        text: 'ITL: 40,40,120,40 ms',
                                        fontSize: 21,
                                        color: green,
                                        fontWeight: 600,
                                    }),
                                ],
                            }),
                        }),
                    ],
                }),
            ],
        }),
    })
}

export default create('dark')
