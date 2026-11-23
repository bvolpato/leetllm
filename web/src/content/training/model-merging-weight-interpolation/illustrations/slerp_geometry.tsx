import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgFrame,
    SvgPoint,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    renderMathSvg,
    type ThemeMode,
} from 'vizmatic'

export const width = 560
export const height = 720
export const alt =
    'On equal-scale axes, the vectors (1,0) and (0,1) lie on the unit circle. Their chord midpoint is (0.5,0.5), with norm 0.7071; the SLERP midpoint is approximately (0.7071,0.7071), with norm 1. The constructed vectors show how the two paths differ.'
export const numericFixture = {
    left: [1, 0],
    right: [0, 1],
    linearMidpoint: [0.5, 0.5],
    linearRadius: Math.sqrt(0.5),
    slerpMidpoint: [Math.SQRT1_2, Math.SQRT1_2],
    slerpRadius: 1,
}

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    fontSize: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
    weight = 600,
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({ c, text, width: '100%', fontSize, color, align, fontWeight: weight }),
    })
}

function equation(
    c: ReturnType<typeof getThemeColors>,
    tex: string,
    altText: string,
    x: number,
    y: number,
    availableWidth: number,
    fontSize: number,
    color: string,
) {
    const svg = renderMathSvg(tex, { fontSize, color })
    const left = x + Math.max(0, (availableWidth - svg.width) / 2)
    return CanvasItem({
        x: left,
        y,
        width: svg.width,
        height: svg.height,
        children: createElement('img', {
            src: 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.svg),
            width: svg.width,
            height: svg.height,
            alt: altText,
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const chord = getReadableToneColor('warm', c)
    const arc = getReadableToneColor('cyan', c)
    const endpoint = getReadableToneColor('purple', c)
    const centerX = 280
    const centerY = 328
    const scale = 130
    const mapX = (x: number) => centerX + x * scale
    const mapY = (y: number) => centerY - y * scale
    const circleSegments = Array.from({ length: 48 }, (_, index) => {
        const a0 = (index / 48) * Math.PI * 2
        const a1 = ((index + 1) / 48) * Math.PI * 2
        return VectorSegment({
            key: 'circle-' + index,
            x1: mapX(Math.cos(a0)),
            y1: mapY(Math.sin(a0)),
            x2: mapX(Math.cos(a1)),
            y2: mapY(Math.sin(a1)),
            color: c.border,
            strokeWidth: 1.5,
            showStartDot: false,
            showEndDot: false,
        })
    })
    const arcSegments = Array.from({ length: 16 }, (_, index) => {
        const a0 = ((index / 16) * Math.PI) / 2
        const a1 = (((index + 1) / 16) * Math.PI) / 2
        return VectorSegment({
            key: 'slerp-arc-' + index,
            x1: mapX(Math.cos(a0)),
            y1: mapY(Math.sin(a0)),
            x2: mapX(Math.cos(a1)),
            y2: mapY(Math.sin(a1)),
            color: arc,
            strokeWidth: 4,
            showStartDot: false,
            showEndDot: false,
        })
    })
    const chordSegments = Array.from({ length: 6 }, (_, index) => {
        const t0 = (index * 2) / 12
        const t1 = (index * 2 + 1) / 12
        return VectorSegment({
            key: 'linear-chord-' + index,
            x1: mapX(1 - t0),
            y1: mapY(t0),
            x2: mapX(1 - t1),
            y2: mapY(t1),
            color: chord,
            strokeWidth: 4,
            showStartDot: false,
            showEndDot: false,
        })
    })
    const axes = [
        VectorSegment({
            x1: mapX(-1.25),
            y1: centerY,
            x2: mapX(1.25),
            y2: centerY,
            color: c.textSecondary,
            strokeWidth: 1.8,
            showStartDot: false,
            showEndDot: false,
        }),
        VectorSegment({
            x1: centerX,
            y1: mapY(-1),
            x2: centerX,
            y2: mapY(1.25),
            color: c.textSecondary,
            strokeWidth: 1.8,
            showStartDot: false,
            showEndDot: false,
        }),
        ...[-1, 0, 1].map((value) =>
            VectorSegment({
                key: 'x-tick-' + value,
                x1: mapX(value),
                y1: centerY - 4,
                x2: mapX(value),
                y2: centerY + 4,
                color: c.textSecondary,
                strokeWidth: 1.4,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        ...[-1, 0, 1].map((value) =>
            VectorSegment({
                key: 'y-tick-' + value,
                x1: centerX - 4,
                y1: mapY(value),
                x2: centerX + 4,
                y2: mapY(value),
                color: c.textSecondary,
                strokeWidth: 1.4,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
    ]
    const geometry = createElement(
        'svg',
        { width, height, viewBox: '0 0 560 720', role: 'presentation', 'aria-hidden': true },
        SvgFrame({
            c,
            x: 24,
            y: 144,
            width: 512,
            height: 368,
            rx: 10,
            fill: c.bgSubtle,
            stroke: c.border,
            strokeWidth: 1.5,
        }),
        ...axes,
        ...circleSegments,
        ...chordSegments,
        ...arcSegments,
        SvgPoint({
            cx: mapX(1),
            cy: mapY(0),
            r: 8,
            fill: endpoint,
            stroke: c.bgCard,
            strokeWidth: 2,
        }),
        SvgPoint({
            cx: mapX(0),
            cy: mapY(1),
            r: 8,
            fill: endpoint,
            stroke: c.bgCard,
            strokeWidth: 2,
        }),
        SvgPoint({
            cx: mapX(0.5),
            cy: mapY(0.5),
            r: 7,
            fill: chord,
            stroke: c.bgCard,
            strokeWidth: 2,
        }),
        SvgPoint({
            cx: mapX(Math.SQRT1_2),
            cy: mapY(Math.SQRT1_2),
            r: 7,
            fill: arc,
            stroke: c.bgCard,
            strokeWidth: 2,
        }),
    )

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
                CanvasItem({ x: 0, y: 0, width, height, children: geometry }),
                label(
                    c,
                    'Two paths between equal-norm weights',
                    16,
                    12,
                    528,
                    34,
                    24,
                    c.textPrimary,
                    'center',
                    800,
                ),
                label(
                    c,
                    'Equal-norm toy vectors · equal x/y scale',
                    18,
                    50,
                    524,
                    25,
                    20,
                    c.textSecondary,
                    'center',
                    600,
                ),
                equation(
                    c,
                    '\\theta_0=(1,0),\\qquad \\theta_1=(0,1)',
                    'theta zero is one zero and theta one is zero one',
                    30,
                    86,
                    500,
                    22,
                    c.textPrimary,
                ),
                CanvasItem({
                    x: 56,
                    y: 121,
                    width: 36,
                    height: 14,
                    children: createElement(
                        'svg',
                        { width: 36, height: 14, viewBox: '0 0 36 14' },
                        VectorSegment({
                            x1: 0,
                            y1: 7,
                            x2: 36,
                            y2: 7,
                            color: chord,
                            strokeWidth: 4,
                            showStartDot: false,
                            showEndDot: false,
                        }),
                    ),
                }),
                label(c, 'Linear chord L', 100, 115, 172, 26, 20, c.textPrimary, 'left', 600),
                CanvasItem({
                    x: 292,
                    y: 121,
                    width: 36,
                    height: 14,
                    children: createElement(
                        'svg',
                        { width: 36, height: 14, viewBox: '0 0 36 14' },
                        VectorSegment({
                            x1: 0,
                            y1: 7,
                            x2: 36,
                            y2: 7,
                            color: arc,
                            strokeWidth: 4,
                            showStartDot: false,
                            showEndDot: false,
                        }),
                    ),
                }),
                label(c, 'SLERP arc S', 336, 115, 172, 26, 20, c.textPrimary, 'left', 600),
                label(c, 'θ₁', 218, 165, 48, 24, 20, endpoint, 'right', 700),
                label(c, 'θ₀', 420, 329, 54, 24, 20, endpoint, 'left', 700),
                ...[-1, 0, 1].map((value) =>
                    label(
                        c,
                        String(value),
                        mapX(value) - 16,
                        474,
                        32,
                        24,
                        20,
                        c.textSecondary,
                        'center',
                        550,
                    ),
                ),
                ...[-1, 1].map((value) =>
                    label(
                        c,
                        String(value),
                        61,
                        mapY(value) - 11,
                        34,
                        24,
                        20,
                        c.textSecondary,
                        'right',
                        550,
                    ),
                ),
                equation(
                    c,
                    '\\theta_{\\mathrm{lin}}(1/2)=(0.5,0.5),\\quad \\|\\theta_{\\mathrm{lin}}\\|=0.7071',
                    'linear midpoint is 0.5, 0.5 and its norm is 0.7071',
                    28,
                    524,
                    504,
                    22,
                    chord,
                ),
                equation(
                    c,
                    '\\theta_{\\mathrm{slerp}}(1/2)\\approx(0.7071,0.7071),\\quad \\|\\theta_{\\mathrm{slerp}}\\|=1',
                    'SLERP midpoint is approximately 0.7071, 0.7071 and its norm is one',
                    28,
                    570,
                    504,
                    22,
                    arc,
                ),
                label(
                    c,
                    'Equal endpoint norms give a unit-radius arc here.',
                    20,
                    624,
                    520,
                    25,
                    20,
                    c.textSecondary,
                    'center',
                    600,
                ),
                label(
                    c,
                    'Task scores choose the path.',
                    20,
                    655,
                    520,
                    26,
                    20,
                    c.textSecondary,
                    'center',
                    600,
                ),
            ],
        }),
    })
}

export default create('dark')
