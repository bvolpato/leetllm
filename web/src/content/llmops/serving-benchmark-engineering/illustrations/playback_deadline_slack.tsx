import React from 'react'
import {
    LineChart,
    Scene,
    getReadableToneColor,
    getThemeColors,
    withDensity,
    type ThemeMode,
} from 'vizmatic'

export const width = 680
export const height = 650
export const autoSize = false
export const preset = 'engineering'
export const alt =
    'A token arrival versus deadline chart compares Stream A and Stream B across tokens 1 through 5 against fixed playback deadlines of 300, 380, 460, 540, and 620 milliseconds. Stream A stays below every deadline even with a 120 millisecond third gap. Stream B maintains an 80 millisecond mean TPOT but crosses above the 540 millisecond deadline at token 4, arriving at 580 milliseconds.'

const labels = ['Tok 1', 'Tok 2', 'Tok 3', 'Tok 4', 'Tok 5']
const deadlines = [300, 380, 460, 540, 620]
const streamA = [240, 280, 320, 440, 480]
const streamB = [300, 380, 460, 580, 620]

export function create(theme: ThemeMode = 'dark') {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity({ ...base, shadow: 'transparent' }, 2.05)
    const green = getReadableToneColor('green', c)
    const purple = getReadableToneColor('purple', c)
    const red = getReadableToneColor('red', c)

    return Scene({
        c,
        density: 2.05,
        padding: 10,
        contentWidth: 640,
        children: LineChart({
            c,
            title: 'Early token slack prevents misses',
            subtitle: '300 ms + 80 ms/tok target (both average 80 ms TPOT; Tok 4 +40 ms late)',
            width: 640,
            height: 290,
            labels,
            min: 200,
            max: 650,
            yAxisLabel: 'ms',
            showGrid: true,
            showPoints: true,
            directLabels: false,
            series: [
                { name: 'Stream B', points: streamB, color: red },
                { name: 'Deadline', points: deadlines, color: purple },
                { name: 'Stream A', points: streamA, color: green },
            ],
            ariaLabel: alt,
        }),
    })
}

export default create('dark')
