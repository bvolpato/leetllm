import {
    AxisPlot,
    Column,
    getThemeColors,
    Panel,
    Row,
    Scene,
    TextLabel,
    withDensity,
} from 'vizmatic'
import type { ThemeMode } from 'vizmatic'

export const width = 740
export const height = 660
export const alt =
    'Two unit-circle plots compare RoPE basis consistency for a query at position 2 with scaled frequency 0.5 (1 radian). A stale cached key stored under unscaled frequency 1 at position 1 also sits at 1 radian, producing dot product 1.000000. Re-rotating the key under scaled frequency 0.5 puts it at 0.5 radians and restores the true dot product cos(0.5) = 0.877583.'

const unitCircle = Array.from({ length: 65 }, (_, i) => {
    const theta = (i / 64) * Math.PI * 2
    return { x: Math.cos(theta), y: Math.sin(theta) }
})

function angleVector(angle: number) {
    return { x2: Math.cos(angle), y2: Math.sin(angle) }
}

export function create(theme: ThemeMode) {
    const base = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const c = withDensity(base, 2.2)
    const q = angleVector(1.0)
    const staleK = angleVector(1.0)
    const goodK = angleVector(0.5)

    return Scene({
        c,
        density: 2.2,
        contentWidth: 710,
        padding: 10,
        gap: 8,
        children: [
            Column({
                gap: 8,
                align: 'center',
                children: [
                    Row({
                        gap: 14,
                        justify: 'center',
                        children: [
                            Panel({
                                c,
                                title: 'Stale cached key',
                                subtitle: 'q: 1.0 rad · k: 1.0 rad',
                                tone: 'warm',
                                width: 340,
                                padding: 10,
                                gap: 6,
                                footer: 'q · k = 1.000000 (collision)',
                                children: [
                                    AxisPlot({
                                        c,
                                        width: 240,
                                        height: 220,
                                        xMin: -1.35,
                                        xMax: 1.35,
                                        yMin: -1.25,
                                        yMax: 1.25,
                                        padding: 16,
                                        showAxes: true,
                                        showGrid: false,
                                        paths: [
                                            { points: unitCircle, tone: 'neutral', strokeWidth: 2 },
                                        ],
                                        vectors: [
                                            {
                                                x1: 0,
                                                y1: 0,
                                                ...q,
                                                color: c.primary,
                                                strokeWidth: 5,
                                                arrow: true,
                                            },
                                            {
                                                x1: 0,
                                                y1: 0,
                                                ...staleK,
                                                color: c.warning,
                                                strokeWidth: 4,
                                                arrow: true,
                                                arrowSize: 6,
                                            },
                                        ],
                                    }),
                                ],
                            }),
                            Panel({
                                c,
                                title: 'Consistent basis',
                                subtitle: 'q: 1.0 rad · k: 0.5 rad',
                                tone: 'green',
                                width: 340,
                                padding: 10,
                                gap: 6,
                                footer: 'q · k = cos(0.5) = 0.877583',
                                children: [
                                    AxisPlot({
                                        c,
                                        width: 240,
                                        height: 220,
                                        xMin: -1.35,
                                        xMax: 1.35,
                                        yMin: -1.25,
                                        yMax: 1.25,
                                        padding: 16,
                                        showAxes: true,
                                        showGrid: false,
                                        paths: [
                                            { points: unitCircle, tone: 'neutral', strokeWidth: 2 },
                                        ],
                                        vectors: [
                                            {
                                                x1: 0,
                                                y1: 0,
                                                ...q,
                                                color: c.primary,
                                                strokeWidth: 5,
                                                arrow: true,
                                            },
                                            {
                                                x1: 0,
                                                y1: 0,
                                                ...goodK,
                                                color: c.positive,
                                                strokeWidth: 5,
                                                arrow: true,
                                            },
                                        ],
                                    }),
                                ],
                            }),
                        ],
                    }),
                    TextLabel({
                        c,
                        text: 'Recompute cached keys whenever RoPE scaling changes',
                        fontSize: 23,
                        color: c.textSecondary,
                        align: 'center',
                    }),
                ],
            }),
        ],
    })
}

export default create('dark')
