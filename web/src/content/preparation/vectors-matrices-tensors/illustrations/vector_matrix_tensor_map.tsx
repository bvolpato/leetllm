import { createElement } from 'react'
import {
    Board,
    CanvasItem,
    Scene,
    TextLabel,
    VectorArrow,
    defineIllustration,
    getReadableToneColor,
    withColorAlpha,
} from 'vizmatic'

export const width = 648
export const height = 434
export const alt =
    'Tensor H has shape [2,3,2]: two prompts, three tokens per prompt, and two features per token. Open matrices show H[0] and H[1], with token rows t=0,1,2 and feature columns d=0,1. In H[1], token row 2 is highlighted and feature 0 contains 1.0. An indexing chain reduces H to H[1], then H[1,2], then scalar H[1,2,0]=1.0.'

const prompts = [
    [
        [1, 0],
        [0.5, 0.5],
        [0, 1],
    ],
    [
        [0, 1],
        [0.5, 0.5],
        [1, 0],
    ],
]

const illustration = defineIllustration((c) => {
    const blue = getReadableToneColor('blue', c)
    const green = getReadableToneColor('green', c)
    const label = (
        x: number,
        y: number,
        w: number,
        text: string,
        size = 22,
        color = c.textPrimary,
        weight = 500,
    ) =>
        CanvasItem({
            x,
            y,
            width: w,
            height: size * 1.4,
            children: TextLabel({
                c,
                text,
                fontSize: size,
                fontWeight: weight,
                color,
                align: 'center',
            }),
        })
    const slice = (x: number, batch: number) => [
        label(
            x + 28,
            64,
            180,
            `H[${batch}] · prompt ${batch}`,
            23,
            batch ? blue : c.textPrimary,
            600,
        ),
        label(x + 50, 103, 75, 'd=0', 20, c.textSecondary),
        label(x + 125, 103, 75, 'd=1', 20, c.textSecondary),
        ...[0, 1, 2].map((t) =>
            label(x, 138 + t * 42, 45, `t=${t}`, 20, batch && t === 2 ? blue : c.textSecondary),
        ),
        CanvasItem({
            x: x + 46,
            y: 135,
            width: 160,
            height: 126,
            children: createElement(
                'div',
                {
                    style: { display: 'flex', position: 'relative', width: 160, height: 126 },
                },
                createElement(
                    'svg',
                    {
                        width: 160,
                        height: 126,
                        viewBox: '0 0 160 126',
                        style: { position: 'absolute', left: 0, top: 0 },
                    },
                    createElement('path', {
                        d: 'M 9 1 H 1 V 125 H 9 M 151 1 H 159 V 125 H 151',
                        fill: 'none',
                        stroke: c.textMuted,
                        strokeWidth: 1.4,
                    }),
                ),
                createElement(
                    'div',
                    { style: { display: 'flex', flexDirection: 'column', marginLeft: 9 } },
                    ...prompts[batch].map((row, t) =>
                        createElement(
                            'div',
                            { key: t, style: { display: 'flex', height: 42, gap: 6 } },
                            ...row.map((value, d) =>
                                createElement(
                                    'div',
                                    {
                                        key: d,
                                        style: {
                                            display: 'flex',
                                            width: 68,
                                            height: 40,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontFamily: c.fontSans,
                                            fontSize: 26,
                                            fontWeight:
                                                batch === 1 && t === 2 && d === 0 ? 650 : 400,
                                            color:
                                                batch === 1 && t === 2
                                                    ? d === 0
                                                        ? green
                                                        : blue
                                                    : c.textPrimary,
                                            backgroundColor:
                                                batch === 1 && t === 2
                                                    ? withColorAlpha(d === 0 ? green : blue, 0.13)
                                                    : 'transparent',
                                            borderRadius: 4,
                                        },
                                    },
                                    value.toFixed(1),
                                ),
                            ),
                        ),
                    ),
                ),
            ),
        }),
    ]
    const arrows = createElement(
        'svg',
        {
            width: 600,
            height: 386,
            viewBox: '0 0 600 386',
            style: { position: 'absolute', left: 0, top: 0 },
        },
        ...[
            [124, 148],
            [270, 294],
            [426, 450],
        ].map(([x1, x2]) =>
            VectorArrow({
                x1,
                y1: 310,
                x2,
                y2: 310,
                color: c.textMuted,
                strokeWidth: 1.6,
                arrowSize: 5,
            }),
        ),
    )
    return Scene({
        c,
        padding: 24,
        gap: 0,
        contentWidth: 600,
        children: Board({
            c,
            width: 600,
            height: 386,
            children: [
                label(0, 8, 600, 'H: 2 prompts × 3 tokens × 2 features', 24, c.textPrimary, 600),
                ...slice(4, 0),
                ...slice(330, 1),
                CanvasItem({ x: 0, y: 0, width: 600, height: 386, children: arrows }),
                label(0, 293, 120, 'H', 23, c.textPrimary, 600),
                label(0, 334, 120, '[2, 3, 2]', 22, c.textSecondary),
                label(152, 293, 114, 'H[1]', 23, blue, 600),
                label(152, 334, 114, '[3, 2]', 22, c.textSecondary),
                label(298, 293, 124, 'H[1, 2]', 23, blue, 600),
                label(298, 334, 124, '[2]', 22, c.textSecondary),
                label(454, 293, 146, 'H[1, 2, 0]', 22, green, 600),
                label(454, 330, 146, '1.0', 28, green, 650),
            ],
        }),
    })
})

export const create = illustration.create
export default illustration.default
