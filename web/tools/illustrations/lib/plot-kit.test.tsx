import React from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Scene, getThemeColors, renderToSvg } from 'vizmatic'
import { Figure, MathSvg, buildSmoothPath } from './plot-kit'
import { prepareArticleFigure } from './presentation'
import { prepareBookFigure } from '../book'

describe('plot-kit handcrafted primitives', () => {
    it('builds monotone cubic Bezier paths without overshoot and supports parametric curves', () => {
        const mono = buildSmoothPath([
            [0, 100],
            [50, 40],
            [100, 10],
            [150, 10],
        ])
        expect(mono).toMatch(/^M0\.00 100\.00C/)
        expect(mono).toContain('150.00 10.00')

        const loop = buildSmoothPath([
            [0, 0],
            [40, 20],
            [20, 40],
            [0, 10],
        ])
        expect(loop).toMatch(/^M0\.00 0\.00C/)
    })

    it.each(['dark', 'light'] as const)(
        'renders smoothCurve, area, band, logAxes, vline/hline, callout, heatGrid, brace, and MathSvg in %s mode',
        async (theme) => {
            const fig = new Figure(theme, 720, 520)
            const blue = fig.tone('blue')
            const green = fig.tone('green')
            const red = fig.tone('critical')

            const plot = fig.plot(
                { x: 72, y: 40, width: 280, height: 190 },
                { x: [1, 1000], y: [0.01, 10], xScale: 'log', yScale: 'log' },
            )
            plot.logAxes({ xLabel: 'Steps', yLabel: 'Loss', minorGrid: true, labelSize: 13 })
            plot.band(
                (x) => 2 / Math.sqrt(x),
                (x) => 4 / Math.sqrt(x),
                { fill: blue, fillOpacity: 0.14, samples: 40 },
            )
            plot.fillArea(
                [
                    [1, 3],
                    [10, 1],
                    [100, 0.3],
                    [1000, 0.1],
                ],
                { fill: green, fillOpacity: 0.12, smooth: true },
            )
            plot.smoothCurve(
                [
                    [1, 3],
                    [10, 1],
                    [100, 0.3],
                    [1000, 0.1],
                ],
                { color: blue, width: 2 },
            )
            plot.vline(100, 'lr decay', { color: red })
            plot.hline(0.1, 'floor', { color: green })

            fig.callout([plot.px(10), plot.py(1)], [plot.px(40), plot.py(3)], 'fast drop', {
                color: blue,
            })
            fig.brace(72, 275, 352, 275, '3 decades', { side: 1, depth: 8 })

            fig.heatGrid(
                [
                    [0.9, 0.0, 0.0],
                    [0.35, 0.65, 0.0],
                    [0.1, 0.25, 0.65],
                ],
                { x: 430, y: 50, width: 220, height: 180 },
                {
                    causal: true,
                    rowLabels: ['The', 'cat', 'sat'],
                    colLabels: ['The', 'cat', 'sat'],
                    highlightCell: { row: 2, col: 2 },
                },
            )
            fig.heatGrid(
                [
                    [-0.8, 0, 0.9],
                    [0.4, -0.2, 0.1],
                ],
                { x: 430, y: 295, width: 220, height: 110 },
                { scale: 'diverging', domain: [-1, 1], showValues: true },
            )

            const element = fig.render()
            const html = renderToStaticMarkup(element)
            expect(html).toContain('lr decay')
            expect(html).toContain('3 decades')
            expect(html).toContain('fast drop')

            const articlePrepared = prepareArticleFigure(element, false)
            const bookPrepared = prepareBookFigure(element)
            expect(bookPrepared.notes).toEqual([])

            const svg = await renderToSvg(articlePrepared as React.ReactElement, 720, 520, {
                background: 'transparent',
                theme,
            })
            expect(svg).toMatch(/^<svg\b/)
            expect(svg).not.toContain('NaN')

            const c = getThemeColors(theme)
            const mathScene = (
                <Scene c={c} padding={12}>
                    <MathSvg c={c} tex="\mathrm{softmax}(QK^\top / \sqrt{d_k})" fontSize={18} />
                </Scene>
            )
            const mathSvg = await renderToSvg(
                prepareArticleFigure(mathScene, false) as React.ReactElement,
                420,
                100,
                { background: 'transparent', theme },
            )
            expect(mathSvg).toMatch(/^<svg\b/)
            expect(mathSvg).toContain('<image')
        },
    )
})
