import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    SvgPoint,
    TextLabel,
    VectorSegment,
    getReadableToneColor,
    getThemeColors,
    type ThemeMode,
} from 'vizmatic'

export const width = 560
export const height = 630
export const alt =
    'Greedy soup model selection comparing candidate combinations on target y = 2x + 2 at x in [-1, 0, 1]. Averaging low-bias and high-bias models matches target outputs [0, 2, 4] with zero MSE, whereas adding a degrading predictor shifts outputs to [-2, 2, 6] with MSE 8/3, triggering greedy rejection.'
export const numericFixture = {
    x: [-1, 0, 1],
    target: [0, 2, 4],
    lowBias: [-1, 1, 3],
    highBias: [1, 3, 5],
    selectedPairSoup: [0, 2, 4],
    bad: [-6, 2, 10],
    allThreeSoup: [-2, 2, 6],
    pairMse: 0,
    allThreeMse: 8 / 3,
}

function label(
    c: ReturnType<typeof getThemeColors>,
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    size: number,
    color = c.textPrimary,
    align: 'left' | 'center' | 'right' = 'left',
) {
    return CanvasItem({
        x,
        y,
        width: w,
        height: h,
        children: TextLabel({
            c,
            text,
            width: '100%',
            fontSize: size,
            color,
            align,
            fontWeight: 650,
        }),
    })
}

export function create(theme: ThemeMode = 'dark') {
    const c = getThemeColors(theme, theme === 'light' ? 'engineering' : 'default')
    const target = getReadableToneColor('cyan', c)
    const selected = getReadableToneColor('green', c)
    const all = getReadableToneColor('critical', c)
    const xPos = [138, 300, 462]
    const plot = { yStart: 130, yEnd: 424 }
    const y = (v: number) => plot.yEnd - ((v + 3) / 10) * (plot.yEnd - plot.yStart)
    const segment = (values: number[], color: string, prefix: string, widthPx: number) =>
        values.slice(0, -1).map((v, i) =>
            VectorSegment({
                key: prefix + i,
                x1: xPos[i],
                y1: y(v),
                x2: xPos[i + 1],
                y2: y(values[i + 1]),
                color,
                strokeWidth: widthPx,
                showStartDot: false,
                showEndDot: false,
            }),
        )
    const graph = createElement(
        'svg',
        {
            width,
            height,
            viewBox: `0 0 ${width} ${height}`,
            role: 'presentation',
            'aria-hidden': true,
        },
        ...[-2, 0, 2, 4, 6].map((v) =>
            VectorSegment({
                x1: 88,
                y1: y(v),
                x2: 520,
                y2: y(v),
                color: v === 0 ? c.textSecondary : c.border,
                strokeWidth: v === 0 ? 1.8 : 1,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        ...[0, 1, 2].map((i) =>
            VectorSegment({
                x1: xPos[i],
                y1: plot.yStart,
                x2: xPos[i],
                y2: plot.yEnd,
                color: c.border,
                strokeWidth: 1,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
        ...segment(numericFixture.target, target, 'target-', 3.2),
        ...segment(numericFixture.allThreeSoup, all, 'all-', 4),
        ...numericFixture.target.map((v, i) =>
            SvgPoint({
                cx: xPos[i],
                cy: y(v),
                r: 8,
                fill: selected,
                stroke: c.bgCard,
                strokeWidth: 2,
            }),
        ),
        ...numericFixture.allThreeSoup.flatMap((v, i) =>
            i === 1
                ? []
                : [
                      SvgPoint({
                          cx: xPos[i],
                          cy: y(v),
                          r: 6,
                          fill: all,
                          stroke: c.bgCard,
                          strokeWidth: 2,
                      }),
                  ],
        ),
        ...[0, 2].map((i) =>
            VectorSegment({
                x1: xPos[i],
                y1: y(numericFixture.target[i]),
                x2: xPos[i],
                y2: y(numericFixture.allThreeSoup[i]),
                color: all,
                strokeWidth: 2,
                showStartDot: false,
                showEndDot: false,
            }),
        ),
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
                CanvasItem({ x: 0, y: 0, width, height, children: graph }),
                label(
                    c,
                    'A soup is an average you evaluate',
                    15,
                    10,
                    530,
                    35,
                    24,
                    c.textPrimary,
                    'center',
                ),
                label(
                    c,
                    'Toy predictors · target y = 2x + 2',
                    15,
                    49,
                    530,
                    27,
                    20,
                    c.textSecondary,
                    'center',
                ),
                ...[-2, 0, 2, 4, 6].map((v) =>
                    label(c, String(v), 40, y(v) - 13, 38, 26, 20, c.textSecondary, 'right'),
                ),
                ...[-1, 0, 1].map((v, i) =>
                    label(c, `x = ${v}`, xPos[i] - 52, 431, 104, 26, 20, c.textSecondary, 'center'),
                ),
                CanvasItem({
                    x: 36,
                    y: 474,
                    width: 38,
                    height: 16,
                    children: createElement(
                        'svg',
                        { width: 38, height: 16, viewBox: '0 0 38 16' },
                        VectorSegment({
                            x1: 0,
                            y1: 8,
                            x2: 38,
                            y2: 8,
                            color: target,
                            strokeWidth: 3,
                            showStartDot: false,
                            showEndDot: false,
                        }),
                    ),
                }),
                label(c, 'target and selected pair soup', 84, 466, 286, 28, 20, c.textPrimary),
                CanvasItem({
                    x: 374,
                    y: 474,
                    width: 38,
                    height: 16,
                    children: createElement(
                        'svg',
                        { width: 38, height: 16, viewBox: '0 0 38 16' },
                        VectorSegment({
                            x1: 0,
                            y1: 8,
                            x2: 38,
                            y2: 8,
                            color: all,
                            strokeWidth: 3,
                            showStartDot: false,
                            showEndDot: false,
                        }),
                    ),
                }),
                label(c, 'all three', 420, 466, 116, 28, 20, c.textPrimary),
                label(
                    c,
                    'low_bias + high_bias soup matches target · MSE 0',
                    24,
                    520,
                    512,
                    30,
                    20,
                    selected,
                    'center',
                ),
                label(
                    c,
                    'Add bad (w=8, b=2) → three-model MSE 8/3 ≈ 2.67',
                    24,
                    556,
                    512,
                    30,
                    20,
                    all,
                    'center',
                ),
                label(
                    c,
                    'Select on validation; test generalization on holdout.',
                    22,
                    600,
                    516,
                    28,
                    20,
                    c.textSecondary,
                    'center',
                ),
            ],
        }),
    })
}

export default create('dark')
