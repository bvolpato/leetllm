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
export const height = 770
export const alt =
    'A constructed two-unit ReLU network has incoming weights [1, −1] and outgoing weights [2, −1]. The second network stores the same two units in reverse order. Applying the supplied permutation π=(1,0) restores outputs [−2, −1, 2, 4]; naive averaging gives zero for every input. The figure traces this known-swap alignment before averaging.'
export const numericFixture = {
    x: [-2, -1, 1, 2],
    incoming: [1, -1],
    outgoing: [2, -1],
    permutation: [1, 0],
    originalOutput: [-2, -1, 2, 4],
    naiveAverageOutput: [0, 0, 0, 0],
    alignedAverageOutput: [-2, -1, 2, 4],
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
    const aligned = getReadableToneColor('green', c)
    const rejected = getReadableToneColor('critical', c)
    const swap = getReadableToneColor('purple', c)
    const plot = { xMin: 86, xMax: 500, yMin: 405, yMax: 610 }
    const mapX = (x: number) => plot.xMin + ((x + 2) / 4) * (plot.xMax - plot.xMin)
    const mapY = (y: number) => plot.yMin + ((4 - y) / 6) * (plot.yMax - plot.yMin)
    const xSamples = [-2, -1, 0, 1, 2]
    const alignedOutputs = [-2, -1, 0, 2, 4]
    const graph = [
        ...[-2, -1, 0, 1, 2].map((x) =>
            VectorSegment({
                key: 'x-grid-' + x,
                x1: mapX(x),
                y1: plot.yMin,
                x2: mapX(x),
                y2: plot.yMax,
                color: x === 0 ? c.textSecondary : c.border,
                strokeWidth: x === 0 ? 1.8 : 1,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        ...[-2, 0, 2, 4].map((y) =>
            VectorSegment({
                key: 'y-grid-' + y,
                x1: plot.xMin,
                y1: mapY(y),
                x2: plot.xMax,
                y2: mapY(y),
                color: y === 0 ? c.textSecondary : c.border,
                strokeWidth: y === 0 ? 1.8 : 1,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        ...xSamples.slice(0, -1).map((x, index) =>
            VectorSegment({
                key: 'aligned-line-' + index,
                x1: mapX(x),
                y1: mapY(alignedOutputs[index]),
                x2: mapX(xSamples[index + 1]),
                y2: mapY(alignedOutputs[index + 1]),
                color: aligned,
                strokeWidth: 4,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        VectorSegment({
            x1: mapX(-2),
            y1: mapY(0),
            x2: mapX(2),
            y2: mapY(0),
            color: rejected,
            strokeWidth: 3.2,
            showStartDot: false,
            showEndDot: false,
        }),
        ...xSamples.map((x, index) =>
            SvgPoint({
                key: 'aligned-point-' + index,
                cx: mapX(x),
                cy: mapY(alignedOutputs[index]),
                r: 5.5,
                fill: aligned,
                stroke: c.bgCard,
                strokeWidth: 2,
            }),
        ),
        ...xSamples
            .filter((_, index) => index !== 2)
            .map((x, index) =>
                SvgFrame({
                    key: 'naive-zero-point-' + index,
                    c,
                    x: mapX(x) - 3,
                    y: mapY(0) - 3,
                    width: 6,
                    height: 6,
                    rx: 1,
                    fill: rejected,
                    stroke: c.bgCard,
                    strokeWidth: 1,
                }),
            ),
    ]

    const geometry = createElement(
        'svg',
        { width, height, viewBox: '0 0 560 770', role: 'presentation', 'aria-hidden': true },
        SvgFrame({
            c,
            x: 24,
            y: 124,
            width: 512,
            height: 142,
            rx: 10,
            fill: c.bgSubtle,
            stroke: c.border,
            strokeWidth: 1.5,
        }),
        VectorSegment({
            x1: 32,
            y1: 162,
            x2: 528,
            y2: 162,
            color: c.border,
            strokeWidth: 1,
            showStartDot: false,
            showEndDot: false,
        }),
        VectorSegment({
            x1: 32,
            y1: 221,
            x2: 528,
            y2: 221,
            color: c.border,
            strokeWidth: 1,
            showStartDot: false,
            showEndDot: false,
        }),
        SvgFrame({
            c,
            x: 24,
            y: 354,
            width: 512,
            height: 366,
            rx: 10,
            fill: c.bgSubtle,
            stroke: c.border,
            strokeWidth: 1.5,
        }),
        ...graph,
    )

    const labels = [
        label(
            c,
            'A constructed two-unit ReLU example',
            18,
            12,
            524,
            34,
            25,
            c.textPrimary,
            'center',
            800,
        ),
        label(
            c,
            'Same function · different hidden-unit order',
            18,
            49,
            524,
            25,
            21,
            c.textSecondary,
            'center',
            650,
        ),
        equation(
            'f(x)=2\\,\\operatorname{ReLU}(x)-\\operatorname{ReLU}(-x)',
            'f of x equals two ReLU x minus ReLU of negative x',
            28,
            82,
            504,
            27,
            c.textPrimary,
        ),
        label(
            c,
            'Each unit · incoming / outgoing weight',
            30,
            132,
            500,
            27,
            21,
            c.textSecondary,
            'center',
            650,
        ),
        label(c, 'Slot', 38, 167, 70, 24, 20, c.textSecondary, 'center', 700),
        label(c, 'Model A', 110, 167, 196, 24, 20, aligned, 'center', 700),
        label(c, 'Model B', 316, 167, 206, 24, 20, swap, 'center', 700),
        equation('u_1', 'u one', 48, 194, 52, 21, c.textPrimary),
        label(c, '+1  /  +2', 110, 194, 196, 26, 21, c.textPrimary, 'center', 700),
        label(c, '−1  /  −1', 316, 194, 206, 26, 21, c.textPrimary, 'center', 700),
        equation('u_2', 'u two', 48, 230, 52, 21, c.textPrimary),
        label(c, '−1  /  −1', 110, 230, 196, 26, 21, c.textPrimary, 'center', 700),
        label(c, '+1  /  +2', 316, 230, 206, 26, 21, c.textPrimary, 'center', 700),
        equation(
            '\\pi=(1,0)',
            'permutation pi swaps the two hidden-unit rows',
            34,
            278,
            130,
            21,
            swap,
        ),
        label(
            c,
            'Swap B’s two rows, then average matching coordinates.',
            160,
            279,
            372,
            28,
            20,
            c.textSecondary,
            'left',
            600,
        ),
        label(
            c,
            'Function values at five inputs',
            30,
            363,
            500,
            27,
            22,
            c.textPrimary,
            'center',
            700,
        ),
        ...[-2, 0, 2, 4].map((value) =>
            label(
                c,
                String(value),
                40,
                mapY(value) - 11,
                34,
                24,
                20,
                c.textSecondary,
                'right',
                550,
            ),
        ),
        ...[-2, -1, 0, 1, 2].map((value) =>
            label(
                c,
                String(value),
                mapX(value) - 16,
                612,
                32,
                24,
                20,
                c.textSecondary,
                'center',
                550,
            ),
        ),
        label(c, 'input x', 432, 635, 86, 24, 20, c.textSecondary, 'center', 600),
        CanvasItem({
            x: 52,
            y: 653,
            width: 40,
            height: 14,
            children: createElement(
                'svg',
                { width: 40, height: 14, viewBox: '0 0 40 14' },
                VectorSegment({
                    x1: 0,
                    y1: 7,
                    x2: 40,
                    y2: 7,
                    color: aligned,
                    strokeWidth: 4,
                    showStartDot: false,
                    showEndDot: false,
                }),
            ),
        }),
        label(
            c,
            'A, swapped B, and aligned mean',
            100,
            647,
            418,
            26,
            20,
            c.textPrimary,
            'left',
            600,
        ),
        CanvasItem({
            x: 52,
            y: 688,
            width: 40,
            height: 14,
            children: createElement(
                'svg',
                { width: 40, height: 14, viewBox: '0 0 40 14' },
                VectorSegment({
                    x1: 0,
                    y1: 7,
                    x2: 40,
                    y2: 7,
                    color: rejected,
                    strokeWidth: 3,
                    showStartDot: false,
                    showEndDot: false,
                }),
            ),
        }),
        equation(
            '\\text{Naive mean: } w_{\\mathrm{in}}=(0,0)\\Rightarrow f(x)=0',
            'naive mean incoming weight is zero, so the output is zero',
            100,
            680,
            418,
            20,
            c.textSecondary,
        ),
        label(
            c,
            'Known swap; no alignment solver is run.',
            20,
            730,
            520,
            26,
            20,
            c.textSecondary,
            'center',
            550,
        ),
    ]

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
            children: [CanvasItem({ x: 0, y: 0, width, height, children: geometry }), ...labels],
        }),
    })
}

export default create('dark')
