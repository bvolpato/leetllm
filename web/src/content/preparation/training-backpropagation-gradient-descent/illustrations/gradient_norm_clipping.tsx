import {
    AxisPlot,
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    defineIllustration,
    getReadableToneColor,
} from 'vizmatic'
import type { ThemeColors } from 'vizmatic'

export const alt =
    'A constructed two-dimensional gradient g=(3,4) has norm 5. With cap C=2, norm clipping applies the common scale 2/5 and produces the clipped vector (1.2,1.6), which lies on the radius-2 boundary and points in the same direction.'

export const width = 520
export const height = 630

function label(
    c: ThemeColors,
    x: number,
    y: number,
    width: number,
    text: string,
    fontSize: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    mono = false,
) {
    return CanvasItem({
        x,
        y,
        width,
        height: fontSize + 8,
        children: TextLabel({ c, text, width, fontSize, color, align, mono }),
    })
}

const illustration = defineIllustration((theme) => {
    const c = { ...theme, shadow: 'transparent' }
    const chartX = 80
    const chartY = 125
    const chartWidth = 360
    const chartHeight = 360
    const padding = 34
    const xPosition = (value: number) =>
        chartX + padding + ((value + 2.5) / 7) * (chartWidth - 2 * padding)
    const yPosition = (value: number) =>
        chartY + padding + (1 - (value + 2.5) / 7) * (chartHeight - 2 * padding)
    const clipBoundary = Array.from({ length: 65 }, (_, index) => {
        const angle = (index / 64) * Math.PI * 2
        return { x: 2 * Math.cos(angle), y: 2 * Math.sin(angle) }
    })
    const grid = [
        ...[0, 2, 4].map((value) => ({
            points: [
                { x: value, y: -2.5 },
                { x: value, y: 4.5 },
            ],
            color: value === 0 ? c.textSecondary : c.borderSubtle,
            strokeWidth: value === 0 ? 2 : 1,
        })),
        ...[0, 2, 4].map((value) => ({
            points: [
                { x: -2.5, y: value },
                { x: 4.5, y: value },
            ],
            color: value === 0 ? c.textSecondary : c.borderSubtle,
            strokeWidth: value === 0 ? 2 : 1,
        })),
        { points: clipBoundary, tone: 'purple' as const, strokeWidth: 2.5 },
    ]
    const warm = getReadableToneColor('warm', c)
    const green = getReadableToneColor('green', c)
    const purple = getReadableToneColor('purple', c)

    return Scene({
        c,
        padding: 0,
        gap: 0,
        contentWidth: width,
        background: 'transparent',
        children: Board({
            c,
            width,
            height,
            background: 'transparent',
            children: [
                label(c, 20, 14, 480, 'Norm clipping preserves direction', 24),
                label(
                    c,
                    20,
                    49,
                    480,
                    'Example vector: g = (3, 4) · norm 5 · cap C = 2',
                    20,
                    c.textSecondary,
                ),
                label(c, 80, 91, 360, 'Vertical component g₂ ↑', 17, c.textSecondary),
                CanvasItem({
                    x: chartX,
                    y: chartY,
                    width: chartWidth,
                    height: chartHeight,
                    children: AxisPlot({
                        c,
                        width: chartWidth,
                        height: chartHeight,
                        xMin: -2.5,
                        xMax: 4.5,
                        yMin: -2.5,
                        yMax: 4.5,
                        padding,
                        showAxes: false,
                        showGrid: false,
                        paths: [...grid],
                        vectors: [
                            {
                                x1: 0,
                                y1: 0,
                                x2: 3,
                                y2: 4,
                                tone: 'warm',
                                strokeWidth: 5,
                                arrow: true,
                                arrowSize: 8,
                            },
                            {
                                x1: 0,
                                y1: 0,
                                x2: 1.2,
                                y2: 1.6,
                                tone: 'green',
                                strokeWidth: 5,
                                arrow: true,
                                arrowSize: 8,
                            },
                        ],
                        points: [
                            { x: 0, y: 0, tone: 'neutral', r: 6, stroke: c.bgCard, strokeWidth: 2 },
                            { x: 3, y: 4, tone: 'warm', r: 7, stroke: c.bgCard, strokeWidth: 2 },
                            {
                                x: 1.2,
                                y: 1.6,
                                tone: 'green',
                                r: 7,
                                stroke: c.bgCard,
                                strokeWidth: 2,
                            },
                        ],
                    }),
                }),
                ...[0, 2, 4].map((value) =>
                    label(
                        c,
                        xPosition(value) - 16,
                        chartY + chartHeight - 1,
                        32,
                        String(value),
                        17,
                        c.textSecondary,
                        'center',
                        true,
                    ),
                ),
                ...[0, 2, 4].map((value) =>
                    label(
                        c,
                        48,
                        yPosition(value) - 11,
                        25,
                        String(value),
                        17,
                        c.textSecondary,
                        'right',
                        true,
                    ),
                ),
                label(c, 170, 512, 180, 'component g₁ →', 17, c.textSecondary, 'center'),
                label(
                    c,
                    xPosition(0) + 7,
                    yPosition(2) - 25,
                    92,
                    'C = 2',
                    20,
                    purple,
                    'left',
                    true,
                ),
                label(
                    c,
                    xPosition(3) - 64,
                    yPosition(4) - 34,
                    90,
                    'g (3,4)',
                    20,
                    warm,
                    'left',
                    true,
                ),
                label(
                    c,
                    20,
                    547,
                    480,
                    'norm(g)=5 · cap C=2 · scale=2/5',
                    20,
                    c.textPrimary,
                    'center',
                    true,
                ),
                label(
                    c,
                    20,
                    579,
                    480,
                    'clipped=(1.2,1.6) · same direction',
                    20,
                    green,
                    'center',
                    true,
                ),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
